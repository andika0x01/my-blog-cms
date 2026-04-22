import { requireUser } from "../utils/session.server";
import type { Route } from "./+types/tulis";
import { Editor } from "../components/editor";
import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tulis Artikel | Andika" }];
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

  if (!title || !content) {
    return { error: "Judul dan konten wajib diisi." };
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const db = context.cloudflare.env.DB;

  try {
    await db.prepare("INSERT INTO posts (slug, title, content) VALUES (?, ?, ?)").bind(slug, title, content).run();
  } catch (error) {
    return { error: "Gagal menyimpan. Pastikan judul unik agar slug tidak bentrok." };
  }

  return redirect("/");
}

export default function Tulis({ actionData }: Route.ComponentProps) {
  const [content, setContent] = useState("");
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-start justify-between gap-4">
        <input
          type="text"
          name="title"
          placeholder="Judul tulisan..."
          required
          className="flex-1 text-4xl md:text-5xl font-medium tracking-tighter bg-transparent border-none outline-none text-white placeholder:text-gray-600 focus:ring-0"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          {isSubmitting ? "Menyimpan..." : "Publish"}
        </button>
      </div>

      {actionData?.error && <p className="text-red-400 text-sm">{actionData.error}</p>}

      <div className="h-[1px] w-full bg-white/10" />
      <input type="hidden" name="content" value={content} />
      <Editor onChange={(html) => setContent(html)} />
    </Form>
  );
}
