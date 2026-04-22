import { requireUser } from "../utils/session.server";
import type { Route } from "./+types/notifikasi";
import { Link, Form, useNavigation } from "react-router";
import { cn } from "~/utils/cn";
import { BellSlash, CaretRight } from "@phosphor-icons/react";
import { siteConfig } from "~/config";

export function meta() {
  return [{ title: `Notifikasi | ${siteConfig.name}` }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const userId = await requireUser(request, context.cloudflare.env);
  const db = context.cloudflare.env.DB;
  const user = await db.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first<{ username: string }>();
  const myName = user?.username || "admin";

  const { results } = await db
    .prepare(
      `
    SELECT c.*, p.title as post_title, p.slug as post_slug 
    FROM comments c 
    JOIN posts p ON c.post_id = p.id 
    WHERE c.name != ?
    ORDER BY c.is_read ASC, c.created_at DESC
  `
    )
    .bind(myName)
    .all();

  return { comments: results };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireUser(request, context.cloudflare.env);
  const db = context.cloudflare.env.DB;
  await db.prepare("UPDATE comments SET is_read = 1 WHERE is_read = 0").run();
  return { success: true };
}

export default function Notifikasi({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isUpdating = navigation.state === "submitting";
  const unreadCount = loaderData.comments.filter((c: any) => c.is_read === 0).length;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-medium tracking-tighter text-white">Notifikasi.</h1>
          <p className="text-xs font-mono text-gray-600 mt-2 uppercase tracking-widest">{unreadCount} UNREAD MESSAGES</p>
        </div>

        {unreadCount > 0 && (
          <Form method="post">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 bg-white text-black hover:bg-gray-200 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? "MARKING..." : "Clear All"}
            </button>
          </Form>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {loaderData.comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-700">
            <BellSlash size={32} weight="thin" className="mb-4 opacity-20" />
            <p className="text-sm font-mono tracking-tight">Kotak masuk bersih.</p>
          </div>
        ) : (
          loaderData.comments.map((c: any) => (
            <Link
              key={c.id}
              to={`/baca/${c.post_slug}`}
              className={cn(
                "group relative p-6 rounded-3xl border transition-all duration-300 flex flex-col gap-3",
                c.is_read === 0
                  ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20"
                  : "bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {c.is_read === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  <span className={cn("text-sm font-semibold tracking-tight", c.is_read === 0 ? "text-white" : "text-gray-400")}>{c.name}</span>
                  <span className="text-[10px] text-gray-600 font-mono">— {c.post_title}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-600 uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>

              <p className={cn("text-sm leading-relaxed max-w-[60ch]", c.is_read === 0 ? "text-gray-300" : "text-gray-500")}>{c.content}</p>

              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                View Thread <CaretRight weight="bold" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
