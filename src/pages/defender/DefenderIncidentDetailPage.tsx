import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";
import { buildAlerts, incidentTitle } from "../../data/defenderSim";

const tabs = ["Attack story", "Alerts", "Assets", "Investigations", "Evidence and Response", "Summary"] as const;

export function DefenderIncidentDetailPage() {
  const { incidentId } = useParams();
  const { incidents, addNotification } = useSimulator();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Attack story");

  const inc = useMemo(() => incidents.find((i) => i.id === incidentId) ?? incidents[0], [incidents, incidentId]);
  const alerts = useMemo(() => (inc ? buildAlerts(inc) : []), [inc]);

  if (!inc) return <div className="def-page">No incident found.</div>;

  return (
    <div className="def-page">
      <p><Link to="/defender/incidents">← Incidents</Link></p>
      <h1>{incidentTitle(inc)}</h1>
      <p className="dash-muted">High · Active · {inc.xdrSir.sirId} · Workloads: Endpoint, Identity, Email, Cloud Apps</p>
      <div className="def-tabs">
        {tabs.map((t) => (
          <button key={t} type="button" className={"xdr-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="def-incident-grid">
        <section className="panel">
          <div className="panel-h">Alerts</div>
          <div className="def-alert-list">
            {alerts.map((a) => (
              <button key={a.id} type="button" className="def-alert-item" onClick={() => addNotification("Alert opened", `${a.title} — ${a.entity}`)}>
                <span className={"def-dot " + a.severity} />
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.timeUtc} · {a.entity}</small>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">Incident graph</div>
          <div className="def-graph">
            <div className="def-node">{inc.host.hostname.split(".")[0]}</div>
            <div className="def-line" />
            <div className="def-node">{inc.host.internalIp}</div>
            <div className="def-line" />
            <div className="def-node danger">{inc.xdrSir.maliciousDomains[0]?.domain ?? "mal-domain"}</div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">Incident details</div>
          <div className="def-kv">
            <p><strong>Assigned to:</strong> Unassigned</p>
            <p><strong>Classification:</strong> Not set</p>
            <p><strong>First activity:</strong> {inc.xdrSir.firstSeenUtc}</p>
            <p><strong>Last activity:</strong> {inc.xdrSir.lastObservedUtc}</p>
            <p><strong>Risk level:</strong> High</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => addNotification("Manage incident", "Incident ownership updated (simulated).")}>Manage incident</button>
        </section>
      </div>

      <div className="def-home-grid" style={{ marginTop: 12 }}>
        <section className="def-card">
          <h3>Attack story (text alternative)</h3>
          <ul className="dash-list">
            <li>Root cause: Email from bad-actor@evil.com with subject "Payroll Update".</li>
            <li>User bob.jones clicked URL malicious-site.com.</li>
            <li>Endpoint event: backdoor.exe downloaded on HR-Laptop-01.</li>
            <li>Identity event: anomalous excessive login attempts on DC-Server-01.</li>
          </ul>
        </section>
        <section className="def-card">
          <h3>Mailboxes</h3>
          <p><strong>Sender:</strong> bad-actor@evil.com</p>
          <p><strong>Recipient:</strong> bob.jones@contoso.com</p>
          <p><strong>Subject:</strong> Payroll Update</p>
          <button type="button" className="btn" onClick={() => addNotification("Mailbox action", "Hard delete executed across tenant (simulated).")}>Hard delete in tenant</button>
        </section>
        <section className="def-card">
          <h3>Users</h3>
          <p><strong>bob.jones</strong> - Risk level: High</p>
          <p>Impossible travel + excessive auth failures detected.</p>
        </section>
        <section className="def-card">
          <h3>Timeline</h3>
          <ul className="dash-list">
            {inc.events.slice(0, 5).map((e) => (
              <li key={e.id}>{e.timestampUtc} — {e.eventType}</li>
            ))}
          </ul>
        </section>
        <section className="def-card">
          <h3>Assets</h3>
          <p><strong>Devices:</strong> {inc.host.hostname}</p>
          <p><strong>Users:</strong> {inc.events[0]?.user ?? "Unknown user"}</p>
        </section>
        <section className="def-card">
          <h3>Evidence</h3>
          <ul className="dash-list">
            {inc.events.slice(0, 4).map((e) => (
              <li key={e.id}><code>{e.sha256Prefix}…{e.sha256Suffix}</code> · {e.filename ?? e.eventType}</li>
            ))}
          </ul>
        </section>
        <section className="def-card">
          <h3>Response</h3>
          <button type="button" className="btn" onClick={() => addNotification("Response", "Device isolated (simulated).")}>Isolate device</button>
          <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={() => addNotification("Response", "File quarantined (simulated).")}>Quarantine file</button>
        </section>
      </div>
    </div>
  );
}

