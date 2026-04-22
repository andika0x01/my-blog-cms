import { requireUser } from "../utils/session.server";
import type { Route } from "./+types/tulis";
import { Editor } from "../components/editor";
import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import { siteConfig } from "~/config";

export function meta() {
  return [{ title: `Tulis Artikel | ${siteConfig.name}` }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context.cloudflare.env);
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireUser(request, context.cloudflare.env);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const intent = formData.get("intent") as string;

  if (!title || !content) {
    return { error: "Judul dan konten wajib diisi." };
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const isDraft = intent === "draft" ? 1 : 0;
  const db = context.cloudflare.env.DB;

  try {
    await db.prepare("INSERT INTO posts (slug, title, content, is_draft) VALUES (?, ?, ?, ?)").bind(slug, title, content, isDraft).run();
  } catch (error) {
    return { error: "Gagal menyimpan. Pastikan judul unik agar slug tidak bentrok." };
  }

  return redirect(isDraft ? "/blog" : "/");
}

export default function Tulis({ actionData }: Route.ComponentProps) {
  const [content, setContent] = useState("");
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <input
          type="text"
          name="title"
          placeholder="Judul tulisan..."
          required
          className="flex-1 text-4xl md:text-5xl font-medium tracking-tighter bg-transparent border-none outline-none text-white placeholder:text-gray-600 focus:ring-0"
        />

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-full font-medium text-sm border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Simpan Draft"}
          </button>

          <button
            type="submit"
            name="intent"
            value="publish"
            disabled={isSubmitting}
            className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Menyimpan..." : "Publish"}
          </button>
        </div>
      </div>

      {actionData?.error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{actionData.error}</div>}

      <div className="h-[1px] w-full bg-white/10" />
      <input type="hidden" name="content" value={content} />
      <Editor onChange={(html) => setContent(html)} />
    </Form>
  );
}
