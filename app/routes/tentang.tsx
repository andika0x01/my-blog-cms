import { Link } from "react-router";
import { PencilSimple } from "@phosphor-icons/react";
import { getAuthSession } from "../utils/session.server";
import type { Route } from "./+types/tentang";

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
      <div className="prose prose-invert prose-neutral text-gray-400 leading-relaxed max-w-none" dangerouslySetInnerHTML={{ __html: page?.content || "" }} />
    </div>
  );
}
