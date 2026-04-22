import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { getAuthSession, getSessionStorage } from "../utils/session.server";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await getAuthSession(request, context.cloudflare.env);
  const sessionStorage = getSessionStorage(context.cloudflare.env);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
