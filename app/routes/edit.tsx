import type { Route } from "./+types/edit";
import { Editor } from "../components/editor";
import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import { requireUser } from "../utils/session.server";
import { siteConfig } from "~/config";

export function meta() {
  return [{ title: `Edit Artikel | ${siteConfig.name}` }];
}

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  slug: string;
  is_draft: number;
};

export async function loader({ params, context, request }: Route.LoaderArgs) {
  await requireUser(request, context.cloudflare.env);
  const db = context.cloudflare.env.DB;

  const post = await db.prepare("SELECT * FROM posts WHERE slug = ?").bind(params.slug).first<Post>();

  if (!post) throw new Response("Not Found", { status: 404 });
  return { post };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  await requireUser(request, context.cloudflare.env);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const intent = formData.get("intent") as string;

  const db = context.cloudflare.env.DB;
  const isDraft = intent === "draft" ? 1 : 0;

  await db.prepare("UPDATE posts SET title = ?, content = ?, is_draft = ? WHERE slug = ?").bind(title, content, isDraft, params.slug).run();
  return redirect(`/baca/${params.slug}`);
}

export default function Edit({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;
  const [content, setContent] = useState<string>(post.content);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 w-full">
        <input
          type="text"
          name="title"
          defaultValue={post.title}
          className="w-full min-w-0 flex-1 text-4xl md:text-5xl font-medium tracking-tighter bg-transparent border-none outline-none text-white focus:ring-0"
        />

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-full font-medium text-sm border transition-all disabled:opacity-50 ${
              post.is_draft === 1 ? "bg-white/5 border-white/20 text-white" : "border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {isSubmitting ? "..." : post.is_draft === 1 ? "Simpan Draft" : "Jadikan Draft"}
          </button>

          <button
            type="submit"
            name="intent"
            value="publish"
            disabled={isSubmitting}
            className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : post.is_draft === 1 ? "Publish Sekarang" : "Update"}
          </button>
        </div>
      </div>

      <input type="hidden" name="content" value={content} />
      <Editor initialContent={post.content} onChange={(html) => setContent(html)} />
    </Form>
  );
}
