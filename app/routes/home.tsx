import { Link } from "react-router";
import type { Route } from "./+types/home";
import { siteConfig } from "../config";
import { formatDate } from "../utils/date";
import { getRecentPosts } from "../services/post.server";

export function meta() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteConfig.name,
    "url": siteConfig.url,
    "description": siteConfig.description,
    "author": {
      "@type": "Person",
      "name": siteConfig.author
    }
  };

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
    { "script:ld+json": jsonLd }
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  try {
    const posts = await getRecentPosts(db);
    return { posts };
  } catch (error) {
    console.error("Database error:", error);
    return { posts: [] };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;

  return (
    <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-10">
      <header className="flex flex-col gap-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-none text-black">{siteConfig.name}</h1>
        <p className="text-base text-gray-500 leading-relaxed max-w-[65ch]">{siteConfig.description}</p>
      </header>

      <section className="flex flex-col gap-0 border-t border-gray-200">
        {posts.length === 0 ? (
          <p className="text-gray-500 italic py-4">No posts published yet.</p>
        ) : (
          posts.map((post: any) => (
            <Link key={post.id} to={`/baca/${post.slug}`} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-sm">
              <h2 className="text-lg font-medium text-black">{post.title}</h2>
              <time className="text-sm text-gray-500 shrink-0">{formatDate(post.created_at)}</time>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
