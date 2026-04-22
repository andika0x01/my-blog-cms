import { Link } from "react-router";
import { PencilSimple } from "@phosphor-icons/react";
import { getAuthSession } from "../utils/session.server";
import type { Route } from "./+types/tentang";
import { siteConfig } from "../config";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.page) {
    return [{ title: `Tentang | ${siteConfig.name}` }];
  }

  const { title, content } = data.page;

  const plainTextContent = content
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  const description = plainTextContent.substring(0, 160) || siteConfig.description;

  return [
    { title: `${title} | ${siteConfig.name}` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | ${siteConfig.name}` },
    { property: "og:description", content: description },
    { property: "og:url", content: `${siteConfig.url}/tentang` },
    { property: "og:type", content: "profile" },
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

  const page = await db.prepare("SELECT title, content FROM pages WHERE slug = 'about'").first<{ title: string; content: string }>();

  return { page, isLoggedIn };
}

export default function Tentang({ loaderData }: Route.ComponentProps) {
  const { page, isLoggedIn } = loaderData;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-medium tracking-tighter text-white">{page?.title || "Tentang Saya"}</h1>
        {isLoggedIn && (
          <Link to="/edit-page/about" className="p-2 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <PencilSimple size={20} />
          </Link>
        )}
      </div>

      {page?.content ? (
        <div
          className="prose prose-invert prose-neutral text-gray-400 leading-relaxed max-w-none 
          prose-headings:text-white prose-a:text-white prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="text-gray-500 italic">Belum ada konten untuk halaman ini.</p>
      )}
    </div>
  );
}
