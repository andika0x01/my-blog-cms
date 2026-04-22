import type { Route } from "./+types/edit";
import { Editor } from "../components/editor";
import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import { requireUser } from "../utils/session.server";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  slug: string;
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
  const db = context.cloudflare.env.DB;

  await db.prepare("UPDATE posts SET title = ?, content = ? WHERE slug = ?").bind(title, content, params.slug).run();

  return redirect(`/baca/${params.slug}`);
}

export default function Edit({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  const [content, setContent] = useState<string>(post.content);
  const navigation = useNavigation();

  return (
    <Form method="post" className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-start justify-between gap-4">
        <input
          type="text"
          name="title"
          defaultValue={post.title}
          className="flex-1 text-4xl md:text-5xl font-medium tracking-tighter bg-transparent border-none outline-none text-white focus:ring-0"
        />
        <button type="submit" className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
          {navigation.state === "submitting" ? "Menyimpan..." : "Update"}
        </button>
      </div>
      <input type="hidden" name="content" value={content} />
      <Editor initialContent={post.content} onChange={(html) => setContent(html)} />
    </Form>
  );
}
