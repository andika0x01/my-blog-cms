import { data, Form, Link, redirect, useNavigation } from "react-router";
import { Trash, PencilSimple, Heart, ChatCircle, ArrowLeft, PaperPlaneTilt, ArrowUDownLeft, X } from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Route } from "./+types/baca";
import { getAuthSession, getVisitorStorage } from "../utils/session.server";
import { siteConfig } from "../config";
import { cn } from "../utils/cn";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) return [{ title: "Not Found" }];

  const { title, content, slug } = data.post;
  const description =
    content
      .replace(/<[^>]*>?/gm, "")
      .substring(0, 160)
      .trim() + "...";
  const postUrl = `${siteConfig.url}/baca/${slug}`;

  return [
    { title: `${title} | ${siteConfig.name}` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: postUrl },
    { property: "og:type", content: "article" },
    { property: "og:image", content: siteConfig.ogImage },
    { property: "article:author", content: siteConfig.author },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: siteConfig.ogImage },
  ];
}

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  slug: string;
  is_draft: number;
};

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const authSession = await getAuthSession(request, context.cloudflare.env);
  const visitorStorage = getVisitorStorage(context.cloudflare.env);
  const visitorSession = await visitorStorage.getSession(request.headers.get("Cookie"));

  const userId = authSession.get("userId");
  const isLoggedIn = !!userId;
  const visitorName = visitorSession.get("name") || "";
  const visitorHasLiked = visitorSession.get(`liked_${params.slug}`) === true;

  let adminUsername = null;
  if (isLoggedIn) {
    const user = await db.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first<{ username: string }>();
    adminUsername = user?.username;
  }

  const post = await db.prepare("SELECT id, title, content, created_at, slug, is_draft FROM posts WHERE slug = ?").bind(params.slug).first<Post>();

  if (!post) throw data("Tulisan tidak ditemukan", { status: 404 });

  if (post.is_draft === 1 && !isLoggedIn) {
    throw data("Maaf, tulisan ini belum dipublikasi.", { status: 404 });
  }

  const likesCount = await db.prepare("SELECT COUNT(*) as total FROM likes WHERE post_id = ?").bind(post.id).first<any>();

  const commentsData = await db.prepare("SELECT id, name, content, created_at, parent_id FROM comments WHERE post_id = ? ORDER BY created_at ASC").bind(post.id).all();

  return {
    post,
    isLoggedIn,
    likes: likesCount?.total || 0,
    comments: commentsData.results,
    visitorName,
    visitorHasLiked,
    adminUsername,
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const authSession = await getAuthSession(request, context.cloudflare.env);
  const visitorStorage = getVisitorStorage(context.cloudflare.env);
  const visitorSession = await visitorStorage.getSession(request.headers.get("Cookie"));

  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = authSession.get("userId");

  if (intent === "delete") {
    if (!userId) return data("Unauthorized", { status: 401 });
    await db.prepare("DELETE FROM posts WHERE slug = ?").bind(params.slug).run();
    return redirect("/blog");
  }

  const post_id = formData.get("post_id");

  if (intent === "like") {
    if (userId || visitorSession.get(`liked_${params.slug}`)) return null;

    await db.prepare("INSERT INTO likes (post_id, visitor_id) VALUES (?, ?)").bind(post_id, "anon").run();
    visitorSession.set(`liked_${params.slug}`, true);
    return data({ success: true }, { headers: { "Set-Cookie": await visitorStorage.commitSession(visitorSession) } });
  }

  if (intent === "comment") {
    const parent_id = formData.get("parent_id") || null;
    const content = formData.get("content") as string;
    let name = visitorSession.get("name") || (formData.get("name") as string);

    if (userId) {
      const user = await db.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first<{ username: string }>();
      name = user?.username || "Author";
    }

    if (!name || !content) return { error: "Konten tidak boleh kosong." };

    await db.prepare("INSERT INTO comments (post_id, name, content, parent_id, is_read) VALUES (?, ?, ?, ?, 0)").bind(post_id, name, content, parent_id).run();

    if (!userId) visitorSession.set("name", name);

    return data({ success: true }, { headers: { "Set-Cookie": await visitorStorage.commitSession(visitorSession) } });
  }

  return null;
}

export default function Baca({ loaderData }: Route.ComponentProps) {
  const { post, isLoggedIn, likes, comments, visitorName, visitorHasLiked, adminUsername } = loaderData;
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const isActuallyLiked = !isLoggedIn && visitorHasLiked;
  const isButtonDisabled = isLoggedIn || visitorHasLiked;

  const { rootComments, repliesMap } = useMemo(() => {
    const roots: any[] = [];
    const replies: Record<number, any[]> = {};
    comments.forEach((c: any) => {
      if (!c.parent_id) {
        roots.push(c);
      } else {
        if (!replies[c.parent_id]) replies[c.parent_id] = [];
        replies[c.parent_id].push(c);
      }
    });
    return { rootComments: roots, repliesMap: replies };
  }, [comments]);

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[100dvh]">
      <Link to="/blog" className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors w-fit font-mono">
        <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> /root/blog
      </Link>

      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl md:text-6xl font-medium tracking-tighter leading-none text-white">{post.title}</h1>
              {post.is_draft === 1 && (
                <span className="text-xs bg-white/10 text-zinc-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-white/5">Draft</span>
              )}
            </div>
            <time className="text-sm text-zinc-500 font-mono italic">
              {new Date(post.created_at).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </time>
          </div>

          {isLoggedIn && (
            <div className="flex gap-2">
              <Link
                to={`/edit/${post.slug}`}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-zinc-300 hover:text-white transition-all"
              >
                <PencilSimple size={16} /> Edit
              </Link>
              <Form method="post" onSubmit={(e) => !confirm("Hapus tulisan ini?") && e.preventDefault()}>
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-sm text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash size={16} /> Hapus
                </button>
              </Form>
            </div>
          )}
        </header>

        <div className="h-[1px] w-full bg-white/5" />
        <div className="prose prose-invert prose-neutral max-w-none text-zinc-300 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
      </article>

      <section className="flex flex-col gap-10 mt-12">
        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 text-zinc-500">
            <ChatCircle size={22} weight="duotone" />
            <span className="font-mono text-xs tracking-widest uppercase">{comments.length} Respon</span>
          </div>

          <Form method="post">
            <input type="hidden" name="post_id" value={post.id} />
            <button
              type="submit"
              name="intent"
              value="like"
              disabled={isButtonDisabled}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all",
                isButtonDisabled ? "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed" : "bg-white text-zinc-950 hover:scale-105 active:scale-95"
              )}
            >
              <Heart weight={isActuallyLiked ? "fill" : "bold"} className={cn("w-3.5 h-3.5", isActuallyLiked ? "text-red-500" : "")} />
              {isActuallyLiked ? "Liked" : "Like"} <span className="opacity-40">{likes}</span>
            </button>
          </Form>
        </div>

        {!replyingTo && (
          <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CommentForm post_id={post.id} visitorName={visitorName} isLoggedIn={isLoggedIn} title="Tulis Komentar" />
          </motion.div>
        )}

        <div className="flex flex-col gap-12 pb-24">
          {rootComments.map((comment: any) => (
            <div key={comment.id} className="flex flex-col gap-6">
              <CommentItem comment={comment} onReply={() => setReplyingTo(comment.id)} isAuthor={comment.name === adminUsername} isReplying={replyingTo === comment.id} />

              <AnimatePresence>
                {replyingTo === comment.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-6 md:ml-8 overflow-hidden"
                  >
                    <CommentForm post_id={post.id} parent_id={comment.id} visitorName={visitorName} isLoggedIn={isLoggedIn} onCancel={() => setReplyingTo(null)} autoFocus />
                  </motion.div>
                )}
              </AnimatePresence>

              {repliesMap[comment.id] && (
                <div className="ml-6 md:ml-8 flex flex-col gap-6 border-l border-white/5 pl-6 md:pl-8">
                  {repliesMap[comment.id].map((reply: any) => (
                    <div key={reply.id} className="flex flex-col gap-6">
                      <CommentItem comment={reply} onReply={() => setReplyingTo(reply.id)} isAuthor={reply.name === adminUsername} isReply isReplying={replyingTo === reply.id} />
                      <AnimatePresence>
                        {replyingTo === reply.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <CommentForm
                              post_id={post.id}
                              parent_id={comment.id}
                              visitorName={visitorName}
                              isLoggedIn={isLoggedIn}
                              onCancel={() => setReplyingTo(null)}
                              autoFocus
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CommentItem({ comment, onReply, isAuthor, isReply, isReplying }: any) {
  return (
    <motion.div layout className="group flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={cn("text-[15px] font-semibold tracking-tight", isAuthor ? "text-white" : "text-zinc-200")}>{comment.name}</span>
            {isAuthor && <span className="text-[8px] bg-zinc-200 text-zinc-950 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter">Author</span>}
          </div>
          <span className="text-[10px] font-mono text-zinc-600 tracking-wider uppercase">
            {new Date(comment.created_at).toLocaleDateString()} — {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {!isReplying && (
          <button
            onClick={onReply}
            className="opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center gap-1.5"
          >
            <ArrowUDownLeft weight="bold" /> Reply
          </button>
        )}
      </div>

      <p className={cn("text-zinc-400 leading-relaxed max-w-[65ch]", isReply ? "text-sm" : "text-[15px]")}>{comment.content}</p>
    </motion.div>
  );
}

function CommentForm({ post_id, parent_id, visitorName, isLoggedIn, onCancel, autoFocus, title }: any) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const showNameInput = !isLoggedIn && !visitorName;

  return (
    <Form
      method="post"
      className={cn("flex flex-col gap-4 p-5 rounded-2xl border transition-all", parent_id ? "bg-zinc-900/40 border-white/10 mt-2 shadow-lg" : "bg-white/[0.02] border-white/5")}
    >
      <div className="flex items-center justify-between">
        {title && <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</h4>}
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      <input type="hidden" name="post_id" value={post_id} />
      {parent_id && <input type="hidden" name="parent_id" value={parent_id} />}

      <div className="flex flex-col gap-3">
        {showNameInput && (
          <input
            type="text"
            name="name"
            placeholder="Nama..."
            required
            className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
          />
        )}

        <textarea
          name="content"
          placeholder={parent_id ? "Balas komentar..." : "Tulis pikiran anda..."}
          required
          rows={2}
          autoFocus={autoFocus}
          className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all resize-none placeholder:text-zinc-700"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          name="intent"
          value="comment"
          disabled={isSubmitting}
          className="bg-white text-zinc-950 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full"
            />
          ) : (
            <PaperPlaneTilt weight="bold" size={12} />
          )}
          {isSubmitting ? "Satu momen..." : "Kirim"}
        </button>
      </div>
    </Form>
  );
}
