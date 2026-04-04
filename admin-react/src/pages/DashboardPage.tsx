import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import {
    getNotifications,
    getStats,
    getTickets,
    type ApiStats,
    type NotificationItem,
    type Ticket,
} from "../lib/api";

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ApiStats>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getStats(), getTickets(), getNotifications()])
      .then(([statsPayload, ticketsPayload, notificationPayload]) => {
        setStats(statsPayload.stats || {});
        setTickets(ticketsPayload.tickets || []);
        setNotifications(notificationPayload.notifications || []);
        setError("");
      })
      .catch((err) => {
        setStats({});
        setTickets([]);
        setNotifications([]);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      });
  }, []);

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;
  const closedCount = tickets.filter(
    (ticket) => ticket.status === "closed",
  ).length;
  const openCount = tickets.filter(
    (ticket) => ticket.status !== "resolved" && ticket.status !== "closed",
  ).length;
  const unreadCount = notifications.filter(
    (item) => item.is_read === 0 || item.is_read === false,
  ).length;

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        )
        .slice(0, 3),
    [tickets],
  );

  const recentActivity = useMemo(
    () =>
      [...notifications]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        )
        .slice(0, 3),
    [notifications],
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();

    tickets
      .filter(
        (ticket) => ticket.status !== "resolved" && ticket.status !== "closed",
      )
      .forEach((ticket) => {
        const category = ticket.category || "other";
        counts.set(category, (counts.get(category) || 0) + 1);
      });

    const max = Math.max(...counts.values(), 1);

    return [...counts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        width: `${Math.max(12, Math.round((count / max) * 100))}%`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [tickets]);

  const barHeights = useMemo(() => {
    const monthData = [...tickets]
      .sort(
        (a, b) =>
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime(),
      )
      .slice(-12);

    const max = Math.max(monthData.length, 1);
    return Array.from({ length: 12 }).map((_, index) => {
      const ticket = monthData[index];
      if (!ticket) return 16;

      const priorityBoost =
        ticket.priority === "high" ? 20 : ticket.priority === "medium" ? 10 : 0;
      return Math.min(
        96,
        Math.max(18, ((index + 1) / max) * 70 + priorityBoost),
      );
    });
  }, [tickets]);

  const formatRelative = (value?: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";

    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Layout>
      <div className="dashboard-main">
        <div className="page-section-header">
          <div>
            <div className="dashboard-breadcrumb">
              <span>Directory</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <strong>Dashboard</strong>
            </div>
            <h2 className="dashboard-title">Executive Overview</h2>
            <p className="dashboard-subtitle">
              Real-time metrics for Azure Ledger ecosystem
            </p>
          </div>
          <span className="status-chip">
            <span className="material-symbols-outlined">
              {unreadCount > 0 ? "notifications_active" : "check_circle"}
            </span>
            {unreadCount > 0
              ? `${unreadCount} Alerts Need Review`
              : "Systems Operational"}
          </span>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <section className="dashboard-metrics-grid">
          <article className="dashboard-metric dashboard-metric--primary">
            <div className="dashboard-metric__head">
              <span className="dashboard-metric__icon material-symbols-outlined">
                confirmation_number
              </span>
              <span className="dashboard-metric__tag dashboard-metric__tag--soft">
                +12% vs last week
              </span>
            </div>
            <div className="dashboard-metric__body">
              <p className="eyebrow">Total Active Tickets</p>
              <strong className="count">
                {openCount || stats.pendingTickets || 0}
              </strong>
            </div>
          </article>

          <article className="dashboard-metric">
            <div className="dashboard-metric__head">
              <span className="dashboard-metric__icon dashboard-metric__icon--amber material-symbols-outlined">
                app_registration
              </span>
              <span className="dashboard-metric__tag dashboard-metric__tag--danger">
                Priority: High
              </span>
            </div>
            <div className="dashboard-metric__body">
              <p className="eyebrow">Pending Verification</p>
              <strong className="count">
                {stats.pendingVerificationUsers ?? 0}
              </strong>
            </div>
          </article>

          <article className="dashboard-metric">
            <div className="dashboard-metric__head">
              <span className="dashboard-metric__icon dashboard-metric__icon--slate material-symbols-outlined">
                task_alt
              </span>
              <span className="dashboard-metric__tag dashboard-metric__tag--success">
                98% Success
              </span>
            </div>
            <div className="dashboard-metric__body">
              <p className="eyebrow">Resolved + Closed</p>
              <strong className="count">
                {resolvedCount + closedCount || stats.resolvedTickets || 0}
              </strong>
            </div>
          </article>
        </section>

        <section className="dashboard-lower-grid">
          <div className="dashboard-left-col">
            <div className="chart-card">
              <div className="page-section-header">
                <div>
                  <h3>Ticket Volume Trends</h3>
                  <p className="muted">
                    Comparing current week vs historical average
                  </p>
                </div>
                <div className="dashboard-filter-pills">
                  <span className="filter-chip">7 Days</span>
                  <span className="filter-chip filter-chip--active">
                    30 Days
                  </span>
                </div>
              </div>
              <div className="dashboard-chart">
                {barHeights.map((height, index) => (
                  <div key={index} className="chart-bar">
                    <span style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
              <div className="dashboard-chart-labels">
                <span>Jan 01</span>
                <span>Jan 10</span>
                <span>Jan 20</span>
                <span>Jan 30</span>
              </div>
            </div>

            <div className="dashboard-activity">
              <div className="page-section-header">
                <h3>System Activity</h3>
                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={() => navigate("/notifications")}
                >
                  View Notifications
                </button>
              </div>
              <div className="activity-list">
                {recentActivity.length === 0 ? (
                  <div className="activity-item">
                    <div>
                      <strong>No recent notifications yet.</strong>
                      <p>New activity will appear here in real-time.</p>
                    </div>
                  </div>
                ) : (
                  recentActivity.map((item) => (
                    <div key={item.id} className="activity-item">
                      <div>
                        <strong>
                          <span className="dashboard-link-text">
                            {item.title}
                          </span>
                        </strong>
                        <p>
                          {item.message} • {formatRelative(item.created_at)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-right-col">
            <div className="surface-card">
              <h3>Open Reports by Category</h3>
              <div className="dashboard-category-list">
                {categories.length === 0 ? (
                  <p className="muted">No open tickets available.</p>
                ) : (
                  categories.map((category) => (
                    <div key={category.name}>
                      <div className="dashboard-category-row">
                        <span>{category.name}</span>
                        <strong>{category.count}</strong>
                      </div>
                      <div className="dashboard-progress-track">
                        <div
                          className="dashboard-progress-fill"
                          style={{ width: category.width }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                className="dashboard-outline-button"
                onClick={() => navigate("/reports")}
              >
                Open Reports Workspace
              </button>
            </div>

            <div className="dashboard-audit-card">
              <div>
                <h3>Review Pending Users</h3>
                <p>
                  There are currently {stats.pendingVerificationUsers ?? 0} user
                  accounts awaiting verification and role approval.
                </p>
                <button
                  type="button"
                  className="dashboard-audit-button"
                  onClick={() => navigate("/users")}
                >
                  Open User Management
                </button>
              </div>
              <span className="material-symbols-outlined">verified_user</span>
            </div>

            <div className="surface-card">
              <h3>Newest Tickets</h3>
              <div className="dashboard-review-list">
                {recentTickets.length === 0 ? (
                  <p className="muted">No tickets submitted yet.</p>
                ) : (
                  recentTickets.map((ticket) => {
                    const created = new Date(ticket.created_at || Date.now());
                    return (
                      <div key={ticket.id} className="dashboard-review-item">
                        <div className="dashboard-review-date">
                          <span>
                            {created.toLocaleString("en-US", {
                              month: "short",
                            })}
                          </span>
                          <strong>{created.getDate()}</strong>
                        </div>
                        <div>
                          <strong>{ticket.title}</strong>
                          <p>
                            {ticket.category || "General"} •{" "}
                            {ticket.priority || "medium"} •{" "}
                            {ticket.status || "pending"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
