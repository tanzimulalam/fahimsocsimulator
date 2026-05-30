import { useState } from "react";
import { useLabState } from "../../lib/useLabState";

type Template = { id: string; name: string; technique: string; difficulty: "Easy" | "Medium" | "Hard"; clickRate: number; compromiseRate: number };

// Deterministic templates (ties to Class 3/4 GoPhish / PhishER concepts).
const TEMPLATES: Template[] = [
  { id: "t1", name: "Payroll update — credential harvest", technique: "Credential Harvest", difficulty: "Medium", clickRate: 0.34, compromiseRate: 0.18 },
  { id: "t2", name: "OneDrive shared document", technique: "Link in Attachment", difficulty: "Hard", clickRate: 0.22, compromiseRate: 0.09 },
  { id: "t3", name: "IT helpdesk MFA reset", technique: "Credential Harvest", difficulty: "Easy", clickRate: 0.47, compromiseRate: 0.29 },
  { id: "t4", name: "Invoice overdue (malware)", technique: "Malware Attachment", difficulty: "Medium", clickRate: 0.3, compromiseRate: 0.15 },
];

type Campaign = {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  targeted: number;
  clicked: number;
  compromised: number;
  reported: number;
  launchedAt: string;
};

export function DefenderAttackSimulationPage() {
  const [campaigns, setCampaigns] = useLabState<Campaign[]>("defender-attack-sim-v1", []);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [targeted, setTargeted] = useState(120);
  const [name, setName] = useState("");

  const launch = () => {
    const t = TEMPLATES.find((x) => x.id === templateId)!;
    const clicked = Math.round(targeted * t.clickRate);
    const compromised = Math.round(targeted * t.compromiseRate);
    const reported = Math.round(targeted * 0.21);
    setCampaigns((prev) => [
      {
        id: `camp-${Date.now().toString(36)}`,
        name: name.trim() || `${t.name} campaign`,
        templateId: t.id,
        templateName: t.name,
        targeted,
        clicked,
        compromised,
        reported,
        launchedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setName("");
  };

  return (
    <div className="def-page">
      <h1>Attack simulation training</h1>
      <p className="dash-muted">Launch a simulated phishing campaign and review click/compromise/report rates (persisted).</p>

      <section className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Launch campaign</div>
        <div className="def-toolbar" style={{ padding: 12 }}>
          <input className="def-search-inline" placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="def-search-inline" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.difficulty})</option>)}
          </select>
          <label className="filter-check">Targeted users
            <input className="def-search-inline" type="number" min={1} max={1000} value={targeted} onChange={(e) => setTargeted(Math.max(1, Number(e.target.value) || 1))} style={{ width: 90 }} />
          </label>
          <button className="btn btn-primary" onClick={launch}>Launch simulation</button>
        </div>
      </section>

      <div className="panel">
        <div className="panel-h">Campaign results <span className="badge-count info">{campaigns.length}</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Campaign</th><th>Template</th><th>Targeted</th><th>Clicked</th><th>Compromised</th><th>Reported</th><th>Click rate</th></tr></thead>
            <tbody>
              {campaigns.length === 0 ? <tr><td colSpan={7} className="dash-muted">No campaigns launched yet.</td></tr> : null}
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.templateName}</td>
                  <td>{c.targeted}</td>
                  <td>{c.clicked}</td>
                  <td>{c.compromised}</td>
                  <td>{c.reported}</td>
                  <td>{Math.round((c.clicked / c.targeted) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
