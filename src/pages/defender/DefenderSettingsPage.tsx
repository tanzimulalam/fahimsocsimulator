import { useSimulator } from "../../context/SimulatorContext";
import { useLabState } from "../../lib/useLabState";

type SettingsState = {
  edrBlock: boolean;
  tamperProtection: boolean;
  autoInvestigate: boolean;
  webContentFiltering: boolean;
  liveResponse: boolean;
  asrRules: boolean;
};

const initial: SettingsState = {
  edrBlock: true,
  tamperProtection: true,
  autoInvestigate: true,
  webContentFiltering: false,
  liveResponse: true,
  asrRules: false,
};

const TOGGLES: { key: keyof SettingsState; label: string; desc: string }[] = [
  { key: "edrBlock", label: "EDR in block mode", desc: "Block post-breach activity even when AV is in passive mode." },
  { key: "tamperProtection", label: "Tamper protection", desc: "Prevent malicious apps from disabling Defender." },
  { key: "autoInvestigate", label: "Automated investigation & response", desc: "Auto-investigate alerts and queue remediation actions." },
  { key: "webContentFiltering", label: "Web content filtering", desc: "Block categories of unwanted web content." },
  { key: "liveResponse", label: "Live response", desc: "Allow analysts to run a remote shell on devices." },
  { key: "asrRules", label: "Attack surface reduction rules", desc: "Block Office child processes, mshta, and script abuse." },
];

export function DefenderSettingsPage() {
  const { addNotification } = useSimulator();
  const [settings, setSettings] = useLabState<SettingsState>("defender-settings-v1", initial);

  const toggle = (key: keyof SettingsState) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="def-page">
      <h1>Settings — Endpoints</h1>
      <p className="dash-muted">Advanced features and onboarding (persisted, simulated).</p>

      <section className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Advanced features</div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {TOGGLES.map((t) => (
            <label key={t.key} className="filter-check" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input type="checkbox" checked={settings[t.key]} onChange={() => toggle(t.key)} />
              <span>
                <strong>{t.label}</strong> {settings[t.key] ? <span className="def-status-chip remediated">On</span> : <span className="def-status-chip">Off</span>}
                <div className="dash-muted" style={{ fontSize: 12 }}>{t.desc}</div>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-h">Onboarding</div>
        <div style={{ padding: 12 }}>
          <p className="dash-muted">Download the onboarding package to deploy the Defender sensor (simulated — no file is created).</p>
          <button className="btn" onClick={() => addNotification("Onboarding", "Onboarding script download started (simulated).")}>Download onboarding package</button>
        </div>
      </section>
    </div>
  );
}
