import type { SentinelSeverity } from "../../data/sentinelData";

export function senSevClass(sev: SentinelSeverity): string {
  if (sev === "High") return "sev sev-high";
  if (sev === "Medium") return "sev sev-medium";
  return "sev sev-low";
}

export function fmtTs(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function statusChipClass(status: string): string {
  if (status === "Closed") return "def-status-chip remediated";
  if (status === "Active") return "def-status-chip pending-actions";
  return "def-status-chip in-progress";
}
