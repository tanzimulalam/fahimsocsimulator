import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { InvestigationDrawer } from "../../components/xdr/InvestigationDrawer";
import { InvestigationGrid } from "../../components/xdr/InvestigationGrid";
import { XdrSirPanel } from "../../components/xdr/XdrSirPanel";
import { buildInvestigationNodes, sirHeadline, type InvestigationNode } from "../../data/xdrInvestigation";
import type { Incident } from "../../types";
import { useSimulator } from "../../context/SimulatorContext";
import {
  findBestIncidentForShaQuery,
  findIncidentBySha256,
  findIncidentsBySha256Partial,
  fullShaFromEvent,
  normalizeSha256Input,
  normalizeSha256Partial,
  uniqueSha256sFromIncident,
} from "../../lib/sha256";
import { useClassroom } from "../../context/ClassroomContext";

export function XdrInvestigatePage() {
  const { incidents, addNotification, responseActions, logResponseAction } = useSimulator();
  const { session } = useClassroom();
  const [searchParams, setSearchParams] = useSearchParams();
  const incidentIdParam = searchParams.get("incident") ?? "";
  const shaParam = searchParams.get("sha") ?? "";

  const [source, setSource] = useState("all");
  const [disposition, setDisposition] = useState("mal");
  const [envOnly, setEnvOnly] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [shaInput, setShaInput] = useState("");

  const selectable = useMemo(
    () => incidents.filter((i) => i.status === "requires_attention" || i.status === "in_progress"),
    [incidents]
  );

  const activeIncident = useMemo((): Incident | undefined => {
    if (incidentIdParam) return incidents.find((i) => i.id === incidentIdParam) ?? selectable[0];
    return selectable[0] ?? incidents[0];
  }, [incidentIdParam, incidents, selectable]);

  const activeId = activeIncident?.id ?? "";

  useEffect(() => {
    if (shaParam.length === 64) {
      const n = normalizeSha256Input(shaParam);
      if (n) setShaInput(n);
    }
  }, [shaParam]);

  useEffect(() => {
    if (shaParam.length !== 64) return;
    const n = normalizeSha256Input(shaParam);
    if (!n) return;
    const found = findIncidentBySha256(incidents, n);
    if (found && found.id !== incidentIdParam) {
      setSearchParams({ incident: found.id, sha: n }, { replace: true });
    }
  }, [shaParam, incidents, incidentIdParam, setSearchParams]);

  const nodes = useMemo(() => {
    if (!activeIncident) return [];
    const hashes = uniqueSha256sFromIncident(activeIncident);
    return buildInvestigationNodes(hashes, activeIncident.id);
  }, [activeIncident]);

  const filteredNodes = useMemo(() => {
    let n = [...nodes];
    if (!envOnly) {
      n = n.slice(0, Math.max(4, Math.floor(n.length * 0.85)));
    }
    if (source === "email") {
      n = n.slice(0, Math.max(3, Math.floor(n.length * 0.35)));
    }
    if (disposition === "sus") {
      n = n.slice(0, Math.max(2, Math.floor(n.length * 0.4)));
    }
    if (n.length === 0) return nodes.slice(0, 1);
    return n;
  }, [nodes, source, disposition, envOnly]);

  const [selected, setSelected] = useState<InvestigationNode | null>(null);

  useEffect(() => {
    if (!selected) return;
    if (!filteredNodes.some((x) => x.id === selected.id)) setSelected(null);
  }, [filteredNodes, selected]);

  const sirLabel = useMemo(() => {
    if (!activeIncident) return "Investigate — no incident";
    return `${sirHeadline(activeIncident.xdrSir)} · ${activeIncident.hostLine}`;
  }, [activeIncident]);

  function onChangeIncident(id: string) {
    setSearchParams(id ? { incident: id } : {});
    setShaInput("");
    setSelected(null);
  }

  function submitShaLookup(e: FormEvent) {
    e.preventDefault();
    const raw = shaInput.trim();
    const n = normalizeSha256Input(raw);
    const part = normalizeSha256Partial(raw);
    if (!n && (!part || part.length < 8)) {
      addNotification(
        "SHA-256",
        "Paste at least 8 hex characters (partial from AMP works) or a full 64-char hash — no spaces."
      );
      return;
    }
    const found = findBestIncidentForShaQuery(incidents, raw);
    if (!found) {
      addNotification(
        "No match",
        "That hash is not on any incident in this simulator. Try ae12bb54 (Lumma), 275a021b (EICAR), or paste a full SHA-256 from Events."
      );
      return;
    }
    const multi = part && part.length < 64 ? findIncidentsBySha256Partial(incidents, part).length : 0;
    if (multi > 1 && part && part.length < 24) {
      addNotification("Ambiguous", `${multi} incidents share that short fragment — type more characters or pick from Inbox.`);
    }
    const matchedHash =
      n ??
      (part ? found.events.map((ev) => fullShaFromEvent(ev)).find((h) => h.includes(part)) : undefined) ??
      "";
    setSearchParams({ incident: found.id, sha: matchedHash.length === 64 ? matchedHash : "" });
    addNotification("SIR loaded", `${found.xdrSir.sirId} — ${found.hostLine}`);
    setSelected(null);
  }

  const sir = activeIncident?.xdrSir;
  const actionRows = useMemo(
    () => responseActions.filter((r) => r.incidentId === activeId).slice(0, 12),
    [responseActions, activeId]
  );
  const actionStats = useMemo(() => {
    const rows = responseActions.filter((r) => r.incidentId === activeId);
    return {
      total: rows.length,
      blocked: rows.filter((r) => r.action === "block_sha256").length,
      allowed: rows.filter((r) => r.action === "allow_sha256").length,
      isolated: rows.filter((r) => r.action === "isolate_host").length,
      latest: rows[0] ?? null,
    };
  }, [responseActions, activeId]);

  function quickNodeAction(node: InvestigationNode, action: "block_sha256" | "allow_sha256" | "isolate_host") {
    if (!activeId) return;
    const msg =
      action === "block_sha256"
        ? "Quick action: SHA blocked from graph node."
        : action === "allow_sha256"
          ? "Quick action: SHA allowed from graph node."
          : "Quick action: host isolation queued from graph node.";
    addNotification("Response Action", msg);
    logResponseAction({
      incidentId: activeId,
      hostLine: activeIncident?.hostLine ?? "Unknown host",
      nodeLabel: node.label,
      sha256: node.sha256,
      source: "Graph quick action",
      action,
      actor: session?.name ?? "Analyst",
    });
  }

  return (
    <div className="xdr-investigate">
      <div className="xdr-investigate-head">
        <div className="xdr-breadcrumb">
          <Link to="/xdr/investigate" className="xdr-back">
            ←
          </Link>
          <span>Investigate</span>
        </div>

        <form className="xdr-sha-lookup" onSubmit={submitShaLookup}>
          <label className="xdr-sha-label">
            <span className="xdr-sha-label-text">Lookup by SHA-256 (paste from AMP)</span>
            <input
              type="text"
              className="xdr-sha-input"
              placeholder="64 hex chars — paste hash, press Enter"
              value={shaInput}
              onChange={(e) => setShaInput(e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 64))}
              spellCheck={false}
              autoComplete="off"
              aria-label="SHA-256 lookup"
            />
          </label>
          <button type="submit" className="btn btn-primary xdr-sha-btn">
            Resolve
          </button>
        </form>

        <h1 className="xdr-sir-title">
          Investigate — <strong>{activeIncident?.hostLine ?? "—"}</strong>
        </h1>
        <p className="dash-muted" style={{ margin: "4px 0 0", fontSize: 11 }}>
          Graph: <strong>{filteredNodes.length}</strong> nodes · Seed: AMP incident <code>{activeId}</code> · Mixed
          verdicts (malicious / suspicious / unknown / common / clean)
        </p>
        <div className="xdr-amp-bridge">
          <label>
            Linked AMP incident{" "}
            <select
              className="select-like"
              value={activeId}
              onChange={(e) => onChangeIncident(e.target.value)}
              aria-label="Linked AMP incident"
            >
              {incidents.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.hostLine} ({i.status})
                </option>
              ))}
            </select>
          </label>
          <Link className="btn" to={`/inbox?incident=${encodeURIComponent(activeId)}`}>
            Open in AMP Inbox
          </Link>
        </div>
        <div className="xdr-filters">
          <select
            className="select-like"
            value={source}
            aria-label="Sources"
            onChange={(e) => {
              setSource(e.target.value);
              addNotification("XDR filters", `Sources → ${e.target.value}. Graph node count updates.`);
            }}
          >
            <option value="all">Sources: All</option>
            <option value="amp">AMP</option>
            <option value="email">Email</option>
          </select>
          <select
            className="select-like"
            value={disposition}
            aria-label="Disposition"
            onChange={(e) => {
              setDisposition(e.target.value);
              addNotification("XDR filters", `Disposition → ${e.target.value}.`);
            }}
          >
            <option value="mal">Disposition: Malicious</option>
            <option value="sus">Suspicious</option>
            <option value="any">Any</option>
          </select>
          <label className="xdr-check">
            <input
              type="checkbox"
              checked={envOnly}
              onChange={(e) => {
                setEnvOnly(e.target.checked);
                addNotification("Scope", e.target.checked ? "My environment only — on." : "Including sector peers — simulated.");
              }}
            />{" "}
            My environment only
          </label>
        </div>
      </div>

      <div className="xdr-kpi-strip">
        <div className="xdr-kpi-card"><div className="xdr-kpi-title">Total actions</div><div className="xdr-kpi-num">{actionStats.total}</div></div>
        <div className="xdr-kpi-card"><div className="xdr-kpi-title">Blocked SHA</div><div className="xdr-kpi-num">{actionStats.blocked}</div></div>
        <div className="xdr-kpi-card"><div className="xdr-kpi-title">Allowed SHA</div><div className="xdr-kpi-num">{actionStats.allowed}</div></div>
        <div className="xdr-kpi-card"><div className="xdr-kpi-title">Host Isolations</div><div className="xdr-kpi-num">{actionStats.isolated}</div></div>
      </div>
      {actionStats.latest ? (
        <div className="xdr-outcome-banner">
          Latest action: <strong>{actionStats.latest.action}</strong> by <strong>{actionStats.latest.actor}</strong> from {actionStats.latest.source} on {new Date(actionStats.latest.at).toLocaleString()}.
        </div>
      ) : null}

      {sir ? <XdrSirPanel sir={sir} /> : null}

      <div className="xdr-workspace">
        <InvestigationGrid
          nodes={filteredNodes}
          selectedId={selected?.id ?? null}
          onSelect={(n) => setSelected(n)}
          onRefresh={() => addNotification("Investigate", "Graph refreshed from AMP observables + active filters.")}
          onQuickAction={quickNodeAction}
        />
        <InvestigationDrawer
          node={selected}
          incidentId={activeId || null}
          incidentHostLine={activeIncident?.hostLine ?? null}
          sirLabel={sirLabel}
          xdrSir={sir ?? null}
          onClose={() => setSelected(null)}
        />
      </div>

      <div className="xdr-timeline-panel" style={{ marginTop: 12 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Response Action Ledger</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th><th>Actor</th><th>Action</th><th>Source</th><th>Node</th><th>SHA256</th>
              </tr>
            </thead>
            <tbody>
              {actionRows.length === 0 ? (
                <tr><td colSpan={6}>No response actions recorded yet for this incident.</td></tr>
              ) : actionRows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.at).toLocaleString()}</td>
                  <td>{r.actor}</td>
                  <td><span className={`xdr-action-chip ${r.action}`}>{r.action}</span></td>
                  <td>{r.source}</td>
                  <td>{r.nodeLabel}</td>
                  <td><code>{r.sha256.slice(0, 20)}...</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="xdr-timeline-bar">
        <button type="button" className="link-btn" onClick={() => setTimelineOpen((o) => !o)}>
          {timelineOpen ? "Hide timeline" : "Show timeline"}
        </button>
        <span className="dash-muted" style={{ fontSize: 11 }}>
          {timelineOpen ? "Correlated observables from this SIR" : "Timeline collapsed"}
        </span>
      </div>

      {timelineOpen && sir ? (
        <div className="xdr-timeline-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Type</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono small">{sir.firstSeenUtc.replace("T", " ").replace(".000Z", "")}</td>
                <td>SIR opened</td>
                <td>
                  {sir.sirId} ingested from {sir.msisacFeedId}
                </td>
              </tr>
              {sir.maliciousIpv4.slice(0, 4).map((row) => (
                <tr key={row.ip + row.firstSeenUtc}>
                  <td className="mono small">{row.firstSeenUtc.replace("T", " ").replace(".000Z", "")}</td>
                  <td>Network</td>
                  <td>
                    Observable <code>{row.ip}</code> — {row.context}
                  </td>
                </tr>
              ))}
              {sir.maliciousDomains.slice(0, 3).map((d) => (
                <tr key={d.domain}>
                  <td className="mono small">{sir.lastObservedUtc.replace("T", " ").replace(".000Z", "")}</td>
                  <td>DNS</td>
                  <td>
                    Domain <code>{d.domain}</code> — {d.context}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dash-muted" style={{ fontSize: 11, margin: "8px 0 0" }}>
            Timeline is synthetic but aligned to this incident’s SIR text and AMP host line ({activeIncident?.hostLine}).
          </p>
        </div>
      ) : null}
    </div>
  );
}
