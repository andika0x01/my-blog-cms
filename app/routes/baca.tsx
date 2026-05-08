import { data, Form, Link, redirect, useNavigation } from "react-router";
import { useRef, useEffect } from "react";
import { Trash, PencilSimple, Heart, ChatCircle, ArrowLeft, PaperPlaneTilt, ArrowUDownLeft, X } from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Route } from "./+types/baca";
import { getAuthSession, getVisitorStorage } from "../utils/session.server";
import { siteConfig } from "../config";
import { cn } from "../utils/cn";
import { formatDate } from "../utils/date";
import { getPostBySlug, getPostNavigation, deletePost } from "../services/post.server";
import { getCommentsAndLikes, addLike, addComment } from "../services/comment.server";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) return [{ title: "Not Found" }];

  const { title, content, slug, created_at, id } = data.post;
  const description =
    content
      .replace(/<[^>]*>?/gm, "")
      .substring(0, 160)
      .trim() + "...";
  const postUrl = `${siteConfig.url}/baca/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "image": [
      siteConfig.ogImage
    ],
    "datePublished": new Date(created_at).toISOString(),
    "dateModified": new Date(created_at).toISOString(),
    "author": [{
      "@type": "Person",
      "name": siteConfig.author,
      "url": siteConfig.links.github
    }]
  };

  return [
    { title: `${title} | ${siteConfig.name}` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: postUrl },
    { property: "og:type", content: "article" },
    { property: "og:image", content: siteConfig.ogImage },
    { property: "article:published_time", content: new Date(created_at).toISOString() },
    { property: "article:author", content: siteConfig.author },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: siteConfig.ogImage },
    { "script:ld+json": jsonLd }
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

  const post = await getPostBySlug(db, params.slug, isLoggedIn);

  if (!post) {
    throw data("Post not found or hasn't been published yet.", { status: 404 });
  }

  const { prevPost, nextPost } = await getPostNavigation(db, post.created_at);
  const { likes, comments } = await getCommentsAndLikes(db, post.id);

  return {
    post,
    isLoggedIn,
    likes,
    comments,
    visitorName,
    visitorHasLiked,
    adminUsername,
    prevPost,
    nextPost,
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
    await deletePost(db, params.slug as string);
    return redirect("/blog");
  }

  const post_id = Number(formData.get("post_id"));

  if (intent === "like") {
    if (userId || visitorSession.get(`liked_${params.slug}`)) return null;

    await addLike(db, post_id);
    visitorSession.set(`liked_${params.slug}`, true);
    return data({ success: true }, { headers: { "Set-Cookie": await visitorStorage.commitSession(visitorSession) } });
  }

  if (intent === "comment") {
    const parent_id = formData.get("parent_id") ? Number(formData.get("parent_id")) : null;
    const content = formData.get("content") as string;
    let name = visitorSession.get("name") || (formData.get("name") as string);

    if (userId) {
      const user = await db.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first<{ username: string }>();
      name = user?.username || "Author";
    }

    if (!name || !content) return { error: "Konten tidak boleh kosong." };

    await addComment(db, post_id, name, content, parent_id);

    if (!userId) visitorSession.set("name", name);

    return data({ success: true }, { headers: { "Set-Cookie": await visitorStorage.commitSession(visitorSession) } });
  }

  return null;
}

export default function Baca({ loaderData }: Route.ComponentProps) {
  const { post, isLoggedIn, likes, comments, visitorName, visitorHasLiked, adminUsername, prevPost, nextPost } = loaderData;
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
    <div key={post.slug} className="flex flex-col gap-12 animate-in fade-in duration-700 mt-10">
      <Link to="/blog" className="group flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors w-fit font-mono">
        <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> /root/blog
      </Link>

      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-6 font-mono">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-none text-black my-2">{post.title}</h1>
              {post.is_draft === 1 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-sm uppercase tracking-widest font-bold border border-gray-200">Draft</span>
              )}
            </div>
            <time className="text-sm text-gray-500">[{formatDate(post.created_at, "dddd, DD MMMM YYYY")}]</time>
          </div>

          {isLoggedIn && (
            <div className="flex gap-2">
              <Link
                to={`/edit/${post.slug}`}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-sm text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-all font-sans"
              >
                <PencilSimple size={16} /> Edit
              </Link>
              <Form method="post" onSubmit={(e) => !confirm("Delete this post?") && e.preventDefault()}>
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600 hover:bg-red-100 transition-all font-sans"
                >
                  <Trash size={16} /> Delete
                </button>
              </Form>
            </div>
          )}
        </header>

        <div className="h-[1px] w-full bg-gray-200" />
        <div className="prose prose-neutral max-w-none text-gray-800 text-base leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
      </article>

      <nav className="flex flex-col md:flex-row justify-between gap-4 mt-8 pt-8 border-t border-gray-200 font-mono">
        {prevPost ? (
          <Link to={`/baca/${prevPost.slug}`} className="group flex flex-col gap-2 w-full md:w-1/2 text-left">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">← Previous</span>
            <span className="text-gray-800 group-hover:text-black font-medium transition-colors hover:underline decoration-gray-300 underline-offset-4">{prevPost.title}</span>
          </Link>
        ) : (
          <div className="w-full md:w-1/2" />
        )}

        {nextPost ? (
          <Link to={`/baca/${nextPost.slug}`} className="group flex flex-col gap-2 w-full md:w-1/2 text-left md:text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Next →</span>
            <span className="text-gray-800 group-hover:text-black font-medium transition-colors hover:underline decoration-gray-300 underline-offset-4">{nextPost.title}</span>
          </Link>
        ) : (
          <div className="w-full md:w-1/2" />
        )}
      </nav>

      <section className="flex flex-col gap-10 mt-12 font-sans">
        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-500">
            <ChatCircle size={22} weight="duotone" />
            <span className="font-mono text-xs tracking-widest uppercase">{comments.length} Responses</span>
          </div>

          <Form method="post">
            <input type="hidden" name="post_id" value={post.id} />
            <button
              type="submit"
              name="intent"
              value="like"
              disabled={isButtonDisabled}
              className={cn(
                "group flex items-center gap-3 px-5 py-2 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-all duration-300 border",
                isLoggedIn
                  ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                  : isActuallyLiked
                    ? "bg-rose-50 text-rose-500 border-rose-200 cursor-default"
                    : "bg-white text-black border-black hover:bg-gray-50 hover:scale-105 active:scale-95 shadow-sm"
              )}
            >
              <Heart
                weight={isActuallyLiked ? "fill" : "bold"}
                className={cn(
                  "w-4 h-4 transition-transform duration-300",
                  !isButtonDisabled && "group-hover:scale-110 group-hover:text-rose-500",
                  isActuallyLiked && "text-rose-500 animate-in zoom-in duration-300"
                )}
              />
              <span>{isActuallyLiked ? "Liked" : "Like"}</span>

              <div className={cn("w-[1px] h-3.5 transition-colors duration-300", isLoggedIn ? "bg-gray-300" : isActuallyLiked ? "bg-rose-200" : "bg-gray-300")} />
              <span className="font-mono text-[11px]">{likes}</span>
            </button>
          </Form>
        </div>

        {!replyingTo && (
          <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CommentForm post_id={post.id} visitorName={visitorName} isLoggedIn={isLoggedIn} title="Write a comment" />
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
                <div className="ml-6 md:ml-8 flex flex-col gap-6 border-l border-gray-200 pl-6 md:pl-8">
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
    <motion.div layout className="flex flex-col gap-2 md:gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm md:text-base font-semibold tracking-tight", isAuthor ? "text-black" : "text-gray-800")}>{comment.name}</span>
            {isAuthor && <span className="text-[9px] md:text-[10px] bg-black text-white px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter">Author</span>}
          </div>
          <span className="text-[10px] md:text-xs font-mono text-gray-500 tracking-wider uppercase mt-0.5">{formatDate(comment.created_at, "DD/MM/YYYY — HH:mm")}</span>
        </div>

        {!isReplying && (
          <button
            onClick={onReply}
            className="shrink-0 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors flex items-center gap-1.5 mt-1"
          >
            <ArrowUDownLeft weight="bold" /> Reply
          </button>
        )}
      </div>

      <p className={cn("text-gray-600 leading-relaxed max-w-[65ch]", isReply ? "text-sm" : "text-sm md:text-base")}>{comment.content}</p>
    </motion.div>
  );
}

function CommentForm({ post_id, parent_id, visitorName, isLoggedIn, onCancel, autoFocus, title }: any) {
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

  const isSubmitting = navigation.state === "submitting";
  const showNameInput = !isLoggedIn && !visitorName;

  useEffect(() => {
    if (navigation.state === "idle") {
      formRef.current?.reset();
    }
  }, [navigation.state]);

  return (
    <Form
      ref={formRef}
      method="post"
      className={cn("flex flex-col gap-4 p-5 rounded-sm border transition-all", parent_id ? "bg-gray-50 border-gray-200 mt-2 shadow-sm" : "bg-white border-gray-200")}
    >
      <div className="flex items-center justify-between">
        {title && <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{title}</h4>}
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gray-500 hover:text-black transition-colors">
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      <input type="hidden" name="post_id" value={post_id} />
      {parent_id && <input type="hidden" name="parent_id" value={parent_id} />}

      <div className="flex flex-col gap-3 font-sans">
        {showNameInput && (
          <input
            type="text"
            name="name"
            placeholder="Name..."
            required
            className="bg-white border border-gray-200 rounded-sm px-4 py-2.5 text-xs text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-400"
          />
        )}

        <textarea
          name="content"
          placeholder={parent_id ? "Reply to comment..." : "Write your thoughts..."}
          required
          rows={2}
          autoFocus={autoFocus}
          className="bg-white border border-gray-200 rounded-sm px-4 py-3 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          name="intent"
          value="comment"
          disabled={isSubmitting}
          className="bg-black text-white px-6 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <PaperPlaneTilt weight="bold" size={12} />
          )}
          {isSubmitting ? "One moment..." : "Send"}
        </button>
      </div>
    </Form>
  );
}
