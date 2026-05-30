import { classroomApi } from "../lib/apiClient";
import type {
  DefenderClassification,
  DefenderDetermination,
  DefenderIncidentStatus,
  DefenderSeverity,
} from "./defenderIncidents";

/**
 * Mutable, persisted overlay for the static Defender incident catalog.
 * Keyed by incident id. The static catalog stays in code; only analyst-changed
 * fields (status / classification / determination / assignee / notes / action log)
 * live here. Versioned key so future shape changes don't collide.
 */

export type DefenderIncidentNote = {
  id: string;
  text: string;
  timestamp: string;
  authorInitials: string;
};

export type DefenderIncidentLogEntry = {
  id: string;
  description: string;
  timestamp: string;
  authorInitials: string;
  kind: "response" | "manage" | "note" | "alert";
};

export type DefenderIncidentMutable = {
  severity?: DefenderSeverity;
  status?: DefenderIncidentStatus;
  classification?: DefenderClassification;
  determination?: DefenderDetermination;
  assignedTo?: string | null;
  notes: DefenderIncidentNote[];
  actionLog: DefenderIncidentLogEntry[];
};

export type DefenderIncidentStateMap = Record<string, DefenderIncidentMutable>;

export const DEFENDER_INCIDENTS_KEY = "defender-incidents-v1";

export function emptyMutable(): DefenderIncidentMutable {
  return { notes: [], actionLog: [] };
}

export function loadDefenderIncidentState(): DefenderIncidentStateMap {
  const raw = localStorage.getItem(DEFENDER_INCIDENTS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as DefenderIncidentStateMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDefenderIncidentState(state: DefenderIncidentStateMap) {
  localStorage.setItem(DEFENDER_INCIDENTS_KEY, JSON.stringify(state));
  if (classroomApi.enabled) {
    void classroomApi.putLabState("default", DEFENDER_INCIDENTS_KEY, state).catch((err) => {
      console.warn("Failed to sync Defender incident state.", err);
    });
  }
}

export async function loadDefenderIncidentStateFromBackend(): Promise<DefenderIncidentStateMap | null> {
  if (!classroomApi.enabled) return null;
  const state = await classroomApi.getLabState<DefenderIncidentStateMap>("default", DEFENDER_INCIDENTS_KEY);
  if (!state || typeof state !== "object") return null;
  localStorage.setItem(DEFENDER_INCIDENTS_KEY, JSON.stringify(state));
  return state;
}

export function defenderUid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}`;
}
