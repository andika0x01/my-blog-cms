import type { Route } from "./+types/pengaturan";
import { Form, useNavigation } from "react-router";
import { requireUser } from "../utils/session.server";
import bcrypt from "bcryptjs";
import { siteConfig } from "~/config";

export function meta() {
  return [
    { title: `Settings | ${siteConfig.name}` },
    { name: "robots", content: "noindex, nofollow" }
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context.cloudflare.env);
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const userId = await requireUser(request, context.cloudflare.env);
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const db = context.cloudflare.env.DB;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.prepare("UPDATE users SET username = ?, password = ? WHERE id = ?").bind(username, hashedPassword, userId).run();
    return { success: "Profile updated successfully (Bcrypt)." };
  } catch (error) {
    return { error: "Failed to update profile." };
  }
}

export default function Pengaturan({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex flex-col gap-10 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-medium tracking-tighter text-white">Settings.</h1>
        <p className="text-gray-400">Update your login credentials.</p>
      </div>

      <Form method="post" className="space-y-4">
        <div className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="New Username"
            required
            className="w-full bg-transparent border-b border-white/10 px-0 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white transition-colors"
          />
          <input
            type="password"
            name="password"
            placeholder="New Password"
            required
            className="w-full bg-transparent border-b border-white/10 px-0 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        {actionData?.error && <p className="text-red-400 text-sm">{actionData.error}</p>}
        {actionData?.success && <p className="text-green-400 text-sm">{actionData.success}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white text-black py-3 rounded-full font-medium mt-4 hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </Form>
    </div>
  );
}
