import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/root";
import { getAuthSession, getVisitorStorage } from "./utils/session.server";
import { Header } from "./components/header";
import appCss from "./app.css?url";
import { ErrorPage } from "./components/error-page";
import { siteConfig } from "./config";

export function meta() {
  return [
    { name: "theme-color", content: "#050505" },
    { name: "author", content: siteConfig.author },
    { property: "og:site_name", content: siteConfig.name },
    { property: "og:locale", content: siteConfig.locale },
    { name: "twitter:site", content: siteConfig.twitterHandle },
    { name: "twitter:creator", content: siteConfig.twitterHandle },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: appCss },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" },
  { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" },
  { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" },
  { rel: "canonical", href: siteConfig.url },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await getAuthSession(request, context.cloudflare.env);
  const isLoggedIn = session.has("userId");

  const visitorStorage = getVisitorStorage(context.cloudflare.env);
  const visitorSession = await visitorStorage.getSession(request.headers.get("Cookie"));
  const visitorName = visitorSession.get("name") || "";

  const db = context.cloudflare.env.DB;
  let adminUnreadCount = 0;
  let visitorUnreadCount = 0;

  try {
    if (isLoggedIn) {
      const userId = session.get("userId");
      const user = await db.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first<{ username: string }>();
      const adminName = user?.username || "admin";

      const resAdmin = await db.prepare("SELECT COUNT(*) as count FROM comments WHERE is_read = 0 AND name != ?").bind(adminName).first();
      adminUnreadCount = (resAdmin as any)?.count || 0;
    }

    if (visitorName) {
      // Find replies to the visitor's comments that haven't been read by the visitor
      const resVisitor = await db
        .prepare(
          `
        SELECT COUNT(*) as count 
        FROM comments c 
        JOIN comments p ON c.parent_id = p.id 
        WHERE p.name = ? AND c.name != ? AND c.visitor_read = 0
        `
        )
        .bind(visitorName, visitorName)
        .first();
      visitorUnreadCount = (resVisitor as any)?.count || 0;
    }
  } catch (error) {
    // Gracefully handle if visitor_read column doesn't exist yet during migration
    console.error("Error fetching notification counts:", error);
  }

  return { isLoggedIn, adminUnreadCount, visitorUnreadCount, isVisitor: !!visitorName };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

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
    <div className="max-w-[720px] mx-auto w-full px-5 md:px-0 min-h-[100dvh] flex flex-col break-words overflow-x-hidden">
      <Header 
        isLoggedIn={loaderData.isLoggedIn} 
        adminUnreadCount={loaderData.adminUnreadCount} 
        visitorUnreadCount={loaderData.visitorUnreadCount} 
        isVisitor={loaderData.isVisitor}
      />
      <main className="flex-1 py-12 md:py-16">
        <Outlet />
      </main>
      <footer className="py-8 border-t border-white/10 text-sm text-gray-600 flex justify-between items-center">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}.
        </p>
      </footer>
    </div>
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
    <div className="max-w-[720px] mx-auto w-full px-5 md:px-0 min-h-[100dvh] flex flex-col break-words">
      <Header isLoggedIn={false} />
      <main className="flex-1 py-12 md:py-16">
        <ErrorPage status={status} message={message} />
      </main>
    </div>
  );
}
