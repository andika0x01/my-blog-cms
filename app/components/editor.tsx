"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { Mathematics } from "@tiptap/extension-mathematics";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback } from "react";
import { TextB, TextItalic, TextStrikethrough, TextHOne, TextHTwo, TextHThree, CodeBlock, Link as LinkIcon, LinkBreak } from "@phosphor-icons/react";
import { cn } from "../utils/cn";

const lowlight = createLowlight(common);

export function Editor({ onChange, initialContent = "" }: { onChange?: (html: string) => void; initialContent?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: { class: "rounded-xl bg-zinc-950 p-4 font-mono text-sm border border-white/5 my-6" },
      }),
      Mathematics,
      Placeholder.configure({
        placeholder: "Tulis sesuatu yang bermakna...",
        emptyEditorClass: "is-editor-empty",
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: "rounded-2xl border border-white/10 my-8" },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-white underline decoration-white/30 underline-offset-4 cursor-pointer hover:decoration-white transition-colors",
        },
      }),
      Youtube.configure({
        width: 720,
        height: 405,
        HTMLAttributes: { class: "rounded-2xl overflow-hidden my-8 w-full aspect-video" },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-neutral max-w-none focus:outline-none min-h-[50vh]",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="w-full mt-8 relative">
      <BubbleMenu editor={editor} className="flex items-center gap-1 bg-zinc-900 border border-white/10 shadow-xl rounded-lg px-2 py-1.5 backdrop-blur-md overflow-x-auto">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("heading", { level: 1 }) ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
        >
          <TextHOne weight="bold" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("heading", { level: 2 }) ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
        >
          <TextHTwo weight="bold" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("heading", { level: 3 }) ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
        >
          <TextHThree weight="bold" className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("bold") ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
        >
          <TextB weight="bold" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("italic") ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
        >
          <TextItalic weight="bold" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("strike") ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
        >
          <TextStrikethrough weight="bold" className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("link") ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
          title="Tambah/Edit Link"
        >
          <LinkIcon weight="bold" className="w-4 h-4" />
        </button>

        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
            title="Hapus Link"
          >
            <LinkBreak weight="bold" className="w-4 h-4" />
          </button>
        )}

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn("p-1.5 rounded-md transition-colors", editor.isActive("codeBlock") ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
        >
          <CodeBlock weight="bold" className="w-4 h-4" />
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
}
