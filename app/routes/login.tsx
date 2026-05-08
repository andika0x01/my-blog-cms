import type { Route } from "./+types/login";
import { Form, redirect, useNavigation } from "react-router";
import { getSessionStorage } from "../utils/session.server";
import bcrypt from "bcryptjs";
import { siteConfig } from "~/config";

export function meta() {
  return [
    { title: `Login | ${siteConfig.name}` },
    { name: "robots", content: "noindex, nofollow" }
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const { DB } = context.cloudflare.env;

  const user = await DB.prepare("SELECT id, password FROM users WHERE username = ?").bind(username).first<any>();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Incorrect username or password." };
  }

  const storage = getSessionStorage(context.cloudflare.env);
  const session = await storage.getSession();
  session.set("userId", user.id);

  return redirect("/", {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium tracking-tight text-black">Login.</h1>
          <p className="text-gray-500">Sign in to manage posts.</p>
        </div>

        <Form method="post" className="space-y-4">
          <div className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              className="w-full bg-transparent border-b border-black/10 px-0 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full bg-transparent border-b border-black/10 px-0 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {actionData?.error && <p className="text-red-500 text-sm">{actionData.error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-full font-medium mt-4 hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Sign In"}
          </button>
        </Form>
      </div>
    </div>
  );
}
