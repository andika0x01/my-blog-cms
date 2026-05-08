export async function getCommentsAndLikes(db: D1Database, postId: number) {
  const likesCount = await db.prepare("SELECT COUNT(*) as total FROM likes WHERE post_id = ?").bind(postId).first<any>();
  const commentsData = await db.prepare("SELECT id, name, content, created_at, parent_id FROM comments WHERE post_id = ? ORDER BY created_at ASC").bind(postId).all();
  
  return {
    likes: likesCount?.total || 0,
    comments: commentsData.results,
  };
}

export async function addLike(db: D1Database, postId: number) {
  return await db.prepare("INSERT INTO likes (post_id, visitor_id) VALUES (?, ?)").bind(postId, "anon").run();
}

export async function addComment(db: D1Database, postId: number, name: string, content: string, parentId: number | null) {
  return await db.prepare("INSERT INTO comments (post_id, name, content, parent_id, is_read) VALUES (?, ?, ?, ?, 0)").bind(postId, name, content, parentId).run();
}

export async function deleteComment(db: D1Database, commentId: number) {
  return await db.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
}
