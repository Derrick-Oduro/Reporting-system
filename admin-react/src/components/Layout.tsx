import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";

const pageMeta: Record<
  string,
  {
    ctaLabel: string;
    search: string;
    topbarLabel?: string;
    showSidebarUser?: boolean;
  }
> = {
  "/dashboard": {
    ctaLabel: "New Report",
    search: "Global system search...",
    showSidebarUser: true,
  },
  "/users": {
    ctaLabel: "New Report",
    search: "Search users, IDs, or email...",
    showSidebarUser: true,
  },
  "/reports": {
    ctaLabel: "New Report",
    search: "Search reports, students, or IDs...",
    showSidebarUser: true,
  },
  "/notifications": {
    ctaLabel: "New Report",
    search: "Search alerts...",
    topbarLabel: "Reporting Portal",
    showSidebarUser: true,
  },
  "/tickets": {
    ctaLabel: "New Ticket",
    search: "Search tickets...",
    showSidebarUser: false,
  },
  "/settings": {
    ctaLabel: "Save Changes",
    search: "Search settings...",
    showSidebarUser: true,
  },
};

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname;
  const meta = pageMeta[active] || pageMeta["/dashboard"];

  return (
    <div className="static-shell">
      <Sidebar
        active={active}
        ctaLabel={meta.ctaLabel}
        showUser={meta.showSidebarUser ?? true}
      />

      <div className="static-shell__content">
        <header className="static-topbar">
          <div className="static-topbar__search">
            <span className="material-symbols-outlined">search</span>
            <input placeholder={meta.search} type="text" />
          </div>
          <div className="static-topbar__actions">
            {meta.topbarLabel ? (
              <span className="static-topbar__label">{meta.topbarLabel}</span>
            ) : null}
            <button
              type="button"
              className="static-icon-button"
              onClick={() => navigate("/settings")}
              aria-label="Open settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button type="button" className="static-icon-button">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button
              type="button"
              className="static-button static-button--primary"
            >
              Create Action
            </button>
          </div>
        </header>

        <main className="static-page">{children}</main>
      </div>
    </div>
  );
}
