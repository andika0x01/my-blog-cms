import type { Route } from "./+types/robots[.]txt";
import { siteConfig } from "../config";

export function loader({ request }: Route.LoaderArgs) {
  const robotsTxt = `
User-agent: *
Allow: /
Disallow: /admin
Disallow: /edit/
Disallow: /tulis
Disallow: /notifikasi
Disallow: /pengaturan
Disallow: /login

Sitemap: ${siteConfig.url}/sitemap.xml
`.trim();

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
