import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { sevClass } from "./DefenderIncidentsPage";
import { AttackGraph, type GraphEdge, type GraphNode } from "../../components/shared/AttackGraph";
import { IocSidePanel, type IocPanelData } from "../../components/shared/IocSidePanel";
import { NotesActionLog } from "../../components/shared/NotesActionLog";
import { Modal } from "../../components/Modal";
import { exportJson, exportPdf } from "../../lib/exportIncident";
import type {
  DefenderClassification,
  DefenderDetermination,
  DefenderIncidentStatus,
  DefenderSeverity,
} from "../../data/defenderIncidents";
import type { ResponseActionKind } from "../../context/SimulatorContext";

const TABS = ["Attack story", "Alerts", "Assets", "Investigations", "Evidence and response", "Summary"] as const;
type Tab = (typeof TABS)[number];

const SEVERITIES: DefenderSeverity[] = ["High", "Medium", "Low", "Informational"];
const STATUSES: DefenderIncidentStatus[] = ["Active", "In progress", "Resolved", "Redirected"];
const CLASSIFICATIONS: DefenderClassification[] = ["Not set", "True positive", "Informational, expected activity", "False positive"];
const DETERMINATIONS: DefenderDetermination[] = ["Not set", "Malware", "Phishing", "Compromised account", "Multi-stage attack", "Malicious user activity", "Unwanted software", "Security testing"];

function fmt(iso: string) {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + "Z";
  } catch {
    return iso;
  }
}

type ConfirmState = { title: string; body: string; confirmLabel: string; run: () => void } | null;

export function DefenderIncidentDetailPage() {
  const { incidentId } = useParams();
  const {
    getIncident,
    getMutable,
    updateIncident,
    addIncidentNote,
    logDefenderAction,
    getDeviceState,
    getUserState,
    setDeviceState,
    setUserState,
    analyst,
  } = useDefenderData();

  const [tab, setTab] = useState<Tab>("Attack story");
  const [ioc, setIoc] = useState<IocPanelData | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const inc = incidentId ? getIncident(incidentId) : undefined;
  const mutable = inc ? getMutable(inc.id) : undefined;

  const graph = useMemo(() => {
    if (!inc) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[], lookup: {} as Record<string, IocPanelData> };
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const lookup: Record<string, IocPanelData> = {};
    const add = (id: string, node: GraphNode, panel: IocPanelData) => {
      nodes.push(node);
      lookup[id] = panel;
    };
    inc.mailboxes.forEach((m, i) => add(`mb${i}`, { id: `mb${i}`, type: "mailbox", label: m.upn, verdict: "common" }, { type: "mailbox", value: m.upn, verdict: "unknown" }));
    inc.urlEvidence.forEach((u, i) => add(`url${i}`, { id: `url${i}`, type: "url", label: u.url, verdict: u.verdict }, { type: "url", value: u.url, verdict: u.verdict }));
    inc.devices.forEach((d, i) => add(`dev${i}`, { id: `dev${i}`, type: "endpoint", label: d.name, verdict: "asset" }, { type: "device", value: d.name, verdict: d.riskLevel, context: d.os }));
    inc.users.forEach((u, i) => add(`usr${i}`, { id: `usr${i}`, type: "user", label: u.upn, verdict: u.riskLevel === "High" ? "suspicious" : "clean" }, { type: "user", value: u.upn, verdict: u.riskLevel }));
    inc.fileEvidence.forEach((f, i) => add(`file${i}`, { id: `file${i}`, type: "file", label: f.filename, verdict: f.verdict }, { type: "file", value: f.filename, verdict: f.verdict, sha256: f.sha256 }));
    inc.ipEvidence.forEach((p, i) => add(`ip${i}`, { id: `ip${i}`, type: "ip", label: p.ip, verdict: p.verdict }, { type: "ip", value: p.ip, verdict: p.verdict, context: p.role }));

    const primaryDevice = inc.devices.length ? "dev0" : inc.users.length ? "usr0" : null;
    inc.mailboxes.forEach((_, i) => primaryDevice && edges.push({ source: `mb${i}`, target: primaryDevice }));
    inc.urlEvidence.forEach((_, i) => primaryDevice && edges.push({ source: `url${i}`, target: primaryDevice }));
    inc.users.forEach((_, i) => inc.devices.length && edges.push({ source: "dev0", target: `usr${i}` }));
    inc.fileEvidence.forEach((_, i) => primaryDevice && edges.push({ source: primaryDevice, target: `file${i}` }));
    inc.ipEvidence.forEach((_, i) => {
      const src = inc.fileEvidence.length ? "file0" : primaryDevice;
      if (src) edges.push({ source: src, target: `ip${i}` });
    });
    return { nodes, edges, lookup };
  }, [inc]);

  if (!inc || !mutable) {
    return (
      <div className="def-page">
        <p><Link to="/defender/incidents">← Incidents</Link></p>
        <h1>Incident not found</h1>
      </div>
    );
  }

  const ask = (title: string, body: string, confirmLabel: string, run: () => void) => setConfirm({ title, body, confirmLabel, run });

  const doExportJson = () => {
    exportJson(`Defender_${inc.id}_report.json`, {
      ...inc,
      analystState: mutable,
      handledBy: analyst,
      exportedAt: new Date().toISOString(),
    });
  };
  const doExportPdf = () => {
    exportPdf({
      title: inc.title,
      subtitle: "Microsoft Defender XDR — Incident Report",
      filename: `Defender_${inc.id}_report.pdf`,
      sections: [
        {
          heading: "Incident profile",
          rows: [
            { label: "Incident ID", value: `${inc.id} (#${inc.displayId})` },
            { label: "Severity", value: inc.severity },
            { label: "Status", value: inc.status },
            { label: "Classification", value: inc.classification },
            { label: "Determination", value: inc.determination },
            { label: "Assigned to", value: inc.assignedTo ?? "Unassigned" },
            { label: "Workloads", value: inc.workloads.join(", ") },
            { label: "MITRE techniques", value: inc.techniques.join(", ") || "—" },
            { label: "CVEs", value: inc.cves.join(", ") || "—" },
          ],
        },
        { heading: "Attack story", bullets: inc.attackStory.map((s) => `${fmt(s.time)} [${s.workload}] ${s.text}`) },
        { heading: "Investigation notes", bullets: mutable.notes.length ? mutable.notes.map((n) => `${n.authorInitials} @ ${fmt(n.timestamp)}: ${n.text}`) : ["No notes recorded."] },
        { heading: "Action log", bullets: mutable.actionLog.length ? mutable.actionLog.map((l) => `${fmt(l.timestamp)} — ${l.description} (${l.authorInitials})`) : ["No actions taken."] },
      ],
    });
  };

  const response = (action: ResponseActionKind, label: string, target: string, source: string, sha256?: string) =>
    logDefenderAction({ incidentId: inc.id, action, label, target, source, sha256 });

  return (
    <div className="def-page">
      <p><Link to="/defender/incidents">← Incidents</Link></p>
      <h1 style={{ fontSize: 24 }}>{inc.title}</h1>
      <p className="dash-muted">
        <span className={sevClass(inc.severity)}>{inc.severity}</span> · {inc.status} · Incident #{inc.displayId} · Workloads: {inc.workloads.join(", ")}
      </p>

      {/* Cross-tool synced banner + deep links */}
      {(inc.linkedSentinelIncidentId || inc.linkedXdrIncidentId || inc.linkedEmailMailId) ? (
        <div className="banner-info" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {inc.linkedSentinelIncidentId ? <span>This incident is synced with <strong>Microsoft Sentinel</strong>.</span> : null}
          {inc.linkedSentinelIncidentId ? (
            <Link className="btn" to={`/sentinel/incidents?incident=${encodeURIComponent(inc.linkedSentinelIncidentId)}`}>View in Microsoft Sentinel →</Link>
          ) : null}
          {inc.linkedXdrIncidentId ? (
            <Link className="btn" to={`/xdr/incidents?incident=${encodeURIComponent(inc.linkedXdrIncidentId)}`}>View Cisco XDR case →</Link>
          ) : null}
          {inc.linkedEmailMailId ? (
            <Link className="btn" to={`/defender/email-collab/explorer?mail=${encodeURIComponent(inc.linkedEmailMailId)}`}>Open originating email in Explorer →</Link>
          ) : null}
        </div>
      ) : null}

      <div className="def-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={"xdr-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12, alignItems: "start" }}>
        <div>
          {tab === "Attack story" ? (
            <>
              <section className="panel" style={{ marginBottom: 12 }}>
                <div className="panel-h">Attack story graph <span className="dash-muted" style={{ fontWeight: 400 }}>click a node to pivot</span></div>
                <AttackGraph nodes={graph.nodes} edges={graph.edges} selectedId={undefined} onNodeClick={(n) => setIoc(graph.lookup[n.id] ?? null)} />
              </section>
              <section className="panel">
                <div className="panel-h">Timeline</div>
                <div style={{ padding: 12 }}>
                  {inc.attackStory.map((s) => (
                    <div key={s.step} style={{ display: "flex", gap: 12, paddingBottom: 12, borderLeft: "2px solid #2563eb", marginLeft: 6, paddingLeft: 14, position: "relative" }}>
                      <div style={{ position: "absolute", left: -7, top: 2, width: 10, height: 10, borderRadius: "50%", background: "#2563eb" }} />
                      <div>
                        <div style={{ fontSize: 11, color: "#9aa4b2" }}>{fmt(s.time)} · <span className="def-status-chip">{s.workload}</span></div>
                        <div style={{ fontSize: 13 }}>{s.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {tab === "Alerts" ? (
            <section className="panel">
              <div className="panel-h">{inc.alerts.length} alerts</div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {inc.alerts.map((a) => (
                  <details key={a.id} className="def-card">
                    <summary style={{ cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
                      <span className={sevClass(a.severity)}>{a.severity}</span>
                      <strong>{a.title}</strong>
                      <span className="dash-muted" style={{ marginLeft: "auto", fontSize: 11 }}>{a.detectionSource}</span>
                    </summary>
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <p><strong>Category:</strong> {a.category} · <strong>Status:</strong> {a.status}</p>
                      <p><strong>MITRE techniques:</strong> {a.mitreTechniques.join(", ")}</p>
                      <p><strong>Entities:</strong> {a.entities.join(", ")}</p>
                      <p><strong>First activity:</strong> {fmt(a.firstActivity)}</p>
                      {a.sentinelAnalyticRuleId ? (
                        <p>
                          <Link className="btn" to={`/sentinel/analytics?rule=${encodeURIComponent(a.sentinelAnalyticRuleId)}`}>
                            Link to Sentinel analytic rule {a.sentinelAnalyticRuleId} →
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "Assets" ? (
            <section className="panel">
              <div className="panel-h">Assets</div>
              <div style={{ padding: 12 }}>
                <h4>Devices</h4>
                {inc.devices.length === 0 ? <p className="dash-muted">No devices.</p> : null}
                {inc.devices.map((d) => {
                  const st = getDeviceState(d.name);
                  return (
                    <div key={d.name} className="def-card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>{d.name}</strong> {st.isolated ? <span className="def-status-chip remediated">Isolated</span> : null}
                          <div className="dash-muted" style={{ fontSize: 12 }}>{d.os} · Risk: {d.riskLevel}</div>
                        </div>
                        <Link className="btn" to={`/defender/assets?device=${encodeURIComponent(d.name)}`}>Open device page →</Link>
                      </div>
                    </div>
                  );
                })}
                <h4 style={{ marginTop: 12 }}>Users</h4>
                {inc.users.length === 0 ? <p className="dash-muted">No users.</p> : null}
                {inc.users.map((u) => {
                  const st = getUserState(u.upn);
                  return (
                    <div key={u.upn} className="def-card" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>{u.upn}</strong> {st.compromised ? <span className="def-status-chip pending-actions">Compromised</span> : null}
                          <div className="dash-muted" style={{ fontSize: 12 }}>Risk: {u.riskLevel}</div>
                        </div>
                        <Link className="btn" to={`/defender/identities/users?user=${encodeURIComponent(u.upn)}`}>Open user →</Link>
                      </div>
                    </div>
                  );
                })}
                {inc.mailboxes.length ? (
                  <>
                    <h4 style={{ marginTop: 12 }}>Mailboxes</h4>
                    {inc.mailboxes.map((m) => <p key={m.upn}>{m.upn}</p>)}
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          {tab === "Investigations" ? (
            <NotesActionLog
              notes={mutable.notes}
              actionLog={mutable.actionLog}
              onAddNote={(t) => addIncidentNote(inc.id, t)}
              aiContext={`Incident: ${inc.title}. Tactics: ${inc.tactics.join(", ")}. Devices: ${inc.devices.map((d) => d.name).join(", ")}. Write a SOC investigation note.`}
            />
          ) : null}

          {tab === "Evidence and response" ? (
            <section className="panel">
              <div className="panel-h">Evidence and response</div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Type</th><th>Entity</th><th>Verdict</th><th>Response</th></tr>
                  </thead>
                  <tbody>
                    {inc.devices.map((d) => {
                      const st = getDeviceState(d.name);
                      return (
                        <tr key={`d-${d.name}`}>
                          <td>Device</td>
                          <td><button className="link-btn" onClick={() => setIoc({ type: "device", value: d.name, verdict: d.riskLevel, context: d.os })}>{d.name}</button></td>
                          <td>{st.isolated ? "Isolated" : "Active"}</td>
                          <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {st.isolated ? (
                              <button className="btn" onClick={() => ask("Release device", `Release ${d.name} from isolation?`, "Release", () => setDeviceState(d.name, { isolated: false }, "release_host", "Released device from isolation", inc.id))}>Release</button>
                            ) : (
                              <button className="btn" onClick={() => ask("Isolate device", `Isolate ${d.name} from the network?`, "Isolate", () => setDeviceState(d.name, { isolated: true }, "isolate_host", "Isolated device", inc.id))}>Isolate</button>
                            )}
                            <button className="btn" onClick={() => ask("Collect investigation package", `Collect forensic package from ${d.name}?`, "Collect", () => setDeviceState(d.name, { packageCollected: true }, "collect_package", "Collected investigation package", inc.id))}>Collect package</button>
                            <button className="btn" onClick={() => ask("Restrict app execution", `Restrict app execution on ${d.name}?`, "Restrict", () => setDeviceState(d.name, { appRestricted: true }, "restrict_app", "Restricted app execution", inc.id))}>Restrict apps</button>
                          </td>
                        </tr>
                      );
                    })}
                    {inc.fileEvidence.map((f) => (
                      <tr key={`f-${f.sha256}`}>
                        <td>File</td>
                        <td><button className="link-btn" onClick={() => setIoc({ type: "file", value: f.filename, verdict: f.verdict, sha256: f.sha256 })}>{f.filename}</button></td>
                        <td>{f.verdict}</td>
                        <td>
                          <button className="btn" onClick={() => ask("Block file hash", `Block ${f.filename} (${f.sha256.slice(0, 16)}…) across the tenant?`, "Block hash", () => response("block_sha256", "Blocked file hash", f.filename, "Defender for Endpoint", f.sha256))}>Block hash</button>
                        </td>
                      </tr>
                    ))}
                    {inc.ipEvidence.map((p) => (
                      <tr key={`i-${p.ip}`}>
                        <td>IP</td>
                        <td><button className="link-btn" onClick={() => setIoc({ type: "ip", value: p.ip, verdict: p.verdict, context: p.role })}>{p.ip}</button></td>
                        <td>{p.verdict}</td>
                        <td><button className="btn" onClick={() => ask("Block IP", `Block ${p.ip}?`, "Block IP", () => response("block_ip", "Blocked IP", p.ip, "Defender for Endpoint"))}>Block IP</button></td>
                      </tr>
                    ))}
                    {inc.urlEvidence.map((u) => (
                      <tr key={`u-${u.url}`}>
                        <td>URL</td>
                        <td><button className="link-btn" onClick={() => setIoc({ type: "url", value: u.url, verdict: u.verdict })}>{u.url}</button></td>
                        <td>{u.verdict}</td>
                        <td><button className="btn" onClick={() => ask("Block URL", `Block ${u.url}?`, "Block URL", () => response("block_url", "Blocked URL", u.url, "Defender for Office 365"))}>Block URL</button></td>
                      </tr>
                    ))}
                    {inc.users.map((u) => {
                      const st = getUserState(u.upn);
                      return (
                        <tr key={`usr-${u.upn}`}>
                          <td>User</td>
                          <td><button className="link-btn" onClick={() => setIoc({ type: "user", value: u.upn, verdict: u.riskLevel })}>{u.upn}</button></td>
                          <td>{st.compromised ? "Compromised" : "Active"}</td>
                          <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button className="btn" onClick={() => ask("Mark user as compromised", `Mark ${u.upn} as compromised?`, "Confirm", () => setUserState(u.upn, { compromised: true }, "mark_user_compromised", "Marked user as compromised", inc.id))}>Mark compromised</button>
                            <button className="btn" onClick={() => ask("Require sign-in", `Revoke sessions and require ${u.upn} to sign in again?`, "Require sign-in", () => setUserState(u.upn, { sessionsRevoked: true }, "require_signin", "Required user to sign in again", inc.id))}>Require sign-in</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {tab === "Summary" ? (
            <section className="panel">
              <div className="panel-h">Summary</div>
              <div className="def-kv">
                <p><strong>Incident:</strong> {inc.title}</p>
                <p><strong>Tactics:</strong> {inc.tactics.join(", ")}</p>
                <p><strong>Techniques:</strong> {inc.techniques.join(", ")}</p>
                <p><strong>CVEs:</strong> {inc.cves.join(", ") || "—"}</p>
                <p><strong>Devices:</strong> {inc.devices.map((d) => d.name).join(", ") || "—"}</p>
                <p><strong>Users:</strong> {inc.users.map((u) => u.upn).join(", ") || "—"}</p>
                <p><strong>First activity:</strong> {fmt(inc.firstActivity)}</p>
                <p><strong>Last activity:</strong> {fmt(inc.lastActivity)}</p>
              </div>
              <div style={{ padding: 12, display: "flex", gap: 8 }}>
                <button type="button" className="btn" onClick={doExportJson}>Export JSON</button>
                <button type="button" className="btn" onClick={doExportPdf}>Export PDF</button>
              </div>
            </section>
          ) : null}
        </div>

        {/* Manage incident right rail */}
        <aside className="panel" style={{ position: "sticky", top: 8 }}>
          <div className="panel-h">Manage incident</div>
          <div className="def-kv" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={() => updateIncident(inc.id, { assignedTo: analyst }, `Assigned to ${analyst}`)}>
              Assign to me
            </button>
            <label style={{ fontSize: 12 }}>Severity
              <select className="def-search-inline" style={{ width: "100%" }} value={inc.severity} onChange={(e) => updateIncident(inc.id, { severity: e.target.value as DefenderSeverity }, `Severity set to ${e.target.value}`)}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>Status
              <select className="def-search-inline" style={{ width: "100%" }} value={inc.status} onChange={(e) => updateIncident(inc.id, { status: e.target.value as DefenderIncidentStatus }, `Status set to ${e.target.value}`)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>Classification
              <select className="def-search-inline" style={{ width: "100%" }} value={inc.classification} onChange={(e) => updateIncident(inc.id, { classification: e.target.value as DefenderClassification }, `Classified as ${e.target.value}`)}>
                {CLASSIFICATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>Determination
              <select className="def-search-inline" style={{ width: "100%" }} value={inc.determination} onChange={(e) => updateIncident(inc.id, { determination: e.target.value as DefenderDetermination }, `Determination set to ${e.target.value}`)}>
                {DETERMINATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <p className="dash-muted" style={{ fontSize: 12, margin: 0 }}>Assigned to: <strong>{inc.assignedTo ?? "Unassigned"}</strong></p>
            <hr style={{ borderColor: "#2a2f38", width: "100%" }} />
            <button type="button" className="btn" onClick={doExportJson}>Export incident (JSON)</button>
            <button type="button" className="btn" onClick={doExportPdf}>Export incident (PDF)</button>
          </div>
        </aside>
      </div>

      <IocSidePanel ioc={ioc} onClose={() => setIoc(null)} onAddToNote={(t) => { addIncidentNote(inc.id, t); setIoc(null); }} />

      <Modal open={!!confirm} title={confirm?.title ?? ""} onClose={() => setConfirm(null)}>
        <p>{confirm?.body}</p>
        <p className="dash-muted" style={{ fontSize: 12 }}>Simulated action — logged to the incident, the shared response ledger, and the Action center.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button type="button" className="btn" onClick={() => setConfirm(null)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => { confirm?.run(); setConfirm(null); }}>{confirm?.confirmLabel}</button>
        </div>
      </Modal>
    </div>
  );
}
