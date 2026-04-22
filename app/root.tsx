import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { getAuthSession } from "./utils/session.server";
import { Header } from "./components/header";
import "./app.css";

export function meta() {
  return [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#050505" },
    { property: "og:site_name", content: "Andika Dinata" },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" },
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",
  },
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css",
  },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await getAuthSession(request, context.cloudflare.env);
  return { isLoggedIn: session.has("userId") };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <div className="max-w-[720px] mx-auto w-full px-5 md:px-0 min-h-[100dvh] flex flex-col">
      <Header isLoggedIn={loaderData.isLoggedIn} />
      <main className="flex-1 py-12 md:py-16">
        <Outlet />
      </main>
      <footer className="py-8 border-t border-white/10 text-sm text-gray-600 flex justify-between items-center">
        <p>© {new Date().getFullYear()} Andika Dinata.</p>
      </footer>
    </div>
  );
}
