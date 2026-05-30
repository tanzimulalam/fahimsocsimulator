import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { sevClass } from "./DefenderIncidentsPage";
import { Modal } from "../../components/Modal";
import { DEFENDER_HUNTING_TABLES } from "../../data/defenderHuntingTables";
import type { DefenderSeverity } from "../../data/defenderIncidents";

type InventoryUser = {
  upn: string;
  risk: DefenderSeverity;
  priority: number;
  roles: string;
  riskySignins: string;
};

const EXTRA_USERS: InventoryUser[] = [
  { upn: "j.atherton@contoso.com", risk: "Low", priority: 12, roles: "Helpdesk", riskySignins: "None" },
  { upn: "ceo@contoso.com", risk: "Medium", priority: 40, roles: "Global reader", riskySignins: "Atypical travel (low)" },
];

function fmt(iso: string) {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + "Z";
  } catch {
    return iso;
  }
}

const ROLE_BY_RISK: Record<DefenderSeverity, string> = {
  High: "Member · privileged group",
  Medium: "Member",
  Low: "Member",
  Informational: "Guest",
};

export function DefenderIdentitiesUsersPage() {
  const { incidents, getUserState, setUserState } = useDefenderData();
  const [params, setParams] = useSearchParams();
  const selectedUser = params.get("user");
  const filter = params.get("filter");

  const FILTER_LABEL: Record<string, string> = {
    dormant: "Dormant accounts in AD that should be removed from sensitive groups",
    globalAdmin: "Entra ID Global Administrators",
    securityAdmin: "Entra ID Security Administrators",
    sensitive: "Identities tagged as sensitive",
  };
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => void } | null>(null);

  const inventory = useMemo<InventoryUser[]>(() => {
    const map = new Map<string, InventoryUser>();
    incidents.forEach((i) =>
      i.users.forEach((u) => {
        if (!map.has(u.upn)) {
          const idAlerts = i.alerts.filter((a) => a.serviceSource === "Identity").length;
          map.set(u.upn, {
            upn: u.upn,
            risk: u.riskLevel,
            priority: u.riskLevel === "High" ? 90 : u.riskLevel === "Medium" ? 55 : 20,
            roles: ROLE_BY_RISK[u.riskLevel],
            riskySignins: idAlerts > 0 ? "Impossible travel / MFA fatigue" : "None",
          });
        }
      })
    );
    EXTRA_USERS.forEach((u) => { if (!map.has(u.upn)) map.set(u.upn, u); });
    return [...map.values()].sort((a, b) => b.priority - a.priority);
  }, [incidents]);

  const openUser = (upn: string) => {
    const next = new URLSearchParams(params);
    next.set("user", upn);
    setParams(next, { replace: true });
  };
  const closeUser = () => {
    const next = new URLSearchParams(params);
    next.delete("user");
    setParams(next, { replace: true });
  };

  const userData = useMemo(() => {
    if (!selectedUser) return null;
    const upnLocal = selectedUser.split("@")[0];
    const signins = DEFENDER_HUNTING_TABLES.IdentityLogonEvents.filter(
      (r) => String(r.AccountUpn) === selectedUser || String(r.AccountUpn).split("@")[0] === upnLocal
    );
    const linkedIncidents = incidents.filter((i) => i.users.some((u) => u.upn === selectedUser));
    const riskDetections = linkedIncidents.flatMap((i) => i.alerts.filter((a) => a.serviceSource === "Identity"));
    const inv = inventory.find((u) => u.upn === selectedUser);
    const groups = inv?.risk === "High" ? ["Finance-Admins", "VPN-Users", "All-Staff"] : ["VPN-Users", "All-Staff"];
    return { signins, linkedIncidents, riskDetections, inv, groups };
  }, [selectedUser, incidents, inventory]);

  return (
    <div className="def-page">
      <h1>Identities / Users</h1>
      <p className="dash-muted">{inventory.length} users · investigation priority from Defender for Identity + Entra ID Protection</p>

      {filter && FILTER_LABEL[filter] ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 12, borderRadius: 6, background: "rgba(245,159,0,0.12)", border: "1px solid rgba(245,159,0,0.4)", color: "#ffd07a", fontSize: 13 }}>
          <span>Filtered from ITDR Dashboard: <strong>{FILTER_LABEL[filter]}</strong></span>
          <button className="link-btn" style={{ marginLeft: "auto" }} onClick={() => { const n = new URLSearchParams(params); n.delete("filter"); setParams(n, { replace: true }); }}>Clear filter</button>
        </div>
      ) : null}

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Investigation priority</th><th>Risk</th><th>Roles</th><th>Risky sign-ins</th><th>State</th><th></th></tr>
            </thead>
            <tbody>
              {inventory.map((u) => {
                const st = getUserState(u.upn);
                return (
                  <tr key={u.upn}>
                    <td><button className="link-btn" onClick={() => openUser(u.upn)}>{u.upn}</button></td>
                    <td>{u.priority}</td>
                    <td><span className={sevClass(u.risk)}>{u.risk}</span></td>
                    <td>{u.roles}</td>
                    <td>{u.riskySignins}</td>
                    <td>
                      {st.compromised ? <span className="def-status-chip pending-actions">Compromised</span> : null}
                      {st.safe ? <span className="def-status-chip remediated">Safe</span> : null}
                      {st.sessionsRevoked ? <span className="def-status-chip in-progress">Sessions revoked</span> : null}
                    </td>
                    <td><button className="btn" onClick={() => openUser(u.upn)}>Open</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selectedUser} title={selectedUser ? `User page — ${selectedUser}` : ""} onClose={closeUser} wide>
        {userData && selectedUser ? (
          <div>
            {(() => {
              const st = getUserState(selectedUser);
              return (
                <>
                  <div className="def-toolbar">
                    <button className="btn" onClick={() => setConfirm({ title: "Confirm compromised", body: `Mark ${selectedUser} as compromised?`, run: () => setUserState(selectedUser, { compromised: true, safe: false }, "mark_user_compromised", "Confirmed user compromised") })}>Confirm compromised</button>
                    <button className="btn" onClick={() => setConfirm({ title: "Require password reset", body: `Force a password reset for ${selectedUser}?`, run: () => setUserState(selectedUser, { passwordReset: true }, "reset_password", "Required password reset") })}>Require password reset</button>
                    <button className="btn" onClick={() => setConfirm({ title: "Revoke sessions", body: `Revoke all active sessions for ${selectedUser}?`, run: () => setUserState(selectedUser, { sessionsRevoked: true }, "revoke_sessions", "Revoked all sessions") })}>Revoke sessions</button>
                    <button className="btn" onClick={() => setConfirm({ title: "Mark safe", body: `Mark ${selectedUser} as safe (dismiss risk)?`, run: () => setUserState(selectedUser, { safe: true, compromised: false }, "mark_safe", "Marked user as safe") })}>Mark safe</button>
                  </div>
                  <p className="dash-muted" style={{ fontSize: 12 }}>
                    Risk: {userData.inv?.risk} · {st.compromised ? "Compromised" : st.safe ? "Safe" : "Active"}{st.passwordReset ? " · Password reset required" : ""}{st.sessionsRevoked ? " · Sessions revoked" : ""}
                  </p>

                  <div className="def-incident-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
                    <section className="panel">
                      <div className="panel-h">Sign-in log</div>
                      <div className="table-wrap" style={{ maxHeight: 280 }}>
                        <table className="data-table">
                          <thead><tr><th>Time</th><th>Result</th><th>Location</th><th>IP</th><th>App</th></tr></thead>
                          <tbody>
                            {userData.signins.length === 0 ? <tr><td colSpan={5} className="dash-muted">No sign-in events.</td></tr> : null}
                            {userData.signins.map((s, i) => (
                              <tr key={i}><td>{fmt(String(s.Timestamp))}</td><td>{String(s.ActionType)}</td><td>{String(s.Location)}</td><td>{String(s.IPAddress)}</td><td>{String(s.Application)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <section className="def-card">
                        <h3>Risk detections</h3>
                        {userData.riskDetections.length === 0 ? <p className="dash-muted">None.</p> : userData.riskDetections.map((a) => (
                          <p key={a.id}><span className={sevClass(a.severity)}>{a.severity}</span> {a.title}</p>
                        ))}
                      </section>
                      <section className="def-card">
                        <h3>Group memberships</h3>
                        {userData.groups.map((g) => <p key={g}>{g}</p>)}
                      </section>
                      <section className="def-card">
                        <h3>Linked incidents</h3>
                        {userData.linkedIncidents.length === 0 ? <p className="dash-muted">None.</p> : userData.linkedIncidents.map((i) => (
                          <p key={i.id}><Link to={`/defender/incidents/${encodeURIComponent(i.id)}`}>#{i.displayId} {i.title}</Link></p>
                        ))}
                      </section>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      <Modal open={!!confirm} title={confirm?.title ?? ""} onClose={() => setConfirm(null)}>
        <p>{confirm?.body}</p>
        <p className="dash-muted" style={{ fontSize: 12 }}>Simulated — logged to the shared response ledger and Action center; reflected on any linked incident.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { confirm?.run(); setConfirm(null); }}>Confirm</button>
        </div>
      </Modal>
    </div>
  );
}
