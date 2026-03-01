import { Response, Router } from "express";
import { body, validationResult } from "express-validator";
import db from "../database/db";
import {
    authenticateToken,
    AuthRequest,
    requireAdmin,
} from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// File upload endpoint
router.post(
  "/upload",
  upload.single("file"),
  (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the file path that can be used to access the file
      const filePath = `uploads/${req.file.filename}`;

      res.status(200).json({
        message: "File uploaded successfully",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: filePath,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "File upload failed" });
    }
  },
);

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
    console.log("=== CREATE TICKET REQUEST ===");
    console.log("User ID:", req.userId);
    console.log("Request Body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, priority } = req.body;

    try {
      console.log("Inserting ticket into database...");
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

      console.log("✅ Ticket inserted with ID:", ticketId);
      console.log("Insert result:", result);

      // Get created ticket
      const ticket = db
        .prepare("SELECT * FROM tickets WHERE id = ?")
        .get(ticketId);

      console.log("Retrieved ticket:", ticket);

      // Create notification for admins
      const admins: any[] = db
        .prepare("SELECT id FROM users WHERE role = ?")
        .all("admin");

      console.log("Found admins:", admins.length);

      const notifStmt = db.prepare(`
        INSERT INTO notifications (user_id, ticket_id, title, message, type)
        VALUES (?, ?, ?, ?, 'ticket_created')
      `);

      admins.forEach((admin) => {
        notifStmt.run(admin.id, ticketId, "New Ticket", `New ticket: ${title}`);
      });

      const responseData = {
        message: "Ticket created successfully",
        ticket,
      };

      console.log(
        "✅ Sending response:",
        JSON.stringify(responseData, null, 2),
      );
      res.status(201).json(responseData);
    } catch (error: any) {
      console.error("❌ Create ticket error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
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

  console.log("=== GET TICKET REQUEST ===");
  console.log("Ticket ID:", id);
  console.log("User ID:", req.userId);

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
      console.log("ERROR: Ticket not found");
      return res.status(404).json({ error: "Ticket not found" });
    }

    console.log("Ticket found:", ticket.title);

    // Check permission (users can only view their own tickets, admins can view all)
    if (req.userRole !== "admin" && ticket.user_id !== req.userId) {
      console.log("ERROR: Access denied");
      return res.status(403).json({ error: "Access denied" });
    }

    // Get comments
    const comments = db
      .prepare(
        `
      SELECT c.*, u.full_name as user_name, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `,
      )
      .all(id);

    console.log("Comments found:", comments.length);

    // Get attachments
    const attachments = db
      .prepare(
        `
      SELECT * FROM attachments
      WHERE ticket_id = ?
      ORDER BY uploaded_at DESC
    `,
      )
      .all(id);

    console.log("Attachments found:", attachments.length);
    console.log("Attachments data:", attachments);

    res.json({ ticket, comments, attachments });
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

// Add attachment to ticket
router.post("/:id/attachments", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { file_name, file_path, file_type, file_size } = req.body;

  console.log("=== ADD ATTACHMENT REQUEST ===");
  console.log("Ticket ID:", id);
  console.log("User ID:", req.userId);
  console.log("Request body:", req.body);

  if (!file_name || !file_path) {
    console.log("ERROR: Missing file_name or file_path");
    return res.status(400).json({ error: "File name and path are required" });
  }

  try {
    const ticket: any = db
      .prepare("SELECT * FROM tickets WHERE id = ?")
      .get(id);

    console.log("Ticket found:", ticket ? "yes" : "no");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check permission
    if (req.userRole !== "admin" && ticket.user_id !== req.userId) {
      console.log("ERROR: Access denied");
      return res.status(403).json({ error: "Access denied" });
    }

    console.log("Inserting attachment into database...");
    const stmt = db.prepare(`
      INSERT INTO attachments (ticket_id, file_name, file_path, file_type, file_size)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(id, file_name, file_path, file_type, file_size);
    const attachmentId = result.lastInsertRowid;

    console.log("Attachment inserted with ID:", attachmentId);

    const attachment = db
      .prepare("SELECT * FROM attachments WHERE id = ?")
      .get(attachmentId);

    console.log("Retrieved attachment:", attachment);

    // Verify it was saved by checking all attachments for this ticket
    const allAttachments = db
      .prepare("SELECT * FROM attachments WHERE ticket_id = ?")
      .all(id);
    console.log("Total attachments for ticket:", allAttachments.length);

    res.status(201).json({
      message: "Attachment added successfully",
      attachment,
    });
  } catch (error: any) {
    console.error("Add attachment error:", error);
    res.status(500).json({ error: "Failed to add attachment" });
  }
});

export default router;
