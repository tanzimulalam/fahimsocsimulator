import type { Incident } from "../types";
import { fullShaFromEvent } from "./sha256";

/** After scan completes: clean vs still-dirty (malware-heavy hosts usually stay “dirty”). */
export function resolveScanOutcome(incident: Incident | undefined, mode: "full" | "flash"): "clean" | "threats_found" {
  if (!incident) return "clean";

  const risk = incident.host.riskScore;
  const mal = incident.events.filter(
    (e) => e.disposition === "Malicious" || e.severity === "critical" || e.severity === "high"
  ).length;
  const suspicious = incident.events.filter(
    (e) => e.disposition === "Suspicious" || e.disposition === "Unknown"
  ).length;
  const qf = incident.events.some((e) => e.eventType.toLowerCase().includes("quarantine failure"));
  const r = Math.random();

  if (mal >= 2 || risk >= 95) {
    return r < (mode === "full" ? 0.88 : 0.52) ? "threats_found" : "clean";
  }
  if (mal >= 1 || qf || risk >= 75) {
    return r < (mode === "full" ? 0.74 : 0.4) ? "threats_found" : "clean";
  }
  if (suspicious >= 2 || risk >= 55) {
    return r < (mode === "full" ? 0.38 : 0.18) ? "threats_found" : "clean";
  }
  if (incident.status === "resolved" && risk < 35) {
    return r < 0.04 ? "threats_found" : "clean";
  }
  return r < (mode === "full" ? 0.09 : 0.04) ? "threats_found" : "clean";
}

export function collectThreatHashesForScanLog(incident: Incident | undefined, max = 4): string[] {
  if (!incident) return [];
  const set = new Set<string>();
  for (const ev of incident.events) {
    const full = fullShaFromEvent(ev);
    if (!/^[a-f0-9]{64}$/i.test(full)) continue;
    const d = (ev.disposition ?? "").toLowerCase();
    if (d.includes("malicious") || d.includes("suspicious") || d === "unknown") {
      set.add(full);
    }
    if (ev.severity === "high" || ev.severity === "critical") {
      set.add(full);
    }
  }
  const prioritized = [...set];
  if (prioritized.length > 0) return prioritized.slice(0, max);
  for (const ev of incident.events) {
    const full = fullShaFromEvent(ev);
    if (!/^[a-f0-9]{64}$/i.test(full)) continue;
    const d = (ev.disposition ?? "").toLowerCase();
    if (d === "clean") continue;
    set.add(full);
  }
  const rest = [...set];
  if (rest.length > 0) return rest.slice(0, max);
  const first = incident.events[0] ? fullShaFromEvent(incident.events[0]) : "";
  return /^[a-f0-9]{64}$/i.test(first) ? [first] : [];
}
