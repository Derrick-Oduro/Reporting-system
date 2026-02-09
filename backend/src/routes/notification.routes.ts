import { Response, Router } from "express";
import db from "../database/db";
import { authenticateToken, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all notifications for current user
router.get("/", (req: AuthRequest, res: Response) => {
  try {
    const notifications = db
      .prepare(
        `
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
      )
      .all(req.userId);

    res.json({ notifications });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// Get unread notification count
router.get("/unread-count", (req: AuthRequest, res: Response) => {
  try {
    const result: any = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `,
      )
      .get(req.userId);

    res.json({ count: result.count });
  } catch (error: any) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// Mark notification as read
router.patch("/:id/read", (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const notification: any = db
      .prepare("SELECT * FROM notifications WHERE id = ?")
      .get(id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.user_id !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    db.prepare(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE id = ?
    `,
    ).run(id);

    res.json({ message: "Notification marked as read" });
  } catch (error: any) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", (req: AuthRequest, res: Response) => {
  try {
    db.prepare(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `,
    ).run(req.userId);

    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// Delete notification
router.delete("/:id", (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const notification: any = db
      .prepare("SELECT * FROM notifications WHERE id = ?")
      .get(id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.user_id !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    db.prepare("DELETE FROM notifications WHERE id = ?").run(id);

    res.json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
