import type { CompromiseEvent, HostInfo, IncidentWork } from "../types";
import { formatUtcTraining } from "./formatUtc";

/** Synthetic log lines for the Events modal (training). */
export function buildScanLogEvents(work: IncidentWork, host: HostInfo): CompromiseEvent[] {
  const s = work.scan;
  const rows: CompromiseEvent[] = [];

  if (s.status === "scanning" && s.startedAt) {
    rows.push({
      id: "scan-sim-progress",
      severity: "low",
      eventType: "Endpoint scan in progress…",
      sha256Prefix: "00000000",
      sha256Suffix: "00000000",
      timestampUtc: formatUtcTraining(s.startedAt),
      user: "NT AUTHORITY\\SYSTEM",
      processPath: "C:\\Program Files\\Cisco\\AMP\\Endpoint\\scanner.exe",
      parentProcess: "C:\\Windows\\System32\\services.exe",
      localIp: host.internalIp,
      direction: "local",
      disposition: "Scanning",
    });
  }

  if (s.status === "clean" && s.completedAt && s.startedAt) {
    rows.push({
      id: "scan-sim-complete",
      severity: "low",
      eventType:
        s.mode === "flash"
          ? "Flash scan completed — no immediate threats (clean)"
          : "Full scan completed — no threats detected (clean scan)",
      sha256Prefix: "00000000",
      sha256Suffix: "00000000",
      timestampUtc: formatUtcTraining(s.completedAt),
      user: "NT AUTHORITY\\SYSTEM",
      processPath: "C:\\Program Files\\Cisco\\AMP\\Endpoint\\scanner.exe",
      localIp: host.internalIp,
      direction: "local",
      disposition: "Clean",
    });
    rows.push({
      id: "scan-sim-start",
      severity: "low",
      eventType:
        s.mode === "flash" ? "Scan job started — Flash scan" : "Scan job started — Full endpoint scan",
      sha256Prefix: "00000000",
      sha256Suffix: "00000000",
      timestampUtc: formatUtcTraining(s.startedAt),
      user: "CORP\\analyst",
      processPath: "C:\\Program Files\\Cisco\\AMP\\Console\\scan-launcher.exe",
      localIp: host.internalIp,
      direction: "local",
      disposition: "Requested",
    });
  }

  return rows;
}

export function mergeEventsForDisplay(
  detectionEvents: CompromiseEvent[],
  scanEvents: CompromiseEvent[]
): CompromiseEvent[] {
  return [...scanEvents, ...detectionEvents].sort((a, b) =>
    b.timestampUtc.localeCompare(a.timestampUtc)
  );
}
