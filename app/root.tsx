import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/root";
import { getAuthSession } from "./utils/session.server";
import { Header } from "./components/header";
import "./app.css";
import { ErrorPage } from "./components/error-page";
import { siteConfig } from "./config";

export function meta() {
  return [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
    { name: "theme-color", content: "#050505" },
    { name: "author", content: siteConfig.author },
    { property: "og:site_name", content: siteConfig.name },
    { property: "og:locale", content: siteConfig.locale },
    { name: "twitter:site", content: siteConfig.twitterHandle },
    { name: "twitter:creator", content: siteConfig.twitterHandle },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" },
  { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" },
  { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" },
  { rel: "canonical", href: siteConfig.url },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await getAuthSession(request, context.cloudflare.env);
  return { isLoggedIn: session.has("userId") };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-oled text-gray-400 antialiased selection:bg-white selection:text-black">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <Layout>
      <div className="max-w-[720px] mx-auto w-full px-5 md:px-0 min-h-[100dvh] flex flex-col break-words overflow-x-hidden">
        <Header isLoggedIn={loaderData.isLoggedIn} />
        <main className="flex-1 py-12 md:py-16">
          <Outlet />
        </main>
        <footer className="py-8 border-t border-white/10 text-sm text-gray-600 flex justify-between items-center">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}.
          </p>
        </footer>
      </div>
    </Layout>
  );
}

export function ErrorBoundary({ error }: any) {
  let status = 500;
  let message = "Internal Server Error";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message = error.data?.message || error.statusText;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <Layout>
      <div className="max-w-[720px] mx-auto w-full px-5 md:px-0 min-h-[100dvh] flex flex-col break-words">
        <Header isLoggedIn={false} />
        <main className="flex-1 py-12 md:py-16">
          <ErrorPage status={status} message={message} />
        </main>
      </div>
    </Layout>
  );
}
