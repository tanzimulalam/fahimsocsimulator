import { useMemo } from "react";
import { useSentinelData } from "../../context/SentinelDataContext";
import { SENTINEL_LOG_TABLES } from "../../data/sentinelData";

function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="def-pivot-bars" style={{ padding: 12 }}>
      {data.map((d) => (
        <div key={d.label} className="def-pivot-row">
          <div className="def-pivot-label">{d.label}</div>
          <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: "#0078d4" }} /></div>
          <div className="def-pivot-count">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

export function SentinelWorkbooksPage() {
  const { incidents } = useSentinelData();

  const byTactic = useMemo(() => {
    const m: Record<string, number> = {};
    incidents.forEach((i) => i.tactics.forEach((t) => (m[t] = (m[t] ?? 0) + 1)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [incidents]);

  const signinByLocation = useMemo(() => {
    const m: Record<string, number> = {};
    SENTINEL_LOG_TABLES.SigninLogs.forEach((r) => {
      const loc = String(r.Location ?? "Unknown");
      m[loc] = (m[loc] ?? 0) + 1;
    });
    return Object.entries(m).map(([label, value]) => ({ label, value }));
  }, []);

  const failedAuth = useMemo(() => {
    const fails = SENTINEL_LOG_TABLES.SecurityEvent.filter((r) => Number(r.EventID) === 4625).length;
    const success = SENTINEL_LOG_TABLES.SecurityEvent.filter((r) => Number(r.EventID) === 4624).length;
    return [
      { label: "Failed (4625)", value: fails },
      { label: "Success (4624)", value: success },
    ];
  }, []);

  return (
    <div className="def-page">
      <h1>Workbooks</h1>
      <p className="dash-muted">Read-only dashboards computed from workspace data.</p>

      <div className="def-incident-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel"><div className="panel-h">Incidents by MITRE tactic</div><Bars data={byTactic} /></section>
        <section className="panel"><div className="panel-h">Sign-ins by location</div><Bars data={signinByLocation} /></section>
        <section className="panel"><div className="panel-h">Failed vs successful authentication</div><Bars data={failedAuth} /></section>
        <section className="panel">
          <div className="panel-h">Sign-in map</div>
          <div style={{ padding: 12 }}>
            {signinByLocation.map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span>📍 {s.label}</span><span className="badge-count info">{s.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
