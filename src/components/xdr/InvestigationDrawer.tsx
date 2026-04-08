import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { InvestigationNode, NodeSeverity } from "../../data/xdrInvestigation";
import type { IncidentXdrSir } from "../../types";
import { talosReputationUrl, virusTotalFileUrl } from "../../lib/threatIntelLinks";
import { useSimulator } from "../../context/SimulatorContext";
import { Modal } from "../Modal";

function verdictFor(sev: NodeSeverity): { label: string; sevClass: string } {
  if (sev === "malicious") return { label: "Malicious", sevClass: "sev-high" };
  if (sev === "suspicious") return { label: "Suspicious", sevClass: "sev-medium" };
  if (sev === "unknown") return { label: "Unknown", sevClass: "sev-medium" };
  if (sev === "common") return { label: "Common / low risk", sevClass: "sev-low" };
  return { label: "Clean", sevClass: "sev-low" };
}

type Props = {
  node: InvestigationNode | null;
  incidentId: string | null;
  sirLabel: string;
  xdrSir: IncidentXdrSir | null;
  onClose: () => void;
};

export function InvestigationDrawer({ node, incidentId, sirLabel, xdrSir, onClose }: Props) {
  const { addNotification } = useSimulator();
  const navigate = useNavigate();
  const [respOpen, setRespOpen] = useState(false);
  const [respSource, setRespSource] = useState("");

  if (!node) {
    return (
      <aside className="xdr-drawer xdr-drawer-empty">
        <p className="dash-muted">
          Select a process node in the graph, or paste a full SHA-256 from AMP into the lookup field above and press Enter
          to load that incident’s SIR.
        </p>
        <button type="button" className="btn" onClick={onClose}>
          Close panel
        </button>
      </aside>
    );
  }

  const vt = virusTotalFileUrl(node.sha256);
  const talos = talosReputationUrl(node.sha256);
  const v = verdictFor(node.severity);
  const currentNode = node;

  function openResponse(source: string) {
    setRespSource(source);
    setRespOpen(true);
  }

  function doResponse(action: "block_sha" | "isolate_host" | "block_ip") {
    if (action === "block_sha") addNotification("Response Action", `SHA256 blocked from ${respSource}: ${currentNode.sha256.slice(0, 16)}...`);
    if (action === "isolate_host") addNotification("Response Action", `Host isolation queued from ${respSource} for this malicious observable.`);
    if (action === "block_ip") addNotification("Response Action", `Related malicious IP blocked from ${respSource}.`);
    setRespOpen(false);
  }

  return (
    <aside className="xdr-drawer">
      <div className="xdr-drawer-head">
        <span className={"xdr-drawer-icon xdr-drawer-icon--" + node.severity} aria-hidden />
        <div>
          <div className="xdr-drawer-title">{node.label}</div>
          <code className="xdr-drawer-hash">{node.shaDisplay}</code>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close drawer">
          ×
        </button>
      </div>

      <div className="xdr-drawer-body">
        <p className="xdr-drawer-summary">
          <strong>Telemetry slice (simulated)</strong>
          <br />
          <span className="dash-muted">
            {xdrSir
              ? `SIR window ${xdrSir.firstSeenUtc} — ${xdrSir.lastObservedUtc}`
              : "Observed: (link an AMP incident)"}
          </span>
        </p>
        <button
          type="button"
          className="link-btn xdr-drawer-add"
          onClick={() => addNotification("Investigation", "Observable added to investigation (simulated).")}
        >
          + Add observable to investigation
        </button>

        <section className="xdr-drawer-section">
          <h4>Verdicts</h4>
          <div className="xdr-verdict-row">
            <span className="xdr-verdict-badge">1</span>
            <span className={"sev " + v.sevClass}>{v.label}</span>
            <span className="dash-muted"> · AMP File Reputation · node: {node.severity}</span>
          </div>
          {xdrSir ? (
            <p className="dash-muted" style={{ fontSize: 11, marginTop: 8 }}>
              Case linkage: <strong>{xdrSir.sirId}</strong> — {xdrSir.maliciousIpv4.length} IPs and{" "}
              {xdrSir.maliciousDomains.length} domains in MS-ISAC bundle for this incident.
            </p>
          ) : null}
        </section>

        <details className="xdr-accordion" open>
          <summary>Secure Endpoint — Data Group</summary>
          <ul className="xdr-action-list">
            <li>
              <a href={vt} target="_blank" rel="noreferrer">
                Search for this SHA256 ↗
              </a>
            </li>
            <li>
              <button
                type="button"
                className="link-btn"
                title="Add SHA256 to simple custom detections list DEFCON to detect and quarantine"
                onClick={() => openResponse("DEFCON")}
              >
                Add SHA256 to custom detections DEFCON
              </button>
            </li>
            <li>
              <button
                type="button"
                className="link-btn"
                onClick={() => openResponse("Email Security Blocklist")}
              >
                Add SHA256 to custom detections Email Security Blocklist
              </button>
            </li>
            <li>
              <button
                type="button"
                className="link-btn"
                onClick={() => openResponse("Quick SCD")}
              >
                Add SHA256 to custom detections Quick SCD
              </button>
            </li>
          </ul>
        </details>

        <details className="xdr-accordion">
          <summary>Secure Malware Analytics</summary>
          <ul className="xdr-action-list">
            <li>
              <a href={talos} target="_blank" rel="noreferrer">
                Browse {node.sha256.slice(0, 24)}… ↗
              </a>
            </li>
            <li>
              <a href={vt} target="_blank" rel="noreferrer">
                Search {node.sha256.slice(0, 24)}… ↗
              </a>
            </li>
          </ul>
        </details>

        <details className="xdr-accordion">
          <summary>SecureX Orchestrator</summary>
          <ul className="xdr-action-list">
            <li>
              <button
                type="button"
                className="link-btn"
                onClick={() => addNotification("Threat Grid", "Submit URL to Threat Grid (simulated workflow).")}
              >
                Submit URL to Threat Grid
              </button>
            </li>
          </ul>
        </details>

        <p className="xdr-drawer-foot-hint dash-muted">
          Investigation: <strong>{sirLabel}</strong>
          {incidentId ? (
            <>
              {" "}
              · Linked AMP incident <code>{incidentId}</code>
            </>
          ) : null}
        </p>

        <div className="xdr-drawer-actions">
          <button
            type="button"
            className="btn btn-primary xdr-view-events"
            onClick={() => {
              const q = incidentId ? `?incident=${encodeURIComponent(incidentId)}` : "";
              navigate(`/inbox${q}`);
              addNotification("AMP", "Opening Secure Endpoint Inbox — continue triage there.");
            }}
          >
            View events
          </button>
        </div>
      </div>
      <Modal open={respOpen} title={`Response Options — ${respSource}`} onClose={() => setRespOpen(false)}>
        <p>Select remediation action for this malicious indicator.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => doResponse("block_sha")}>Block SHA256</button>
          <button type="button" className="btn" onClick={() => doResponse("isolate_host")}>Isolate Host</button>
          <button type="button" className="btn" onClick={() => doResponse("block_ip")}>Block Related IP</button>
        </div>
      </Modal>
    </aside>
  );
}
