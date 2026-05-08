export async function getRecentPosts(db: D1Database) {
  const { results } = await db
    .prepare("SELECT id, title, slug, created_at FROM posts WHERE is_draft = 0 ORDER BY created_at DESC LIMIT 3")
    .all();
  return results;
}

export async function getPosts(db: D1Database, isLoggedIn: boolean, page: number, search: string, limit: number = 10) {
  const offset = (page - 1) * limit;

  let baseQuery = isLoggedIn ? "FROM posts WHERE 1=1" : "FROM posts WHERE is_draft = 0";
  const params: (string | number)[] = [];

  if (search) {
    baseQuery += " AND (title LIKE ? OR content LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total ${baseQuery}`)
    .bind(...params)
    .first<{ total: number }>();
  const totalPosts = countResult?.total || 0;
  const totalPages = Math.ceil(totalPosts / limit);

  const postsQuery = `SELECT id, title, slug, created_at, is_draft ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const postsParams = [...params, limit, offset];

  const { results } = await db
    .prepare(postsQuery)
    .bind(...postsParams)
    .all();

  return {
    posts: results,
    totalPosts,
    totalPages,
    page,
    search,
  };
}

export async function getPostBySlug(db: D1Database, slug: string, isLoggedIn: boolean) {
  let query = "SELECT id, title, content, slug, is_draft, created_at FROM posts WHERE slug = ?";
  const post = await db.prepare(query).bind(slug).first<any>();
  if (post && post.is_draft === 1 && !isLoggedIn) return null;
  return post;
}

export async function getPostNavigation(db: D1Database, createdAt: string) {
  const prevPost = await db
    .prepare("SELECT slug, title FROM posts WHERE created_at < ? AND is_draft = 0 ORDER BY created_at DESC LIMIT 1")
    .bind(createdAt)
    .first<{ slug: string; title: string }>();

  const nextPost = await db
    .prepare("SELECT slug, title FROM posts WHERE created_at > ? AND is_draft = 0 ORDER BY created_at ASC LIMIT 1")
    .bind(createdAt)
    .first<{ slug: string; title: string }>();
    
  return { prevPost, nextPost };
}

export async function deletePost(db: D1Database, slug: string) {
  return await db.prepare("DELETE FROM posts WHERE slug = ?").bind(slug).run();
}
