import { Notification } from "../types";
import { apiClient } from "../utils/apiClient";

export class NotificationService {
  constructor() {}

  async getUserNotifications(
    userId: number,
    unreadOnly: boolean = false,
  ): Promise<Notification[]> {
    const response = await apiClient.get<{ notifications: Notification[] }>(
      "/notifications",
    );

    if (response.error) {
      return [];
    }

    let notifications = response.data?.notifications || [];

    if (unreadOnly) {
      notifications = notifications.filter((n) => n.is_read === 0);
    }

    return notifications;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const response = await apiClient.get<{ count: number }>(
      "/notifications/unread-count",
    );

    if (response.error) {
      return 0;
    }

    return response.data?.count || 0;
  }

  async markAsRead(notificationId: number): Promise<void> {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`,
    );

    if (response.error) {
      throw new Error(response.error);
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    const response = await apiClient.patch("/notifications/mark-all-read");

    if (response.error) {
      throw new Error(response.error);
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    const response = await apiClient.delete(`/notifications/${notificationId}`);

    if (response.error) {
      throw new Error(response.error);
    }
  }

  async createNotification(
    userId: number,
    title: string,
    message: string,
    ticketId?: number,
  ): Promise<void> {
    // Notifications are created by the backend automatically
    console.warn("Client-side notification creation not supported with API");
  }
}
