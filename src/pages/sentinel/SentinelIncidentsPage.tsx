import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSentinelData } from "../../context/SentinelDataContext";
import { compareSentinelIncidents, type SentinelCloseClassification, type SentinelEntity } from "../../data/sentinelIncidents";
import { getRule, SENTINEL_PLAYBOOKS, type SentinelSeverity } from "../../data/sentinelData";
import { AttackGraph, type GraphEdge, type GraphNode, type GraphNodeType, type GraphVerdict } from "../../components/shared/AttackGraph";
import { NotesActionLog } from "../../components/shared/NotesActionLog";
import { Modal } from "../../components/Modal";
import { senSevClass, statusChipClass, fmtTs } from "./sentinelShared";

const SEVERITIES: SentinelSeverity[] = ["High", "Medium", "Low", "Informational"];
const STATUSES = ["New", "Active", "Closed"] as const;

function entityNodeType(t: SentinelEntity["type"]): GraphNodeType {
  switch (t) {
    case "account": return "user";
    case "host": return "endpoint";
    case "ip": return "ip";
    case "url": return "url";
    case "filehash": return "file";
  }
}
function entityVerdict(t: SentinelEntity["type"]): GraphVerdict {
  if (t === "host" || t === "account") return "asset";
  return "malicious";
}

function entityLogQuery(e: SentinelEntity): string {
  switch (e.type) {
    case "account": return `SigninLogs\n| where UserPrincipalName == "${e.value}"`;
    case "host": return `DeviceEvents\n| where DeviceName == "${e.value}"`;
    case "ip": return `SecurityEvent\n| where IpAddress == "${e.value}"`;
    case "url": return `DeviceEvents\n| where RemoteUrl contains "${e.value}"`;
    case "filehash": return `DeviceEvents\n| where ProcessCommandLine contains "${e.value}"`;
  }
}

export function SentinelIncidentsPage() {
  const { incidents, getIncident, getMutable, updateIncident, closeIncident, addComment, analyst, runPlaybook } = useSentinelData();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const focusId = params.get("incident");

  if (focusId) {
    return <IncidentDetail id={focusId} />;
  }

  const sevFilter = params.get("severity") ?? "";
  const statusFilter = params.get("status") ?? "";
  const text = params.get("q") ?? "";

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const filtered = incidents
    .filter((i) => (sevFilter ? i.severity === sevFilter : true))
    .filter((i) => (statusFilter ? i.status === statusFilter : true))
    .filter((i) => {
      if (!text) return true;
      const hay = (i.title + " " + i.id + " " + i.owner + " " + i.productNames.join(" ") + " " + i.entities.map((e) => e.value).join(" ") + " " + i.tactics.join(" ")).toLowerCase();
      return hay.includes(text.toLowerCase());
    })
    .sort(compareSentinelIncidents);

  return (
    <div className="def-page">
      <h1>Incidents</h1>
      <p className="dash-muted">{filtered.length} of {incidents.length} incidents. Incidents synced from Microsoft Defender XDR are marked.</p>

      <div className="def-toolbar">
        <input className="def-search-inline" placeholder="Search title, entity, owner, tactic…" value={text} onChange={(e) => setParam("q", e.target.value)} />
        <select className="def-search-inline" value={sevFilter} onChange={(e) => setParam("severity", e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="def-search-inline" value={statusFilter} onChange={(e) => setParam("status", e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Severity</th><th>Incident</th><th>ID</th><th>Status</th><th>Owner</th><th>Alerts</th><th>Products</th><th>Last updated</th><th>Synced</th></tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/sentinel/incidents?incident=${encodeURIComponent(i.id)}`)}>
                  <td><span className={senSevClass(i.severity)}>{i.severity}</span></td>
                  <td><strong>{i.title}</strong></td>
                  <td>{i.displayId}</td>
                  <td><span className={statusChipClass(i.status)}>{i.status}</span></td>
                  <td>{i.owner ?? <span className="dash-muted">Unassigned</span>}</td>
                  <td><span className="badge-count info">{i.alertCount}</span></td>
                  <td><span className="dash-muted" style={{ fontSize: 11 }}>{i.productNames.join(", ")}</span></td>
                  <td>{fmtTs(i.lastUpdated)}</td>
                  <td>{i.linkedDefenderIncidentId ? <span className="def-status-chip in-progress">Defender XDR</span> : <span className="dash-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  function IncidentDetail({ id }: { id: string }) {
    const inc = getIncident(id);
    const [closeOpen, setCloseOpen] = useState(false);
    const [closeClass, setCloseClass] = useState<SentinelCloseClassification>("True positive");
    const [closeReason, setCloseReason] = useState("");
    const [playbookFor, setPlaybookFor] = useState<SentinelEntity | null>(null);

    if (!inc) {
      return (
        <div className="def-page">
          <p><Link to="/sentinel/incidents">← Incidents</Link></p>
          <div className="panel" style={{ padding: 16 }}>Incident {id} not found.</div>
        </div>
      );
    }

    const m = getMutable(id);
    const rule = getRule(inc.analyticRuleId);

    const nodes: GraphNode[] = [
      { id: "root", type: "process", label: inc.title.slice(0, 12), verdict: "suspicious" },
      ...inc.entities.map((e, idx) => ({ id: `e${idx}`, type: entityNodeType(e.type), label: e.value, verdict: entityVerdict(e.type) })),
    ];
    const edges: GraphEdge[] = inc.entities.map((_, idx) => ({ source: "root", target: `e${idx}` }));

    return (
      <div className="def-page">
        <p><Link to="/sentinel/incidents">← Incidents</Link></p>

        {(inc.linkedDefenderIncidentId || inc.linkedXdrIncidentId) ? (
          <div className="sync-banner">
            <span className="sync-dot" />
            {inc.linkedDefenderIncidentId ? "This incident is synced with Microsoft Defender XDR." : "This incident correlates with a Cisco XDR case."}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>{inc.title}</h1>
            <div className="dash-muted">Sentinel incident {inc.displayId} · <span className={senSevClass(inc.severity)}>{inc.severity}</span> · <span className={statusChipClass(inc.status)}>{inc.status}</span></div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {inc.linkedDefenderIncidentId ? <Link className="btn btn-primary" to={`/defender/incidents/${encodeURIComponent(inc.linkedDefenderIncidentId)}`}>Investigate in Microsoft Defender XDR</Link> : null}
            {inc.linkedXdrIncidentId ? <Link className="btn" to={`/xdr/incidents?incident=${encodeURIComponent(inc.linkedXdrIncidentId)}`}>View Cisco XDR case</Link> : null}
          </div>
        </div>

        <div className="def-incident-grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: 12 }}>
          <div>
            <section className="panel" style={{ marginBottom: 12 }}>
              <div className="panel-h">Overview</div>
              <div className="def-kv">
                <p>{inc.description}</p>
                <p><strong>Tactics:</strong> {inc.tactics.join(", ")}</p>
                <p><strong>Techniques:</strong> {inc.techniques.join(", ")}</p>
                <p><strong>Products:</strong> {inc.productNames.join(", ")}</p>
                <p><strong>Analytic rule:</strong> {rule ? <Link to={`/sentinel/analytics?rule=${encodeURIComponent(rule.id)}`}>{rule.name}</Link> : inc.analyticRuleId}</p>
                <p><strong>Created:</strong> {fmtTs(inc.created)} · <strong>Updated:</strong> {fmtTs(inc.lastUpdated)}</p>
              </div>
            </section>

            <section className="panel" style={{ marginBottom: 12 }}>
              <div className="panel-h">Entities <span className="dash-muted" style={{ fontWeight: 400 }}>· click to pivot to Logs</span></div>
              <div style={{ padding: 12 }}>
                {inc.entities.map((e, idx) => (
                  <button key={idx} className="sen-entity" onClick={() => navigate(`/sentinel/logs?q=${encodeURIComponent(entityLogQuery(e))}`)}>
                    <span className="sen-entity-type">{e.type}</span> {e.value}
                  </button>
                ))}
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {inc.entities.map((e, idx) => (
                    <button key={idx} className="btn" onClick={() => setPlaybookFor(e)} title="Run a playbook against this entity">Run playbook on {e.value.slice(0, 18)}</button>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel" style={{ marginBottom: 12 }}>
              <div className="panel-h">Investigation graph</div>
              <div style={{ padding: 12 }}>
                <AttackGraph nodes={nodes} edges={edges} />
              </div>
            </section>

            <NotesActionLog
              notes={m.comments.map((c) => ({ id: c.id, text: c.text, timestamp: c.timestamp, authorInitials: c.authorInitials }))}
              actionLog={m.actionLog}
              onAddNote={(t) => addComment(id, t)}
              aiContext={`Write a SOC investigation note for Microsoft Sentinel incident "${inc.title}". Tactics: ${inc.tactics.join(", ")}.`}
            />
          </div>

          <div>
            <section className="panel" style={{ marginBottom: 12 }}>
              <div className="panel-h">Manage incident</div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn" onClick={() => updateIncident(id, { owner: analyst }, `Assigned to ${analyst}`)}>Assign to me</button>
                <label className="def-kv-label">Severity
                  <select className="def-search-inline" value={inc.severity} onChange={(e) => updateIncident(id, { severity: e.target.value as SentinelSeverity }, `Severity set to ${e.target.value}`)}>
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="def-kv-label">Status
                  <select className="def-search-inline" value={inc.status} onChange={(e) => updateIncident(id, { status: e.target.value as typeof STATUSES[number] }, `Status set to ${e.target.value}`)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <button className="btn btn-primary" onClick={() => setCloseOpen(true)} disabled={inc.status === "Closed"}>
                  {inc.status === "Closed" ? `Closed: ${inc.closeClassification}` : "Close incident"}
                </button>
              </div>
            </section>
          </div>
        </div>

        {closeOpen ? (
          <Modal open title="Close incident" onClose={() => setCloseOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label className="def-kv-label">Classification
                <select className="def-search-inline" value={closeClass} onChange={(e) => setCloseClass(e.target.value as SentinelCloseClassification)}>
                  <option value="True positive">True positive</option>
                  <option value="Benign positive">Benign positive</option>
                  <option value="False positive">False positive</option>
                  <option value="Undetermined">Undetermined</option>
                </select>
              </label>
              <label className="def-kv-label">Reason
                <textarea className="def-query" style={{ minHeight: 70 }} value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="Closing note…" />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={() => { closeIncident(id, closeClass, closeReason); setCloseOpen(false); }}>Close incident</button>
                <button className="btn" onClick={() => setCloseOpen(false)}>Cancel</button>
              </div>
            </div>
          </Modal>
        ) : null}

        {playbookFor ? (
          <Modal open title={`Run playbook on ${playbookFor.value}`} onClose={() => setPlaybookFor(null)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SENTINEL_PLAYBOOKS.map((p) => (
                <button key={p.id} className="btn" style={{ textAlign: "left" }} onClick={() => { runPlaybook(p.id, p.name, playbookFor.value, id); setPlaybookFor(null); }}>
                  <strong>{p.name}</strong>
                  <div className="dash-muted" style={{ fontSize: 11 }}>{p.description}</div>
                </button>
              ))}
            </div>
          </Modal>
        ) : null}
      </div>
    );
  }
}
