import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/Modal";
import { useSimulator } from "../../context/SimulatorContext";
import { BASE_PHISHING_EMAILS, type MailRecord } from "../../data/defenderEmailLab";
import {
  loadDefenderInvestigations,
  saveDefenderInvestigations,
  shortId,
  type DefenderInvestigation,
} from "../../data/defenderInvestigations";

type PivotKey =
  | "senderDomain"
  | "senderIp"
  | "deliveryAction"
  | "detectionTechnology"
  | "fullUrl"
  | "urlDomain"
  | "urlDomainPath";

const EMAIL_STATE_KEY = "defenderEmailLabState";
const BLOCKED_DOMAINS_KEY = "defenderBlockedDomainsV1";

function senderDomain(sender: string): string {
  return (sender.split("@")[1] ?? "").toLowerCase();
}

function loadBlockedDomains(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKED_DOMAINS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function DefenderEmailExplorerPage() {
  const { addNotification, incidents } = useSimulator();
  const navigate = useNavigate();
  const [view, setView] = useState("all");
  const [pivot, setPivot] = useState<PivotKey>("deliveryAction");
  const [summaryTab, setSummaryTab] = useState("Email");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-04-30");
  const [blockedDomains, setBlockedDomains] = useState<string[]>(() => loadBlockedDomains());

  const [mails, setMails] = useState<MailRecord[]>(() => {
    const raw = localStorage.getItem(EMAIL_STATE_KEY);
    const base = (() => {
      if (!raw) return BASE_PHISHING_EMAILS;
      try {
        const parsed = JSON.parse(raw) as MailRecord[];
        return Array.isArray(parsed) && parsed.length ? parsed : BASE_PHISHING_EMAILS;
      } catch {
        return BASE_PHISHING_EMAILS;
      }
    })();
    const blocked = loadBlockedDomains();
    if (blocked.length === 0) return base;
    return base.map((m) =>
      blocked.includes(senderDomain(m.sender))
        ? { ...m, deliveryAction: "Blocked", location: "Quarantine" as const }
        : m
    );
  });
  const [activeMailId, setActiveMailId] = useState(BASE_PHISHING_EMAILS[0]?.id ?? "");

  const activeMail = useMemo(() => mails.find((m) => m.id === activeMailId) ?? null, [mails, activeMailId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mails.filter((m) => {
      const inDate = m.date >= dateFrom && m.date <= dateTo;
      if (!inDate) return false;
      if (view === "malware" && m.threat !== "Malware") return false;
      if (view === "phish" && m.threat !== "Phish") return false;
      if (view === "benign" && m.threat !== "Clean" && m.threat !== "Spam") return false;
      if (!q) return true;
      return (
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.sender.toLowerCase().includes(q) ||
        m.recipient.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.suspiciousUrl.toLowerCase().includes(q) ||
        m.date.includes(q)
      );
    });
  }, [mails, search, dateFrom, dateTo, view]);

  const explorerRows = useMemo(
    () => filtered.filter((m) => m.location !== "Quarantine" && m.location !== "Deleted"),
    [filtered]
  );
  const quarantineRows = useMemo(() => filtered.filter((m) => m.location === "Quarantine"), [filtered]);
  const trashRows = useMemo(() => mails.filter((m) => m.location === "Deleted"), [mails]);
  const totalItems = filtered.length;

  const pivotRows = useMemo(() => {
    const group = new Map<string, number>();
    const toDomain = (addr: string) => addr.split("@")[1] ?? "unknown.local";
    const fakeIp = (id: string) => {
      const n = Number(id.replace("m", "")) || 1;
      return `203.0.113.${10 + ((n * 7) % 120)}`;
    };
    const detectTech = (m: MailRecord) => {
      if (m.threat === "Malware") return "URL detonation";
      if (m.threat === "Clean") return "Safe attachments";
      if (m.threat === "Spam") return "Bulk complaint";
      return m.reason.includes("domain") ? "Anti-phishing" : "EDR behavioral";
    };
    const urlPath = (u: string) => u.replace(/^https?:\/\//, "");
    const pick = (m: MailRecord): string => {
      if (pivot === "senderDomain") return toDomain(m.sender);
      if (pivot === "senderIp") return fakeIp(m.id);
      if (pivot === "deliveryAction") return m.deliveryAction;
      if (pivot === "detectionTechnology") return detectTech(m);
      if (pivot === "fullUrl") return m.suspiciousUrl;
      if (pivot === "urlDomain") return toDomain(m.suspiciousUrl.replace(/^https?:\/\//, "x@"));
      return urlPath(m.suspiciousUrl);
    };
    filtered.forEach((m) => {
      const k = pick(m);
      group.set(k, (group.get(k) ?? 0) + 1);
    });
    return [...group.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [filtered, pivot]);

  useEffect(() => {
    localStorage.setItem(EMAIL_STATE_KEY, JSON.stringify(mails));
  }, [mails]);

  useEffect(() => {
    localStorage.setItem(BLOCKED_DOMAINS_KEY, JSON.stringify(blockedDomains));
  }, [blockedDomains]);

  useEffect(() => {
    function restoreAll() {
      setMails(BASE_PHISHING_EMAILS);
      setBlockedDomains([]);
      localStorage.removeItem(BLOCKED_DOMAINS_KEY);
      setActiveMailId(BASE_PHISHING_EMAILS[0]?.id ?? "");
      addNotification("Class scenario", "All phishing emails restored to baseline.");
    }
    window.addEventListener("defender-email-restore-all", restoreAll);
    return () => window.removeEventListener("defender-email-restore-all", restoreAll);
  }, [addNotification]);

  function openPreview(id: string) {
    setActiveMailId(id);
    setPreviewOpen(true);
  }

  function openTrace(id: string) {
    setActiveMailId(id);
    setTraceOpen(true);
  }

  function markDeleted(id: string) {
    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, location: "Deleted", deliveryAction: "Junked" } : m))
    );
    addNotification("Message action", "Email soft-deleted — removed from Explorer list (simulated Microsoft 365).");
  }

  function moveToJunk(id: string) {
    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, location: "Junk", deliveryAction: "Junked" } : m))
    );
    addNotification("Message action", "Moved to Junk Email folder for the recipient (simulated).");
  }

  function blockSenderForMail(mail: MailRecord) {
    const d = senderDomain(mail.sender);
    if (!d) {
      addNotification("Block sender", "Could not parse sender domain.");
      return;
    }
    setBlockedDomains((prev) => [...new Set([...prev, d])]);
    setMails((prev) =>
      prev.map((m) =>
        senderDomain(m.sender) === d ? { ...m, deliveryAction: "Blocked", location: "Quarantine" as const } : m
      )
    );
    addNotification("Tenant block", `Sender domain blocked: ${d} — future messages will be held (simulated).`);
  }

  function zapZeroHour(id: string) {
    const mail = mails.find((m) => m.id === id);
    if (!mail) return;
    const d = senderDomain(mail.sender);
    setMails((prev) =>
      prev.map((m) =>
        senderDomain(m.sender) === d || m.sender === mail.sender
          ? { ...m, location: "Deleted" as const, deliveryAction: "Blocked" }
          : m
      )
    );
    addNotification("ZAP", `Zero-hour auto purge ran for messages from ${mail.sender} (simulated).`);
  }

  function markReleased(id: string) {
    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, location: "Inbox", deliveryAction: "Delivered" } : m))
    );
    addNotification("Quarantine", "Email released to inbox (simulated).");
  }

  function restoreFromTrash(id: string) {
    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, location: "Quarantine", deliveryAction: "Quarantined" } : m))
    );
    addNotification("Trash", "Email restored to quarantine for class replay.");
  }

  function startInvestigation(id: string) {
    const mail = mails.find((m) => m.id === id);
    if (!mail) return;
    const linked = incidents.find((i) => i.status === "requires_attention" || i.status === "in_progress") ?? incidents[0];
    const inv: DefenderInvestigation = {
      id: shortId("INV"),
      mailId: mail.id,
      subject: mail.subject,
      sender: mail.sender,
      recipient: mail.recipient,
      createdAt: Date.now(),
      status: "Pending actions",
      severity: mail.threat === "Malware" ? "High" : mail.threat === "Phish" ? "Medium" : "Low",
      verdict: mail.threat === "Malware" ? "Malicious" : mail.threat === "Phish" ? "Suspicious" : "Clean",
      graphNodes: [mail.subject, mail.sender, mail.recipient, mail.suspiciousUrl, mail.attachment],
      evidence: [`URL: ${mail.suspiciousUrl}`, `Attachment: ${mail.attachment}`, `Reason: ${mail.reason}`],
      actions: [
        { id: shortId("ACT"), label: "Soft delete message copies", status: "Pending" },
        { id: shortId("ACT"), label: "Quarantine sender domain", status: "Pending" },
        { id: shortId("ACT"), label: "Block malicious URL", status: "Pending" },
      ],
      incidentStatus: "Active",
      classification: "Phishing",
      comment: "Investigation started from Explorer email preview.",
      linkedIncidentId: linked?.id,
      linkedHostLine: linked?.hostLine,
      history: [
        { at: Date.now(), event: "Investigation created from Explorer preview" },
        { at: Date.now(), event: "Automated clustering started (AIR simulated)" },
        { at: Date.now(), event: "Pending actions generated for analyst approval" },
      ],
    };
    const existing = loadDefenderInvestigations();
    saveDefenderInvestigations([inv, ...existing].slice(0, 300));
    addNotification("Investigation created", `${inv.id} opened for ${mail.subject}`);
    setPreviewOpen(false);
    navigate(`/defender/investigations?investigation=${encodeURIComponent(inv.id)}`);
  }

  return (
    <div className="def-page">
      <h1>Email & collaboration - Explorer</h1>
      <div className="def-tabs" style={{ marginBottom: 8 }}>
        <button type="button" className={"btn" + (view === "all" ? " btn-primary" : "")} onClick={() => setView("all")}>
          All email
        </button>
        <button type="button" className={"btn" + (view === "malware" ? " btn-primary" : "")} onClick={() => setView("malware")}>
          Malware
        </button>
        <button type="button" className={"btn" + (view === "phish" ? " btn-primary" : "")} onClick={() => setView("phish")}>
          Phish
        </button>
        <button type="button" className={"btn" + (view === "benign" ? " btn-primary" : "")} onClick={() => setView("benign")}>
          Benign / FP drill
        </button>
        <button type="button" className="btn" onClick={() => addNotification("Campaigns", "Campaign lens (simulated).")}>
          Campaigns
        </button>
      </div>
      <div className="def-toolbar">
        <label className="filter-check">
          View
          <select className="select-like" value={view} onChange={(e) => setView(e.target.value)}>
            <option value="all">All email</option>
            <option value="malware">Malware</option>
            <option value="phish">Phish</option>
            <option value="benign">Benign / FP drill</option>
          </select>
        </label>
        <button type="button" className="btn" onClick={() => addNotification("Filter", "Sender filter opened.")}>Sender</button>
        <button type="button" className="btn" onClick={() => addNotification("Filter", "Recipient filter opened.")}>Recipient</button>
        <button type="button" className="btn" onClick={() => addNotification("Filter", "Subject filter opened.")}>Subject</button>
        <button type="button" className="btn" onClick={() => addNotification("Filter", "URL filter opened.")}>URL</button>
        <button type="button" className="btn" onClick={() => addNotification("Filter", "File/IP filter opened.")}>File IP</button>
        <button type="button" className="btn" onClick={() => addNotification("Date range", "Last 30 days applied.")}>Last 30 days</button>
        <button type="button" className="btn" title="Trash bin" onClick={() => setTrashOpen(true)}>
          🗑 Trash ({trashRows.length})
        </button>
      </div>
      <div className="def-toolbar">
        <input
          className="def-search-inline"
          style={{ minWidth: 320 }}
          placeholder="Search by first name, last name, email, subject, or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="filter-check">
          From
          <input className="def-search-inline" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="filter-check">
          To
          <input className="def-search-inline" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <small className="dash-muted">
          Dataset: {mails.length} messages · Blocked sender domains: {blockedDomains.length}
        </small>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="def-toolbar">
          <label className="filter-check">
            Select pivot for histogram chart
            <select className="select-like" value={pivot} onChange={(e) => setPivot(e.target.value as PivotKey)}>
              <option value="senderDomain">Sender domain</option>
              <option value="senderIp">Sender IP</option>
              <option value="deliveryAction">Delivery action</option>
              <option value="detectionTechnology">Detection technology</option>
              <option value="fullUrl">Full URL</option>
              <option value="urlDomain">URL domain</option>
              <option value="urlDomainPath">URL domain and path</option>
            </select>
          </label>
          <button type="button" className="btn" onClick={() => addNotification("Export", "Chart data exported (simulated).")}>
            Export chart data
          </button>
        </div>
        <div className="def-pivot-bars">
          {pivotRows.map((r) => (
            <div key={r.label} className="def-pivot-row">
              <div className="def-pivot-label" title={r.label}>{r.label}</div>
              <div className="def-pivot-bar-track">
                <div className="def-pivot-bar-fill" style={{ width: `${Math.max(6, (r.count / Math.max(1, pivotRows[0]?.count ?? 1)) * 100)}%` }} />
              </div>
              <div className="def-pivot-count">{r.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="def-tabs">
        {["Email", "URL clicks", "Top URLs", "Top clicks", "Top targeted users", "Email origin", "Campaign"].map((t) => (
          <button key={t} type="button" className={"btn" + (summaryTab === t ? " btn-primary" : "")} onClick={() => setSummaryTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">{summaryTab} ({totalItems} items)</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Subject</th><th>Sender</th><th>Recipient</th><th>Email location</th><th>Delivery action</th><th>Threat</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {explorerRows.map((m) => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{m.subject}</td>
                  <td>{m.sender}</td>
                  <td>{m.recipient}</td>
                  <td>{m.location}</td>
                  <td>{m.deliveryAction}</td>
                  <td>{m.threat}</td>
                  <td>
                    <button type="button" className="link-btn" onClick={() => openPreview(m.id)}>Preview</button>{" "}
                    <button type="button" className="link-btn" onClick={() => openTrace(m.id)}>Trace</button>{" "}
                    <button type="button" className="link-btn" onClick={() => moveToJunk(m.id)}>Junk</button>{" "}
                    <button type="button" className="link-btn" onClick={() => blockSenderForMail(m)}>Block sender</button>{" "}
                    <button type="button" className="link-btn" onClick={() => zapZeroHour(m.id)}>ZAP</button>{" "}
                    <button type="button" className="link-btn" onClick={() => markDeleted(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <div className="panel-h">Review - Quarantine</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Subject</th><th>Reason</th><th>Expires</th><th>Actions</th></tr></thead>
            <tbody>
              {quarantineRows.map((m) => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{m.subject}</td>
                  <td>{m.reason}</td>
                  <td>{m.expires}</td>
                  <td>
                    <button type="button" className="link-btn" onClick={() => markReleased(m.id)}>Release</button>{" "}
                    <button type="button" className="link-btn" onClick={() => markDeleted(m.id)}>Delete</button>{" "}
                    <button type="button" className="link-btn" onClick={() => blockSenderForMail(m)}>Block sender</button>{" "}
                    <button type="button" className="link-btn" onClick={() => zapZeroHour(m.id)}>ZAP</button>{" "}
                    <button type="button" className="link-btn" onClick={() => openPreview(m.id)}>Preview</button>{" "}
                    <button type="button" className="link-btn" onClick={() => openTrace(m.id)}>Trace</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Phishing email preview" wide>
        <div className="panel" style={{ marginBottom: 10 }}>
          <div className="panel-h">Message headers</div>
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            <div><strong>From:</strong> {activeMail?.sender}</div>
            <div><strong>To:</strong> {activeMail?.recipient}</div>
            <div><strong>Subject:</strong> {activeMail?.subject}</div>
            <div><strong>Date:</strong> {activeMail?.date} 10:44:19 +0000</div>
            <div><strong>Return-Path:</strong> bounce@mailer-offers.win</div>
            <div><strong>Authentication:</strong> SPF fail, DKIM none, DMARC fail</div>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 10 }}>
          <div className="panel-h">Email body (simulated)</div>
          {activeMail?.practiceBenign ? (
            <p className="dash-muted" style={{ marginTop: 0 }}>
              <strong>Class hint:</strong> treat as false-positive drill — compare authentication headers and URL host to phishing templates.
            </p>
          ) : null}
          <div style={{ background: "#0f1116", border: "1px solid #2a2f38", borderRadius: 6, padding: 12 }}>
            <p style={{ marginTop: 0 }}>
              Hi {activeMail?.firstName ?? "analyst"},
            </p>
            <p>{activeMail?.body}</p>
            <p><strong>Act now:</strong> this request is marked urgent and time-sensitive.</p>
            <p>
              Confirm your identity and shipping details here:
              <br />
              <code>{activeMail?.suspiciousUrl}</code>
            </p>
            <p>As part of processing, download and complete the attached form: <code>{activeMail?.attachment}</code></p>
            <p style={{ marginBottom: 0 }}>- Rewards Processing Team</p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn"
            onClick={() => startInvestigation(activeMailId)}
          >
            Start investigation
          </button>
          <button type="button" className="btn" onClick={() => activeMail && moveToJunk(activeMail.id)}>
            Move to Junk
          </button>
          <button type="button" className="btn" onClick={() => activeMail && blockSenderForMail(activeMail)}>
            Block sender
          </button>
          <button type="button" className="btn" onClick={() => zapZeroHour(activeMailId)}>
            ZAP (purge similar)
          </button>
          <button type="button" className="btn" onClick={() => activeMail && markDeleted(activeMail.id)}>
            Delete message
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => addNotification("IOC", "Added sender domain, URL, and file hash to block list (simulated).")}
          >
            Add IOCs to block list
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setPreviewOpen(false)}>Close</button>
        </div>
      </Modal>

      <Modal open={traceOpen} onClose={() => setTraceOpen(false)} title="Message trace details" wide>
        <div className="panel" style={{ marginBottom: 10 }}>
          <div className="panel-h">Routing and location trace</div>
          <ul className="dash-list">
            <li><strong>Message ID:</strong> &lt;{activeMail?.id}@contoso-mail-gw&gt;</li>
            <li><strong>Ingress:</strong> MX gateway - Singapore POP</li>
            <li><strong>Relay:</strong> EU filtering cluster - policy scan triggered</li>
            <li><strong>Current location:</strong> {activeMail?.location}</li>
            <li><strong>Detection:</strong> {activeMail?.reason}</li>
          </ul>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => addNotification("Trace", "Geo route timeline exported (simulated).")}>Export trace</button>
          <button type="button" className="btn btn-primary" onClick={() => setTraceOpen(false)}>Close</button>
        </div>
      </Modal>

      <Modal open={trashOpen} onClose={() => setTrashOpen(false)} title="Trash bin - recover deleted emails" wide>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Subject</th><th>Sender</th><th>Recipient</th><th>Action</th></tr></thead>
            <tbody>
              {trashRows.map((m) => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{m.subject}</td>
                  <td>{m.sender}</td>
                  <td>{m.recipient}</td>
                  <td><button type="button" className="link-btn" onClick={() => restoreFromTrash(m.id)}>Restore to quarantine</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => setTrashOpen(false)}>Done</button>
        </div>
      </Modal>
    </div>
  );
}

