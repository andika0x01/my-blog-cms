export async function getUnreadNotificationCounts(db: D1Database, isLoggedIn: boolean, userId: number | null, visitorName: string) {
  let adminUnreadCount = 0;
  let visitorUnreadCount = 0;

  try {
    if (isLoggedIn && userId) {
      const user = await db.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first<{ username: string }>();
      const adminName = user?.username || "admin";

      const resAdmin = await db.prepare("SELECT COUNT(*) as count FROM comments WHERE is_read = 0 AND name != ?").bind(adminName).first();
      adminUnreadCount = (resAdmin as any)?.count || 0;
    }

    if (visitorName) {
      const resVisitor = await db
        .prepare(
          `
        SELECT COUNT(*) as count 
        FROM comments c 
        JOIN comments p ON c.parent_id = p.id 
        WHERE p.name = ? AND c.name != ? AND c.is_visitor_read = 0
        `
        )
        .bind(visitorName, visitorName)
        .first();
      visitorUnreadCount = (resVisitor as any)?.count || 0;
    }
  } catch (error) {
    console.error("Error fetching notification counts:", error);
  }

  return { adminUnreadCount, visitorUnreadCount };
}
