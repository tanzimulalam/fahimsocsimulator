import { NavLink } from "react-router-dom";

const items: { to: string; label: string; sub?: boolean }[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/inbox", label: "Inbox" },
  { to: "/overview", label: "Overview" },
  { to: "/events", label: "Events" },
  { to: "/analysis", label: "Analysis", sub: true },
  { to: "/outbreak", label: "Outbreak Control", sub: true },
  { to: "/management", label: "Management", sub: true },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden>
          SE
        </div>
        <div className="sidebar-title">
          Secure Endpoint
          <span>Simulator (training)</span>
        </div>
      </div>
      <nav aria-label="Primary">
        <ul className="nav-list">
          {items.map((item) => (
            <li key={item.to} className="nav-item">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
                end={item.to === "/dashboard"}
              >
                {item.label}
                {item.sub ? <span className="nav-chevron">▸</span> : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
