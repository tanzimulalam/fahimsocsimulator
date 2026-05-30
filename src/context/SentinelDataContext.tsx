import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import {
  SENTINEL_INCIDENTS,
  type SentinelCloseClassification,
  type SentinelIncident,
  type SentinelStatus,
} from "../data/sentinelIncidents";
import { SENTINEL_RULES, type AnalyticRule, type SentinelSeverity } from "../data/sentinelData";
import {
  emptySentinelMutable,
  sentinelUid,
  type SentinelIncidentMutable,
  type SentinelIncidentStateMap,
} from "../data/sentinelState";
import { useLabState, analystInitials } from "../lib/useLabState";
import { useSimulator } from "./SimulatorContext";
import { useClassroom } from "./ClassroomContext";

export type SentinelBookmark = {
  id: string;
  query: string;
  table: string;
  note: string;
  createdAt: string;
  incidentId?: string;
};

export type PlaybookRun = {
  id: string;
  playbookId: string;
  playbookName: string;
  target: string;
  incidentId?: string;
  timestamp: string;
  authorInitials: string;
};

type SentinelDataContextValue = {
  incidents: SentinelIncident[];
  getIncident: (id: string) => SentinelIncident | undefined;
  getMutable: (id: string) => SentinelIncidentMutable;
  updateIncident: (
    id: string,
    patch: Partial<{ severity: SentinelSeverity; status: SentinelStatus; owner: string | null }>,
    logDescription?: string
  ) => void;
  closeIncident: (id: string, classification: SentinelCloseClassification, reason: string) => void;
  addComment: (id: string, text: string) => void;
  // analytic rules
  rules: AnalyticRule[];
  toggleRule: (id: string) => void;
  runRule: (id: string) => void;
  // bookmarks
  bookmarks: SentinelBookmark[];
  addBookmark: (b: Omit<SentinelBookmark, "id" | "createdAt">) => void;
  // connectors
  connectorOverrides: Record<string, "Connected" | "Disconnected">;
  toggleConnector: (id: string, current: "Connected" | "Disconnected") => void;
  // playbooks
  playbookRuns: PlaybookRun[];
  runPlaybook: (playbookId: string, playbookName: string, target: string, incidentId?: string) => void;
  analyst: string;
};

const SentinelDataContext = createContext<SentinelDataContextValue | null>(null);

type RuleOverride = { enabled?: boolean; incidentsCreated?: number };

export function SentinelDataProvider({ children }: { children: ReactNode }) {
  const { logResponseAction, addNotification } = useSimulator();
  const { session } = useClassroom();
  const analyst = session?.name ?? "Fahim Tanzimul";
  const initials = analystInitials(session?.name);

  const [incidentState, setIncidentState] = useLabState<SentinelIncidentStateMap>("sentinel-incidents-v1", {});
  const [ruleOverrides, setRuleOverrides] = useLabState<Record<string, RuleOverride>>("sentinel-rules-v1", {});
  const [connectorOverrides, setConnectorOverrides] = useLabState<Record<string, "Connected" | "Disconnected">>("sentinel-connectors-v1", {});
  const [bookmarks, setBookmarks] = useLabState<SentinelBookmark[]>("sentinel-bookmarks-v1", []);
  const [playbookRuns, setPlaybookRuns] = useLabState<PlaybookRun[]>("sentinel-playbook-runs-v1", []);

  const incidents = useMemo<SentinelIncident[]>(
    () =>
      SENTINEL_INCIDENTS.map((inc) => {
        const m = incidentState[inc.id];
        if (!m) return inc;
        return {
          ...inc,
          severity: m.severity ?? inc.severity,
          status: m.status ?? inc.status,
          owner: m.owner !== undefined ? m.owner : inc.owner,
          closeClassification: m.closeClassification ?? inc.closeClassification,
        };
      }),
    [incidentState]
  );

  const getIncident = useCallback((id: string) => incidents.find((i) => i.id === id), [incidents]);
  const getMutable = useCallback(
    (id: string): SentinelIncidentMutable => incidentState[id] ?? emptySentinelMutable(),
    [incidentState]
  );

  const appendLog = useCallback(
    (id: string, description: string) => {
      setIncidentState((prev) => {
        const cur = prev[id] ?? emptySentinelMutable();
        return {
          ...prev,
          [id]: {
            ...cur,
            actionLog: [
              { id: sentinelUid("log"), description, timestamp: new Date().toISOString(), authorInitials: initials },
              ...cur.actionLog,
            ],
          },
        };
      });
    },
    [setIncidentState, initials]
  );

  const updateIncident: SentinelDataContextValue["updateIncident"] = useCallback(
    (id, patch, logDescription) => {
      setIncidentState((prev) => {
        const cur = prev[id] ?? emptySentinelMutable();
        return { ...prev, [id]: { ...cur, ...patch } };
      });
      if (logDescription) appendLog(id, logDescription);
    },
    [setIncidentState, appendLog]
  );

  const closeIncident: SentinelDataContextValue["closeIncident"] = useCallback(
    (id, classification, reason) => {
      setIncidentState((prev) => {
        const cur = prev[id] ?? emptySentinelMutable();
        return {
          ...prev,
          [id]: {
            ...cur,
            status: "Closed",
            closeClassification: classification,
            closeReason: reason,
            actionLog: [
              { id: sentinelUid("log"), description: `Closed incident as ${classification}${reason ? ` — ${reason}` : ""}`, timestamp: new Date().toISOString(), authorInitials: initials },
              ...cur.actionLog,
            ],
          },
        };
      });
      addNotification("Incident closed", `${id} closed as ${classification} (Microsoft Sentinel — simulated).`);
    },
    [setIncidentState, initials, addNotification]
  );

  const addComment: SentinelDataContextValue["addComment"] = useCallback(
    (id, text) => {
      const t = text.trim();
      if (!t) return;
      setIncidentState((prev) => {
        const cur = prev[id] ?? emptySentinelMutable();
        return {
          ...prev,
          [id]: {
            ...cur,
            comments: [...cur.comments, { id: sentinelUid("c"), text: t, timestamp: new Date().toISOString(), authorInitials: initials }],
          },
        };
      });
    },
    [setIncidentState, initials]
  );

  const rules = useMemo<AnalyticRule[]>(
    () =>
      SENTINEL_RULES.map((r) => {
        const o = ruleOverrides[r.id];
        if (!o) return r;
        return {
          ...r,
          enabled: o.enabled !== undefined ? o.enabled : r.enabled,
          incidentsCreated: o.incidentsCreated !== undefined ? o.incidentsCreated : r.incidentsCreated,
        };
      }),
    [ruleOverrides]
  );

  const toggleRule: SentinelDataContextValue["toggleRule"] = useCallback(
    (id) => {
      setRuleOverrides((prev) => {
        const base = SENTINEL_RULES.find((r) => r.id === id);
        const curEnabled = prev[id]?.enabled ?? base?.enabled ?? false;
        return { ...prev, [id]: { ...prev[id], enabled: !curEnabled } };
      });
    },
    [setRuleOverrides]
  );

  const runRule: SentinelDataContextValue["runRule"] = useCallback(
    (id) => {
      setRuleOverrides((prev) => {
        const base = SENTINEL_RULES.find((r) => r.id === id);
        const cur = prev[id]?.incidentsCreated ?? base?.incidentsCreated ?? 0;
        return { ...prev, [id]: { ...prev[id], incidentsCreated: cur + 1 } };
      });
      addNotification("Analytic rule run", "Rule executed; matching results would create or update an incident (simulated).");
    },
    [setRuleOverrides, addNotification]
  );

  const addBookmark: SentinelDataContextValue["addBookmark"] = useCallback(
    (b) => {
      setBookmarks((prev) => [{ ...b, id: sentinelUid("bm"), createdAt: new Date().toISOString() }, ...prev]);
      addNotification("Hunting bookmark saved", "Result bookmarked for later investigation (simulated).");
    },
    [setBookmarks, addNotification]
  );

  const toggleConnector: SentinelDataContextValue["toggleConnector"] = useCallback(
    (id, current) => setConnectorOverrides((prev) => ({ ...prev, [id]: current === "Connected" ? "Disconnected" : "Connected" })),
    [setConnectorOverrides]
  );

  const runPlaybook: SentinelDataContextValue["runPlaybook"] = useCallback(
    (playbookId, playbookName, target, incidentId) => {
      setPlaybookRuns((prev) => [
        { id: sentinelUid("run"), playbookId, playbookName, target, incidentId, timestamp: new Date().toISOString(), authorInitials: initials },
        ...prev,
      ]);
      logResponseAction({
        incidentId: incidentId ?? "—",
        hostLine: target,
        nodeLabel: target,
        sha256: "",
        source: "Microsoft Sentinel — Automation",
        action: "playbook_run",
        actor: analyst,
        tool: "Microsoft Sentinel",
        label: `Playbook: ${playbookName}`,
        target,
      });
      if (incidentId) appendLog(incidentId, `Ran playbook "${playbookName}" on ${target}`);
      addNotification("Playbook executed", `${playbookName} ran against ${target} (Microsoft Sentinel — simulated).`);
    },
    [setPlaybookRuns, initials, logResponseAction, analyst, appendLog, addNotification]
  );

  const value: SentinelDataContextValue = {
    incidents,
    getIncident,
    getMutable,
    updateIncident,
    closeIncident,
    addComment,
    rules,
    toggleRule,
    runRule,
    bookmarks,
    addBookmark,
    connectorOverrides,
    toggleConnector,
    playbookRuns,
    runPlaybook,
    analyst,
  };

  return <SentinelDataContext.Provider value={value}>{children}</SentinelDataContext.Provider>;
}

export function useSentinelData(): SentinelDataContextValue {
  const ctx = useContext(SentinelDataContext);
  if (!ctx) throw new Error("useSentinelData must be used within SentinelDataProvider");
  return ctx;
}
