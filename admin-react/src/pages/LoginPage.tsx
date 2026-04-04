import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiBaseUrl } from "../lib/api";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <main className="login-main">
        <section className="login-grid">
          <div className="login-info">
            <div className="login-info__content">
              <div className="login-pill">
                <span />
                Web admin portal
              </div>

              <h1>Reporting System admin website.</h1>
              <p>
                This is the standalone web admin interface. It uses the app API
                only, so the mobile admin version can stay limited while the
                website gets more features over time.
              </p>
            </div>

            <div className="login-stats">
              <div>
                <span>Access</span>
                <strong>Web only</strong>
              </div>
              <div>
                <span>Backend</span>
                <strong>API driven</strong>
              </div>
              <div>
                <span>Scope</span>
                <strong>Expandable</strong>
              </div>
            </div>
          </div>

          <div className="login-form-wrap">
            <section className="login-form-card">
              <div className="login-form-head">
                <p className="auth-kicker">Admin Sign In</p>
                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-subtitle">
                  Sign in to the web dashboard. The mobile admin screens are not
                  part of this login flow.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  Email
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="admin@example.com"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter password"
                    required
                  />
                </label>

                <div className="auth-api-box">
                  Default API endpoint:
                  <span className="auth-api-value">{getApiBaseUrl()}</span>
                </div>

                <button
                  className="button button--primary login-submit"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? "Signing in" : "Sign in"}</span>
                  <span
                    className={`login-spinner ${loading ? "is-visible" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </form>

              {error ? <p className="auth-error">{error}</p> : null}

              <p className="login-footnote">
                This site is static HTML and Tailwind. It talks to the backend
                API directly and keeps the mobile admin experience separate.
              </p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
