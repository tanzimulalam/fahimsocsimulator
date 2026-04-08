import { useEffect, useRef, useState } from "react";

type NoteTemplate = {
  id: string;
  name: string;
  html: string;
  createdAt: string;
};

const TEMPLATE_KEY = "socNotepadTemplates";
const PRESET_TEMPLATES: Array<{ id: string; name: string; html: string }> = [
  {
    id: "preset-ir",
    name: "Incident Response",
    html: `
      <h2>Incident Response Runbook</h2>
      <ol>
        <li><strong>Identify:</strong> Confirm alert source, severity, and impacted assets.</li>
        <li><strong>Contain:</strong> Isolate endpoint, block IOCs, disable risky sessions.</li>
        <li><strong>Investigate:</strong> Review timeline, process tree, mail trace, and identity logs.</li>
        <li><strong>Eradicate:</strong> Remove persistence, quarantine payloads, patch exploited paths.</li>
        <li><strong>Recover:</strong> Validate host health, restore services, monitor for recurrence.</li>
      </ol>
    `,
  },
  {
    id: "preset-email",
    name: "Email Triage",
    html: `
      <h2>Email Triage Checklist</h2>
      <ul>
        <li>Validate sender domain and SPF/DKIM/DMARC result.</li>
        <li>Inspect subject urgency cues and social engineering patterns.</li>
        <li>Open URL safely (detonation/sandbox) and compare domain age/intel.</li>
        <li>Analyze attachments (macro, archive, executable indicators).</li>
        <li>Decide action: release, quarantine, hard delete, tenant-wide remediation.</li>
      </ul>
    `,
  },
  {
    id: "preset-xdr",
    name: "XDR Hunt Playbook",
    html: `
      <h2>XDR Hunt Playbook</h2>
      <p><strong>Objective:</strong> Link email delivery to endpoint and identity abuse within 1 hour.</p>
      <pre>EmailEvents
| where SenderFromDomain == "bad.com"
| join kind=inner IdentityLogonEvents on AccountName
| where DeviceName contains "Finance"
| project Timestamp, AccountName, DeviceName, SenderFromDomain, ActionType</pre>
      <ul>
        <li>Correlate with DeviceProcessEvents for encoded PowerShell.</li>
        <li>Pivot to CloudAppEvents for unusual mass download activity.</li>
      </ul>
    `,
  },
];

export function NotepadPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const drawing = useRef(false);
  const [markerOn, setMarkerOn] = useState(false);
  const [templates, setTemplates] = useState<NoteTemplate[]>(() => {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as NoteTemplate[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(220, 38, 38, 0.88)";
    ctx.lineWidth = 5;
  }, []);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  }, [templates]);

  function toPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!markerOn) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const p = toPoint(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!markerOn || !drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = toPoint(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function onUp() {
    drawing.current = false;
  }

  function clearMarks() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  }

  function saveTemplate() {
    const html = editorRef.current?.innerHTML ?? "";
    const name = window.prompt("Template name");
    if (!name || !name.trim()) return;
    const next: NoteTemplate = {
      id: `tpl-${Date.now()}`,
      name: name.trim(),
      html,
      createdAt: new Date().toISOString(),
    };
    setTemplates((prev) => [next, ...prev].slice(0, 20));
    setStatus(`Template "${next.name}" saved.`);
  }

  function loadTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t || !editorRef.current) return;
    editorRef.current.innerHTML = t.html;
    setStatus(`Template "${t.name}" loaded.`);
  }

  function loadPreset(id: string) {
    const t = PRESET_TEMPLATES.find((x) => x.id === id);
    if (!t || !editorRef.current) return;
    editorRef.current.innerHTML = t.html;
    setStatus(`Preset "${t.name}" loaded.`);
  }

  function resetClassScenario() {
    if (editorRef.current) {
      editorRef.current.innerHTML = `
        <h2>Class Notes</h2>
        <p>Type here like a whiteboard document. Example:</p>
        <ul>
          <li>Start with email header review (SPF/DKIM/DMARC).</li>
          <li>Pivot to URL and sender domain intelligence.</li>
          <li>Contain, investigate, and restore from quarantine.</li>
        </ul>
      `;
    }
    clearMarks();
    window.dispatchEvent(new Event("defender-email-restore-all"));
    setStatus("Class scenario reset: notes cleared + phishing emails restored.");
  }

  function restoreAllPhishingEmails() {
    window.dispatchEvent(new Event("defender-email-restore-all"));
    setStatus("All phishing emails restored to baseline.");
  }

  return (
    <div className="notepad-page">
      <h1>Instructor Notepad</h1>
      <p className="dash-muted">Type notes and use red marker mode to circle or draw for teaching.</p>
      <div className="notepad-grid">
        <aside className="notepad-tools panel">
          <div className="panel-h">Admin Quick Tools</div>
          <div className="notepad-tools-body">
            <button type="button" className={"btn" + (markerOn ? " btn-primary" : "")} onClick={() => setMarkerOn((v) => !v)}>
              {markerOn ? "Marker: ON" : "Marker: OFF"}
            </button>
            <button type="button" className="btn" onClick={clearMarks}>Clear red marks</button>
            <button type="button" className="btn" onClick={saveTemplate}>Save note template</button>
            <button type="button" className="btn" onClick={resetClassScenario}>Reset class scenario</button>
            <button type="button" className="btn btn-primary" onClick={restoreAllPhishingEmails}>
              Restore all phishing emails
            </button>
            <p className="dash-muted" style={{ margin: 0 }}><strong>Status:</strong> {status}</p>
            <hr className="notepad-divider" />
            <h3>Saved templates</h3>
            <ul className="notepad-template-list">
              {PRESET_TEMPLATES.map((t) => (
                <li key={t.id}>
                  <button type="button" className="link-btn" onClick={() => loadPreset(t.id)}>
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
            <h3>Custom templates</h3>
            {templates.length === 0 ? (
              <p className="dash-muted">No templates saved yet.</p>
            ) : (
              <ul className="notepad-template-list">
                {templates.map((t) => (
                  <li key={t.id}>
                    <button type="button" className="link-btn" onClick={() => loadTemplate(t.id)}>{t.name}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <div className="notepad-wrap" ref={wrapRef}>
          <div
            ref={editorRef}
            className="notepad-editor"
            contentEditable
            suppressContentEditableWarning
            spellCheck
          >
            <h2>Class Notes</h2>
            <p>Type here like a whiteboard document. Example:</p>
            <ul>
              <li>Start with email header review (SPF/DKIM/DMARC).</li>
              <li>Pivot to URL and sender domain intelligence.</li>
              <li>Contain, investigate, and restore from quarantine.</li>
            </ul>
          </div>
          <canvas
            ref={canvasRef}
            className={"notepad-canvas" + (markerOn ? " on" : "")}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
          />
        </div>
      </div>
    </div>
  );
}

