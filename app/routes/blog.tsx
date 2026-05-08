import { Link, Form, useSubmit } from "react-router";
import type { Route } from "./+types/blog";
import { getAuthSession } from "../utils/session.server";
import { siteConfig } from "../config";
import { formatDate } from "../utils/date";
import { getPosts } from "../services/post.server";

export function meta({ location }: Route.MetaArgs) {
  const url = new URL(location.pathname + location.search, siteConfig.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const q = url.searchParams.get("q");

  const title = page > 1 ? `Blog - Halaman ${page} | ${siteConfig.name}` : `Blog | ${siteConfig.name}`;
  const description = `Read the latest articles and thoughts from ${siteConfig.author}.`;

  const metaTags = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: `${siteConfig.url}/blog` },
    { property: "og:type", content: "website" },
    { property: "og:image", content: siteConfig.ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: siteConfig.ogImage },
    { tagName: "link", rel: "canonical", href: `${siteConfig.url}/blog` },
  ];

  if (q) {
    metaTags.push({ name: "robots", content: "noindex, follow" });
  }

  return metaTags;
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await getAuthSession(request, context.cloudflare.env);
  const isLoggedIn = session.has("userId");

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const search = url.searchParams.get("q") || "";
  
  const postData = await getPosts(db, isLoggedIn, page, search);
  return { ...postData, isLoggedIn };
}

export default function Blog({ loaderData }: Route.ComponentProps) {
  const { posts, isLoggedIn, page, totalPages, search } = loaderData;
  const submit = useSubmit();
  const searchParam = search ? `&q=${encodeURIComponent(search)}` : "";

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-4xl font-semibold tracking-tight text-black">All Posts.</h1>
        <Form method="get" className="relative w-full md:w-64" onChange={(e) => submit(e.currentTarget)}>
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search posts..."
            className="w-full bg-white border border-gray-200 rounded-sm px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
          {search && (
            <Link to="/blog" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
              ✕
            </Link>
          )}
        </Form>
      </div>

      <div className="flex flex-col gap-0 border-t border-gray-200">
        {posts.length === 0 ? (
          <p className="text-gray-500 italic py-4">{search ? `No posts matched with "${search}".` : "No posts published yet."}</p>
        ) : (
          posts.map((post: any) => (
            <Link key={post.id} to={`/post/${post.slug}`} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-sm">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-black group-hover:underline decoration-gray-300 underline-offset-4">{post.title}</h2>
                {post.is_draft === 1 && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-sm bg-gray-100 text-gray-500 border border-gray-200">
                    Draft
                  </span>
                )}
              </div>
              <time className="text-sm text-gray-500 shrink-0">{formatDate(post.created_at)}</time>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          {page > 1 ? (
            <Link
              to={`/blog?page=${page - 1}${searchParam}`}
              className="px-4 py-2 border border-gray-200 rounded-sm hover:bg-gray-50 hover:text-black text-gray-600 transition-colors text-sm font-medium"
            >
              ← Previous
            </Link>
          ) : (
            <div />
          )}

          <span className="text-gray-500 text-sm">
            Page {page} of {totalPages}
          </span>

          {page < totalPages && (
            <Link
              to={`/blog?page=${page + 1}${searchParam}`}
              className="px-4 py-2 border border-gray-200 rounded-sm hover:bg-gray-50 hover:text-black text-gray-600 transition-colors text-sm font-medium"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
