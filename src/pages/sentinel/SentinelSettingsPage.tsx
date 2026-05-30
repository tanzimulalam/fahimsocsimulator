import { useLabState } from "../../lib/useLabState";

type SettingsState = {
  uebaEnabled: boolean;
  anomalies: boolean;
  autoCloseBenign: boolean;
  entityBehavior: boolean;
  dataRetention90: boolean;
};

const initial: SettingsState = {
  uebaEnabled: true,
  anomalies: true,
  autoCloseBenign: false,
  entityBehavior: true,
  dataRetention90: true,
};

const TOGGLES: { key: keyof SettingsState; label: string; desc: string }[] = [
  { key: "uebaEnabled", label: "User & Entity Behavior Analytics (UEBA)", desc: "Baseline normal behavior to surface anomalies." },
  { key: "anomalies", label: "Anomaly rules", desc: "Enable ML anomaly detections in Analytics." },
  { key: "autoCloseBenign", label: "Auto-close benign positives", desc: "Automatically close incidents classified as benign by automation." },
  { key: "entityBehavior", label: "Entity behavior pages", desc: "Show per-entity insight timelines." },
  { key: "dataRetention90", label: "90-day interactive retention", desc: "Keep logs hot for 90 days before archive." },
];

export function SentinelSettingsPage() {
  const [settings, setSettings] = useLabState<SettingsState>("sentinel-settings-v1", initial);
  const toggle = (key: keyof SettingsState) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="def-page">
      <h1>Settings</h1>
      <p className="dash-muted">Workspace settings (persisted, simulated).</p>

      <section className="panel">
        <div className="panel-h">Workspace features</div>
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
    </div>
  );
}
