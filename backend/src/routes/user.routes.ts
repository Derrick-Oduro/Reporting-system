import bcrypt from "bcryptjs";
import { Response, Router } from "express";
import { body, validationResult } from "express-validator";
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
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.student_id,
        u.phone,
        u.role,
        u.is_verified,
        u.verified_at,
        u.updated_at,
        u.created_at,
        COALESCE(COUNT(t.id), 0) AS ticket_count
      FROM users u
      LEFT JOIN tickets t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
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
    const verifiedUsers: any = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE is_verified = 1")
      .get();
    const pendingVerificationUsers: any = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE is_verified = 0")
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
        verifiedUsers: verifiedUsers.count,
        pendingVerificationUsers: pendingVerificationUsers.count,
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

// Get single user (admin only)
router.get("/:id", requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const user: any = db
      .prepare(
        `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.student_id,
        u.phone,
        u.role,
        u.is_verified,
        u.verified_at,
        u.updated_at,
        u.created_at,
        COALESCE(COUNT(t.id), 0) AS ticket_count
      FROM users u
      LEFT JOIN tickets t ON t.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      )
      .get(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Create user (admin only)
router.post(
  "/",
  requireAdmin,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("full_name").trim().notEmpty(),
    body("role").optional().isIn(["student", "admin"]),
    body("is_verified").optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      full_name,
      student_id,
      phone,
      role = "student",
      is_verified,
    } = req.body;

    try {
      const existingUser = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const verified =
        typeof is_verified === "boolean"
          ? is_verified
            ? 1
            : 0
          : role === "admin"
            ? 1
            : 0;
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = db
        .prepare(
          `
        INSERT INTO users (email, password, full_name, student_id, phone, role, is_verified, verified_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
      `,
        )
        .run(
          email,
          hashedPassword,
          full_name,
          student_id || null,
          phone || null,
          role,
          verified,
          verified,
        );

      const user = db
        .prepare(
          `
        SELECT id, email, full_name, student_id, phone, role, is_verified, verified_at, updated_at, created_at
        FROM users
        WHERE id = ?
      `,
        )
        .get(result.lastInsertRowid);

      res.status(201).json({ message: "User created successfully", user });
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  },
);

// Update user (admin only)
router.patch(
  "/:id",
  requireAdmin,
  [
    body("email").optional().isEmail().normalizeEmail(),
    body("full_name").optional().trim().notEmpty(),
    body("role").optional().isIn(["student", "admin"]),
    body("is_verified").optional().isBoolean(),
    body("password").optional().isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, full_name, student_id, phone, role, is_verified, password } =
      req.body;

    try {
      const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (Number(id) === req.userId && role && role !== user.role) {
        return res
          .status(400)
          .json({ error: "You cannot change your own role" });
      }

      if (email && email !== user.email) {
        const existingEmail = db
          .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
          .get(email, id);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      let hashedPassword = user.password;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const nextRole = role ?? user.role;
      const nextVerified =
        typeof is_verified === "boolean"
          ? is_verified
            ? 1
            : 0
          : nextRole === "admin"
            ? 1
            : user.is_verified;

      const nextVerifiedAt =
        nextVerified === 1
          ? (user.verified_at ?? new Date().toISOString())
          : null;

      db.prepare(
        `
        UPDATE users
        SET
          email = ?,
          password = ?,
          full_name = ?,
          student_id = ?,
          phone = ?,
          role = ?,
          is_verified = ?,
          verified_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(
        email ?? user.email,
        hashedPassword,
        full_name ?? user.full_name,
        student_id !== undefined ? student_id : user.student_id,
        phone !== undefined ? phone : user.phone,
        nextRole,
        nextVerified,
        nextVerifiedAt,
        id,
      );

      const updatedUser = db
        .prepare(
          `
        SELECT id, email, full_name, student_id, phone, role, is_verified, verified_at, updated_at, created_at
        FROM users
        WHERE id = ?
      `,
        )
        .get(id);

      res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

// Verify user (admin only)
router.patch("/:id/verify", requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const user: any = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    db.prepare(
      `
      UPDATE users
      SET is_verified = 1, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(id);

    const updatedUser = db
      .prepare(
        `
      SELECT id, email, full_name, student_id, phone, role, is_verified, verified_at, updated_at, created_at
      FROM users
      WHERE id = ?
    `,
      )
      .get(id);

    res.json({ message: "User verified successfully", user: updatedUser });
  } catch (error: any) {
    console.error("Verify user error:", error);
    res.status(500).json({ error: "Failed to verify user" });
  }
});

// Delete user (admin only)
router.delete("/:id", requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (Number(id) === req.userId) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account" });
    }

    const user: any = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    db.transaction(() => {
      db.prepare("DELETE FROM notifications WHERE user_id = ?").run(id);
      db.prepare("DELETE FROM comments WHERE user_id = ?").run(id);
      db.prepare("DELETE FROM tickets WHERE user_id = ?").run(id);
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
    })();

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
