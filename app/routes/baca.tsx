import { data, Form, Link, redirect } from "react-router";
import { Trash, PencilSimple } from "@phosphor-icons/react";
import type { Route } from "./+types/baca";
import { getAuthSession } from "../utils/session.server";
import { siteConfig } from "../config";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) return [{ title: "Not Found" }];

  const { title, content, slug } = data.post;
  const description = content.replace(/<[^>]*>?/gm, "").substring(0, 160);

  return [
    { title: `${title} | ${siteConfig.name}` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:url", content: `${siteConfig.url}/baca/${slug}` },
    { property: "og:site_name", content: siteConfig.name },
    { name: "twitter:card", content: "summary_large_image" },
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
  const session = await getAuthSession(request, context.cloudflare.env);
  const isLoggedIn = session.has("userId");

  const post = await db.prepare("SELECT id, title, content, created_at, slug, is_draft FROM posts WHERE slug = ?").bind(params.slug).first<Post>();

  if (!post) throw data("Tulisan tidak ditemukan", { status: 404 });

  if (post.is_draft === 1 && !isLoggedIn) {
    throw data("Maaf, tulisan ini belum dipublikasi.", { status: 404 });
  }

  return { post, isLoggedIn };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const session = await getAuthSession(request, context.cloudflare.env);
  if (!session.has("userId")) return data("Unauthorized", { status: 401 });

  await db.prepare("DELETE FROM posts WHERE slug = ?").bind(params.slug).run();
  return redirect("/blog");
}

export default function Baca({ loaderData }: Route.ComponentProps) {
  const { post, isLoggedIn } = loaderData;

  return (
    <article className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-tight text-white">{post.title}</h1>
            {post.is_draft === 1 && (
              <span className="text-xs bg-white/10 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-white/5">Draft</span>
            )}
          </div>

          <time className="text-sm text-gray-500 font-mono">
            {new Date(post.created_at).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        {isLoggedIn && (
          <div className="flex gap-2">
            <Link
              to={`/edit/${post.slug}`}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white transition-colors"
            >
              <PencilSimple size={16} /> Edit
            </Link>
            <Form method="post" onSubmit={(e) => !confirm("Hapus tulisan ini?") && e.preventDefault()}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-sm text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash size={16} /> Hapus
              </button>
            </Form>
          </div>
        )}
      </header>

      <div className="h-[1px] w-full bg-white/10" />

      <div
        className="prose prose-invert prose-neutral max-w-none text-gray-300 prose-a:text-white prose-a:underline prose-a:decoration-white/30 hover:prose-a:decoration-white"
        dangerouslySetInnerHTML={{ __html: post.content || "" }}
      />
    </article>
  );
}
