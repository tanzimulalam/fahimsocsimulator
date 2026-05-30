import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { compareDefenderIncidents } from "../../data/defenderIncidents";
import type {
  DefenderClassification,
  DefenderIncidentStatus,
  DefenderSeverity,
  DefenderWorkload,
} from "../../data/defenderIncidents";

const SEVERITIES: DefenderSeverity[] = ["High", "Medium", "Low", "Informational"];
const STATUSES: DefenderIncidentStatus[] = ["Active", "In progress", "Resolved", "Redirected"];
const WORKLOADS: DefenderWorkload[] = ["Endpoint", "Email", "Identity", "CloudApps"];

export function sevClass(sev: DefenderSeverity): string {
  if (sev === "High") return "sev sev-high";
  if (sev === "Medium") return "sev sev-medium";
  return "sev sev-low";
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + "Z";
  } catch {
    return iso;
  }
}

export function DefenderIncidentsPage() {
  const { incidents, updateIncident, analyst } = useDefenderData();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sevFilter = (params.get("sev") ?? "").split(",").filter(Boolean);
  const statusFilter = params.get("status") ?? "";
  const workloadFilter = params.get("workload") ?? "";
  const mine = params.get("mine") === "1";
  const q = params.get("q") ?? "";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const toggleSev = (s: string) => {
    const set = new Set(sevFilter);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    setParam("sev", [...set].join(","));
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return incidents
      .filter((i) => (sevFilter.length ? sevFilter.includes(i.severity) : true))
      .filter((i) => (statusFilter ? i.status === statusFilter : true))
      .filter((i) => (workloadFilter ? i.workloads.includes(workloadFilter as DefenderWorkload) : true))
      .filter((i) => (mine ? i.assignedTo === analyst : true))
      .filter((i) => {
        if (!ql) return true;
        const hay = [
          i.title,
          ...i.devices.map((d) => d.name),
          ...i.users.map((u) => u.upn),
          ...i.fileEvidence.map((f) => `${f.filename} ${f.sha256}`),
          ...i.ipEvidence.map((p) => p.ip),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(ql);
      })
      .slice()
      .sort(compareDefenderIncidents);
  }, [incidents, sevFilter, statusFilter, workloadFilter, mine, q, analyst]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkStatus = (status: DefenderIncidentStatus) => {
    selected.forEach((id) => updateIncident(id, { status }, `Status set to ${status} (bulk)`));
    setSelected(new Set());
  };
  const bulkAssign = () => {
    selected.forEach((id) => updateIncident(id, { assignedTo: analyst }, `Assigned to ${analyst} (bulk)`));
    setSelected(new Set());
  };
  const bulkClassify = (classification: DefenderClassification) => {
    selected.forEach((id) => updateIncident(id, { classification }, `Classified as ${classification} (bulk)`));
    setSelected(new Set());
  };

  return (
    <div className="def-page">
      <h1>Incidents</h1>
      <p className="dash-muted">{filtered.length} of {incidents.length} incidents · sorted by severity, then last activity</p>

      <div className="def-toolbar">
        {SEVERITIES.map((s) => (
          <label key={s} className="filter-check">
            <input type="checkbox" checked={sevFilter.includes(s)} onChange={() => toggleSev(s)} /> {s}
          </label>
        ))}
        <select className="def-search-inline" value={statusFilter} onChange={(e) => setParam("status", e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="def-search-inline" value={workloadFilter} onChange={(e) => setParam("workload", e.target.value)}>
          <option value="">All workloads</option>
          {WORKLOADS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <label className="filter-check">
          <input type="checkbox" checked={mine} onChange={(e) => setParam("mine", e.target.checked ? "1" : "")} /> Assigned to me
        </label>
        <input
          className="def-search-inline"
          style={{ minWidth: 220 }}
          placeholder="Search title, device, user, hash, IP…"
          value={q}
          onChange={(e) => setParam("q", e.target.value)}
        />
        {(sevFilter.length || statusFilter || workloadFilter || mine || q) ? (
          <button type="button" className="btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear filters</button>
        ) : null}
      </div>

      {selected.size > 0 ? (
        <div className="def-toolbar" style={{ background: "#151b23", border: "1px solid #2a2f38", borderRadius: 6, padding: 8 }}>
          <strong style={{ fontSize: 13 }}>{selected.size} selected — Manage incidents:</strong>
          <button type="button" className="btn" onClick={bulkAssign}>Assign to me</button>
          <button type="button" className="btn" onClick={() => bulkStatus("In progress")}>Set In progress</button>
          <button type="button" className="btn" onClick={() => bulkStatus("Resolved")}>Resolve</button>
          <button type="button" className="btn" onClick={() => bulkClassify("True positive")}>True positive</button>
          <button type="button" className="btn" onClick={() => bulkClassify("False positive")}>False positive</button>
          <button type="button" className="btn" onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
      ) : null}

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th>Incident name</th>
                <th>ID</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Classification</th>
                <th>Determination</th>
                <th>Workloads</th>
                <th>Assigned to</th>
                <th>Active alerts</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const activeAlerts = i.alerts.filter((a) => a.status !== "Resolved").length;
                return (
                  <tr key={i.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/defender/incidents/${encodeURIComponent(i.id)}`)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggleSelect(i.id)} />
                    </td>
                    <td>
                      <Link to={`/defender/incidents/${encodeURIComponent(i.id)}`} onClick={(e) => e.stopPropagation()}>
                        {i.title}
                      </Link>
                    </td>
                    <td>{i.displayId}</td>
                    <td><span className={sevClass(i.severity)}>{i.severity}</span></td>
                    <td>{i.status}</td>
                    <td>{i.classification}</td>
                    <td>{i.determination}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {i.workloads.map((w) => (
                          <span key={w} className="def-status-chip">{w}</span>
                        ))}
                      </div>
                    </td>
                    <td>{i.assignedTo ?? "Unassigned"}</td>
                    <td><span className={"badge-count " + (activeAlerts > 0 ? "high" : "info")}>{activeAlerts}</span></td>
                    <td>{fmtTime(i.lastActivity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
