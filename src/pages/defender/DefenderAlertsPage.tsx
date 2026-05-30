import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { useLabState } from "../../lib/useLabState";
import { sevClass } from "./DefenderIncidentsPage";
import type { DefenderAlertRecord } from "../../data/defenderIncidents";

type AlertRow = DefenderAlertRecord & { incidentId: string; incidentTitle: string; displayId: number };

function fmt(iso: string) {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + "Z";
  } catch {
    return iso;
  }
}

export function DefenderAlertsPage() {
  const { incidents } = useDefenderData();
  const [params, setParams] = useSearchParams();
  const [tuning, setTuning] = useLabState<Record<string, string>>("defender-alert-tuning-v1", {});
  const [tuneFor, setTuneFor] = useState<AlertRow | null>(null);
  const [tuneNote, setTuneNote] = useState("");

  const sevFilter = params.get("sev") ?? "";
  const sourceFilter = params.get("source") ?? "";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = useMemo<AlertRow[]>(() => {
    const all: AlertRow[] = [];
    incidents.forEach((i) =>
      i.alerts.forEach((a) => all.push({ ...a, incidentId: i.id, incidentTitle: i.title, displayId: i.displayId }))
    );
    return all.sort((a, b) => new Date(b.firstActivity).getTime() - new Date(a.firstActivity).getTime());
  }, [incidents]);

  const sources = useMemo(() => [...new Set(rows.map((r) => r.detectionSource))], [rows]);

  const filtered = rows
    .filter((r) => (sevFilter ? r.severity === sevFilter : true))
    .filter((r) => (sourceFilter ? r.detectionSource === sourceFilter : true));

  const saveTune = () => {
    if (!tuneFor) return;
    setTuning((prev) => ({ ...prev, [tuneFor.id]: tuneNote.trim() || "Suppressed by analyst" }));
    setTuneFor(null);
    setTuneNote("");
  };

  return (
    <div className="def-page">
      <h1>Alerts</h1>
      <p className="dash-muted">{filtered.length} of {rows.length} alerts across all incidents</p>

      <div className="def-toolbar">
        <select className="def-search-inline" value={sevFilter} onChange={(e) => setParam("sev", e.target.value)}>
          <option value="">All severities</option>
          {["High", "Medium", "Low", "Informational"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="def-search-inline" value={sourceFilter} onChange={(e) => setParam("source", e.target.value)}>
          <option value="">All detection sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(sevFilter || sourceFilter) ? <button className="btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear</button> : null}
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Alert</th>
                <th>Severity</th>
                <th>Detection source</th>
                <th>Category / MITRE</th>
                <th>Linked incident</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const tuned = tuning[r.id];
                return (
                  <tr key={r.id}>
                    <td>{fmt(r.firstActivity)}</td>
                    <td>
                      {r.title}
                      {tuned ? <div className="dash-muted" style={{ fontSize: 11 }}>Tuned: {tuned}</div> : null}
                    </td>
                    <td><span className={sevClass(r.severity)}>{r.severity}</span></td>
                    <td>{r.detectionSource}</td>
                    <td>{r.category} · {r.mitreTechniques.join(", ")}</td>
                    <td><Link to={`/defender/incidents/${encodeURIComponent(r.incidentId)}`}>#{r.displayId}</Link></td>
                    <td>{tuned ? "Suppressed" : r.status}</td>
                    <td><button className="btn" onClick={() => { setTuneFor(r); setTuneNote(tuned ?? ""); }}>Tune alert</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {tuneFor ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 3000 }}>
          <div className="panel" style={{ width: 460, maxWidth: "92vw", padding: 16 }}>
            <h3>Tune alert: {tuneFor.title}</h3>
            <p className="dash-muted" style={{ fontSize: 12 }}>Record a suppression rule / tuning note (persisted). This does not delete the alert — it documents the triage decision.</p>
            <textarea className="def-query" style={{ minHeight: 80 }} value={tuneNote} onChange={(e) => setTuneNote(e.target.value)} placeholder="e.g. Known benign — authorized admin tool. Suppress for IT-DESK-* devices." />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
              <button className="btn" onClick={() => setTuneFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTune}>Save tuning</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
