import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConsolePage } from "../components/ConsolePage";
import { Modal } from "../components/Modal";
import { GLOBAL_EVENTS_FEED, type GlobalFeedRow } from "../data/globalEventsFeed";
import { useSimulator } from "../context/SimulatorContext";
import { csvEscape, downloadText } from "../lib/fakeExport";
import { talosReputationUrl, virusTotalIpUrl } from "../lib/threatIntelLinks";

function sevClass(s: GlobalFeedRow["severity"]): string {
  if (s === "low") return "sev-low";
  if (s === "medium") return "sev-medium";
  if (s === "high") return "sev-high";
  return "sev-critical";
}

export function EventsPage() {
  const { addNotification, incidents } = useSimulator();
  const [severity, setSeverity] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<GlobalFeedRow | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPer, setRowsPer] = useState(10);

  const groups = useMemo(() => {
    const s = new Set(GLOBAL_EVENTS_FEED.map((r) => r.group));
    return ["all", ...[...s].sort()];
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return GLOBAL_EVENTS_FEED.filter((r) => {
      if (severity !== "all" && r.severity !== severity) return false;
      if (groupFilter !== "all" && r.group !== groupFilter) return false;
      if (!qq) return true;
      return (
        r.hostname.toLowerCase().includes(qq) ||
        r.eventType.toLowerCase().includes(qq) ||
        r.group.toLowerCase().includes(qq) ||
        r.remoteIp.toLowerCase().includes(qq)
      );
    });
  }, [severity, groupFilter, q]);

  const counts = useMemo(
    () => ({
      critical: filtered.filter((r) => r.severity === "critical").length,
      high: filtered.filter((r) => r.severity === "high").length,
      medium: filtered.filter((r) => r.severity === "medium").length,
      low: filtered.filter((r) => r.severity === "low").length,
      informational: filtered.filter((r) => r.eventType.toLowerCase().includes("policy") || r.severity === "low").length,
    }),
    [filtered]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPer));
  const pageSafe = Math.min(page, pages - 1);
  const rows = filtered.slice(pageSafe * rowsPer, pageSafe * rowsPer + rowsPer);

  function exportVisible() {
    const header = ["timeUtc", "severity", "eventType", "hostname", "group", "localIp", "remoteIp", "shaShort"];
    const lines = [header.join(","), ...filtered.map((r) => header.map((k) => csvEscape(String((r as never)[k]))).join(","))];
    downloadText(`org-events-${Date.now()}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
    addNotification("Export", `Exported ${filtered.length} row(s) — synthetic org feed.`);
  }

  return (
    <ConsolePage
      title="Events"
      subtitle="Organization-wide event stream (synthetic). Inbox incidents have richer per-host Events drill-down."
    >
      <div className="amp-events-filters">
        <input
          className="search-input amp-events-search"
          placeholder="Search events"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          aria-label="Search events"
        />
        <select className="select-like" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} aria-label="Group">
          {groups.map((g) => (
            <option key={g} value={g}>
              {g === "all" ? "All groups" : g}
            </option>
          ))}
        </select>
        <select className="select-like" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity">
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button type="button" className="btn" onClick={() => addNotification("Filters", "Saved filter set (simulated).")}>
          Saved filters
        </button>
        <button type="button" className="btn btn-primary" onClick={exportVisible}>
          Export
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setQ("");
            setSeverity("all");
            setGroupFilter("all");
            setPage(0);
          }}
        >
          Reset all
        </button>
      </div>

      <div className="amp-sev-kpis">
        <button type="button" className="amp-sev-pill" onClick={() => setSeverity("all")}>
          <strong>{filtered.length}</strong> Events
        </button>
        <button type="button" className="amp-sev-pill" onClick={() => setSeverity("critical")}>
          <strong>{counts.critical}</strong> Critical
        </button>
        <button type="button" className="amp-sev-pill" onClick={() => setSeverity("high")}>
          <strong>{counts.high}</strong> High
        </button>
        <button type="button" className="amp-sev-pill" onClick={() => setSeverity("medium")}>
          <strong>{counts.medium}</strong> Medium
        </button>
        <button type="button" className="amp-sev-pill" onClick={() => setSeverity("low")}>
          <strong>{counts.low}</strong> Low
        </button>
        <button type="button" className="amp-sev-pill" onClick={() => addNotification("Informational", "Focus on policy and scan lifecycle rows.")}>
          <strong>{counts.informational}</strong> Informational
        </button>
      </div>

      <div className="panel">
        <div className="panel-h">Recent events — click a row for full detail</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Severity</th>
                <th>Event</th>
                <th>Host</th>
                <th>Group</th>
                <th>Local IP</th>
                <th>Remote IP</th>
                <th>Hash</th>
                <th>Intel</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="events-row-click"
                  onClick={() => setDetail(r)}
                  title="Click for event detail"
                >
                  <td className="mono small">{r.timeUtc}</td>
                  <td>
                    <span className={"sev " + sevClass(r.severity)}>{r.severity}</span>
                  </td>
                  <td>{r.eventType}</td>
                  <td>
                    <code>{r.hostname}</code>
                  </td>
                  <td>{r.group}</td>
                  <td className="mono small">{r.localIp}</td>
                  <td className="mono small">{r.remoteIp}</td>
                  <td className="mono tiny">{r.shaShort}</td>
                  <td className="intel-cell" onClick={(e) => e.stopPropagation()}>
                    {r.remoteIp !== "—" ? (
                      <>
                        <a href={virusTotalIpUrl(r.remoteIp)} target="_blank" rel="noreferrer">
                          VT
                        </a>
                        <a href={talosReputationUrl(r.remoteIp)} target="_blank" rel="noreferrer">
                          Talos
                        </a>
                      </>
                    ) : (
                      <span className="dash-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="dash-muted" style={{ padding: 16 }}>
            No rows match — relax filters or clear the search box.
          </p>
        ) : null}
        <div className="pagination">
          <span>
            Showing {rows.length} of {filtered.length}
          </span>
          <span style={{ marginLeft: "auto" }} />
          <button type="button" className="link-btn" disabled={pageSafe <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Prev
          </button>
          <button
            type="button"
            className="link-btn"
            disabled={pageSafe >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            Next
          </button>
          <label style={{ fontSize: 11 }}>
            Rows per page{" "}
            <select className="select-like" value={rowsPer} onChange={(e) => {
              setRowsPer(Number(e.target.value));
              setPage(0);
            }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <span className="dash-muted">
            Open incidents: {incidents.filter((i) => i.status !== "resolved").length}
          </span>
        </div>
      </div>

      <Modal open={!!detail} title={detail ? `Event — ${detail.eventType}` : "Event"} onClose={() => setDetail(null)} wide>
        {detail ? (
          <>
            <dl className="host-grid">
              <div className="kv">
                <dt>Time (UTC)</dt>
                <dd>{detail.timeUtc}</dd>
              </div>
              <div className="kv">
                <dt>Severity</dt>
                <dd>
                  <span className={"sev " + sevClass(detail.severity)}>{detail.severity}</span>
                </dd>
              </div>
              <div className="kv">
                <dt>Host</dt>
                <dd>
                  <code>{detail.hostname}</code>
                </dd>
              </div>
              <div className="kv">
                <dt>Group</dt>
                <dd>{detail.group}</dd>
              </div>
              <div className="kv">
                <dt>User</dt>
                <dd>{detail.user ?? "—"}</dd>
              </div>
              <div className="kv">
                <dt>Process</dt>
                <dd className="mono small">{detail.process ?? "—"}</dd>
              </div>
              <div className="kv">
                <dt>File / path</dt>
                <dd className="mono small">{detail.filePath ?? "—"}</dd>
              </div>
              <div className="kv">
                <dt>MITRE (example)</dt>
                <dd>{detail.mitre ?? "—"}</dd>
              </div>
              <div className="kv">
                <dt>Disposition (sim.)</dt>
                <dd>{detail.disposition ?? "—"}</dd>
              </div>
            </dl>
            <p className="dash-muted">
              Hash snippet: <code>{detail.shaShort}</code> — pivot to Inbox observables or XDR graph for full SHA-256
              exercises.
            </p>
            <div className="dash-links" style={{ marginBottom: 12 }}>
              {detail.remoteIp !== "—" ? (
                <>
                  <a href={virusTotalIpUrl(detail.remoteIp)} target="_blank" rel="noreferrer">
                    VirusTotal IP
                  </a>
                  <a href={talosReputationUrl(detail.remoteIp)} target="_blank" rel="noreferrer">
                    Talos IP
                  </a>
                </>
              ) : null}
              <Link to="/inbox" onClick={() => setDetail(null)}>
                Open Inbox
              </Link>
              <Link to="/xdr/investigate" onClick={() => setDetail(null)}>
                XDR Investigate
              </Link>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  addNotification("Ticket", `INC-${detail.id.toUpperCase()} linked in ServiceNow (simulated).`);
                }}
              >
                Create ticket
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </ConsolePage>
  );
}
