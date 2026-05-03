import type { Route } from "./+types/sitemap[.]xml";
import { siteConfig } from "../config";

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  
  const { results: posts } = await db.prepare("SELECT slug, created_at FROM posts WHERE is_draft = 0 ORDER BY created_at DESC").all<{ slug: string, created_at: string }>();

  const urls = [
    { loc: `${siteConfig.url}/`, lastmod: new Date().toISOString() },
    { loc: `${siteConfig.url}/blog`, lastmod: new Date().toISOString() },
    { loc: `${siteConfig.url}/tentang`, lastmod: new Date().toISOString() },
    ...posts.map((post) => ({
      loc: `${siteConfig.url}/baca/${post.slug}`,
      lastmod: new Date(post.created_at).toISOString(),
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("")}
</urlset>`.trim();

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
