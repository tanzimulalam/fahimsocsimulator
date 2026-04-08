import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";
import type { Incident } from "../../types";

const tabs = ["Overview", "Detection", "Response", "Evidence", "Workflow", "Report"] as const;

export function XdrIncidentsPage() {
  const { incidents, addNotification } = useSimulator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  const incidentParam = searchParams.get("incident");
  const open = useMemo(() => incidents.filter((i) => i.status !== "resolved"), [incidents]);
  const active = useMemo<Incident | undefined>(() => {
    if (incidentParam) return incidents.find((i) => i.id === incidentParam);
    return open[0];
  }, [incidentParam, incidents, open]);

  function selectIncident(id: string) {
    setSearchParams({ incident: id });
  }

  return (
    <div className="xdr-inc-page">
      <div className="xdr-inc-layout">
        <aside className="xdr-inc-left panel">
          <div className="panel-h">Incidents</div>
          <div className="xdr-inc-list">
            {open.map((inc, idx) => (
              <button
                key={inc.id}
                type="button"
                className={"xdr-inc-list-item" + (active?.id === inc.id ? " active" : "")}
                onClick={() => selectIncident(inc.id)}
              >
                <span className="sev sev-high">{idx % 2 === 0 ? "870" : "670"}</span>
                <div>
                  <strong>New Remote Access on {inc.host.internalIp}</strong>
                  <small>{inc.xdrSir.sirId} · {inc.hostLine}</small>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="xdr-inc-main">
          {active ? (
            <>
              <div className="xdr-inc-head">
                <div className="xdr-inc-title-row">
                  <span className="sev sev-high">870</span>
                  <h1>New Remote Access on {active.host.internalIp}</h1>
                  <span className="sev sev-medium">New</span>
                  <span className="sev sev-medium">{active.events[0]?.eventType ?? "Detection"}</span>
                </div>
                <p className="xdr-inc-sub">
                  Reported by Cisco XDR Analytics on {active.events[0]?.timestampUtc ?? "—"} · Linked host:{" "}
                  <code>{active.host.hostname}</code>
                </p>
                <p className="xdr-inc-sub">
                  Device has been accessed (e.g. via SSH) from a remote host for the first time in recent history.
                  This may indicate compromise.
                </p>
                <div className="xdr-inc-head-actions">
                  <button type="button" className="btn" onClick={() => addNotification("Edit", "Incident fields updated (simulated).")}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => addNotification("Workflow", "Launching workflow builder (simulated).")}>
                    Launch new incident workflow
                  </button>
                </div>
              </div>

              <div className="xdr-inc-tabs">
                {tabs.map((t) => (
                  <button key={t} type="button" className={"xdr-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="xdr-inc-canvas panel">
                <div className="panel-h">
                  <button type="button" className="btn" onClick={() => addNotification("Canvas", "Expanded graph canvas (simulated).")}>
                    Expand
                  </button>
                </div>
                <div className="xdr-inc-graph">
                  <div className="xdr-mini-node">{active.host.internalIp}</div>
                  <div className="xdr-mini-link" />
                  <div className="xdr-mini-node">{active.host.externalIp}</div>
                  <div className="xdr-mini-link" />
                  <div className="xdr-mini-node suspicious">{active.xdrSir.maliciousIpv4[0]?.ip ?? "203.0.113.44"}</div>
                </div>
                <div className="xdr-inc-canvas-foot">
                  <button type="button" className="link-btn" onClick={() => addNotification("Timeline", "Timeline shown (simulated).")}>
                    Show timeline
                  </button>
                </div>
              </div>

              <div className="xdr-inc-bottom">
                <section className="panel">
                  <div className="panel-h">Assets</div>
                  <div className="xdr-inc-tile">
                    <strong>Endpoint</strong>
                    <span>{active.host.hostname}</span>
                    <button type="button" className="link-btn" onClick={() => addNotification("Asset", "Opened endpoint profile (simulated).")}>
                      Open profile
                    </button>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-h">Observables</div>
                  <div className="xdr-inc-tile">
                    <strong>Top active</strong>
                    <span>{active.xdrSir.maliciousIpv4[0]?.ip ?? "—"}</span>
                    <Link to={`/xdr/investigate?incident=${encodeURIComponent(active.id)}`}>View all</Link>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-h">Indicators</div>
                  <div className="xdr-inc-tile">
                    <strong>Top active</strong>
                    <span>{active.xdrSir.sirTitle}</span>
                    <button type="button" className="link-btn" onClick={() => addNotification("Indicator", "Indicator added to watchlist (simulated).")}>
                      Add to watchlist
                    </button>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="panel page-placeholder">No incidents available.</div>
          )}
        </section>
      </div>
    </div>
  );
}

