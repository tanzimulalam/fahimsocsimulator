import { useMemo, useState } from "react";
import { useClassroom } from "../context/ClassroomContext";
import { useSimulator } from "../context/SimulatorContext";
import { csvEscape, downloadText } from "../lib/fakeExport";

type Mission = {
  id: string;
  track: "AMP" | "XDR" | "Defender" | "All";
  title: string;
  points: number;
  keywords: string[];
};

const MISSIONS: Mission[] = [
  { id: "m-1", track: "Defender", title: "Preview quarantined phishing email", points: 10, keywords: ["Preview", "phishing"] },
  { id: "m-2", track: "Defender", title: "Trace email route and export trace", points: 10, keywords: ["Trace", "export"] },
  { id: "m-3", track: "AMP", title: "Begin work on selected incident", points: 15, keywords: ["Moved to In Progress"] },
  { id: "m-4", track: "AMP", title: "Run host scan and review clean result", points: 10, keywords: ["Scan complete"] },
  { id: "m-5", track: "XDR", title: "Open XDR case and map MITRE behavior", points: 15, keywords: ["MITRE", "Investigate"] },
  { id: "m-6", track: "XDR", title: "Pivot to malicious IOC and block", points: 20, keywords: ["IOC", "block"] },
  { id: "m-7", track: "Defender", title: "Create custom detection rule", points: 10, keywords: ["custom detection"] },
  { id: "m-8", track: "All", title: "Resolve incident with response action", points: 10, keywords: ["Resolved", "Response"] },
];

const scenarioNotes: Record<string, string> = {
  "Phish -> Endpoint -> Lateral": "Cross-workload kill chain seeded. Start with Defender Explorer, pivot to XDR, then contain in AMP.",
  "Insider Threat Data Staging": "Look for unusual file movement, archive tools, and suspicious cloud upload behavior.",
  "Ransomware Burst": "Rapid detections and containment race. Prioritize high-risk hosts and block spread vectors.",
};

export function TrainingHqPage() {
  const { incidents, activityLog, addNotification, resetAll, clearActivityLog } = useSimulator();
  const { session, students, scenarios, activities, notes, publishScenario } = useClassroom();
  const [scenario, setScenario] = useState<keyof typeof scenarioNotes>("Phish -> Endpoint -> Lateral");
  const [section, setSection] = useState<"All" | "Section A" | "Section B" | "Section C">("All");
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"missions" | "case" | "intel" | "wallboard" | "classroom">("missions");
  const [scenarioTitle, setScenarioTitle] = useState("Lab Scenario - Multi-stage phishing chain");
  const [scenarioInstruction, setScenarioInstruction] = useState("Investigate email origin, pivot to IOC, and contain affected endpoints.");
  const [ampSeed, setAmpSeed] = useState("Add suspicious endpoint event sequence in AMP inbox.");
  const [xdrSeed, setXdrSeed] = useState("Correlate process graph with malicious domain and outbound C2.");
  const [defSeed, setDefSeed] = useState("Defender incident should include mailbox, user risk, and alert timeline.");

  const filteredStudents = useMemo(
    () =>
      students
        .map((s, i) => ({ ...s, section: (["Section A", "Section B", "Section C"][i % 3] as "Section A" | "Section B" | "Section C") }))
        .filter((s) => section === "All" || s.section === section),
    [section, students]
  );

  const missionStatus = useMemo(
    () =>
      MISSIONS.map((m) => {
        const done = activityLog.some((a) =>
          m.keywords.every((k) => `${a.title} ${a.message}`.toLowerCase().includes(k.toLowerCase()))
        );
        return { ...m, done };
      }),
    [activityLog]
  );

  const score = missionStatus.filter((m) => m.done).reduce((sum, m) => sum + m.points, 0);
  const maxScore = missionStatus.reduce((sum, m) => sum + m.points, 0);

  const riskStats = useMemo(() => {
    const open = incidents.filter((i) => i.status !== "resolved").length;
    const high = incidents.filter((i) => i.host.riskScore >= 75).length;
    return { open, high, total: incidents.length };
  }, [incidents]);

  function launchScenario() {
    addNotification("Scenario launched", `${scenario} started. ${scenarioNotes[scenario]}`);
  }

  function postScenarioToStudents() {
    if (!session || session.role !== "admin") return;
    publishScenario(
      {
        title: scenarioTitle.trim() || "Untitled Scenario",
        instructions: scenarioInstruction.trim() || "Follow instructor guidance.",
        ampSeed: ampSeed.trim(),
        xdrSeed: xdrSeed.trim(),
        defenderSeed: defSeed.trim(),
      },
      session.name
    );
    addNotification("Scenario posted", `Lab scenario "${scenarioTitle}" has been published to all registered students.`);
  }

  function resetClass() {
    resetAll();
    clearActivityLog();
    setAssignees({});
    addNotification("Class reset", "All incidents, assignments, and mission activity were reset.");
  }

  function restorePhishing() {
    window.dispatchEvent(new Event("defender-email-restore-all"));
    addNotification("Email lab", "All phishing emails restored from Training HQ.");
  }

  function exportGrades() {
    const rows = [
      ["Student", "Section", "CompletedMissions", "Score", "Percent"],
      ...filteredStudents.map((s) => [
        s.name,
        s.section,
        String(missionStatus.filter((m) => m.done).length),
        String(score),
        `${Math.round((score / Math.max(1, maxScore)) * 100)}%`,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => csvEscape(c)).join(",")).join("\n");
    downloadText("training-gradebook.csv", csv, "text/csv;charset=utf-8");
    addNotification("Export", "Gradebook CSV exported.");
  }

  return (
    <div className="page-scroll">
      <div className="page-header">
        <div>
          <h1 className="page-title">Training HQ</h1>
          <p className="console-subtitle">Guided labs, scenarios, grading, case assignment, and live SOC classroom controls.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={launchScenario}>Launch Scenario</button>
          <button type="button" className="btn" onClick={restorePhishing}>Restore all phishing emails</button>
          <button type="button" className="btn" onClick={exportGrades}>Export gradebook</button>
          <button type="button" className="btn btn-primary" onClick={resetClass}>Reset class scenario</button>
        </div>
      </div>

      <div className="def-tabs" style={{ marginBottom: 12 }}>
        <button type="button" className={"btn" + (tab === "missions" ? " btn-primary" : "")} onClick={() => setTab("missions")}>Guided Missions</button>
        <button type="button" className={"btn" + (tab === "case" ? " btn-primary" : "")} onClick={() => setTab("case")}>Case Management</button>
        <button type="button" className={"btn" + (tab === "intel" ? " btn-primary" : "")} onClick={() => setTab("intel")}>Hunt + Intel Workbench</button>
        <button type="button" className={"btn" + (tab === "wallboard" ? " btn-primary" : "")} onClick={() => setTab("wallboard")}>SOC Wallboard</button>
        <button type="button" className={"btn" + (tab === "classroom" ? " btn-primary" : "")} onClick={() => setTab("classroom")}>Classroom Control</button>
      </div>

      <div className="amp-events-filters">
        <label className="filter-check">
          Section
          <select className="select-like" value={section} onChange={(e) => setSection(e.target.value as "All" | "Section A" | "Section B" | "Section C")}>
            <option>All</option><option>Section A</option><option>Section B</option><option>Section C</option>
          </select>
        </label>
        <label className="filter-check">
          Scenario
          <select className="select-like" value={scenario} onChange={(e) => setScenario(e.target.value as keyof typeof scenarioNotes)}>
            {Object.keys(scenarioNotes).map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <span className="dash-muted">{scenarioNotes[scenario]}</span>
      </div>

      {tab === "missions" ? (
        <div className="grid-top">
          <section className="panel">
            <div className="panel-h">Mission Board ({missionStatus.filter((m) => m.done).length}/{missionStatus.length})</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Track</th><th>Mission</th><th>Points</th><th>Status</th></tr></thead>
                <tbody>
                  {missionStatus.map((m) => (
                    <tr key={m.id}>
                      <td>{m.track}</td>
                      <td>{m.title}</td>
                      <td>{m.points}</td>
                      <td>{m.done ? "Completed" : "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <div className="panel-h">Scoring</div>
            <div style={{ padding: 12 }}>
              <p><strong>Class score:</strong> {score}/{maxScore}</p>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(score / Math.max(1, maxScore)) * 100}%` }} /></div>
              <p className="dash-muted" style={{ marginTop: 10 }}>Auto-checks are driven by real student actions captured in activity log.</p>
              <div className="table-wrap" style={{ marginTop: 10 }}>
                <table className="data-table">
                  <thead><tr><th>Student</th><th>Section</th><th>Grade</th></tr></thead>
                  <tbody>{filteredStudents.map((s) => <tr key={s.name}><td>{s.name}</td><td>{s.section}</td><td>{Math.round((score / Math.max(1, maxScore)) * 100)}%</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "case" ? (
        <section className="panel">
          <div className="panel-h">Case Management + Assignment</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Incident</th><th>Status</th><th>Risk</th><th>Assigned Student</th></tr></thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>{inc.hostLine}</td>
                    <td>{inc.status}</td>
                    <td>{inc.host.riskScore}</td>
                    <td>
                      <select
                        className="select-like"
                        value={assignees[inc.id] ?? ""}
                        onChange={(e) => setAssignees((p) => ({ ...p, [inc.id]: e.target.value }))}
                      >
                        <option value="">Unassigned</option>
                        {filteredStudents.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "intel" ? (
        <div className="grid-top">
          <section className="panel">
            <div className="panel-h">Threat Intel Workbench</div>
            <div style={{ padding: 12 }}>
              <p><strong>IOC Sightings:</strong> 37 (hash), 19 (domains), 12 (IPs)</p>
              <ul className="dash-list">
                <li>Domain: `malicious-site.com` -&gt; confidence 92, first seen in Email + Endpoint</li>
                <li>IP: `203.0.113.44` -&gt; confidence 88, correlated with quarantine failures</li>
                <li>SHA256: `9014827c...062daad6` -&gt; confidence 95, seen on 3 hosts</li>
              </ul>
            </div>
          </section>
          <section className="panel">
            <div className="panel-h">Hunt Query Library</div>
            <pre className="analysis-pre">{`EmailEvents
| where SenderFromDomain == "bad.com"
| join kind=inner IdentityLogonEvents on AccountName
| where DeviceName contains "Finance"
| project Timestamp, AccountName, DeviceName, SenderFromDomain`}</pre>
            <div style={{ padding: "0 12px 12px" }}>
              <button type="button" className="btn" onClick={() => addNotification("Hunt", "Query executed and promoted to custom detection rule.")}>Run + Promote to Detection</button>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "wallboard" ? (
        <section className="panel">
          <div className="panel-h">SOC Wallboard Mode</div>
          <div className="dash-kpi-grid" style={{ padding: 12 }}>
            <div className="dash-kpi"><div className="dash-kpi-value">{riskStats.open}</div><div className="dash-kpi-label">Open Incidents</div></div>
            <div className="dash-kpi"><div className="dash-kpi-value">{riskStats.high}</div><div className="dash-kpi-label">High Risk Assets</div></div>
            <div className="dash-kpi"><div className="dash-kpi-value">{score}%</div><div className="dash-kpi-label">Class Performance</div></div>
            <div className="dash-kpi"><div className="dash-kpi-value">{activityLog.length}</div><div className="dash-kpi-label">Analyst Actions Logged</div></div>
          </div>
        </section>
      ) : null}

      {tab === "classroom" ? (
        <div className="grid-top">
          <section className="panel">
            <div className="panel-h">Publish New Lab Scenario to Students</div>
            <div style={{ padding: 12 }}>
              <label className="filter-check">Scenario Title <input className="def-search-inline" style={{ width: "100%" }} value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} /></label>
              <label className="filter-check">Instructions <textarea className="analyst-comment-input" value={scenarioInstruction} onChange={(e) => setScenarioInstruction(e.target.value)} /></label>
              <label className="filter-check">AMP Incident Seed <textarea className="analyst-comment-input" value={ampSeed} onChange={(e) => setAmpSeed(e.target.value)} /></label>
              <label className="filter-check">XDR Reasoning Seed <textarea className="analyst-comment-input" value={xdrSeed} onChange={(e) => setXdrSeed(e.target.value)} /></label>
              <label className="filter-check">Defender Reasoning Seed <textarea className="analyst-comment-input" value={defSeed} onChange={(e) => setDefSeed(e.target.value)} /></label>
              <div className="modal-actions">
                <button type="button" className="btn btn-primary" onClick={postScenarioToStudents}>Post Scenario to All Students</button>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-h">Latest Student Activity + Notes</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Time</th><th>Student</th><th>Action</th><th>Details</th></tr></thead>
                <tbody>
                  {activities.slice(0, 20).map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.at).toLocaleString()}</td>
                      <td>{a.studentName}</td>
                      <td>{a.action}</td>
                      <td>{a.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: 12 }}>
              <h3 style={{ margin: "0 0 8px" }}>Student Notes Snapshot</h3>
              {Object.keys(notes).length === 0 ? (
                <p className="dash-muted">No student notes saved yet.</p>
              ) : (
                <ul className="dash-list">
                  {Object.values(notes).slice(0, 10).map((n) => (
                    <li key={n.studentId}>
                      {students.find((s) => s.id === n.studentId)?.name ?? n.studentId} - updated {new Date(n.updatedAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel-h">Published Scenarios ({scenarios.length})</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Posted</th><th>Title</th><th>Instructions</th></tr></thead>
                <tbody>{scenarios.slice(0, 15).map((s) => <tr key={s.id}><td>{new Date(s.createdAt).toLocaleString()}</td><td>{s.title}</td><td>{s.instructions}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

