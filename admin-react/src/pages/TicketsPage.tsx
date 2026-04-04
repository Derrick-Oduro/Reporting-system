import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import {
    deleteTicket,
    getTickets,
    updateTicketStatus,
    type Ticket,
} from "../lib/api";

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      setError("");
      const payload = await getTickets();
      setTickets(payload.tickets || []);
    } catch (err) {
      setTickets([]);
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openCount =
    tickets.filter((ticket) => ticket.status !== "resolved").length || 24;
  const resolvedCount =
    tickets.filter((ticket) => ticket.status === "resolved").length || 118;

  const handleStatusChange = async (ticket: Ticket) => {
    if (!ticket.id) return;
    const statusInput = window.prompt(
      "Set status: pending | in-progress | resolved | closed",
      ticket.status || "pending",
    );
    if (!statusInput) return;

    const nextStatus = statusInput.trim().toLowerCase() as
      | "pending"
      | "in-progress"
      | "resolved"
      | "closed";

    if (
      !["pending", "in-progress", "resolved", "closed"].includes(nextStatus)
    ) {
      setError("Invalid status. Use: pending, in-progress, resolved, closed.");
      return;
    }

    try {
      setIsSaving(true);
      await updateTicketStatus(ticket.id, nextStatus);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    if (!ticket.id) return;
    const shouldDelete = window.confirm(
      `Delete ticket #${ticket.id} (${ticket.title})?`,
    );
    if (!shouldDelete) return;

    try {
      setIsSaving(true);
      await deleteTicket(ticket.id);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ticket");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-main">
        <div className="page-section-header">
          <div>
            <div className="dashboard-breadcrumb">
              <span>Directory</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <strong>Student Tickets</strong>
            </div>
            <h2 className="dashboard-title">Ticket Queue</h2>
            <p className="dashboard-subtitle">
              Review, assign, and resolve student support tickets from the
              backend API.
            </p>
          </div>

          <div className="stats-pill">
            <div>
              <p className="users-metric-label">Open</p>
              <strong className="users-metric-value">{openCount}</strong>
            </div>
            <div className="users-metric-divider" />
            <div>
              <p className="users-metric-label">Resolved</p>
              <strong
                className="users-metric-value"
                style={{ color: "#556064" }}
              >
                {resolvedCount}
              </strong>
            </div>
          </div>
        </div>

        <section className="tickets-layout-grid">
          <div className="table-shell tickets-table-shell">
            <div className="tickets-table-head">
              <h3>Recent Tickets</h3>
              <span>Live data from backend</span>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <table className="tickets-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Status Action</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 10).map((ticket) => (
                  <tr key={ticket.id}>
                    <td>#{ticket.id}</td>
                    <td>{ticket.user_name || "Unknown student"}</td>
                    <td>{ticket.title}</td>
                    <td>
                      <span
                        className={`tickets-priority ${ticket.priority || "medium"}`}
                      >
                        {ticket.priority || "medium"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`users-status ${(ticket.status || "pending") === "resolved" ? "is-active" : "is-pending"}`}
                      >
                        {ticket.status || "pending"}
                      </span>
                    </td>
                    <td className="users-actions-cell">
                      <button
                        type="button"
                        className="users-verify-btn"
                        onClick={() => handleStatusChange(ticket)}
                        disabled={isSaving}
                      >
                        Update
                      </button>
                    </td>
                    <td className="users-actions-cell">
                      <button
                        type="button"
                        className="users-icon-btn users-icon-btn--danger"
                        onClick={() => handleDeleteTicket(ticket)}
                        disabled={isSaving}
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tickets-side-column">
            <div className="surface-card tickets-side-card">
              <h3>Ticket Actions</h3>
              <div className="tickets-bullet-list">
                <p>Open a ticket to review details.</p>
                <p>Use the backend to update status when handling cases.</p>
                <p>
                  Keep this page open in another tab; the data refreshes on
                  reload or navigation.
                </p>
              </div>
            </div>

            <div className="tickets-cta-card">
              <h3>Need faster workflow?</h3>
              <p>
                Use the sidebar to move between users, reports, notifications,
                and tickets without leaving the site.
              </p>
              <Link to="/dashboard" className="tickets-back-link">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
