import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";
import {
  loadDefenderInvestigations,
  saveDefenderInvestigations,
  type DefenderInvestigation,
} from "../../data/defenderInvestigations";

export function DefenderInvestigationsPage() {
  const { addNotification } = useSimulator();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("investigation") ?? "";
  const [rows, setRows] = useState<DefenderInvestigation[]>(() => loadDefenderInvestigations());
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => rows.find((r) => r.id === focusId) ?? rows[0] ?? null,
    [rows, focusId]
  );
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return `${r.id} ${r.subject} ${r.sender} ${r.recipient} ${r.status}`.toLowerCase().includes(q);
      }),
    [rows, query]
  );

  useEffect(() => {
    saveDefenderInvestigations(rows);
  }, [rows]);

  function pick(id: string) {
    setSearchParams({ investigation: id });
  }

  function setActionStatus(actionId: string, status: "Approved" | "Remediated") {
    if (!selected) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? {
              ...r,
              status: status === "Approved" ? "In progress" : "Remediated",
              actions: r.actions.map((a) => (a.id === actionId ? { ...a, status } : a)),
            }
          : r
      )
    );
    addNotification("AIR action", `${status} remediation action on ${selected.id}.`);
  }

  function resolveIncident() {
    if (!selected) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? { ...r, status: "Resolved", incidentStatus: "Resolved" }
          : r
      )
    );
    addNotification("Incident", `${selected.id} marked Resolved.`);
  }

  return (
    <div className="def-page">
      <h1>Investigations</h1>
      <div className="def-toolbar">
        <button type="button" className="btn" onClick={() => addNotification("Export", "Investigation list exported (simulated).")}>Export</button>
        <button type="button" className="btn" onClick={() => setRows(loadDefenderInvestigations())}>Refresh</button>
        <input className="def-search-inline" placeholder="Search by id, subject, sender..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="grid-top" style={{ gridTemplateColumns: "1fr 1.2fr" }}>
      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Investigation</th>
                <th>Users</th>
                <th>Creation Time</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6}>No investigations yet. Start one from Email Explorer preview.</td></tr> : filtered.map((r) => (
                <tr key={r.id}>
                  <td><button type="button" className="link-btn" onClick={() => pick(r.id)}>{r.id}</button></td>
                  <td>{r.status}</td>
                  <td>{r.subject}</td>
                  <td>{r.recipient}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{r.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <div className="panel-h">Investigation Details</div>
        {!selected ? <div style={{ padding: 12 }}>Select an investigation record.</div> : (
          <div style={{ padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>{selected.id} - {selected.subject}</h3>
            <p className="dash-muted">Status: {selected.status} | Incident: {selected.incidentStatus} | Classification: {selected.classification}</p>
            <h4 style={{ marginBottom: 6 }}>Investigation Graph (blast radius)</h4>
            <div className="xdr-inc-graph" style={{ height: 120, justifyContent: "flex-start", padding: 8 }}>
              {selected.graphNodes.slice(0, 5).map((n) => <span key={n} className="xdr-mini-node suspicious">{n}</span>)}
            </div>
            <h4 style={{ marginBottom: 6 }}>Evidence</h4>
            <ul className="dash-list">{selected.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
            <h4 style={{ marginBottom: 6 }}>Pending Actions</h4>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Action</th><th>Status</th><th>Operate</th></tr></thead>
                <tbody>
                  {selected.actions.map((a) => (
                    <tr key={a.id}>
                      <td>{a.label}</td>
                      <td>{a.status}</td>
                      <td>
                        <button type="button" className="link-btn" onClick={() => setActionStatus(a.id, "Approved")}>Approve</button>{" "}
                        <button type="button" className="link-btn" onClick={() => setActionStatus(a.id, "Remediated")}>Mark remediated</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={resolveIncident}>Resolve Incident</button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

