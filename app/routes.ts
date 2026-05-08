import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blog", "routes/blog.tsx"),
  route("about", "routes/about.tsx"),
  route("write", "routes/write.tsx"),
  route("post/:slug", "routes/post.tsx"),
  route("edit/:slug", "routes/edit.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("settings", "routes/settings.tsx"),
  route("edit-page/:slug", "routes/edit-page.tsx"),
  route("notifications", "routes/notifications.tsx"),
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("robots.txt", "routes/robots[.]txt.ts"),
] satisfies RouteConfig;
