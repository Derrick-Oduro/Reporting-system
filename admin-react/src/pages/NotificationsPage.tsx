import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import {
    deleteNotification,
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    type NotificationItem,
} from "../lib/api";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const [notificationsPayload, unreadPayload] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setItems(notificationsPayload.notifications || []);
      setUnreadCount(unreadPayload.count || 0);
    } catch (err) {
      setItems([]);
      setUnreadCount(0);
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const isUnread = (item: NotificationItem) =>
    item.is_read === 0 || item.is_read === false;

  const formatRelativeTime = (value?: string) => {
    if (!value) return "Unknown";

    const created = new Date(value).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - created);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(value).toLocaleDateString();
  };

  const getTypeMeta = (type?: string) => {
    if (type === "status_update") {
      return {
        icon: "task_alt",
        variant: "primary",
        label: "STATUS",
      };
    }
    if (type === "comment_added") {
      return {
        icon: "chat",
        variant: "primary",
        label: "COMMENT",
      };
    }
    if (type === "ticket_created") {
      return {
        icon: "confirmation_number",
        variant: "primary",
        label: "TICKET",
      };
    }
    return {
      icon: "notifications",
      variant: "primary",
      label: (type || "INFO").toUpperCase(),
    };
  };

  const unreadTicketCount = useMemo(
    () => items.filter((item) => isUnread(item) && !!item.ticket_id).length,
    [items],
  );

  const unreadCommentCount = useMemo(
    () =>
      items.filter(
        (item) => isUnread(item) && (item.type || "") === "comment_added",
      ).length,
    [items],
  );

  const handleOpenNotification = async (item: NotificationItem) => {
    try {
      if (isUnread(item)) {
        await markNotificationAsRead(item.id);
      }

      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id ? { ...entry, is_read: 1 } : entry,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - (isUnread(item) ? 1 : 0)));

      if (item.ticket_id) {
        navigate("/reports");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open alert");
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    try {
      setIsSaving(true);
      await markAllNotificationsAsRead();
      setItems((previous) => previous.map((item) => ({ ...item, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNotification = async (item: NotificationItem) => {
    try {
      setIsSaving(true);
      await deleteNotification(item.id);
      setItems((previous) => previous.filter((entry) => entry.id !== item.id));
      if (isUnread(item)) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete notification",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-main notifications-main">
        <div className="page-section-header">
          <div>
            <h2 className="dashboard-title">Notifications</h2>
            <p className="dashboard-subtitle">
              Stay updated with system-wide activities and urgent requests.
            </p>
          </div>
          <button
            className="notifications-mark-read"
            type="button"
            onClick={handleMarkAllRead}
            disabled={isSaving || unreadCount === 0}
          >
            <span className="material-symbols-outlined">done_all</span>
            Mark all as read
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <section className="notifications-summary-grid">
          <div className="notifications-stats-pill">
            <div className="notifications-stat-block">
              <p>{String(unreadCount).padStart(2, "0")}</p>
              <span>Unread Alerts</span>
            </div>
            <div className="notifications-stat-divider" />
            <div className="notifications-stat-block">
              <p className="is-tertiary">
                {String(unreadTicketCount).padStart(2, "0")}
              </p>
              <span>Ticket Alerts</span>
            </div>
            <div className="notifications-stat-divider" />
            <div className="notifications-stat-block">
              <p className="is-variant">
                {String(unreadCommentCount).padStart(2, "0")}
              </p>
              <span>Comment Alerts</span>
            </div>
          </div>

          <div className="notifications-status-pill">
            <div>
              <p>System Status</p>
              <h3>All Nodes Healthy</h3>
            </div>
            <div className="notifications-status-icon">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </section>

        <section className="notifications-feed">
          <div className="notifications-day-label">
            <span>Latest</span>
            <div />
          </div>

          {isLoading ? (
            <div className="notifications-load-more">
              <button type="button" disabled>
                Loading notifications...
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="notifications-load-more">
              <button type="button" onClick={loadNotifications}>
                No notifications yet. Refresh
              </button>
            </div>
          ) : (
            items.map((item) => {
              const unread = isUnread(item);
              const meta = getTypeMeta(item.type);
              return (
                <article
                  key={item.id}
                  className={`notifications-card ${unread ? meta.variant : "is-muted"}`}
                >
                  <div
                    className={`notifications-card-icon ${unread ? "is-live" : "is-muted"}`}
                  >
                    <span className="material-symbols-outlined">
                      {meta.icon}
                    </span>
                  </div>
                  <div className="notifications-card-content">
                    <div className="notifications-card-head">
                      <h3>{item.title}</h3>
                      <span>{meta.label}</span>
                    </div>
                    <p>{item.message}</p>
                    <div className="notifications-card-foot">
                      <small>
                        <span className="material-symbols-outlined">
                          schedule
                        </span>
                        {formatRelativeTime(item.created_at)}
                      </small>
                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenNotification(item)}
                          disabled={isSaving}
                        >
                          {item.ticket_id
                            ? "Open Ticket"
                            : unread
                              ? "Mark Read"
                              : "View"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(item)}
                          disabled={isSaving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <div className="notifications-load-more">
            <button
              type="button"
              onClick={loadNotifications}
              disabled={isSaving}
            >
              Refresh Notifications
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
