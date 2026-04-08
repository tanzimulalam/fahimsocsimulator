import { useMemo } from "react";
import { Modal } from "./Modal";
import { csvEscape, downloadText } from "../lib/fakeExport";
import type { CompromiseEvent, Incident, Severity } from "../types";
import { talosReputationUrl, virusTotalFileUrl, virusTotalIpUrl } from "../lib/threatIntelLinks";
import { useSimulator } from "../context/SimulatorContext";
import { buildScanLogEvents, mergeEventsForDisplay } from "../lib/scanEvents";
import { formatUtcTraining } from "../lib/formatUtc";

function sevRowClass(s: Severity): string {
  if (s === "low") return "sev-low";
  if (s === "medium") return "sev-medium";
  if (s === "high") return "sev-high";
  return "sev-critical";
}

function fullSha(ev: CompromiseEvent): string {
  if (ev.sha256Full) return ev.sha256Full;
  return `${ev.sha256Prefix}${"0".repeat(48)}${ev.sha256Suffix}`.slice(0, 64);
}

type Props = {
  incident: Incident | null;
  open: boolean;
  onClose: () => void;
};

export function IncidentEventsModal({ incident, open, onClose }: Props) {
  const { getIncidentWork, addNotification } = useSimulator();
  const work = incident ? getIncidentWork(incident.id) : null;

  const mergedEvents = useMemo(() => {
    if (!incident || !work) return [];
    const scanRows = buildScanLogEvents(work, incident.host);
    return mergeEventsForDisplay(incident.events, scanRows);
  }, [incident, work]);

  if (!open || !incident) return null;

  const h = incident.host;

  return (
    <Modal open={open} title={`Events — ${incident.hostLine}`} onClose={onClose} xwide>
      <div className="events-modal-intro">
        <p>
          <strong>Connector:</strong> {h.connectorVersion} · <strong>Policy:</strong> {h.policy} ·{" "}
          <strong>Last seen:</strong> {h.lastSeenUtc}
        </p>
        <p>
          <strong>Host internal IP:</strong> <code>{h.internalIp}</code> · <strong>External:</strong>{" "}
          <code>{h.externalIp}</code>
        </p>
        <p className="events-modal-hint">
          Detection events and <strong>scan activity</strong> are merged below (newest first). Talos / VT apply to
          file hashes and IPs — scan-only rows have no hash intel.
        </p>
      </div>

      <div className="table-wrap events-modal-table-wrap">
        <table className="data-table events-detail-table">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Severity</th>
              <th>Event</th>
              <th>User</th>
              <th>Local IP</th>
              <th>Remote IP:Port</th>
              <th>Dir</th>
              <th>Process</th>
              <th>File / path</th>
              <th>SHA-256</th>
              <th>Intel</th>
            </tr>
          </thead>
          <tbody>
            {mergedEvents.map((ev) => (
              <EventRow key={ev.id} ev={ev} hostInternal={h.internalIp} hostExternal={h.externalIp} />
            ))}
          </tbody>
        </table>
      </div>

      {work && work.comments.length > 0 ? (
        <div className="events-modal-comments">
          <h4 className="events-modal-comments-title">Analyst notes (same as incident panel)</h4>
          <ul className="analyst-comment-list">
            {work.comments.map((c) => (
              <li key={c.id}>
                <span className="analyst-comment-meta">
                  {c.author} · {formatUtcTraining(c.at)}
                </span>
                <div>{c.text}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="events-modal-footer-actions">
        <button
          type="button"
          className="btn"
          onClick={() => {
            const header = ["timeUtc", "severity", "eventType", "sha256"];
            const lines = mergedEvents.map((ev) => {
              const sha = fullSha(ev);
              return [ev.timestampUtc, ev.severity, ev.eventType, sha].map(csvEscape).join(",");
            });
            downloadText(
              `events-${incident.id}-${Date.now()}.csv`,
              [header.join(","), ...lines].join("\n"),
              "text/csv;charset=utf-8"
            );
            addNotification("Export", "Events table exported (CSV) — includes scan lines if present.");
          }}
        >
          Export table (CSV)
        </button>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

function EventRow({
  ev,
  hostInternal,
  hostExternal,
}: {
  ev: CompromiseEvent;
  hostInternal: string;
  hostExternal: string;
}) {
  const sha = fullSha(ev);
  const local = ev.localIp ?? hostInternal;
  const remote = ev.remoteIp ?? "—";
  const port = ev.remotePort ?? "—";
  const remoteCell = remote === "—" ? "—" : `${remote}:${port}`;
  const user = ev.user ?? "CORP\\student";
  const proc = ev.processPath ?? "—";
  const path = ev.filePath ?? (ev.filename ? `C:\\Users\\…\\${ev.filename}` : "—");
  const isScanOnly = ev.id.startsWith("scan-sim");

  return (
    <tr className={isScanOnly ? "scan-log-row" : undefined}>
      <td className="mono">{ev.timestampUtc}</td>
      <td>
        <span className={"sev " + sevRowClass(ev.severity)}>{ev.severity}</span>
      </td>
      <td>{ev.eventType}</td>
      <td className="mono small">{user}</td>
      <td className="mono small">{local}</td>
      <td className="mono small">{remoteCell}</td>
      <td>{ev.direction ?? "local"}</td>
      <td className="mono small" title={proc}>
        {proc.length > 36 ? proc.slice(0, 34) + "…" : proc}
      </td>
      <td className="mono small" title={path}>
        {path.length > 40 ? path.slice(0, 38) + "…" : path}
      </td>
      <td className="mono tiny" title={isScanOnly ? "N/A for scan log" : sha}>
        {isScanOnly ? "—" : `${sha.slice(0, 16)}…${sha.slice(-12)}`}
      </td>
      <td className="intel-cell">
        {isScanOnly ? (
          <span className="dash-muted">—</span>
        ) : (
          <>
            <a href={virusTotalFileUrl(sha)} target="_blank" rel="noreferrer">
              VT
            </a>
            <a href={talosReputationUrl(sha)} target="_blank" rel="noreferrer">
              Talos
            </a>
            {ev.remoteIp && ev.remoteIp !== "—" ? (
              <>
                <a href={virusTotalIpUrl(ev.remoteIp)} target="_blank" rel="noreferrer" title="VirusTotal IP">
                  VT IP
                </a>
                <a href={talosReputationUrl(ev.remoteIp)} target="_blank" rel="noreferrer" title="Talos IP">
                  Talos IP
                </a>
              </>
            ) : (
              <>
                <a href={virusTotalIpUrl(hostExternal)} target="_blank" rel="noreferrer" title="Host external IP (VT)">
                  VT ext
                </a>
                <a href={talosReputationUrl(hostExternal)} target="_blank" rel="noreferrer" title="Host external IP (Talos)">
                  Talos ext
                </a>
              </>
            )}
          </>
        )}
      </td>
    </tr>
  );
}
