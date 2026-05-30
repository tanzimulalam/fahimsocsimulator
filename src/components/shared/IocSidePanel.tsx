import { simulatedVirusTotalLine } from "../../data/publicMalwareSamples";

export type IocPanelData = {
  type: "file" | "ip" | "url" | "user" | "device" | "mailbox";
  value: string;
  verdict: string;
  sha256?: string;
  context?: string;
};

interface IocSidePanelProps {
  ioc: IocPanelData | null;
  onClose: () => void;
  onAddToNote?: (text: string) => void;
}

const VERDICT_COLOR: Record<string, string> = {
  malicious: "#ff7b72",
  suspicious: "#ffd07a",
  clean: "#79c0ff",
  unknown: "#9aa4b2",
};

export function IocSidePanel({ ioc, onClose, onAddToNote }: IocSidePanelProps) {
  if (!ioc) return null;
  const vColor = VERDICT_COLOR[ioc.verdict.toLowerCase()] ?? "#9aa4b2";
  const vtLine = ioc.sha256 ? simulatedVirusTotalLine(ioc.sha256) : null;

  const copy = () => {
    const text = ioc.sha256 ?? ioc.value;
    void navigator.clipboard?.writeText(text).catch(() => {});
  };

  const addNote = () => {
    const parts = [`IOC ${ioc.type.toUpperCase()}: ${ioc.value}`, `Verdict: ${ioc.verdict}`];
    if (ioc.sha256) parts.push(`SHA-256: ${ioc.sha256}`);
    if (vtLine) parts.push(`VirusTotal (simulated): ${vtLine}`);
    onAddToNote?.(parts.join(" · "));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        maxWidth: "92vw",
        background: "#11151b",
        borderLeft: "1px solid #2a2f38",
        boxShadow: "-8px 0 24px rgba(0,0,0,0.45)",
        zIndex: 3500,
        padding: 16,
        overflowY: "auto",
      }}
      role="dialog"
      aria-label="IOC details"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <strong style={{ fontSize: 14 }}>IOC details</strong>
        <button type="button" className="btn" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="def-card" style={{ marginBottom: 12 }}>
        <h3 style={{ textTransform: "uppercase" }}>{ioc.type}</h3>
        <div style={{ wordBreak: "break-all", fontSize: 13, marginBottom: 8 }}>{ioc.value}</div>
        <span style={{ color: vColor, border: `1px solid ${vColor}`, borderRadius: 999, padding: "2px 10px", fontSize: 11 }}>
          {ioc.verdict}
        </span>
      </div>

      {ioc.sha256 ? (
        <div className="def-card" style={{ marginBottom: 12 }}>
          <h3>SHA-256</h3>
          <code style={{ wordBreak: "break-all", fontSize: 11 }}>{ioc.sha256}</code>
        </div>
      ) : null}

      {vtLine ? (
        <div className="banner-info" style={{ marginBottom: 12 }}>
          <strong>VirusTotal (simulated):</strong> {vtLine}
        </div>
      ) : null}

      {ioc.context ? <p className="dash-muted" style={{ fontSize: 12 }}>{ioc.context}</p> : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button type="button" className="btn" onClick={copy}>Copy {ioc.sha256 ? "hash" : "value"}</button>
        {onAddToNote ? (
          <button type="button" className="btn btn-primary" onClick={addNote}>Add to evidence note</button>
        ) : null}
      </div>
    </div>
  );
}
