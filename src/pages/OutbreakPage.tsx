import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConsolePage } from "../components/ConsolePage";
import { Modal } from "../components/Modal";
import { useSimulator } from "../context/SimulatorContext";
import { downloadText } from "../lib/fakeExport";
import {
  allowEntry,
  getBlockedEntries,
  type AmpBlocklistEntry,
} from "../data/ampBlocklist";

const RULES = [
  {
    id: "OR-2024-AMP-01",
    title: "SHA-256 blocklist (lab IOC set A)",
    detail: "42 hashes; last editor FahimTanzimul; auto-expire 2026-12-31 (simulated).",
  },
  {
    id: "OR-2024-AMP-02",
    title: "Suspicious parent → child (Excel → PowerShell)",
    detail: "Parent process tree depth ≤ 2; alert on signed binaries spawning unsigned PowerShell.",
  },
  {
    id: "OR-2024-AMP-03",
    title: "DMZ webshell watchlist",
    detail: "Correlates with IIS paths + POST anomalies; opens XDR incident on 3+ signals.",
  },
];

export function OutbreakPage() {
  const { addNotification, logResponseAction } = useSimulator();
  const [rule, setRule] = useState<(typeof RULES)[0] | null>(null);
  const [containOpen, setContainOpen] = useState(false);
  const [blocklist, setBlocklist] = useState<AmpBlocklistEntry[]>(() => getBlockedEntries());
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const refreshBlocklist = useCallback(() => {
    setBlocklist(getBlockedEntries());
  }, []);

  useEffect(() => {
    refreshBlocklist();
    const onUpdate = () => refreshBlocklist();
    window.addEventListener("amp-blocklist-updated", onUpdate);
    window.addEventListener("lab-state-reset", onUpdate);
    return () => {
      window.removeEventListener("amp-blocklist-updated", onUpdate);
      window.removeEventListener("lab-state-reset", onUpdate);
    };
  }, [refreshBlocklist]);

  useEffect(() => {
    if (window.location.hash === "#blocklist") {
      document.getElementById("amp-blocklist")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [blocklist.length]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return blocklist.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!q) return true;
      return (
        e.value.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        (e.ticketNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [blocklist, filter, typeFilter]);

  function downloadIoc() {
    const body = RULES.map((r) => `${r.id}\t${r.title}\t${r.detail}`).join("\n");
    downloadText(`ioc-package-${Date.now()}.txt`, "id\ttitle\tdetail\n" + body, "text/plain;charset=utf-8");
    addNotification("IOC", "IOC package downloaded — teaching content only.");
  }

  function exportBlocklist() {
    const header = "type,value,source,blockedAt,ticketNumber";
    const lines = filtered.map((e) =>
      [e.type, e.value, e.source, e.blockedAt, e.ticketNumber ?? ""].join("\t")
    );
    downloadText(`amp-blocklist-${Date.now()}.txt`, header + "\n" + lines.join("\n"), "text/plain;charset=utf-8");
    addNotification("Export", `Exported ${filtered.length} block list entries.`);
  }

  function handleAllow(entry: AmpBlocklistEntry) {
    allowEntry(entry.value, entry.type);
    logResponseAction({
      incidentId: entry.ticketNumber ?? "—",
      hostLine: entry.value,
      source: "Cisco Secure Endpoint",
      action: "block_url",
      actor: "SOC Analyst",
      tool: "Cisco Secure Endpoint",
      label: `Allowed ${entry.type}`,
      target: entry.value,
    });
    addNotification("Allow list", `${entry.value} removed from active block list (simulated).`);
    refreshBlocklist();
  }

  return (
    <ConsolePage
      title="Outbreak Control"
      subtitle="Containment, IOC packages, and the live block list synced with ServiceNow tickets."
    >
      <div className="console-toolbar">
        <button type="button" className="btn btn-primary" onClick={downloadIoc}>
          Download IOC package (TXT)
        </button>
        <Link to="/xdr/investigate" className="btn">
          XDR Investigate
        </Link>
        <Link to="/servicenow/incidents/INC0162850" className="btn">
          ServiceNow — hubspot.com ticket
        </Link>
      </div>

      <div className="panel" id="amp-blocklist" style={{ marginBottom: 16 }}>
        <div className="panel-h">
          Live block list — domains, URLs, IPs, and hashes ({blocklist.length} blocked)
        </div>
        <p className="dash-muted" style={{ padding: "0 12px 8px" }}>
          Entries here reflect MS-ISAC IOC ingest and ServiceNow resolutions. Search for{" "}
          <code>hubspot.com</code> to verify the marketing false-positive lab ticket INC0162850.
        </p>
        <div className="amp-blocklist-filters" style={{ padding: "0 12px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="search-input"
            placeholder="Search block list (e.g. hubspot.com)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <select className="search-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="domain">Domains</option>
            <option value="url">URLs</option>
            <option value="ip">IPs</option>
            <option value="hash">Hashes</option>
          </select>
          <button type="button" className="btn" onClick={exportBlocklist}>
            Export visible
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Indicator</th>
                <th>Source</th>
                <th>ServiceNow</th>
                <th>Blocked at</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((e) => (
                <tr key={e.id} className={e.value === "hubspot.com" ? "amp-blocklist-highlight" : undefined}>
                  <td>{e.type}</td>
                  <td>
                    <code>{e.type === "hash" ? `${e.value.slice(0, 16)}…` : e.value}</code>
                  </td>
                  <td>{e.source}</td>
                  <td>
                    {e.ticketNumber ? (
                      <Link to={`/servicenow/incidents/${e.ticketNumber}`}>{e.ticketNumber}</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{e.blockedAt}</td>
                  <td>
                    <button type="button" className="link-btn" onClick={() => handleAllow(e)}>
                      Allow
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#888" }}>
                    No blocked entries match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <p className="dash-muted" style={{ padding: 12 }}>
            Showing first 50 of {filtered.length} entries. Narrow your search to find specific IOCs.
          </p>
        )}
      </div>

      <div className="outbreak-grid">
        <div className="panel">
          <div className="panel-h">Active outbreak rules — click a rule</div>
          <ul className="dash-list">
            {RULES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="link-btn"
                  style={{ textAlign: "left", padding: 0 }}
                  onClick={() => setRule(r)}
                >
                  <strong>{r.id}</strong> — {r.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="panel-h">Isolation (simulated)</div>
          <p className="dash-muted" style={{ padding: "0 12px" }}>
            In production, isolation limits lateral movement. Here, you confirm intent and we show a toast only.
          </p>
          <div style={{ padding: 12 }}>
            <button type="button" className="btn btn-primary" onClick={() => setContainOpen(true)}>
              Apply network containment…
            </button>
          </div>
        </div>
      </div>

      <Modal open={!!rule} title={rule?.id ?? "Rule"} onClose={() => setRule(null)} wide>
        {rule ? (
          <>
            <p>
              <strong>{rule.title}</strong>
            </p>
            <p>{rule.detail}</p>
            <div className="dash-links">
              <button type="button" className="link-btn" onClick={() => addNotification("Edit", "Rule editor would open (simulated).")}>
                Edit rule
              </button>
              <button type="button" className="link-btn" onClick={() => addNotification("Version", "Revision v3 published (simulated).")}>
                View revision history
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setRule(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal open={containOpen} title="Confirm containment" onClose={() => setContainOpen(false)}>
        <p>
          This will <strong>simulate</strong> blocking all outbound traffic except AMP cloud and your jump box for
          affected hosts. No real network changes occur.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              addNotification("Containment", "Network containment applied to selected scope (simulated). SOC war-room mode: enabled.");
              setContainOpen(false);
            }}
          >
            Confirm containment
          </button>
          <button type="button" className="btn" onClick={() => setContainOpen(false)}>
            Cancel
          </button>
        </div>
      </Modal>
    </ConsolePage>
  );
}
