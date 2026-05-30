import type { SentinelSeverity } from "./sentinelData";
import type { SentinelCloseClassification, SentinelStatus } from "./sentinelIncidents";

/**
 * Mutable per-incident Sentinel state (status, owner, severity, close info,
 * comments, action log). The static catalog stays in code; only these mutable
 * parts are persisted via useLabState under "sentinel-incidents-v1".
 */

export interface SentinelComment {
  id: string;
  text: string;
  timestamp: string;
  authorInitials: string;
}

export interface SentinelLogEntry {
  id: string;
  description: string;
  timestamp: string;
  authorInitials: string;
}

export interface SentinelIncidentMutable {
  severity?: SentinelSeverity;
  status?: SentinelStatus;
  owner?: string | null;
  closeClassification?: SentinelCloseClassification;
  closeReason?: string;
  comments: SentinelComment[];
  actionLog: SentinelLogEntry[];
}

export type SentinelIncidentStateMap = Record<string, SentinelIncidentMutable>;

export function emptySentinelMutable(): SentinelIncidentMutable {
  return { comments: [], actionLog: [] };
}

let counter = 0;
export function sentinelUid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
