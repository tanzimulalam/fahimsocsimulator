import { useEffect, useRef } from "react";
import type { CompromiseEvent } from "../types";
import { useSimulator } from "../context/SimulatorContext";

type Props = {
  event: CompromiseEvent;
  position: { x: number; y: number };
  onClose: () => void;
};

function fullSha(ev: CompromiseEvent): string {
  if (ev.sha256Full) return ev.sha256Full;
  return `${ev.sha256Prefix}${"0".repeat(48)}${ev.sha256Suffix}`.slice(0, 64);
}

export function FileContextMenu({ event, position, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { addNotification } = useSimulator();
  const sha = fullSha(event);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  const disp = event.disposition ?? "Unknown";
  const name = event.filename ?? "—";

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(sha);
      addNotification("Copied", "Full SHA-256 copied to clipboard.");
    } catch {
      addNotification("Copy failed", "Clipboard not available — select the hash manually.");
    }
    onClose();
  }

  function searchHash() {
    const q = encodeURIComponent(sha);
    window.open(`https://www.virustotal.com/gui/search/${q}`, "_blank", "noopener,noreferrer");
    addNotification("Search", "Opened VirusTotal search in a new tab (training).");
    onClose();
  }

  function fakeAction(label: string) {
    addNotification(label, `Simulated: “${label}” queued for ${name}. No backend — for class discussion only.`);
    onClose();
  }

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 380),
      }}
      role="dialog"
      aria-label="File actions"
    >
      <header>
        Disposition: {disp} | Filename: <strong>{name}</strong>
        <div className="sha-full">SHA-256: {sha}</div>
      </header>
      <div className="context-section">
        <div className="context-actions">
          <button type="button" className="btn" onClick={() => void copyHash()}>
            Copy hash
          </button>
          <button type="button" className="btn" onClick={searchHash}>
            Search VT
          </button>
        </div>
        <div className="context-muted">
          VirusTotal (simulated summary): <strong>(0/74) no detection</strong> —{" "}
          <a href="https://www.virustotal.com" target="_blank" rel="noreferrer">
            Full Report
          </a>
        </div>
      </div>
      <div className="context-section">
        <button type="button" className="context-item" onClick={() => fakeAction("File Fetch")}>
          File Fetch
        </button>
        <button type="button" className="context-item" onClick={() => fakeAction("File Analysis")}>
          File Analysis
        </button>
        <button type="button" className="context-item" onClick={() => fakeAction("File Trajectory")}>
          File Trajectory
        </button>
        <button type="button" className="context-item" onClick={() => fakeAction("Outbreak Control")}>
          Outbreak Control ▸
        </button>
      </div>
    </div>
  );
}
