import { Link } from "react-router";
import type { Route } from "./+types/blog";
import { getAuthSession } from "../utils/session.server";
import { siteConfig } from "../config";

export function meta() {
  return [{ title: `Semua Tulisan | ${siteConfig.name}` }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await getAuthSession(request, context.cloudflare.env);
  const isLoggedIn = session.has("userId");

  const query = isLoggedIn
    ? "SELECT id, title, slug, created_at, is_draft FROM posts ORDER BY created_at DESC"
    : "SELECT id, title, slug, created_at, is_draft FROM posts WHERE is_draft = 0 ORDER BY created_at DESC";

  const { results } = await db.prepare(query).all();

  return {
    posts: results as any[],
    isLoggedIn,
  };
}

export default function Blog({ loaderData }: Route.ComponentProps) {
  const { posts, isLoggedIn } = loaderData;

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-4xl font-medium tracking-tighter text-white">Semua Tulisan.</h1>

      <div className="flex flex-col gap-8">
        {posts.length === 0 ? (
          <p className="text-gray-500 italic">Belum ada tulisan.</p>
        ) : (
          posts.map((post: any) => (
            <Link key={post.id} to={`/baca/${post.slug}`} className="group flex flex-col gap-2 relative py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-medium text-gray-200 group-hover:text-white transition-colors">{post.title}</h2>

                {isLoggedIn && post.is_draft === 1 && (
                  <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-white/5">Draft</span>
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

              <div className="absolute bottom-0 left-0 h-[1px] w-full bg-white/5">
                <div className="h-full bg-white/20 w-0 group-hover:w-full transition-all duration-500 ease-out" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
