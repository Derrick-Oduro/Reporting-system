import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import {
    createUser,
    deleteUser,
    getStoredUser,
    getUsers,
    updateUser,
    verifyUser,
    type AuthUser,
} from "../lib/api";

type UserFilter = "all" | "student" | "admin" | "pending";
type UserSort = "newest" | "oldest" | "name" | "role";
type UserModalMode = "create" | "edit" | null;

type UserFormState = {
  full_name: string;
  email: string;
  password: string;
  student_id: string;
  phone: string;
  role: "student" | "admin";
  is_verified: boolean;
};

const PAGE_SIZE = 10;

const createInitialForm = (): UserFormState => ({
  full_name: "",
  email: "",
  password: "",
  student_id: "",
  phone: "",
  role: "student",
  is_verified: false,
});

export function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activeFilter, setActiveFilter] = useState<UserFilter>("all");
  const [sortBy, setSortBy] = useState<UserSort>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<UserModalMode>(null);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [formState, setFormState] = useState<UserFormState>(createInitialForm);

  const currentUser = getStoredUser();

  const avatarFallbacks = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCqFvMX8Z0VOHqG_vGneuz8NJXq5SiWERD7ulIqSpyv3LHxX7tCHTsLoLytMNnSAb-FrWaUwW7AmVn0c9XqFZy_6cbVB_-TVxeua2h7_WcHIpssLg1V-cJZPsfABQRyTk1vNhUmT6W2qMheQU48tixZOgDA41YBIU6MabmCkNGP4fnIfuak079dXwROomf3hdY5PMR4LpoI5RQnUqprRQbpeFZvO5UwsZzwvaYY0B1vZk4q4tjpRN6mQQHCWH21gQSFqWsWbOALA-9d",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB4H_n5HM3MBT9grrkpFLe5qmXClLCmlayYlpYD6eWueH0kvkP1vnv2h48Q4udM2tebefcgkBLLAB6N2DTThBnQpF2fl_zOksQmdeH7Lx_nnYHtRBbjbnTkqHauYtodr0rZ32WYOMmTVc_NCR-1cCo8q0nLwZMhauSgho7XJUwez_JboZVq9O1UM6YXPvdUkpOmiJ1paC792bUVQDI_fQa9p29m6kC0JBt8hj7-5WSfNol271sP2bNYFfE-FPVieWhs6UxEZLVgUmZS",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC45isBx9Zn8BsfuJ7OD5nRqeVaTBKkVtlw-iMfB96BCf45Uh5YVbAaAnNfiFEJ5WOpbEgRvA0CztQF48ARFUeLeEMQyO0WHIIvX9yX8bWgsqXtHa4qOLxQqD0MZ7pdOqJUe_9tTVOn4y_cjy_YEhVJOUkU3mEx5BRN8KO3Zz2YGgzoGMeG7mlRd7GosxI1D1Ev5WlIwmUREaBR3yTauzKU7t9_xQT22hv37WvIBF-cNvdtJARMRiIua_Pi_ToCg8Q1-OA5nRDdV-as",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDWyZZhwBPFHwXdxNdsbQuv_hKSg1Rz8ZulhM-TAvl16cu8Kw7ISxXazfyM0LkQW7VxKSyfz8sR2XDq1Dup0oEOwSrmPc57VC5V8axv-125Q4Jjj1849cxBUUdAKt-Bo3nMh4SON1G7n2ju4YJyPrUExMAGC0jtnMC6BDC5WfCy8o2utXhjra7I9IMXk4xZD1KaWw1lmzHww_oGl9E3jE5nL8Pk8pTbsL0jOTJaCUp7yM-Zt8-O5TuqGG8VDZmOu5IX3Tm9V7MJpi9u",
  ];
  const activityProgress = [85, 20, 98, 45, 76, 64, 35, 90];

  const loadUsers = useCallback(async () => {
    try {
      setError("");
      const payload = await getUsers();
      setUsers(payload.users || []);
    } catch (err) {
      setUsers([]);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const pendingCount = useMemo(
    () => users.filter((user) => Number(user.is_verified || 0) === 0).length,
    [users],
  );

  const verifiedCount = useMemo(
    () => users.filter((user) => Number(user.is_verified || 0) === 1).length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const byFilter = users.filter((user) => {
      if (activeFilter === "pending") {
        return Number(user.is_verified || 0) === 0;
      }
      if (activeFilter === "student") {
        return (user.role || "").toLowerCase() === "student";
      }
      if (activeFilter === "admin") {
        return (user.role || "").toLowerCase() === "admin";
      }
      return true;
    });

    const bySearch = normalizedSearch
      ? byFilter.filter((user) => {
          const searchable = [
            user.full_name,
            user.email,
            user.student_id,
            user.phone,
            user.role,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return searchable.includes(normalizedSearch);
        })
      : byFilter;

    return [...bySearch].sort((a, b) => {
      if (sortBy === "name") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      if (sortBy === "role") {
        return (a.role || "").localeCompare(b.role || "");
      }

      const aCreated = new Date(a.created_at || 0).getTime();
      const bCreated = new Date(b.created_at || 0).getTime();
      if (sortBy === "oldest") {
        return aCreated - bCreated;
      }
      return bCreated - aCreated;
    });
  }, [activeFilter, searchTerm, sortBy, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!modalMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        closeUserModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modalMode, isSaving]);

  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const userRows = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [currentPage, totalPages]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormState(createInitialForm());
    setModalMode("create");
  };

  const openEditModal = (user: AuthUser) => {
    setEditingUser(user);
    setFormState({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "",
      student_id: user.student_id || "",
      phone: user.phone || "",
      role:
        (user.role || "student").toLowerCase() === "admin"
          ? "admin"
          : "student",
      is_verified: Number(user.is_verified || 0) === 1,
    });
    setModalMode("edit");
  };

  const closeUserModal = () => {
    setModalMode(null);
    setEditingUser(null);
    setFormState(createInitialForm());
  };

  const setFormValue = <K extends keyof UserFormState>(
    key: K,
    value: UserFormState[K],
  ) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
  };

  const handleVerifyUser = async (user: AuthUser) => {
    if (!user.id) return;
    try {
      setIsSaving(true);
      await verifyUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (user: AuthUser) => {
    if (!user.id) return;
    if (currentUser?.id && user.id === currentUser.id) {
      setError("You cannot delete your own account while logged in.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${user.full_name || user.email}? This also removes their tickets.`,
    );
    if (!shouldDelete) return;

    try {
      setIsSaving(true);
      await deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const fullName = formState.full_name.trim();
    const email = formState.email.trim().toLowerCase();
    const password = formState.password.trim();

    if (!fullName) {
      setError("Full name is required.");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (modalMode === "create" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (modalMode === "edit" && editingUser?.id === currentUser?.id) {
      const roleChanging = formState.role !== (editingUser.role || "student");
      if (roleChanging) {
        setError("You cannot change your own role.");
        return;
      }
    }

    try {
      setIsSaving(true);
      setError("");

      if (modalMode === "create") {
        await createUser({
          full_name: fullName,
          email,
          password,
          role: formState.role,
          student_id: formState.student_id.trim() || undefined,
          phone: formState.phone.trim() || undefined,
          is_verified: formState.is_verified,
        });
      } else if (modalMode === "edit" && editingUser?.id) {
        await updateUser(editingUser.id, {
          full_name: fullName,
          email,
          role: formState.role,
          student_id: formState.student_id.trim() || undefined,
          phone: formState.phone.trim() || undefined,
          is_verified: formState.is_verified,
          password: password ? password : undefined,
        });
      }

      await loadUsers();
      closeUserModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : modalMode === "create"
            ? "Failed to create user"
            : "Failed to update user",
      );
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
              <strong>User Management</strong>
            </div>
            <h2 className="dashboard-title">System Registry</h2>
            <p className="dashboard-subtitle">
              Manage institutional access, verify student identities, and
              oversee administrative roles across the Azure Ledger ecosystem.
            </p>
          </div>
          <div className="stats-pill">
            <div>
              <p className="users-metric-label">Total Users</p>
              <strong className="users-metric-value">{users.length}</strong>
            </div>
            <div className="users-metric-divider" />
            <div>
              <p className="users-metric-label">Pending</p>
              <strong className="users-metric-value users-metric-value--pending">
                {pendingCount}
              </strong>
            </div>
          </div>
        </div>

        <div className="users-toolbar">
          <div className="users-chip-group">
            <button
              type="button"
              className={`users-chip ${activeFilter === "all" ? "users-chip--active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Users
            </button>
            <button
              type="button"
              className={`users-chip ${activeFilter === "student" ? "users-chip--active" : ""}`}
              onClick={() => setActiveFilter("student")}
            >
              Students
            </button>
            <button
              type="button"
              className={`users-chip ${activeFilter === "admin" ? "users-chip--active" : ""}`}
              onClick={() => setActiveFilter("admin")}
            >
              Admins
            </button>
            <button
              type="button"
              className={`users-chip ${activeFilter === "pending" ? "users-chip--active" : ""}`}
              onClick={() => setActiveFilter("pending")}
            >
              Pending
            </button>
          </div>
          <label className="users-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search name, email, role, student ID"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label className="users-sort-wrap">
            <span>Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as UserSort)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
              <option value="role">Role</option>
            </select>
          </label>
          <button
            type="button"
            className="users-filter-button"
            onClick={openCreateModal}
            disabled={isSaving}
          >
            <span className="material-symbols-outlined">person_add</span>
            New User
          </button>
          <div className="users-toolbar-count">
            Showing {userRows.length} of {filteredUsers.length} users
          </div>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="table-shell users-table-shell">
          <table className="users-table">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Status</th>
                <th>Role</th>
                <th>Activity</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((user, index) => {
                const isPending = Number(user.is_verified || 0) === 0;
                const progress =
                  activityProgress[index % activityProgress.length];
                const activityText = isPending
                  ? "Waiting verification"
                  : `Updated: ${new Date(user.updated_at || user.created_at || Date.now()).toLocaleDateString()}`;

                return (
                  <tr key={`${user.id ?? user.email}-${user.email}`}>
                    <td>
                      <div className="users-profile-cell">
                        <img
                          src={avatarFallbacks[index % avatarFallbacks.length]}
                          alt={user.full_name || "User"}
                        />
                        <div>
                          <strong>{user.full_name || "Unknown user"}</strong>
                          <p>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`users-status ${isPending ? "is-pending" : "is-active"}`}
                      >
                        {isPending ? "Pending Verification" : "Verified"}
                      </span>
                    </td>
                    <td>{user.role || "Student"}</td>
                    <td>
                      {isPending ? (
                        <p>{activityText}</p>
                      ) : (
                        <div className="users-activity-cell">
                          <p>{activityText}</p>
                          <div className="users-activity-track">
                            <span style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="users-actions-cell">
                      {isPending ? (
                        <div className="users-actions">
                          <button
                            type="button"
                            className="users-verify-btn"
                            onClick={() => handleVerifyUser(user)}
                            disabled={isSaving}
                          >
                            Verify User
                          </button>
                          <button
                            type="button"
                            className="users-icon-btn"
                            onClick={() => openEditModal(user)}
                            disabled={isSaving}
                          >
                            <span className="material-symbols-outlined">
                              edit_square
                            </span>
                          </button>
                          <button
                            type="button"
                            className="users-icon-btn users-icon-btn--danger"
                            onClick={() => handleDeleteUser(user)}
                            disabled={isSaving}
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="users-actions">
                          <button
                            type="button"
                            className="users-icon-btn"
                            onClick={() => openEditModal(user)}
                            disabled={isSaving}
                          >
                            <span className="material-symbols-outlined">
                              edit_square
                            </span>
                          </button>
                          <button
                            type="button"
                            className="users-icon-btn users-icon-btn--danger"
                            onClick={() => handleDeleteUser(user)}
                            disabled={isSaving}
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {isLoading ? (
            <p
              className="users-toolbar-count"
              style={{ padding: "1rem 1.5rem" }}
            >
              Loading users...
            </p>
          ) : null}

          <div className="users-pagination">
            <button
              type="button"
              className="users-page-nav"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Previous
            </button>
            <div className="users-page-numbers">
              {pageNumbers[0] > 1 ? (
                <>
                  <button type="button" onClick={() => setCurrentPage(1)}>
                    1
                  </button>
                  {pageNumbers[0] > 2 ? <span>...</span> : null}
                </>
              ) : null}

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? "is-active" : ""}
                >
                  {page}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages ? (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 ? (
                    <span>...</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              ) : null}
            </div>
            <button
              type="button"
              className="users-page-nav"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        <section className="users-bottom-grid">
          <div className="users-audit-card">
            <h3>Institutional Verification Report</h3>
            <p>
              94% of new users completed verification within the 24h SLA this
              week. View detailed performance metrics.
            </p>
            <button type="button">Download Weekly Audit</button>
            <div className="users-audit-bars" aria-hidden="true">
              <span style={{ height: "2rem" }} />
              <span style={{ height: "3rem" }} />
              <span style={{ height: "5rem" }} />
              <span style={{ height: "6rem" }} />
              <span style={{ height: "4rem" }} />
            </div>
          </div>

          <div className="users-security-card">
            <div className="users-security-head">
              <span className="material-symbols-outlined">
                security_update_good
              </span>
              <p>Security Audit</p>
            </div>
            <p>
              Verified users: <strong>{verifiedCount}</strong>. Pending reviews:{" "}
              <strong>{pendingCount}</strong>. Keep privileged role changes
              audited and documented.
            </p>
            <button type="button" onClick={loadUsers} disabled={isSaving}>
              Refresh User Ledger
            </button>
          </div>
        </section>

        {modalMode ? (
          <div
            className="reports-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="users-editor-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSaving) {
                closeUserModal();
              }
            }}
          >
            <div className="reports-modal users-editor-modal">
              <div className="reports-modal-head">
                <div>
                  <span>
                    {modalMode === "create" ? "CREATE USER" : "EDIT USER"}
                  </span>
                  <h2 id="users-editor-title">
                    {modalMode === "create"
                      ? "Register New User"
                      : "Update User Profile"}
                  </h2>
                  <p>
                    {modalMode === "create"
                      ? "Create a student or admin account with verification controls."
                      : "Update identity details, role, and verification state."}
                  </p>
                </div>
                <div className="reports-modal-head-actions">
                  <button
                    type="button"
                    className="users-icon-btn"
                    onClick={closeUserModal}
                    disabled={isSaving}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              <form
                className="auth-form users-editor-form"
                onSubmit={handleUserFormSubmit}
              >
                <div className="users-editor-badges" aria-hidden="true">
                  <span>
                    <strong>
                      {modalMode === "create" ? "New" : "Editing"}
                    </strong>
                    {modalMode === "create"
                      ? " Account Setup"
                      : ` ${editingUser?.email || "User"}`}
                  </span>
                  <span>
                    <strong>Role:</strong> {formState.role}
                  </span>
                </div>

                <section className="users-editor-section">
                  <h4>Identity</h4>
                  <div className="users-editor-grid">
                    <label>
                      Full Name
                      <input
                        type="text"
                        value={formState.full_name}
                        onChange={(event) =>
                          setFormValue("full_name", event.target.value)
                        }
                        autoFocus
                        required
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(event) =>
                          setFormValue("email", event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>
                </section>

                <section className="users-editor-section">
                  <h4>Access</h4>
                  <label>
                    {modalMode === "create"
                      ? "Password"
                      : "Password (leave blank to keep current)"}
                    <input
                      type="password"
                      value={formState.password}
                      minLength={modalMode === "create" ? 6 : 0}
                      onChange={(event) =>
                        setFormValue("password", event.target.value)
                      }
                      required={modalMode === "create"}
                    />
                  </label>
                </section>

                <section className="users-editor-section">
                  <h4>Additional Details</h4>
                  <div className="users-editor-grid">
                    <label>
                      Student ID
                      <input
                        type="text"
                        value={formState.student_id}
                        onChange={(event) =>
                          setFormValue("student_id", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        type="text"
                        value={formState.phone}
                        onChange={(event) =>
                          setFormValue("phone", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </section>

                <section className="users-editor-section users-editor-section--controls">
                  <h4>Permissions</h4>
                  <div className="users-editor-grid users-editor-grid--controls">
                    <label>
                      Role
                      <select
                        value={formState.role}
                        onChange={(event) =>
                          setFormValue(
                            "role",
                            event.target.value === "admin"
                              ? "admin"
                              : "student",
                          )
                        }
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label className="users-checkbox-row">
                      <input
                        type="checkbox"
                        checked={formState.is_verified}
                        onChange={(event) =>
                          setFormValue("is_verified", event.target.checked)
                        }
                      />
                      <span className="users-checkbox-toggle" />
                      <span>
                        Verified account
                        <small>Allows full platform access</small>
                      </span>
                    </label>
                  </div>
                </section>

                <div className="users-editor-actions">
                  <button
                    type="button"
                    className="users-page-nav users-editor-cancel"
                    onClick={closeUserModal}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="users-filter-button users-editor-submit"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : modalMode === "create"
                        ? "Create User"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
