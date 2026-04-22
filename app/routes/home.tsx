import { Link } from "react-router";
import type { Route } from "./+types/home";
import { siteConfig } from "../config";

export function meta() {
  return [
    { title: siteConfig.title },
    { name: "description", content: siteConfig.description },
    { property: "og:title", content: siteConfig.title },
    { property: "og:description", content: siteConfig.description },
    { property: "og:url", content: siteConfig.url },
    { property: "og:type", content: "website" },
    { property: "og:image", content: siteConfig.ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: siteConfig.title },
    { name: "twitter:description", content: siteConfig.description },
    { name: "twitter:image", content: siteConfig.ogImage },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  try {
    const { results } = await db.prepare("SELECT id, title, slug, created_at FROM posts WHERE is_draft = 0 ORDER BY created_at DESC LIMIT 3").all();
    return { posts: results };
  } catch (error) {
    console.error("Database error:", error);
    return { posts: [] };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;

  return (
    <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-6">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-none text-white">very poor and very stupid</h1>
        <p className="text-base text-gray-400 leading-relaxed max-w-[65ch]">welcome to my ugly blog!</p>
      </header>

      <section className="flex flex-col gap-8">
        {posts.length === 0 ? (
          <p className="text-gray-500 italic">Belum ada tulisan.</p>
        ) : (
          posts.map((post: any) => (
            <Link key={post.id} to={`/baca/${post.slug}`} className="group flex flex-col gap-2 relative py-4">
              <h2 className="text-xl md:text-2xl font-medium text-gray-200 group-hover:text-white transition-colors">{post.title}</h2>
              <time className="text-sm text-gray-500 font-mono">
                {new Date(post.created_at).toLocaleDateString("id-ID", {
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
      </section>
    </div>
  );
}
