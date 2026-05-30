import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { useLabState } from "../../lib/useLabState";

type ThreatReport = {
  id: string;
  name: string;
  cves: string[];
  techniques: string[];
  summary: string;
  mitigations: { id: string; text: string }[];
};

const REPORTS: ThreatReport[] = [
  {
    id: "ta-log4shell",
    name: "Log4Shell exploitation (CVE-2021-44228)",
    cves: ["CVE-2021-44228"],
    techniques: ["T1190"],
    summary: "Remote code execution in Apache Log4j 2 via JNDI lookups. Widely exploited for initial access into internet-facing apps.",
    mitigations: [
      { id: "m1", text: "Upgrade Log4j to 2.17.1+ on all Java services" },
      { id: "m2", text: "Block outbound LDAP/RMI from web tiers" },
      { id: "m3", text: "Deploy WAF rule for ${jndi: patterns" },
      { id: "m4", text: "Hunt for java.exe spawning shells" },
    ],
  },
  {
    id: "ta-wannacry",
    name: "WannaCry / EternalBlue (CVE-2017-0144)",
    cves: ["CVE-2017-0144"],
    techniques: ["T1210", "T1486"],
    summary: "SMBv1 worming ransomware. Propagates via the EternalBlue exploit; encrypts files and deletes shadow copies.",
    mitigations: [
      { id: "m1", text: "Apply MS17-010 across all endpoints/servers" },
      { id: "m2", text: "Disable SMBv1" },
      { id: "m3", text: "Segment finance VLAN and block 445/tcp laterally" },
      { id: "m4", text: "Verify offline, tested backups" },
    ],
  },
  {
    id: "ta-asyncrat",
    name: "AsyncRAT commodity remote access trojan",
    cves: [],
    techniques: ["T1566.001", "T1071.001"],
    summary: "Open-source RAT delivered via phishing/HTML smuggling. Provides remote control, keylogging, and credential theft.",
    mitigations: [
      { id: "m1", text: "Block HTML smuggling at the email gateway" },
      { id: "m2", text: "Restrict mshta.exe via ASR rules" },
      { id: "m3", text: "Block known C2 IPs/domains" },
      { id: "m4", text: "User awareness on unexpected attachments" },
    ],
  },
];

export function DefenderThreatIntelPage() {
  const { incidents } = useDefenderData();
  const [open, setOpen] = useState<string>(REPORTS[0].id);
  const [checked, setChecked] = useLabState<Record<string, string[]>>("defender-threat-analytics-v1", {});

  const report = REPORTS.find((r) => r.id === open) ?? REPORTS[0];

  const affected = useMemo(() => {
    return incidents.filter(
      (i) =>
        report.cves.some((c) => i.cves.includes(c)) ||
        report.techniques.some((t) => i.techniques.includes(t))
    );
  }, [incidents, report]);

  const affectedDevices = useMemo(() => [...new Set(affected.flatMap((i) => i.devices.map((d) => d.name)))], [affected]);

  const toggle = (mid: string) => {
    setChecked((prev) => {
      const cur = prev[report.id] ?? [];
      return { ...prev, [report.id]: cur.includes(mid) ? cur.filter((x) => x !== mid) : [...cur, mid] };
    });
  };

  const done = checked[report.id] ?? [];

  return (
    <div className="def-page">
      <h1>Threat analytics</h1>
      <p className="dash-muted">Analyst reports with affected assets computed from your incident catalog and a tracked mitigation checklist.</p>

      <div className="def-hunt-layout">
        <aside className="panel def-hunt-schema">
          <div className="panel-h">Threat reports</div>
          <div style={{ padding: 8 }}>
            {REPORTS.map((r) => (
              <button key={r.id} className={"btn" + (open === r.id ? " btn-primary" : "")} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 6 }} onClick={() => setOpen(r.id)}>
                {r.name}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <section className="panel" style={{ marginBottom: 10 }}>
            <div className="panel-h">{report.name}</div>
            <div className="def-kv">
              <p>{report.summary}</p>
              <p><strong>CVEs:</strong> {report.cves.join(", ") || "—"} · <strong>Techniques:</strong> {report.techniques.join(", ")}</p>
            </div>
          </section>

          <div className="def-incident-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <section className="panel">
              <div className="panel-h">Affected assets <span className="badge-count high">{affectedDevices.length}</span></div>
              <div style={{ padding: 12 }}>
                {affected.length === 0 ? <p className="dash-muted">No matching incidents in your environment.</p> : null}
                {affected.map((i) => (
                  <p key={i.id}><Link to={`/defender/incidents/${encodeURIComponent(i.id)}`}>#{i.displayId} {i.title}</Link></p>
                ))}
                {affectedDevices.length ? <p className="dash-muted" style={{ fontSize: 12 }}>Devices: {affectedDevices.join(", ")}</p> : null}
              </div>
            </section>
            <section className="panel">
              <div className="panel-h">Recommended mitigations <span className="dash-muted" style={{ fontWeight: 400 }}>{done.length}/{report.mitigations.length} done</span></div>
              <div style={{ padding: 12 }}>
                {report.mitigations.map((m) => (
                  <label key={m.id} className="filter-check" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="checkbox" checked={done.includes(m.id)} onChange={() => toggle(m.id)} />
                    <span style={{ textDecoration: done.includes(m.id) ? "line-through" : "none" }}>{m.text}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
