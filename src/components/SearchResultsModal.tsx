import { Link } from "react-router-dom";
import { Modal } from "./Modal";
import type { Incident } from "../types";
import { talosReputationUrl, virusTotalFileUrl, virusTotalIpUrl } from "../lib/threatIntelLinks";
import { lookupTrainingIocs } from "../lib/iocLookup";

type Props = {
  open: boolean;
  query: string;
  incidents: Incident[];
  onClose: () => void;
};

const FAKE_INTEL = [
  { label: "MS-ISAC feed", detail: "SIR0017192 — Malicious IPs/Domains (correlated in XDR Investigate)" },
  { label: "Internal TI: blocklist", detail: "3 overlapping SHA-256 entries (training overlap exercise)" },
  { label: "Email Security", detail: "2 messages held — same attachment hash as endpoint alert" },
];

function verdictClass(v: string): string {
  if (v === "Malicious") return "ioc-verdict ioc-mal";
  if (v === "Suspicious" || v === "Unknown") return "ioc-verdict ioc-sus";
  return "ioc-verdict ioc-clean";
}

export function SearchResultsModal({ open, query, incidents, onClose }: Props) {
  const q = query.trim().toLowerCase();
  const incHits = q
    ? incidents.filter(
        (i) =>
          i.hostLine.toLowerCase().includes(q) ||
          i.groupName.toLowerCase().includes(q) ||
          i.host.hostname.toLowerCase().includes(q) ||
          i.host.internalIp.includes(q) ||
          i.host.externalIp.includes(q) ||
          i.id.toLowerCase().includes(q)
      )
    : [];

  const { shaHits, ipHits, ambiguousSha } = lookupTrainingIocs(query, incidents);

  const hashLike = /^[a-f0-9]{8,64}$/i.test(query.trim().replace(/\s/g, ""));
  const ipLike = /^\d{1,3}(\.\d{1,3}){3}$/.test(query.trim());

  return (
    <Modal open={open} title={`Search results${q ? ` — “${query.trim()}”` : ""}`} onClose={onClose} wide>
      {!q ? (
        <p className="dash-muted">Type a hostname, group, incident id, IP, or partial SHA-256, then press Enter or click Search.</p>
      ) : null}

      {q ? (
        <>
          {(shaHits.length > 0 || ipHits.length > 0) && (
            <section className="search-sec">
              <h4 className="search-sec-title">AMP file & IP reputation (simulated lab)</h4>
              {ambiguousSha ? (
                <p className="dash-muted" style={{ marginTop: 0 }}>
                  Short hash — multiple endpoints could match. Refine to 32+ hex chars or open a hit below.
                </p>
              ) : (
                <p className="dash-muted" style={{ marginTop: 0 }}>
                  Verdicts are <strong>fictional training labels</strong> tied to your current incident dataset — not live Cisco or VirusTotal
                  results.
                </p>
              )}
              {shaHits.length > 0 ? (
                <ul className="ioc-hit-list">
                  {shaHits.map((h) => (
                    <li key={`${h.incidentId}-${h.sha256}-${h.timestampUtc}`} className="ioc-hit-card">
                      <div className="ioc-hit-head">
                        <span className={verdictClass(h.verdict)}>{h.verdict}</span>
                        <span className="ioc-hit-amp">AMP: {h.ampDisposition}</span>
                      </div>
                      <div className="mono tiny">{h.sha256}</div>
                      <div className="ioc-hit-meta">
                        <strong>{h.hostLine}</strong> · <code>{h.hostname}</code> · {h.eventType}
                        {h.filename ? <> · {h.filename}</> : null}
                        {h.threatLabel ? <> · {h.threatLabel}</> : null}
                      </div>
                      <div className="dash-muted tiny">VirusTotal (sim): {h.virusTotalSimulated}</div>
                      <div className="ioc-hit-actions">
                        <Link to={`/inbox?incident=${encodeURIComponent(h.incidentId)}`} onClick={onClose}>
                          Open in Inbox
                        </Link>
                        <Link to={`/xdr/incidents?incident=${encodeURIComponent(h.incidentId)}`} onClick={onClose}>
                          XDR incident
                        </Link>
                        <Link to={`/xdr/investigate?incident=${encodeURIComponent(h.incidentId)}&sha=${encodeURIComponent(h.sha256)}`} onClick={onClose}>
                          Investigate hash
                        </Link>
                        <a href={virusTotalFileUrl(h.sha256)} target="_blank" rel="noreferrer">
                          VirusTotal file
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {ipHits.length > 0 ? (
                <ul className="ioc-hit-list" style={{ marginTop: shaHits.length ? 12 : 0 }}>
                  {ipHits.map((h, idx) => (
                    <li key={`${h.incidentId}-${h.ip}-${h.role}-${idx}`} className="ioc-hit-card">
                      <div className="ioc-hit-head">
                        <span className={verdictClass(h.verdict)}>{h.verdict}</span>
                        <span className="ioc-hit-amp">{h.role}</span>
                      </div>
                      <div className="mono">{h.ip}</div>
                      <div className="ioc-hit-meta">
                        <strong>{h.hostLine}</strong> · <code>{h.hostname}</code>
                      </div>
                      <div className="dash-muted tiny">{h.context}</div>
                      <div className="dash-muted tiny">VirusTotal (sim): {h.virusTotalSimulated}</div>
                      <div className="ioc-hit-actions">
                        <Link to={`/inbox?incident=${encodeURIComponent(h.incidentId)}`} onClick={onClose}>
                          Open in Inbox
                        </Link>
                        <Link to={`/xdr/incidents?incident=${encodeURIComponent(h.incidentId)}`} onClick={onClose}>
                          XDR incident
                        </Link>
                        <a href={virusTotalIpUrl(h.ip)} target="_blank" rel="noreferrer">
                          VirusTotal IP
                        </a>
                        <a href={talosReputationUrl(h.ip)} target="_blank" rel="noreferrer">
                          Talos IP
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {shaHits.length === 0 && ipHits.length === 0 && (hashLike || ipLike) ? (
                <p className="dash-muted">No lab incidents reference this IOC yet — use public pivots below or try a hostname from Inbox.</p>
              ) : null}
            </section>
          )}

          <section className="search-sec">
            <h4 className="search-sec-title">Incidents & hosts ({incHits.length})</h4>
            {incHits.length === 0 ? (
              <p className="dash-muted">No inbox rows match this keyword (IOC panel above may still have hits).</p>
            ) : (
              <ul className="search-hit-list">
                {incHits.map((i) => (
                  <li key={i.id}>
                    <Link to={`/inbox?incident=${encodeURIComponent(i.id)}`} onClick={onClose}>
                      <strong>{i.hostLine}</strong>
                    </Link>
                    <span className="dash-muted">
                      {" "}
                      · {i.status} · {i.groupName} · {i.eventCount} events
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {hashLike && shaHits.length === 0 ? (
            <section className="search-sec">
              <h4 className="search-sec-title">Hash pivot (public)</h4>
              <p className="dash-muted" style={{ marginTop: 0 }}>
                No simulator match — still pivot externally (class-safe).
              </p>
              <div className="dash-links">
                <a href={virusTotalFileUrl(query.trim().replace(/\s/g, ""))} target="_blank" rel="noreferrer">
                  VirusTotal file
                </a>
                <a href={talosReputationUrl(query.trim().replace(/\s/g, ""))} target="_blank" rel="noreferrer">
                  Talos reputation
                </a>
                <Link to="/xdr/investigate" onClick={onClose}>
                  Open XDR Investigate
                </Link>
              </div>
            </section>
          ) : null}

          {ipLike && ipHits.length === 0 ? (
            <section className="search-sec">
              <h4 className="search-sec-title">IP pivot (public)</h4>
              <div className="dash-links">
                <a href={virusTotalIpUrl(query.trim())} target="_blank" rel="noreferrer">
                  VirusTotal IP
                </a>
                <a href={talosReputationUrl(query.trim())} target="_blank" rel="noreferrer">
                  Talos IP
                </a>
              </div>
            </section>
          ) : null}

          <section className="search-sec">
            <h4 className="search-sec-title">Correlated intelligence (simulated)</h4>
            <ul className="dash-list">
              {FAKE_INTEL.map((f) => (
                <li key={f.label}>
                  <strong>{f.label}</strong> — {f.detail}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
