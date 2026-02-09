import { Response, Router } from "express";
import db from "../database/db";
import {
    authenticateToken,
    AuthRequest,
    requireAdmin,
} from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get("/", requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const users = db
      .prepare(
        `
      SELECT id, email, full_name, student_id, phone, role, created_at
      FROM users
      ORDER BY created_at DESC
    `,
      )
      .all();

    res.json({ users });
  } catch (error: any) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

// Get user statistics (admin only)
router.get("/stats", requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const totalUsers: any = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get();
    const totalTickets: any = db
      .prepare("SELECT COUNT(*) as count FROM tickets")
      .get();
    const pendingTickets: any = db
      .prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'pending'")
      .get();
    const resolvedTickets: any = db
      .prepare(
        "SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'",
      )
      .get();

    res.json({
      stats: {
        totalUsers: totalUsers.count,
        totalTickets: totalTickets.count,
        pendingTickets: pendingTickets.count,
        resolvedTickets: resolvedTickets.count,
      },
    });
  } catch (error: any) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
});

export default router;
