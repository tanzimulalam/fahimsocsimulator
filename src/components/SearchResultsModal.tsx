import { Link } from "react-router-dom";
import { Modal } from "./Modal";
import type { Incident } from "../types";
import { talosReputationUrl, virusTotalFileUrl, virusTotalIpUrl } from "../lib/threatIntelLinks";

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

export function SearchResultsModal({ open, query, incidents, onClose }: Props) {
  const q = query.trim().toLowerCase();
  const incHits = q
    ? incidents.filter(
        (i) =>
          i.hostLine.toLowerCase().includes(q) ||
          i.groupName.toLowerCase().includes(q) ||
          i.host.hostname.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      )
    : [];

  const hashLike = /^[a-f0-9]{8,64}$/i.test(q.replace(/\s/g, ""));
  const ipLike = /^\d{1,3}(\.\d{1,3}){3}$/.test(q.trim());

  return (
    <Modal open={open} title={`Search results${q ? ` — “${query.trim()}”` : ""}`} onClose={onClose} wide>
      {!q ? (
        <p className="dash-muted">Type a hostname, group, incident id, IP, or partial SHA-256, then press Enter or click Search.</p>
      ) : null}

      {q ? (
        <>
          <section className="search-sec">
            <h4 className="search-sec-title">Incidents & hosts ({incHits.length})</h4>
            {incHits.length === 0 ? (
              <p className="dash-muted">No inbox incidents match. Try another keyword or open Events / XDR.</p>
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

          {hashLike ? (
            <section className="search-sec">
              <h4 className="search-sec-title">Hash pivot (public)</h4>
              <p className="dash-muted" style={{ marginTop: 0 }}>
                Treating input as a file hash. Use these pivots in class (not a verdict by itself).
              </p>
              <div className="dash-links">
                <a href={virusTotalFileUrl(q)} target="_blank" rel="noreferrer">
                  VirusTotal file
                </a>
                <a href={talosReputationUrl(q)} target="_blank" rel="noreferrer">
                  Talos reputation
                </a>
                <Link to="/xdr/investigate" onClick={onClose}>
                  Open XDR Investigate
                </Link>
              </div>
            </section>
          ) : null}

          {ipLike ? (
            <section className="search-sec">
              <h4 className="search-sec-title">IP pivot (public)</h4>
              <div className="dash-links">
                <a href={virusTotalIpUrl(q.trim())} target="_blank" rel="noreferrer">
                  VirusTotal IP
                </a>
                <a href={talosReputationUrl(q.trim())} target="_blank" rel="noreferrer">
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
