import * as SQLite from "expo-sqlite";
import {
    Attachment,
    Comment,
    StatusHistory,
    Ticket,
    TicketCategory,
    TicketPriority,
    TicketStatus,
    TicketWithUser,
} from "../types";

export class TicketService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async createTicket(
    userId: number,
    title: string,
    description: string,
    category: TicketCategory,
    priority: TicketPriority = "medium",
  ): Promise<number> {
    const result = await this.db.runAsync(
      "INSERT INTO tickets (user_id, title, description, category, status, priority) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, title, description, category, "pending", priority],
    );

    // Create status history
    await this.db.runAsync(
      "INSERT INTO status_history (ticket_id, new_status, changed_by) VALUES (?, ?, ?)",
      [result.lastInsertRowId, "pending", userId],
    );

    return result.lastInsertRowId;
  }

  async getTicketById(ticketId: number): Promise<TicketWithUser | null> {
    const ticket = await this.db.getFirstAsync<TicketWithUser>(
      `SELECT t.*, u.email as user_email, u.full_name as user_name, u.student_id
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [ticketId],
    );

    return ticket || null;
  }

  async getUserTickets(userId: number): Promise<Ticket[]> {
    const tickets = await this.db.getAllAsync<Ticket>(
      "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    return tickets;
  }

  async getAllTickets(filters?: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
  }): Promise<TicketWithUser[]> {
    let query = `
      SELECT t.*, u.email as user_email, u.full_name as user_name, u.student_id
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status) {
      query += " AND t.status = ?";
      params.push(filters.status);
    }

    if (filters?.category) {
      query += " AND t.category = ?";
      params.push(filters.category);
    }

    if (filters?.priority) {
      query += " AND t.priority = ?";
      params.push(filters.priority);
    }

    query += " ORDER BY t.created_at DESC";

    const tickets = await this.db.getAllAsync<TicketWithUser>(query, params);
    return tickets;
  }

  async updateTicketStatus(
    ticketId: number,
    newStatus: TicketStatus,
    changedBy: number,
  ): Promise<void> {
    // Get current status
    const ticket = await this.db.getFirstAsync<{
      status: TicketStatus;
      user_id: number;
    }>("SELECT status, user_id FROM tickets WHERE id = ?", [ticketId]);

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Update ticket status
    const updates: string[] = ["status = ?", "updated_at = CURRENT_TIMESTAMP"];
    const params: any[] = [newStatus];

    if (newStatus === "resolved" || newStatus === "closed") {
      updates.push("resolved_at = CURRENT_TIMESTAMP");
    }

    params.push(ticketId);

    await this.db.runAsync(
      `UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    // Add to status history
    await this.db.runAsync(
      "INSERT INTO status_history (ticket_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)",
      [ticketId, ticket.status, newStatus, changedBy],
    );

    // Create notification for the ticket owner
    await this.db.runAsync(
      "INSERT INTO notifications (user_id, ticket_id, title, message) VALUES (?, ?, ?, ?)",
      [
        ticket.user_id,
        ticketId,
        "Ticket Status Updated",
        `Your ticket status has been changed from "${ticket.status}" to "${newStatus}"`,
      ],
    );
  }

  async addComment(
    ticketId: number,
    userId: number,
    comment: string,
  ): Promise<void> {
    await this.db.runAsync(
      "INSERT INTO comments (ticket_id, user_id, comment) VALUES (?, ?, ?)",
      [ticketId, userId, comment],
    );

    // Update ticket's updated_at
    await this.db.runAsync(
      "UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [ticketId],
    );

    // Get ticket owner to create notification
    const ticket = await this.db.getFirstAsync<{ user_id: number }>(
      "SELECT user_id FROM tickets WHERE id = ?",
      [ticketId],
    );

    if (ticket && ticket.user_id !== userId) {
      await this.db.runAsync(
        "INSERT INTO notifications (user_id, ticket_id, title, message) VALUES (?, ?, ?, ?)",
        [
          ticket.user_id,
          ticketId,
          "New Comment",
          "A new comment was added to your ticket",
        ],
      );
    }
  }

  async getTicketComments(ticketId: number): Promise<Comment[]> {
    const comments = await this.db.getAllAsync<Comment>(
      `SELECT c.*, u.full_name as user_name, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC`,
      [ticketId],
    );

    return comments;
  }

  async getTicketStatusHistory(ticketId: number): Promise<StatusHistory[]> {
    const history = await this.db.getAllAsync<StatusHistory>(
      `SELECT sh.*, u.full_name as changed_by_name
       FROM status_history sh
       JOIN users u ON sh.changed_by = u.id
       WHERE sh.ticket_id = ?
       ORDER BY sh.changed_at DESC`,
      [ticketId],
    );

    return history;
  }

  async addAttachment(
    ticketId: number,
    fileName: string,
    filePath: string,
    fileType?: string,
    fileSize?: number,
  ): Promise<void> {
    await this.db.runAsync(
      "INSERT INTO attachments (ticket_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)",
      [ticketId, fileName, filePath, fileType || null, fileSize || null],
    );
  }

  async getTicketAttachments(ticketId: number): Promise<Attachment[]> {
    const attachments = await this.db.getAllAsync<Attachment>(
      "SELECT * FROM attachments WHERE ticket_id = ? ORDER BY uploaded_at DESC",
      [ticketId],
    );

    return attachments;
  }

  async getTicketStats(userId?: number) {
    const baseQuery = userId
      ? "SELECT status, COUNT(*) as count FROM tickets WHERE user_id = ? GROUP BY status"
      : "SELECT status, COUNT(*) as count FROM tickets GROUP BY status";

    const params = userId ? [userId] : [];
    const stats = await this.db.getAllAsync<{ status: string; count: number }>(
      baseQuery,
      params,
    );

    return {
      pending: stats.find((s) => s.status === "pending")?.count || 0,
      inProgress: stats.find((s) => s.status === "in-progress")?.count || 0,
      resolved: stats.find((s) => s.status === "resolved")?.count || 0,
      closed: stats.find((s) => s.status === "closed")?.count || 0,
      total: stats.reduce((sum, s) => sum + s.count, 0),
    };
  }
}
