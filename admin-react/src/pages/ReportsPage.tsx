import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import {
    addTicketComment,
    deleteTicket,
    getAttachmentUrl,
    getTicketDetails,
    getTickets,
    updateTicketStatus,
    type Ticket,
    type TicketAttachment,
    type TicketComment,
} from "../lib/api";

export function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in-progress" | "resolved" | "closed"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "priority" | "status"
  >("newest");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedComments, setSelectedComments] = useState<TicketComment[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<
    TicketAttachment[]
  >([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      setError("");
      const payload = await getTickets();
      const nextTickets = payload.tickets || [];
      setTickets(nextTickets);
      if (!selectedTicketId && nextTickets.length > 0) {
        setSelectedTicketId(nextTickets[0].id);
      }
    } catch (err) {
      setTickets([]);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    }
  }, [selectedTicketId]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!isExpanded) {
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  const refreshSelectedDetails = useCallback(async (ticketId: number) => {
    const payload = await getTicketDetails(ticketId);
    setSelectedComments(payload.comments || []);
    setSelectedAttachments(payload.attachments || []);
  }, []);

  useEffect(() => {
    const loadSelectedDetails = async () => {
      if (!selectedTicketId) {
        setSelectedComments([]);
        setSelectedAttachments([]);
        return;
      }

      try {
        setIsDetailLoading(true);
        await refreshSelectedDetails(selectedTicketId);
      } catch (err) {
        setSelectedComments([]);
        setSelectedAttachments([]);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load selected report details",
        );
      } finally {
        setIsDetailLoading(false);
      }
    };

    loadSelectedDetails();
  }, [refreshSelectedDetails, selectedTicketId]);

  const applyStatusUpdate = async (
    ticketId: number,
    status: "pending" | "in-progress" | "resolved" | "closed",
  ) => {
    // Reflect the new status immediately in UI.
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status, updated_at: new Date().toISOString() }
          : ticket,
      ),
    );

    await updateTicketStatus(ticketId, status);
    await loadTickets();
    await refreshSelectedDetails(ticketId);
  };

  const allCategories = useMemo(() => {
    const categorySet = new Set(
      tickets
        .map((ticket) => (ticket.category || "").trim())
        .filter((category) => category.length > 0),
    );
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const processedTickets = useMemo(() => {
    const filtered = tickets.filter((ticket) => {
      const status = (ticket.status || "pending") as
        | "pending"
        | "in-progress"
        | "resolved"
        | "closed";
      const category = (ticket.category || "").trim();
      const priority = (ticket.priority || "").toLowerCase() as
        | "low"
        | "medium"
        | "high";

      if (priorityFilter !== "all" && priority !== priorityFilter) {
        return false;
      }

      if (categoryFilter !== "all" && category !== categoryFilter) {
        return false;
      }

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      const searchable = [
        ticket.id?.toString() || "",
        ticket.title || "",
        ticket.description || "",
        ticket.user_name || "",
        ticket.user_email || "",
      ]
        .join(" ")
        .toLowerCase();

      if (
        searchQuery.trim() &&
        !searchable.includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    const priorityRank: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const statusRank: Record<string, number> = {
      pending: 1,
      "in-progress": 2,
      resolved: 3,
      closed: 4,
    };

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "oldest" || sortBy === "newest") {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
      }

      if (sortBy === "priority") {
        const rankA = priorityRank[(a.priority || "").toLowerCase()] || 0;
        const rankB = priorityRank[(b.priority || "").toLowerCase()] || 0;
        if (rankA !== rankB) {
          return rankB - rankA;
        }
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }

      const rankA = statusRank[(a.status || "pending").toLowerCase()] || 0;
      const rankB = statusRank[(b.status || "pending").toLowerCase()] || 0;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

    return sorted;
  }, [
    categoryFilter,
    priorityFilter,
    searchQuery,
    sortBy,
    statusFilter,
    tickets,
  ]);

  const cards = processedTickets.slice(0, 8);
  const selectedTicket = useMemo(
    () =>
      processedTickets.find((ticket) => ticket.id === selectedTicketId) ||
      cards[0] ||
      null,
    [cards, processedTickets, selectedTicketId],
  );

  useEffect(() => {
    if (processedTickets.length === 0) {
      setSelectedTicketId(null);
      return;
    }

    if (!selectedTicketId) {
      setSelectedTicketId(processedTickets[0].id);
      return;
    }

    const stillVisible = processedTickets.some(
      (ticket) => ticket.id === selectedTicketId,
    );
    if (!stillVisible) {
      setSelectedTicketId(processedTickets[0].id);
    }
  }, [processedTickets, selectedTicketId]);

  const pendingCount = tickets.filter(
    (ticket) => ticket.status === "pending",
  ).length;
  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "in-progress",
  ).length;
  const closedCount = tickets.filter(
    (ticket) => ticket.status === "closed",
  ).length;

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const isLegacyLocalAttachmentPath = (filePath?: string) => {
    if (!filePath) return true;
    return (
      filePath.startsWith("file://") ||
      filePath.startsWith("content://") ||
      filePath.includes("var/mobile") ||
      filePath.includes("data/user")
    );
  };

  const handleViewAttachment = (attachment: TicketAttachment) => {
    if (isLegacyLocalAttachmentPath(attachment.file_path)) {
      window.alert(
        "This attachment was saved as a device-local path and cannot be viewed from web. Please re-upload by creating a new ticket attachment.",
      );
      return;
    }

    const url = getAttachmentUrl(attachment.file_path);
    if (!url) {
      window.alert("Attachment URL is unavailable.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadAttachment = (attachment: TicketAttachment) => {
    if (isLegacyLocalAttachmentPath(attachment.file_path)) {
      window.alert(
        "This attachment was saved as a device-local path and cannot be downloaded from web.",
      );
      return;
    }

    const url = getAttachmentUrl(attachment.file_path);
    if (!url) {
      window.alert("Attachment URL is unavailable.");
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status?: string) => {
    if (status === "resolved") return "reports-status reports-status--resolved";
    if (status === "in-progress")
      return "reports-status reports-status--progress";
    if (status === "closed") return "reports-status reports-status--closed";
    return "reports-status reports-status--pending";
  };

  const statusActions: Array<{
    value: "pending" | "in-progress" | "resolved" | "closed";
    label: string;
    icon: string;
  }> = [
    { value: "pending", label: "Pending", icon: "hourglass_empty" },
    { value: "in-progress", label: "Working", icon: "sync" },
    { value: "resolved", label: "Resolve", icon: "task_alt" },
    { value: "closed", label: "Close", icon: "cancel" },
  ];

  const cardTheme = [
    {
      initials: "JS",
      badgeClass: "reports-status reports-status--pending",
      badgeText: "Pending",
      category: "Financial",
      priorityClass: "reports-tag reports-tag--critical",
      priority: "Critical",
      subtitle: "2 hours ago",
      title: "Discrepancy in Semester 2 Ledger Balance",
      description:
        "Student reports that the applied scholarship amount is not reflecting in the final tuition statement for the Spring semester...",
      footerText: "+2",
    },
    {
      initials: "ER",
      badgeClass: "reports-status reports-status--progress",
      badgeText: "In-Progress",
      category: "Technical",
      priorityClass: "reports-tag reports-tag--medium",
      priority: "Medium",
      subtitle: "5 hours ago",
      title: "Portal Access Denied - MFA Issue",
      description:
        "The student is unable to bypass the multi-factor authentication screen after changing their mobile device last week...",
      footerText: "Assigned to: Mark T.",
    },
    {
      initials: "KB",
      badgeClass: "reports-status reports-status--resolved",
      badgeText: "Resolved",
      category: "Academic",
      priorityClass: "reports-tag",
      priority: "Low",
      subtitle: "1 day ago",
      title: "Course Enrollment Override Request",
      description:
        "Seeking approval for CS-402 even though prerequisite CS-301 is being taken concurrently...",
      footerText: "Closed yesterday",
    },
  ];

  return (
    <Layout>
      <div className="dashboard-main">
        <div className="page-section-header">
          <div>
            <div className="dashboard-breadcrumb">
              <span>Directory</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <strong>Reports Management</strong>
            </div>
            <h2 className="dashboard-title">Reports Management</h2>
            <p className="dashboard-subtitle">
              Monitor and resolve student support tickets across the platform.
            </p>
          </div>
          <div className="reports-summary-chips">
            <span className="reports-summary-chip">
              <span />
              {pendingCount} Pending
            </span>
            <span className="reports-summary-chip">
              <span />
              {inProgressCount} In-Progress
            </span>
            <span className="reports-summary-chip">
              <span />
              {closedCount} Closed
            </span>
          </div>
        </div>

        <div className="reports-filter-row">
          <div className="reports-filter-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search by ticket ID, title, student, or email"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            ) : null}
          </div>
          <div className="reports-filter-box">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as "all" | "low" | "medium" | "high",
                )
              }
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="reports-filter-box">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All Categories</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="reports-filter-box">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "pending"
                    | "in-progress"
                    | "resolved"
                    | "closed",
                )
              }
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In-Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="reports-filter-box">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as
                    | "newest"
                    | "oldest"
                    | "priority"
                    | "status",
                )
              }
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
          <button
            type="button"
            className="reports-clear-btn"
            onClick={() => {
              setPriorityFilter("all");
              setCategoryFilter("all");
              setStatusFilter("all");
              setSortBy("newest");
              setSearchQuery("");
            }}
          >
            <span className="material-symbols-outlined">filter_list</span>
            {processedTickets.length} Live Reports
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <section className="reports-layout-grid">
          <div className="reports-list-column">
            {cards.length === 0 ? (
              <div className="reports-empty-state">
                <span className="material-symbols-outlined">
                  assignment_late
                </span>
                <h3>No reports match current filters</h3>
                <p>Try clearing filters or changing your search keywords.</p>
                <button
                  type="button"
                  onClick={() => {
                    setPriorityFilter("all");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSortBy("newest");
                    setSearchQuery("");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : null}

            {cards.map((ticket, index) => {
              const theme = cardTheme[index] || cardTheme[0];
              return (
                <article
                  key={ticket.id || `${theme.initials}-${index}`}
                  className={`reports-ticket-card ${selectedTicketId === ticket.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <div className="reports-ticket-head">
                    <div className="reports-ticket-user">
                      <div className="reports-ticket-avatar">
                        {(ticket.user_name || theme.initials)
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3>{ticket.user_name || "Unknown user"}</h3>
                        <p>
                          Ticket #{ticket.id || `AZ-${8900 + index}`} •{" "}
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleString()
                            : theme.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className={getStatusClass(ticket.status)}>
                      {ticket.status || theme.badgeText}
                    </div>
                  </div>

                  <div className="reports-ticket-content">
                    <p className="reports-ticket-title">
                      {ticket.title || theme.title}
                    </p>
                    <p>{ticket.description || theme.description}</p>
                  </div>

                  <div className="reports-ticket-footer">
                    <div className="reports-tags">
                      <span className="reports-tag">
                        {ticket.category || theme.category}
                      </span>
                      <span
                        className={
                          ticket.priority === "high"
                            ? "reports-tag reports-tag--critical"
                            : ticket.priority === "medium"
                              ? "reports-tag reports-tag--medium"
                              : "reports-tag"
                        }
                      >
                        {ticket.priority || theme.priority}
                      </span>
                    </div>
                    <div className="reports-ticket-meta">
                      {ticket.comment_count
                        ? `${ticket.comment_count} new comments`
                        : theme.footerText}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="reports-detail-panel">
            <div className="reports-detail-head">
              <div>
                <span>Report Details</span>
                <h3>{selectedTicket?.title || "No ticket selected"}</h3>
                <p>
                  Case #{selectedTicket?.id || "-"} • Opened{" "}
                  {selectedTicket?.created_at
                    ? new Date(selectedTicket.created_at).toLocaleString()
                    : "-"}
                </p>
              </div>
              <button
                type="button"
                className="users-icon-btn"
                onClick={() => setIsExpanded(true)}
                title="Open expanded details"
              >
                <span className="material-symbols-outlined">open_in_full</span>
              </button>
            </div>

            <div className="reports-detail-body">
              <div>
                <label>Update Status</label>
                <div className="reports-status-grid">
                  {statusActions.map((action) => (
                    <button
                      key={action.value}
                      type="button"
                      className={
                        selectedTicket?.status === action.value
                          ? "is-active"
                          : ""
                      }
                      onClick={async () => {
                        if (!selectedTicket?.id) return;
                        try {
                          setIsSaving(true);
                          await applyStatusUpdate(
                            selectedTicket.id,
                            action.value,
                          );
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Failed to update status",
                          );
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                    >
                      <span className="material-symbols-outlined">
                        {action.icon}
                      </span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>Internal Admin Notes</label>
                <textarea
                  placeholder="Add a note for other administrators..."
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="reports-notes-actions">
                  <button
                    type="button"
                    className="static-button static-button--primary"
                    onClick={async () => {
                      if (!selectedTicket?.id || !note.trim()) return;
                      try {
                        setIsSaving(true);
                        await addTicketComment(selectedTicket.id, note.trim());
                        setNote("");
                        await loadTickets();
                        await refreshSelectedDetails(selectedTicket.id);
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Failed to save note",
                        );
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                  >
                    Save Note
                  </button>
                  <button type="button" className="reports-attach-btn">
                    <span className="material-symbols-outlined">
                      attach_file
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="reports-escalate-btn"
                onClick={async () => {
                  if (!selectedTicket?.id) return;
                  const shouldDelete = window.confirm(
                    `Delete report ticket #${selectedTicket.id}?`,
                  );
                  if (!shouldDelete) return;
                  try {
                    setIsSaving(true);
                    await deleteTicket(selectedTicket.id);
                    setSelectedTicketId(null);
                    await loadTickets();
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to delete ticket",
                    );
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              >
                <span className="material-symbols-outlined">delete</span>
                Delete Ticket
              </button>
            </div>
          </div>
        </section>

        {isExpanded && selectedTicket ? (
          <div
            className="reports-modal-overlay"
            onClick={() => setIsExpanded(false)}
          >
            <div
              className="reports-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="reports-modal-head">
                <div>
                  <span>Expanded Report View</span>
                  <h2>{selectedTicket.title || "Untitled ticket"}</h2>
                  <p>
                    Case #{selectedTicket.id} • Opened{" "}
                    {formatDateTime(selectedTicket.created_at)}
                  </p>
                </div>
                <div className="reports-modal-head-actions">
                  <span className={getStatusClass(selectedTicket.status)}>
                    {selectedTicket.status || "pending"}
                  </span>
                  <button
                    type="button"
                    className="users-icon-btn"
                    onClick={() => setIsExpanded(false)}
                    title="Close expanded details"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              <div className="reports-modal-body">
                <div className="reports-modal-section">
                  <h3>Ticket Summary</h3>
                  <div className="reports-summary-grid">
                    <div className="reports-summary-card">
                      <p>Reporter</p>
                      <strong>
                        {selectedTicket.user_name || "Unknown user"}
                      </strong>
                    </div>
                    <div className="reports-summary-card">
                      <p>Student ID</p>
                      <strong>{selectedTicket.student_id || "-"}</strong>
                    </div>
                    <div className="reports-summary-card">
                      <p>Email</p>
                      <strong>{selectedTicket.user_email || "-"}</strong>
                    </div>
                    <div className="reports-summary-card">
                      <p>Category / Priority</p>
                      <strong>
                        {(selectedTicket.category || "-") +
                          " / " +
                          (selectedTicket.priority || "-")}
                      </strong>
                    </div>
                  </div>
                  <div className="reports-description-card">
                    <p>Description</p>
                    <strong>{selectedTicket.description || "-"}</strong>
                  </div>
                  <div className="reports-status-grid reports-status-grid--modal">
                    {statusActions.map((action) => (
                      <button
                        key={`modal-${action.value}`}
                        type="button"
                        className={
                          selectedTicket.status === action.value
                            ? "is-active"
                            : ""
                        }
                        onClick={async () => {
                          if (!selectedTicket.id) return;
                          try {
                            setIsSaving(true);
                            await applyStatusUpdate(
                              selectedTicket.id,
                              action.value,
                            );
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Failed to update status",
                            );
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                      >
                        <span className="material-symbols-outlined">
                          {action.icon}
                        </span>
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="reports-modal-section">
                  <h3>Comments</h3>
                  <div className="reports-modal-list">
                    {isDetailLoading ? (
                      <div className="reports-modal-empty">
                        <p>Loading comments...</p>
                      </div>
                    ) : selectedComments.length === 0 ? (
                      <div className="reports-modal-empty">
                        <p>No comments yet.</p>
                      </div>
                    ) : (
                      selectedComments.slice(-10).map((comment) => (
                        <div key={comment.id} className="reports-modal-item">
                          <strong>{comment.comment}</strong>
                          <span>
                            {(comment.user_name || "Unknown user") +
                              (comment.user_role
                                ? ` (${comment.user_role})`
                                : "") +
                              " • " +
                              formatDateTime(comment.created_at)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="reports-modal-section">
                  <h3>Attachments</h3>
                  <div className="reports-modal-list">
                    {isDetailLoading ? (
                      <div className="reports-modal-empty">
                        <p>Loading attachments...</p>
                      </div>
                    ) : selectedAttachments.length === 0 ? (
                      <div className="reports-modal-empty">
                        <p>No attachments uploaded for this ticket.</p>
                      </div>
                    ) : (
                      selectedAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="reports-modal-item reports-modal-item--attachment"
                        >
                          <strong>{attachment.file_name}</strong>
                          <span>
                            {(attachment.file_type || "file") +
                              (attachment.file_size
                                ? ` • ${Math.max(1, Math.round(attachment.file_size / 1024))} KB`
                                : "") +
                              " • " +
                              formatDateTime(attachment.uploaded_at)}
                          </span>
                          {isLegacyLocalAttachmentPath(attachment.file_path) ? (
                            <span>
                              Legacy local attachment path detected. This file
                              is not accessible from web.
                            </span>
                          ) : null}
                          <div className="reports-attachment-actions">
                            <button
                              type="button"
                              className="reports-attachment-link"
                              onClick={() => handleViewAttachment(attachment)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="reports-attachment-link reports-attachment-link--download"
                              onClick={() =>
                                handleDownloadAttachment(attachment)
                              }
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
