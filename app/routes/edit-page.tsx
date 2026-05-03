import type { Route } from "./+types/edit-page";
import { Editor } from "../components/editor";
import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import { requireUser } from "../utils/session.server";
import { siteConfig } from "~/config";

export function meta() {
  return [
    { title: `Edit Page | ${siteConfig.name}` },
    { name: "robots", content: "noindex, nofollow" }
  ];
}

export async function loader({ params, context, request }: Route.LoaderArgs) {
  await requireUser(request, context.cloudflare.env);
  const db = context.cloudflare.env.DB;
  const page = await db.prepare("SELECT * FROM pages WHERE slug = ?").bind(params.slug).first<{ title: string; content: string }>();
  if (!page) throw new Response("Page Not Found", { status: 404 });
  return { page };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  await requireUser(request, context.cloudflare.env);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const db = context.cloudflare.env.DB;

  await db.prepare("UPDATE pages SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?").bind(title, content, params.slug).run();
  return redirect(params.slug === "about" ? "/tentang" : "/");
}

export default function EditPage({ loaderData }: Route.ComponentProps) {
  const { page } = loaderData;
  const [content, setContent] = useState(page.content);
  const navigation = useNavigation();

  return (
    <Form method="post" className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 w-full">
        <input
          type="text"
          name="title"
          defaultValue={page.title}
          className="w-full min-w-0 flex-1 text-4xl md:text-5xl font-medium tracking-tighter bg-transparent border-none outline-none text-white focus:ring-0"
        />

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <button type="submit" className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
            {navigation.state === "submitting" ? "Menyimpan..." : "Update Halaman"}
          </button>
        </div>
      </div>
      <input type="hidden" name="content" value={content} />
      <Editor initialContent={page.content} onChange={(html) => setContent(html)} />
    </Form>
  );
}
