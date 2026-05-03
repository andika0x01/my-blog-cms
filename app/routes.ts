import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blog", "routes/blog.tsx"),
  route("tentang", "routes/tentang.tsx"),
  route("tulis", "routes/tulis.tsx"),
  route("baca/:slug", "routes/baca.tsx"),
  route("edit/:slug", "routes/edit.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("pengaturan", "routes/pengaturan.tsx"),
  route("edit-page/:slug", "routes/edit-page.tsx"),
  route("notifikasi", "routes/notifikasi.tsx"),
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("robots.txt", "routes/robots[.]txt.ts"),
] satisfies RouteConfig;
