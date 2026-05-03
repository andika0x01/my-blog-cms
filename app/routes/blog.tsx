import { Link, Form, useSubmit } from "react-router";
import type { Route } from "./+types/blog";
import { getAuthSession } from "../utils/session.server";
import { siteConfig } from "../config";
import { formatDate } from "../utils/date";

export function meta() {
  const title = `Blog | ${siteConfig.name}`;
  const description = `Read the latest articles and thoughts from ${siteConfig.author}.`;

  return [
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
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await getAuthSession(request, context.cloudflare.env);
  const isLoggedIn = session.has("userId");

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const search = url.searchParams.get("q") || "";
  const limit = 10;
  const offset = (page - 1) * limit;

  let baseQuery = isLoggedIn ? "FROM posts WHERE 1=1" : "FROM posts WHERE is_draft = 0";

  const params: (string | number)[] = [];

  if (search) {
    baseQuery += " AND (title LIKE ? OR content LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total ${baseQuery}`)
    .bind(...params)
    .first<{ total: number }>();
  const totalPosts = countResult?.total || 0;
  const totalPages = Math.ceil(totalPosts / limit);

  const postsQuery = `SELECT id, title, slug, created_at, is_draft ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const postsParams = [...params, limit, offset];

  const { results } = await db
    .prepare(postsQuery)
    .bind(...postsParams)
    .all();

  return {
    posts: results as any[],
    isLoggedIn,
    page,
    totalPages,
    search,
  };
}

export default function Blog({ loaderData }: Route.ComponentProps) {
  const { posts, isLoggedIn, page, totalPages, search } = loaderData;
  const submit = useSubmit();
  const searchParam = search ? `&q=${encodeURIComponent(search)}` : "";

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-4xl font-medium tracking-tighter text-white">All Posts.</h1>
        <Form method="get" className="relative w-full md:w-64" onChange={(e) => submit(e.currentTarget)}>
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search posts..."
            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors"
          />
          {search && (
            <Link to="/blog" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              ✕
            </Link>
          )}
        </Form>
      </div>

      <div className="flex flex-col gap-8">
        {posts.length === 0 ? (
          <p className="text-gray-500 italic">{search ? `No posts matched with "${search}".` : "No posts published yet."}</p>
        ) : (
          posts.map((post: any) => (
            <Link key={post.id} to={`/baca/${post.slug}`} className="group flex flex-col gap-2 relative py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-medium text-gray-200 group-hover:text-white transition-colors">{post.title}</h2>

                {isLoggedIn && post.is_draft === 1 && (
                  <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-white/5">Draft</span>
                )}
              </div>

              <time className="text-sm text-gray-500 font-mono">{formatDate(post.created_at)}</time>

              <div className="absolute bottom-0 left-0 h-[1px] w-full bg-white/5">
                <div className="h-full bg-white/20 w-0 group-hover:w-full transition-all duration-500 ease-out" />
              </div>
            </Link>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <div className="text-sm font-mono text-gray-500">
            Page {page} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                to={`/blog?page=${page - 1}${searchParam}`}
                className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                Previous
              </Link>
            ) : (
              <span className="px-5 py-2 bg-transparent text-gray-600 text-sm cursor-not-allowed">Previous</span>
            )}

            {page < totalPages ? (
              <Link
                to={`/blog?page=${page + 1}${searchParam}`}
                className="px-5 py-2 bg-white text-black rounded-full text-sm font-medium hover:scale-105 active:scale-95 transition-all"
              >
                Next
              </Link>
            ) : (
              <span className="px-5 py-2 bg-transparent text-gray-600 text-sm cursor-not-allowed">Next</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
