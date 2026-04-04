import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/users", label: "User Management", icon: "group" },
  { to: "/reports", label: "Reports", icon: "assessment" },
  { to: "/notifications", label: "Notifications", icon: "notifications" },
  { to: "/tickets", label: "Student Tickets", icon: "confirmation_number" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar({
  active,
  ctaLabel,
  showUser,
}: {
  active: string;
  ctaLabel: string;
  showUser: boolean;
}) {
  return (
    <aside className="static-sidebar">
      <div className="static-sidebar__brand">
        <h1>Student Support</h1>
        <p>Admin System</p>
      </div>

      <nav className="static-sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={`static-sidebar__link ${active === item.to ? "is-active" : ""}`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="static-sidebar__cta">
        <button
          type="button"
          className="static-button static-button--primary static-sidebar__cta-button"
        >
          <span className="material-symbols-outlined">add</span>
          {ctaLabel}
        </button>
      </div>

      {showUser ? (
        <div className="static-sidebar__user">
          <img
            alt="Admin User Avatar"
            className="static-sidebar__avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB57-uprgvqSRCgphkwYQ2U2Lg6M_nHlRNu1ORE2h9sR1PG57oiuQqXZhNyiHpw10i2EaJzbNQ8Kso4-s4DBkTLgjaXFkaz9Qx-faICAFNECiSIc8BuL3lw2qeCLC0jjQMaaEeADmsS-9FyhAIBjmzoxxkls5Z-jRs_fEwZ4yBLdXluDkv07Ie7mE5LFjAe8UHzC_pKx7TL2i6dKukzL4vVx7g5ET0DFwwCht8X5lzsieOatpG-N4itsXLEGdgiDyozUAwBnmZD8JNZ"
          />
          <div>
            <p className="static-sidebar__name">Admin User</p>
            <p className="static-sidebar__role">System Administrator</p>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
