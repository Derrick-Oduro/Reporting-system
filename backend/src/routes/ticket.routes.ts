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

// Create ticket
router.post(
  "/",
  [
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("category").trim().notEmpty(),
    body("priority").optional().isIn(["low", "medium", "high"]),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, priority } = req.body;

    try {
      const stmt = db.prepare(`
        INSERT INTO tickets (user_id, title, description, category, priority, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `);

      const result = stmt.run(
        req.userId,
        title,
        description,
        category,
        priority || "medium",
      );
      const ticketId = result.lastInsertRowid;

      // Get created ticket
      const ticket = db
        .prepare("SELECT * FROM tickets WHERE id = ?")
        .get(ticketId);

      // Create notification for admins
      const admins: any[] = db
        .prepare("SELECT id FROM users WHERE role = ?")
        .all("admin");
      const notifStmt = db.prepare(`
        INSERT INTO notifications (user_id, ticket_id, title, message, type)
        VALUES (?, ?, ?, ?, 'ticket_created')
      `);

      admins.forEach((admin) => {
        notifStmt.run(admin.id, ticketId, "New Ticket", `New ticket: ${title}`);
      });

      res.status(201).json({
        message: "Ticket created successfully",
        ticket,
      });
    } catch (error: any) {
      console.error("Create ticket error:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  },
);

// Get all tickets (admin sees all, users see only their own)
router.get("/", (req: AuthRequest, res: Response) => {
  try {
    let tickets;

    if (req.userRole === "admin") {
      tickets = db
        .prepare(
          `
        SELECT t.*, u.full_name as user_name, u.email as user_email
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `,
        )
        .all();
    } else {
      tickets = db
        .prepare(
          `
        SELECT * FROM tickets
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
        )
        .all(req.userId);
    }

    res.json({ tickets });
  } catch (error: any) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Failed to get tickets" });
  }
});

// Get single ticket
router.get("/:id", (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const ticket: any = db
      .prepare(
        `
      SELECT t.*, u.full_name as user_name, u.email as user_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `,
      )
      .get(id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check permission (users can only view their own tickets, admins can view all)
    if (req.userRole !== "admin" && ticket.user_id !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get comments
    const comments = db
      .prepare(
        `
      SELECT c.*, u.full_name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `,
      )
      .all(id);

    res.json({ ticket, comments });
  } catch (error: any) {
    console.error("Get ticket error:", error);
    res.status(500).json({ error: "Failed to get ticket" });
  }
});

// Update ticket status (admin only)
router.patch("/:id/status", requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "in_progress", "resolved", "closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const ticket: any = db
      .prepare("SELECT * FROM tickets WHERE id = ?")
      .get(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const resolvedAt =
      status === "resolved" || status === "closed"
        ? new Date().toISOString()
        : null;

    db.prepare(
      `
      UPDATE tickets
      SET status = ?, updated_at = CURRENT_TIMESTAMP, resolved_at = ?
      WHERE id = ?
    `,
    ).run(status, resolvedAt, id);

    // Notify ticket owner
    db.prepare(
      `
      INSERT INTO notifications (user_id, ticket_id, title, message, type)
      VALUES (?, ?, ?, ?, 'status_update')
    `,
    ).run(
      ticket.user_id,
      id,
      "Ticket Status Updated",
      `Your ticket status changed to ${status}`,
    );

    const updatedTicket = db
      .prepare("SELECT * FROM tickets WHERE id = ?")
      .get(id);
    res.json({ message: "Ticket updated successfully", ticket: updatedTicket });
  } catch (error: any) {
    console.error("Update ticket error:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// Add comment
router.post("/:id/comments", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const ticket: any = db
      .prepare("SELECT * FROM tickets WHERE id = ?")
      .get(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check permission
    if (req.userRole !== "admin" && ticket.user_id !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const stmt = db.prepare(`
      INSERT INTO comments (ticket_id, user_id, comment)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(id, req.userId, comment);
    const commentId = result.lastInsertRowid;

    // Update ticket updated_at
    db.prepare(
      "UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(id);

    // Notify relevant users
    if (req.userRole === "admin") {
      // Admin commented, notify ticket owner
      db.prepare(
        `
        INSERT INTO notifications (user_id, ticket_id, title, message, type)
        VALUES (?, ?, ?, ?, 'comment_added')
      `,
      ).run(
        ticket.user_id,
        id,
        "New Comment",
        "Admin added a comment to your ticket",
      );
    } else {
      // User commented, notify admins
      const admins: any[] = db
        .prepare("SELECT id FROM users WHERE role = ?")
        .all("admin");
      const notifStmt = db.prepare(`
        INSERT INTO notifications (user_id, ticket_id, title, message, type)
        VALUES (?, ?, ?, ?, 'comment_added')
      `);
      admins.forEach((admin) => {
        notifStmt.run(
          admin.id,
          id,
          "New Comment",
          `User added a comment to ticket #${id}`,
        );
      });
    }

    const newComment = db
      .prepare(
        `
      SELECT c.*, u.full_name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `,
      )
      .get(commentId);

    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error: any) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Delete ticket (admin only)
router.delete("/:id", requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = db.prepare("DELETE FROM tickets WHERE id = ?").run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    console.error("Delete ticket error:", error);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

export default router;
