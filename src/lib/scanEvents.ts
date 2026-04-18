import type { CompromiseEvent, HostInfo, IncidentWork } from "../types";
import { formatUtcTraining } from "./formatUtc";
import { anchorsFromFull } from "../data/publicMalwareSamples";

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

  if (s.status === "threats_found" && s.completedAt && s.startedAt) {
    const completedAt = s.completedAt;
    const startedAt = s.startedAt;
    const hashes = (s.pendingThreatHashes ?? []).filter((h): h is string => typeof h === "string" && h.length === 64);
    rows.push({
      id: "scan-sim-threat-summary",
      severity: "high",
      eventType:
        s.mode === "flash"
          ? "Flash scan completed — active threats still present (remediation required)"
          : "Full scan completed — malicious objects still on disk / in memory",
      sha256Prefix: hashes[0] ? anchorsFromFull(hashes[0]).prefix : "00000000",
      sha256Suffix: hashes[0] ? anchorsFromFull(hashes[0]).suffix : "00000000",
      sha256Full: hashes[0],
      timestampUtc: formatUtcTraining(completedAt),
      user: "NT AUTHORITY\\SYSTEM",
      processPath: "C:\\Program Files\\Cisco\\AMP\\Endpoint\\scanner.exe",
      localIp: host.internalIp,
      direction: "local",
      disposition: "Malicious",
      detectionEngine: "Orbital / TETRA (simulated)",
      detectionName: "Post-scan threat review — prior detections not cleared",
    });
    hashes.slice(0, 3).forEach((full, i) => {
      const { prefix, suffix } = anchorsFromFull(full);
      rows.push({
        id: `scan-sim-pending-${i}`,
        severity: "medium",
        eventType: "Threat object pending remediation (post-scan)",
        sha256Prefix: prefix,
        sha256Suffix: suffix,
        sha256Full: full,
        timestampUtc: formatUtcTraining(completedAt),
        user: "NT AUTHORITY\\SYSTEM",
        processPath: "C:\\Program Files\\Cisco\\AMP\\Endpoint\\scanner.exe",
        localIp: host.internalIp,
        direction: "local",
        disposition: "Malicious",
        detectionEngine: "File reputation (simulated)",
      });
    });
    rows.push({
      id: "scan-sim-start-dirty",
      severity: "low",
      eventType:
        s.mode === "flash" ? "Scan job started — Flash scan" : "Scan job started — Full endpoint scan",
      sha256Prefix: "00000000",
      sha256Suffix: "00000000",
      timestampUtc: formatUtcTraining(startedAt),
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
