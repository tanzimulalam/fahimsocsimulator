import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { sevClass } from "./DefenderIncidentsPage";
import { Modal } from "../../components/Modal";
import { DEFENDER_HUNTING_TABLES } from "../../data/defenderHuntingTables";
import type { DefenderSeverity } from "../../data/defenderIncidents";
import type { KqlRow } from "../../lib/kql";

type InventoryDevice = {
  name: string;
  os: string;
  risk: DefenderSeverity;
  sensorHealth: "Active" | "Inactive" | "Misconfigured";
  managed: "Managed" | "Unmanaged";
  lastSeen: string;
};

// A few extra discovered devices beyond those in incidents (teaching: managed vs unmanaged).
const EXTRA_DEVICES: InventoryDevice[] = [
  { name: "MKTG-LAPTOP-22", os: "Windows 11 23H2", risk: "Low", sensorHealth: "Active", managed: "Managed", lastSeen: "2026-05-29T13:50:00Z" },
  { name: "BYOD-IPHONE-09", os: "iOS 18.2", risk: "Informational", sensorHealth: "Inactive", managed: "Unmanaged", lastSeen: "2026-05-28T22:10:00Z" },
  { name: "LINUX-BUILD-04", os: "Ubuntu 24.04", risk: "Low", sensorHealth: "Misconfigured", managed: "Managed", lastSeen: "2026-05-29T11:00:00Z" },
];

function fmt(iso: string) {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + "Z";
  } catch {
    return iso;
  }
}

export function DefenderAssetsPage() {
  const { incidents, getDeviceState, setDeviceState } = useDefenderData();
  const [params, setParams] = useSearchParams();
  const selectedDevice = params.get("device");
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => void } | null>(null);

  const inventory = useMemo<InventoryDevice[]>(() => {
    const map = new Map<string, InventoryDevice>();
    incidents.forEach((i) =>
      i.devices.forEach((d) => {
        if (!map.has(d.name)) {
          map.set(d.name, { name: d.name, os: d.os, risk: d.riskLevel, sensorHealth: "Active", managed: "Managed", lastSeen: i.lastActivity });
        }
      })
    );
    EXTRA_DEVICES.forEach((d) => { if (!map.has(d.name)) map.set(d.name, d); });
    return [...map.values()];
  }, [incidents]);

  const openDevice = (name: string) => {
    const next = new URLSearchParams(params);
    next.set("device", name);
    setParams(next, { replace: true });
  };
  const closeDevice = () => {
    const next = new URLSearchParams(params);
    next.delete("device");
    setParams(next, { replace: true });
  };

  const deviceData = useMemo(() => {
    if (!selectedDevice) return null;
    const linkedIncidents = incidents.filter((i) => i.devices.some((d) => d.name === selectedDevice));
    const timeline: { ts: string; kind: string; detail: string }[] = [];
    const byDevice = (rows: KqlRow[]) => rows.filter((r) => r.DeviceName === selectedDevice);
    byDevice(DEFENDER_HUNTING_TABLES.DeviceProcessEvents).forEach((r) =>
      timeline.push({ ts: String(r.Timestamp), kind: "Process", detail: `${r.FileName} — ${r.ProcessCommandLine}` })
    );
    byDevice(DEFENDER_HUNTING_TABLES.DeviceNetworkEvents).forEach((r) =>
      timeline.push({ ts: String(r.Timestamp), kind: "Network", detail: `${r.ActionType} → ${r.RemoteIP || r.RemoteUrl}:${r.RemotePort}` })
    );
    byDevice(DEFENDER_HUNTING_TABLES.DeviceFileEvents).forEach((r) =>
      timeline.push({ ts: String(r.Timestamp), kind: "File", detail: `${r.ActionType} ${r.FileName} (${r.FolderPath})` })
    );
    byDevice(DEFENDER_HUNTING_TABLES.DeviceLogonEvents).forEach((r) =>
      timeline.push({ ts: String(r.Timestamp), kind: "Logon", detail: `${r.ActionType} ${r.AccountName} from ${r.RemoteIP}` })
    );
    timeline.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    const users = [...new Set(linkedIncidents.flatMap((i) => i.users.map((u) => u.upn)))];
    const cves = [...new Set(linkedIncidents.flatMap((i) => i.cves))];
    const alerts = linkedIncidents.flatMap((i) => i.alerts.filter((a) => a.entities.includes(selectedDevice)));
    const inv = inventory.find((d) => d.name === selectedDevice);
    return { linkedIncidents, timeline, users, cves, alerts, inv };
  }, [selectedDevice, incidents, inventory]);

  return (
    <div className="def-page">
      <h1>Device inventory</h1>
      <p className="dash-muted">{inventory.length} devices · onboarded to Microsoft Defender for Endpoint (simulated)</p>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Device</th><th>OS</th><th>Risk</th><th>Exposure</th><th>Sensor health</th><th>Management</th><th>Last seen</th><th></th></tr>
            </thead>
            <tbody>
              {inventory.map((d) => {
                const st = getDeviceState(d.name);
                return (
                  <tr key={d.name}>
                    <td><button className="link-btn" onClick={() => openDevice(d.name)}>{d.name}</button> {st.isolated ? <span className="def-status-chip remediated">Isolated</span> : null}</td>
                    <td>{d.os}</td>
                    <td><span className={sevClass(d.risk)}>{d.risk}</span></td>
                    <td>{d.risk === "High" ? "High" : d.risk === "Medium" ? "Medium" : "Low"}</td>
                    <td>{d.sensorHealth}</td>
                    <td>{d.managed}</td>
                    <td>{fmt(d.lastSeen)}</td>
                    <td><button className="btn" onClick={() => openDevice(d.name)}>Open</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selectedDevice} title={selectedDevice ? `Device page — ${selectedDevice}` : ""} onClose={closeDevice} wide>
        {deviceData && selectedDevice ? (
          <div>
            {(() => {
              const st = getDeviceState(selectedDevice);
              return (
                <>
                  <div className="def-toolbar">
                    {st.isolated ? (
                      <button className="btn" onClick={() => setConfirm({ title: "Release device", body: `Release ${selectedDevice} from isolation?`, run: () => setDeviceState(selectedDevice, { isolated: false }, "release_host", "Released device from isolation") })}>Release from isolation</button>
                    ) : (
                      <button className="btn" onClick={() => setConfirm({ title: "Isolate device", body: `Isolate ${selectedDevice}?`, run: () => setDeviceState(selectedDevice, { isolated: true }, "isolate_host", "Isolated device") })}>Isolate device</button>
                    )}
                    <button className="btn" onClick={() => setConfirm({ title: "Collect package", body: `Collect investigation package from ${selectedDevice}?`, run: () => setDeviceState(selectedDevice, { packageCollected: true }, "collect_package", "Collected investigation package") })}>Collect investigation package</button>
                    <button className="btn" onClick={() => setConfirm({ title: "Run AV scan", body: `Run a full antivirus scan on ${selectedDevice}?`, run: () => setDeviceState(selectedDevice, { lastAvScan: new Date().toISOString() }, "run_av_scan", "Ran antivirus scan") })}>Run AV scan</button>
                    <button className="btn" onClick={() => setConfirm({ title: "Restrict app execution", body: `Restrict app execution on ${selectedDevice}?`, run: () => setDeviceState(selectedDevice, { appRestricted: true }, "restrict_app", "Restricted app execution") })}>Restrict app execution</button>
                    <button className="btn" onClick={() => setConfirm({ title: "Live response", body: `Start a live response session to ${selectedDevice}? (simulated console)`, run: () => setDeviceState(selectedDevice, {}, "collect_package", "Started live response session") })}>Live response</button>
                  </div>
                  <p className="dash-muted" style={{ fontSize: 12 }}>
                    {deviceData.inv?.os} · {st.isolated ? "Isolated" : "Active"}{st.packageCollected ? " · Package collected" : ""}{st.appRestricted ? " · App execution restricted" : ""}{st.lastAvScan ? ` · Last AV scan ${fmt(st.lastAvScan)}` : ""}
                  </p>

                  <div className="def-incident-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
                    <section className="panel">
                      <div className="panel-h">Device timeline</div>
                      <div className="table-wrap" style={{ maxHeight: 300 }}>
                        <table className="data-table">
                          <thead><tr><th>Time</th><th>Type</th><th>Detail</th></tr></thead>
                          <tbody>
                            {deviceData.timeline.length === 0 ? <tr><td colSpan={3} className="dash-muted">No telemetry for this device.</td></tr> : null}
                            {deviceData.timeline.map((t, i) => (
                              <tr key={i}><td>{fmt(t.ts)}</td><td>{t.kind}</td><td style={{ wordBreak: "break-all" }}>{t.detail}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <section className="def-card">
                        <h3>Active alerts</h3>
                        {deviceData.alerts.length === 0 ? <p className="dash-muted">None.</p> : deviceData.alerts.map((a) => (
                          <p key={a.id}><span className={sevClass(a.severity)}>{a.severity}</span> {a.title}</p>
                        ))}
                      </section>
                      <section className="def-card">
                        <h3>Logged-on users</h3>
                        {deviceData.users.length === 0 ? <p className="dash-muted">None.</p> : deviceData.users.map((u) => (
                          <p key={u}><Link to={`/defender/identities/users?user=${encodeURIComponent(u)}`}>{u}</Link></p>
                        ))}
                      </section>
                      <section className="def-card">
                        <h3>Vulnerabilities</h3>
                        {deviceData.cves.length === 0 ? <p className="dash-muted">No known CVEs.</p> : deviceData.cves.map((c) => <p key={c}>{c}</p>)}
                      </section>
                      <section className="def-card">
                        <h3>Linked incidents</h3>
                        {deviceData.linkedIncidents.map((i) => (
                          <p key={i.id}><Link to={`/defender/incidents/${encodeURIComponent(i.id)}`}>#{i.displayId} {i.title}</Link></p>
                        ))}
                      </section>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      <Modal open={!!confirm} title={confirm?.title ?? ""} onClose={() => setConfirm(null)}>
        <p>{confirm?.body}</p>
        <p className="dash-muted" style={{ fontSize: 12 }}>Simulated — logged to the shared response ledger and Action center.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { confirm?.run(); setConfirm(null); }}>Confirm</button>
        </div>
      </Modal>
    </div>
  );
}
