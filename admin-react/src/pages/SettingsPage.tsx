import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    const shouldLogout = window.confirm("Log out of the admin portal now?");
    if (!shouldLogout) return;

    setIsLoggingOut(true);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Layout>
      <div className="dashboard-main">
        <div className="page-section-header">
          <div>
            <div className="dashboard-breadcrumb">
              <span>Directory</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <strong>Settings</strong>
            </div>
            <h2 className="dashboard-title">Portal Settings</h2>
            <p className="dashboard-subtitle">
              Manage your account session and security preferences.
            </p>
          </div>
        </div>

        <section className="settings-grid">
          <article className="surface-card settings-card">
            <h3>Account Session</h3>
            <p>
              Signed in as <strong>{user?.email || "admin"}</strong>. Use the
              button below to securely end your session.
            </p>
            <button
              type="button"
              className="settings-logout-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <span className="material-symbols-outlined">logout</span>
              {isLoggingOut ? "Signing out..." : "Log Out"}
            </button>
          </article>

          <article className="surface-card settings-card">
            <h3>Security Notes</h3>
            <ul className="settings-note-list">
              <li>Always log out on shared devices.</li>
              <li>Review pending verifications daily.</li>
              <li>Use admin actions only from trusted networks.</li>
            </ul>
          </article>
        </section>
      </div>
    </Layout>
  );
}
