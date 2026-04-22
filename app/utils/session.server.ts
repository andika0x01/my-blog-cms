import { createCookieSessionStorage, redirect } from "react-router";

export function getSessionStorage(env: any) {
  return createCookieSessionStorage({
    cookie: {
      name: "_blog_session",
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secrets: [env.SESSION_SECRET || "fallback_rahasia_lokal"],
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    },
  });
}

export async function getAuthSession(request: Request, env: any) {
  const storage = getSessionStorage(env);
  return storage.getSession(request.headers.get("Cookie"));
}

export async function requireUser(request: Request, env: any) {
  const session = await getAuthSession(request, env);
  const userId = session.get("userId");
  if (!userId) throw redirect("/login");
  return userId;
}
