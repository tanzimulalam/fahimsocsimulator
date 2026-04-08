import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import type { CompromiseEvent, Incident, IncidentStatus, Severity } from "../types";
import { GROUP_OPTIONS, topAlerts } from "../data/mockData";
import { FileContextMenu } from "./FileContextMenu";
import { IncidentEventsModal } from "./IncidentEventsModal";
import { Modal } from "./Modal";
import { countByStatus, useSimulator } from "../context/SimulatorContext";
import { formatUtcTraining } from "../lib/formatUtc";

function sevClass(s: Severity): string {
  if (s === "low") return "sev-low";
  if (s === "medium") return "sev-medium";
  return "sev-high";
}

type SortKey = "date_desc" | "date_asc" | "severity" | "hostname";

export function IncidentSection({
  expandIncidentId,
  instructorHideResolved,
}: {
  expandIncidentId?: string | null;
  instructorHideResolved?: boolean;
}) {
  const {
    incidents,
    searchQuery,
    selectedIds,
    toggleSelect,
    beginWork,
    markResolved,
    moveToGroup,
    promoteToIncidentManager,
    lastWorkflowAction,
    clearLastWorkflowAction,
    addNotification,
  } = useSimulator();

  const [tab, setTab] = useState<IncidentStatus>("requires_attention");
  const [expandedId, setExpandedId] = useState<string | null>("inc-1");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [menu, setMenu] = useState<{ event: CompromiseEvent; x: number; y: number } | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CompromiseEvent | null>(null);
  const [eventsFor, setEventsFor] = useState<Incident | null>(null);
  const [trajectoryFor, setTrajectoryFor] = useState<Incident | null>(null);
  const [diagnosticsFor, setDiagnosticsFor] = useState<Incident | null>(null);

  useEffect(() => {
    if (!lastWorkflowAction || lastWorkflowAction.type !== "begin_work") return;
    setTab("in_progress");
    const first = lastWorkflowAction.incidentIds[0];
    if (first) setExpandedId(first);
    clearLastWorkflowAction();
  }, [lastWorkflowAction, clearLastWorkflowAction]);

  useEffect(() => {
    if (expandIncidentId) {
      setExpandedId(expandIncidentId);
      const inc = incidents.find((i) => i.id === expandIncidentId);
      if (inc) setTab(inc.status);
    }
  }, [expandIncidentId, incidents]);

  const filtered = useMemo(() => {
    let list = incidents.filter((i) => i.status === tab);
    if (instructorHideResolved && tab === "resolved") {
      list = [];
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.hostLine.toLowerCase().includes(q) ||
          i.groupName.toLowerCase().includes(q) ||
          i.host.hostname.toLowerCase().includes(q)
      );
    }
    const out = [...list];
    out.sort((a, b) => {
      if (sort === "hostname") return a.hostLine.localeCompare(b.hostLine);
      if (sort === "severity") return b.host.riskScore - a.host.riskScore;
      const da = a.host.lastSeenUtc;
      const db = b.host.lastSeenUtc;
      if (sort === "date_desc") return db.localeCompare(da);
      return da.localeCompare(db);
    });
    return out;
  }, [incidents, tab, searchQuery, sort, instructorHideResolved]);

  const tabCounts = useMemo(
    () => ({
      requires_attention: countByStatus(incidents, "requires_attention"),
      in_progress: countByStatus(incidents, "in_progress"),
      resolved: countByStatus(incidents, "resolved"),
    }),
    [incidents]
  );

  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="trend-header" style={{ margin: 0, borderBottom: "1px solid var(--border)" }}>
        <div className="panel trend-chart-panel" style={{ margin: 12 }}>
          <div className="panel-h">Activity trend (simulated)</div>
          <div style={{ padding: 12 }}>
            <button
              type="button"
              className="link-btn"
              style={{ width: "100%", padding: 0, marginBottom: 8 }}
              onClick={() => addNotification("Trend", "This chart is static in the lab build — discuss volume vs. triage in class.")}
            >
              Why is this red? (click)
            </button>
            <svg viewBox="0 0 400 80" width="100%" height="80" aria-hidden>
              {[12, 18, 14, 22, 30, 28, 35, 40, 55, 62, 70, 78].map((h, i) => (
                <rect
                  key={i}
                  x={10 + i * 30}
                  y={75 - h * 0.7}
                  width="20"
                  height={h * 0.7}
                  fill="#e2231a"
                  opacity={0.85}
                  rx={2}
                />
              ))}
            </svg>
          </div>
        </div>
        <div className="mini-alerts" style={{ margin: 12 }}>
          {topAlerts.map((a) => (
            <button
              key={a.name}
              type="button"
              className="mini-alert"
              style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
              onClick={() =>
                addNotification("Threat name", `${a.name} — discuss IOCs, prevalence, and false positives in class.`)
              }
            >
              <span className={"sev sev-" + a.severity}>{a.severity}</span>
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="status-tabs" role="tablist" aria-label="Incident status">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "requires_attention"}
          className={"status-tab" + (tab === "requires_attention" ? " active" : "")}
          onClick={() => setTab("requires_attention")}
        >
          {tabCounts.requires_attention} Requires Attention
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "in_progress"}
          className={"status-tab" + (tab === "in_progress" ? " active" : "")}
          onClick={() => setTab("in_progress")}
        >
          {tabCounts.in_progress} In Progress
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "resolved"}
          className={"status-tab" + (tab === "resolved" ? " active" : "")}
          onClick={() => setTab("resolved")}
        >
          {tabCounts.resolved} Resolved
        </button>
      </div>

      {instructorHideResolved ? (
        <p className="dash-muted" style={{ padding: "0 12px 4px", margin: 0, fontSize: 11 }}>
          Instructor filter: <strong>Resolved</strong> incidents are hidden here so class focuses on open queues. Turn
          off in <strong>New Filter</strong> to show them again.
        </p>
      ) : null}

      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => beginWork()}>
          Begin Work
        </button>
        <button type="button" className="btn" onClick={() => markResolved()}>
          Mark Resolved
        </button>
        <button type="button" className="btn" onClick={() => setMoveOpen(true)}>
          Move to Group…
        </button>
        <button type="button" className="btn" onClick={() => promoteToIncidentManager()}>
          Promote to Incident Manager
        </button>
        <div className="toolbar-spacer" />
        <div className="sort-row">
          <span>Sort</span>
          <select
            className="select-like"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort by"
          >
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="severity">Risk score</option>
            <option value="hostname">Hostname</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="page-placeholder" style={{ padding: 24 }}>
          {instructorHideResolved && tab === "resolved"
            ? "Resolved incidents are hidden by your instructor filter. Open New Filter and uncheck “Hide resolved from discussion.”"
            : searchQuery.trim()
              ? "No incidents match your search. Clear the search box in the header."
              : "No incidents in this queue. Use Reset on Inbox or move items from other tabs."}
        </div>
      ) : (
        filtered.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            open={expandedId === inc.id}
            selected={selectedIds.has(inc.id)}
            onToggle={() => setExpandedId((id) => (id === inc.id ? null : inc.id))}
            onToggleSelect={() => toggleSelect(inc.id)}
            onEventContext={(ev, e) => {
              e.preventDefault();
              setMenu({ event: ev, x: e.clientX, y: e.clientY });
            }}
            onEventClick={(ev) => setDetailEvent(ev)}
            onOpenEvents={() => setEventsFor(inc)}
            onOpenTrajectory={() => setTrajectoryFor(inc)}
            onOpenDiagnostics={() => setDiagnosticsFor(inc)}
          />
        ))
      )}

      {menu ? (
        <FileContextMenu
          event={menu.event}
          position={{ x: menu.x, y: menu.y }}
          onClose={() => setMenu(null)}
        />
      ) : null}

      <IncidentEventsModal
        incident={eventsFor}
        open={!!eventsFor}
        onClose={() => setEventsFor(null)}
      />

      <Modal open={!!trajectoryFor} title="Device Trajectory (simulated)" onClose={() => setTrajectoryFor(null)} wide>
        {trajectoryFor ? (
          <>
            <p>
              <strong>Host:</strong> {trajectoryFor.hostLine} · <strong>Group:</strong> {trajectoryFor.groupName}
            </p>
            <p>
              Timeline (UTC): connector events, file mods, and net flows are <em>fabricated</em> for class narrative.
            </p>
            <ul className="trajectory-list">
              <li>{trajectoryFor.host.lastSeenUtc} — Last successful check-in</li>
              <li>−4h — Policy merge applied ({trajectoryFor.host.policy})</li>
              <li>−6h — TETRA defs update ({trajectoryFor.host.definitionVersion})</li>
              <li>−12h — Suspicious process ancestry (drill: compare with Events table)</li>
            </ul>
            <p>
              <button type="button" className="btn btn-primary" onClick={() => {
                setTrajectoryFor(null);
                setEventsFor(trajectoryFor);
              }}>
                Open full Events for this host
              </button>
            </p>
          </>
        ) : null}
      </Modal>

      <Modal open={!!diagnosticsFor} title="Diagnostics bundle (simulated)" onClose={() => setDiagnosticsFor(null)} wide>
        {diagnosticsFor ? (
          <>
            <p>
              <strong>Hostname:</strong> {diagnosticsFor.host.hostname}
            </p>
            <p>
              <strong>Connector GUID:</strong> <code>{diagnosticsFor.host.connectorGuid}</code>
            </p>
            <p>
              <strong>Processor:</strong> <code>{diagnosticsFor.host.processorId}</code>
            </p>
            <p>
              <strong>Update server:</strong> {diagnosticsFor.host.updateServer}
            </p>
            <p className="diag-fake">
              Simulated bundle would include: <code>support.log</code>, <code>policy.xml</code>,{" "}
              <code>network_diag.txt</code> (not generated in this lab build).
            </p>
          </>
        ) : null}
      </Modal>

      <Modal open={moveOpen} title="Move to group" onClose={() => setMoveOpen(false)}>
        <p>Pick a group for selected incidents. Use checkboxes on incidents first.</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {GROUP_OPTIONS.map((g) => (
            <li key={g} style={{ marginBottom: 8 }}>
              <button type="button" className="btn" style={{ width: "100%", textAlign: "left" }} onClick={() => {
                moveToGroup(g);
                setMoveOpen(false);
              }}>
                {g}
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={!!detailEvent} title="Event detail (training)" onClose={() => setDetailEvent(null)} wide>
        {detailEvent ? (
          <>
            <p>
              <strong>Type:</strong> {detailEvent.eventType}
            </p>
            <p>
              <strong>File:</strong> {detailEvent.filename ?? "—"}
            </p>
            <p>
              <strong>Full SHA-256 (64 hex):</strong>
            </p>
            <div className="hash-block">
              {detailEvent.sha256Full ??
                `${detailEvent.sha256Prefix}${"0".repeat(48)}${detailEvent.sha256Suffix}`.slice(0, 64)}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const t =
                    detailEvent.sha256Full ??
                    `${detailEvent.sha256Prefix}${"0".repeat(48)}${detailEvent.sha256Suffix}`.slice(0, 64);
                  void navigator.clipboard.writeText(t).then(() =>
                    addNotification("Copied", "SHA-256 copied for students to pivot in VT / internal tools.")
                  );
                }}
              >
                Copy SHA-256
              </button>
              <button type="button" className="btn" onClick={() => setDetailEvent(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </section>
  );
}

function IncidentCard({
  incident,
  open,
  selected,
  onToggle,
  onToggleSelect,
  onEventContext,
  onEventClick,
  onOpenEvents,
  onOpenTrajectory,
  onOpenDiagnostics,
}: {
  incident: Incident;
  open: boolean;
  selected: boolean;
  onToggle: () => void;
  onToggleSelect: () => void;
  onEventContext: (ev: CompromiseEvent, e: MouseEvent) => void;
  onEventClick: (ev: CompromiseEvent) => void;
  onOpenEvents: () => void;
  onOpenTrajectory: () => void;
  onOpenDiagnostics: () => void;
}) {
  const { getIncidentWork, startScan, addIncidentComment } = useSimulator();
  const work = getIncidentWork(incident.id);
  const [scanPickerOpen, setScanPickerOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [evPage, setEvPage] = useState(0);
  const [rowsPer, setRowsPer] = useState(10);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);

  const evTotal = incident.events.length;
  const evPages = Math.max(1, Math.ceil(evTotal / rowsPer));
  const evPageSafe = Math.min(evPage, evPages - 1);
  const evSlice = incident.events.slice(evPageSafe * rowsPer, evPageSafe * rowsPer + rowsPer);

  function submitComment(e: FormEvent) {
    e.preventDefault();
    addIncidentComment(incident.id, commentDraft);
    setCommentDraft("");
  }

  const h = incident.host;
  return (
    <>
    <div className={"incident-block" + (selected ? " selected" : "")}>
      <div
        className="incident-head"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <input
          type="checkbox"
          className="incident-select"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${incident.hostLine}`}
        />
        <span className={"chevron" + (open ? " open" : "")} aria-hidden>
          ▸
        </span>
        <div className="incident-title">
          <code>{incident.hostLine}</code> in group {incident.groupName}
        </div>
        <div className="incident-meta">
          <button
            type="button"
            className="incident-meta-btn"
            title="Keyboard / USB events (simulated)"
            onClick={(e) => {
              e.stopPropagation();
              setKeyboardOpen(true);
            }}
          >
            K 0
          </button>
          <button
            type="button"
            className="incident-meta-btn"
            title="Risk charts"
            onClick={(e) => {
              e.stopPropagation();
              setChartsOpen(true);
            }}
          >
            ▤
          </button>
          <span>{incident.eventCount} events</span>
        </div>
      </div>
      {open ? (
        <div className="incident-detail">
          <dl className="host-grid">
            <div className="kv">
              <dt>Hostname</dt>
              <dd>{h.hostname}</dd>
            </div>
            <div className="kv">
              <dt>Operating System</dt>
              <dd>{h.os}</dd>
            </div>
            <div className="kv">
              <dt>Connector Version</dt>
              <dd>{h.connectorVersion}</dd>
            </div>
            <div className="kv">
              <dt>Install Date</dt>
              <dd>{h.installDateUtc}</dd>
            </div>
            <div className="kv">
              <dt>Connector GUID</dt>
              <dd>
                <code>{h.connectorGuid}</code>
              </dd>
            </div>
            <div className="kv">
              <dt>Processor ID</dt>
              <dd>
                <code>{h.processorId}</code>
              </dd>
            </div>
            <div className="kv">
              <dt>Definitions Last Updated</dt>
              <dd>{h.definitionsLastUpdatedUtc}</dd>
            </div>
            <div className="kv">
              <dt>Cisco Secure Client ID</dt>
              <dd>{h.ciscoSecureClientId}</dd>
            </div>
            <div className="kv">
              <dt>Group</dt>
              <dd>{h.group}</dd>
            </div>
            <div className="kv">
              <dt>Policy</dt>
              <dd>{h.policy}</dd>
            </div>
            <div className="kv">
              <dt>Internal IP</dt>
              <dd>{h.internalIp}</dd>
            </div>
            <div className="kv">
              <dt>External IP</dt>
              <dd>{h.externalIp}</dd>
            </div>
            <div className="kv">
              <dt>Last Seen</dt>
              <dd>{h.lastSeenUtc}</dd>
            </div>
            <div className="kv">
              <dt>Definition Version</dt>
              <dd>{h.definitionVersion}</dd>
            </div>
            <div className="kv">
              <dt>Update Server</dt>
              <dd>{h.updateServer}</dd>
            </div>
            <div className="kv">
              <dt>Cisco Security Risk Score</dt>
              <dd>
                <span className="risk-gauge">{h.riskScore}</span>
              </dd>
            </div>
          </dl>

          <div className="sub-panels">
            <div className="sub-panel">
              <h4>Related Compromise Events</h4>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Event Type</th>
                      <th>SHA-256</th>
                      <th>Timestamp (UTC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evSlice.map((ev) => (
                      <tr key={ev.id} onContextMenu={(e) => onEventContext(ev, e)}>
                        <td>
                          <span className={"sev " + sevClass(ev.severity)}>{ev.severity}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="event-row-btn"
                            onClick={() => onEventClick(ev)}
                          >
                            {ev.eventType}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="event-row-btn"
                            onClick={() => onEventClick(ev)}
                            title="Click for full hash"
                          >
                            <code>
                              {ev.sha256Prefix}…{ev.sha256Suffix}
                            </code>
                          </button>
                        </td>
                        <td>{ev.timestampUtc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>
                  {incident.recordCount} record(s) · page {evPageSafe + 1} / {evPages}
                </span>
                <span style={{ marginLeft: "auto" }} />
                <button
                  type="button"
                  className="link-btn"
                  disabled={evPageSafe <= 0}
                  onClick={() => setEvPage((p) => Math.max(0, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="link-btn"
                  disabled={evPageSafe >= evPages - 1}
                  onClick={() => setEvPage((p) => Math.min(evPages - 1, p + 1))}
                >
                  Next
                </button>
                <label style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Rows:
                  <select
                    className="select-like"
                    aria-label="Rows per page"
                    value={rowsPer}
                    onChange={(e) => {
                      setRowsPer(Number(e.target.value));
                      setEvPage(0);
                    }}
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="sub-panel">
              <h4>Vulnerabilities</h4>
              <div className="vuln-box">{incident.vulnerabilitiesNote}</div>
            </div>
          </div>

          {work.scan.status === "scanning" ? (
            <div className="scan-banner" role="status">
              <span className="scan-banner-dot" aria-hidden />
              Scan in progress — {work.scan.mode === "flash" ? "Flash" : "Full"} scan (simulated). Results appear in
              Events when finished.
            </div>
          ) : null}
          {work.scan.status === "clean" ? (
            <div className="scan-done-banner">
              Last scan: <strong>{work.scan.mode === "flash" ? "Flash" : "Full"}</strong> —{" "}
              <span className="sev sev-low">clean</span>
              {work.scan.completedAt ? (
                <span className="scan-done-time"> · {formatUtcTraining(work.scan.completedAt)}</span>
              ) : null}
            </div>
          ) : null}

          <div className="analyst-comments-panel">
            <h4 className="analyst-comments-title">Analyst comments</h4>
            {work.comments.length === 0 ? (
              <p className="dash-muted" style={{ margin: "0 0 10px", fontSize: 12 }}>
                Add notes for your class (e.g. “Scan clean, resolving the incident…”).
              </p>
            ) : (
              <ul className="analyst-comment-list analyst-comment-list-inline">
                {work.comments.map((c) => (
                  <li key={c.id}>
                    <span className="analyst-comment-meta">
                      {c.author} · {formatUtcTraining(c.at)}
                    </span>
                    <div>{c.text}</div>
                  </li>
                ))}
              </ul>
            )}
            <form className="analyst-comment-form" onSubmit={submitComment}>
              <textarea
                className="analyst-comment-input"
                rows={2}
                placeholder="e.g. Scan clean, resolving the incident…"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                aria-label="Analyst comment"
              />
              <button type="submit" className="btn btn-primary" disabled={!commentDraft.trim()}>
                Add comment
              </button>
            </form>
          </div>

          <div className="link-row">
            <button type="button" className="btn btn-scan" onClick={() => setScanPickerOpen(true)}>
              Scan
            </button>
            <button type="button" className="link-btn" onClick={onOpenEvents}>
              Events
            </button>
            <button type="button" className="link-btn" onClick={onOpenTrajectory}>
              Device Trajectory
            </button>
            <button type="button" className="link-btn" onClick={onOpenDiagnostics}>
              Diagnostics
            </button>
          </div>
        </div>
      ) : null}
    </div>

    <Modal open={keyboardOpen} title="Keyboard / peripheral events (simulated)" onClose={() => setKeyboardOpen(false)}>
      <p>
        No USB mass-storage or suspicious keyboard HID events in the last 24h for this host (fabricated for the lab).
      </p>
      <p className="dash-muted">
        In class, contrast with <strong>Device Trajectory</strong> and raw Events when teaching insider / physical access
        scenarios.
      </p>
      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={() => setKeyboardOpen(false)}>
          Close
        </button>
      </div>
    </Modal>

    <Modal open={chartsOpen} title="Risk & prevalence charts (simulated)" onClose={() => setChartsOpen(false)} wide>
      <p>
        <strong>Host:</strong> {incident.hostLine} · <strong>Risk score:</strong> {incident.host.riskScore}
      </p>
      <ul className="dash-list">
        <li>7-day process prevalence vs. org baseline — <span className="sev sev-high">above average</span></li>
        <li>Network egress to rare ASNs — 2 flows (see Events for IPs)</li>
        <li>Policy posture — exploit prevention: blocking</li>
      </ul>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={() => setChartsOpen(false)}>
          Close
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setChartsOpen(false);
            onOpenEvents();
          }}
        >
          Open Events
        </button>
      </div>
    </Modal>

    <Modal open={scanPickerOpen} title="Start endpoint scan" onClose={() => setScanPickerOpen(false)}>
      <p className="dash-muted" style={{ marginTop: 0 }}>
        Choose a scan type. <strong>Full scan</strong> runs a longer simulated job; <strong>Flash scan</strong> finishes
        quickly. Both are training-only.
      </p>
      <div className="scan-choice-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            startScan(incident.id, "full");
            setScanPickerOpen(false);
          }}
        >
          Full Scan
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            startScan(incident.id, "flash");
            setScanPickerOpen(false);
          }}
        >
          Flash Scan
        </button>
      </div>
      <p className="dash-muted" style={{ fontSize: 11, marginBottom: 0 }}>
        After a Full scan completes, open <strong>Events</strong> to see “clean scan” log lines. Then add your comment
        and use <strong>Mark Resolved</strong> when ready.
      </p>
    </Modal>
    </>
  );
}
