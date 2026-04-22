import type { Route } from "./+types/login";
import { Form, redirect, useNavigation } from "react-router";
import { getSessionStorage } from "../utils/session.server";
import bcrypt from "bcryptjs";
import { siteConfig } from "~/config";

export function meta() {
  return [{ title: `Login | ${siteConfig.name}` }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const { DB, SESSION_SECRET } = context.cloudflare.env;

  const user = await DB.prepare("SELECT id, password FROM users WHERE username = ?").bind(username).first<any>();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Username atau password salah." };
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
          <h1 className="text-3xl font-medium tracking-tight text-white">Login.</h1>
          <p className="text-gray-400">Masuk untuk mengelola tulisan.</p>
        </div>

        <Form method="post" className="space-y-4">
          <div className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              className="w-full bg-transparent border-b border-white/10 px-0 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white transition-colors"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full bg-transparent border-b border-white/10 px-0 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {actionData?.error && <p className="text-red-400 text-sm">{actionData.error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black py-3 rounded-full font-medium mt-4 hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </Form>
      </div>
    </div>
  );
}
