import * as SQLite from "expo-sqlite";
import { Notification } from "../types";

export class NotificationService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async getUserNotifications(
    userId: number,
    unreadOnly: boolean = false,
  ): Promise<Notification[]> {
    let query = "SELECT * FROM notifications WHERE user_id = ?";
    const params: any[] = [userId];

    if (unreadOnly) {
      query += " AND is_read = 0";
    }

    query += " ORDER BY created_at DESC";

    const notifications = await this.db.getAllAsync<Notification>(
      query,
      params,
    );
    return notifications;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId],
    );

    return result?.count || 0;
  }

  async markAsRead(notificationId: number): Promise<void> {
    await this.db.runAsync(
      "UPDATE notifications SET is_read = 1 WHERE id = ?",
      [notificationId],
    );
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.db.runAsync(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [userId],
    );
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await this.db.runAsync("DELETE FROM notifications WHERE id = ?", [
      notificationId,
    ]);
  }

  async createNotification(
    userId: number,
    title: string,
    message: string,
    ticketId?: number,
  ): Promise<void> {
    await this.db.runAsync(
      "INSERT INTO notifications (user_id, ticket_id, title, message) VALUES (?, ?, ?, ?)",
      [userId, ticketId || null, title, message],
    );
  }
}
