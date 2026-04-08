import { useState } from "react";
import { useSimulator } from "../../context/SimulatorContext";

type IdentityRow = {
  user: string;
  priority: number;
  role: string;
  location: string;
};

const USERS: IdentityRow[] = [
  { user: "Alice Smith", priority: 90, role: "Global Administrator", location: "New York" },
  { user: "Bob Jones", priority: 76, role: "Finance Analyst", location: "Chicago" },
  { user: "Evan Martin", priority: 42, role: "HR Specialist", location: "Austin" },
];

export function DefenderIdentitiesUsersPage() {
  const { addNotification } = useSimulator();
  const [picked, setPicked] = useState<IdentityRow | null>(null);

  return (
    <div className="def-page">
      <h1>Identities - Users</h1>
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User</th><th>Investigation priority</th><th>Role</th><th>Action</th></tr></thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.user}>
                  <td>{u.user}</td>
                  <td><span className={"sev " + (u.priority > 80 ? "sev-high" : u.priority > 55 ? "sev-medium" : "sev-low")}>{u.priority}</span></td>
                  <td>{u.role}</td>
                  <td><button type="button" className="link-btn" onClick={() => setPicked(u)}>Open user story</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {picked ? (
        <div className="def-home-grid">
          <section className="def-card">
            <h3>{picked.user} - Lateral movement paths</h3>
            <p>{picked.user.split(" ")[0]}'s account can access Server-A, which has admin keys for Server-B.</p>
          </section>
          <section className="def-card">
            <h3>Identity timeline</h3>
            <ul className="dash-list">
              <li>09:00 AM - Login from {picked.location} (normal)</li>
              <li>09:05 AM - Login from Nigeria (impossible travel alert)</li>
              <li>09:06 AM - Requested DC ticket (suspected Golden Ticket behavior)</li>
            </ul>
            <button type="button" className="btn" onClick={() => addNotification("Identity", `User ${picked.user} risk marked high and escalated.`)}>
              Escalate identity incident
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

