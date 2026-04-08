import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Incident, IncidentStatus, IncidentWork } from "../types";
import { INITIAL_INCIDENTS } from "../data/mockData";

const DEFAULT_WORK: IncidentWork = {
  scan: { status: "idle" },
  comments: [],
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  at: number;
};

export type AppActivity = {
  id: string;
  title: string;
  message: string;
  at: number;
};

export type ResponseActionRecord = {
  id: string;
  incidentId: string;
  hostLine: string;
  nodeLabel: string;
  sha256: string;
  source: string;
  action: "block_sha256" | "isolate_host" | "block_ip";
  actor: string;
  at: number;
};

function cloneIncidents(): Incident[] {
  return JSON.parse(JSON.stringify(INITIAL_INCIDENTS)) as Incident[];
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type SimulatorContextValue = {
  incidents: Incident[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectOnly: (id: string) => void;
  clearSelection: () => void;
  resetAll: () => void;
  beginWork: () => void;
  markResolved: () => void;
  moveToGroup: (groupLabel: string) => void;
  promoteToIncidentManager: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  lastWorkflowAction: { type: string; incidentIds: string[] } | null;
  clearLastWorkflowAction: () => void;
  getIncidentWork: (incidentId: string) => IncidentWork;
  startScan: (incidentId: string, mode: "full" | "flash") => void;
  addIncidentComment: (incidentId: string, text: string) => void;
  addLabIncident: (incident: Incident) => void;
  activityLog: AppActivity[];
  clearActivityLog: () => void;
  responseActions: ResponseActionRecord[];
  logResponseAction: (entry: Omit<ResponseActionRecord, "id" | "at">) => void;
};

const SimulatorContext = createContext<SimulatorContextValue | null>(null);
const RESPONSE_ACTIONS_KEY = "socResponseActionsV1";

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(() => cloneIncidents());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastWorkflowAction, setLastWorkflowAction] = useState<{
    type: string;
    incidentIds: string[];
  } | null>(null);
  const [incidentWork, setIncidentWork] = useState<Record<string, IncidentWork>>({});
  const [activityLog, setActivityLog] = useState<AppActivity[]>([]);
  const [responseActions, setResponseActions] = useState<ResponseActionRecord[]>(() => {
    const raw = localStorage.getItem(RESPONSE_ACTIONS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ResponseActionRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const addNotification = useCallback((title: string, message: string) => {
    window.dispatchEvent(new CustomEvent("sim-activity", { detail: { title, message } }));
    const a: AppActivity = { id: uid(), title, message, at: Date.now() };
    setActivityLog((prev) => [a, ...prev].slice(0, 400));
    const n: AppNotification = {
      id: uid(),
      title,
      message,
      read: false,
      at: Date.now(),
    };
    setNotifications((prev) => [n, ...prev].slice(0, 50));
  }, []);

  const getIncidentWork = useCallback(
    (incidentId: string): IncidentWork => incidentWork[incidentId] ?? DEFAULT_WORK,
    [incidentWork]
  );

  const startScan = useCallback(
    (incidentId: string, mode: "full" | "flash") => {
      setIncidentWork((prev) => {
        const cur = prev[incidentId] ?? DEFAULT_WORK;
        if (cur.scan.status === "scanning") {
          queueMicrotask(() =>
            addNotification("Scan", "A scan is already running on this host. Wait for it to finish.")
          );
          return prev;
        }
        const startedAt = Date.now();
        const delay = mode === "full" ? 4200 : 1600;
        window.setTimeout(() => {
          setIncidentWork((p) => {
            const c = p[incidentId] ?? DEFAULT_WORK;
            return {
              ...p,
              [incidentId]: {
                ...c,
                scan: {
                  status: "clean",
                  mode,
                  startedAt,
                  completedAt: Date.now(),
                },
              },
            };
          });
          addNotification(
            "Scan complete",
            mode === "full"
              ? "Full scan finished — clean. Open Events to see “clean scan” log lines."
              : "Flash scan finished — quick check clean. Open Events for details."
          );
        }, delay);
        return {
          ...prev,
          [incidentId]: {
            ...cur,
            scan: { status: "scanning", mode, startedAt },
          },
        };
      });
    },
    [addNotification]
  );

  const addIncidentComment = useCallback((incidentId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setIncidentWork((prev) => {
      const cur = prev[incidentId] ?? DEFAULT_WORK;
      return {
        ...prev,
        [incidentId]: {
          ...cur,
          comments: [
            { id: uid(), text: t, at: Date.now(), author: "FahimTanzimul" },
            ...cur.comments,
          ],
        },
      };
    });
  }, []);

  const addLabIncident = useCallback((incident: Incident) => {
    setIncidents((prev) => [incident, ...prev]);
    addNotification("Lab incident posted", `${incident.hostLine} was added by instructor and requires attention.`);
  }, [addNotification]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearLastWorkflowAction = useCallback(() => setLastWorkflowAction(null), []);
  const clearActivityLog = useCallback(() => setActivityLog([]), []);
  const logResponseAction = useCallback((entry: Omit<ResponseActionRecord, "id" | "at">) => {
    setResponseActions((prev) => {
      const next: ResponseActionRecord = { ...entry, id: uid(), at: Date.now() };
      const merged = [next, ...prev].slice(0, 1000);
      localStorage.setItem(RESPONSE_ACTIONS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const resetAll = useCallback(() => {
    setIncidents(cloneIncidents());
    setIncidentWork({});
    setSelectedIds(new Set());
    setSearchQuery("");
    setLastWorkflowAction(null);
    setResponseActions([]);
    localStorage.removeItem(RESPONSE_ACTIONS_KEY);
    addNotification("Reset", "All incidents were restored to their starting state.");
  }, [addNotification]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectOnly = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const beginWork = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      addNotification("Begin Work", "Select one or more incidents in Requires Attention first (use the checkbox).");
      return;
    }
    const movable = ids.filter((id) => {
      const inc = incidents.find((i) => i.id === id);
      return inc?.status === "requires_attention";
    });
    if (movable.length === 0) {
      addNotification(
        "Begin Work",
        "Only incidents in Requires Attention can begin work. Switch to that tab and select an open incident."
      );
      return;
    }
    setIncidents((prev) =>
      prev.map((i) =>
        movable.includes(i.id) ? { ...i, status: "in_progress" as const } : i
      )
    );
    setLastWorkflowAction({ type: "begin_work", incidentIds: movable });
    const names = movable
      .map((id) => incidents.find((i) => i.id === id)?.hostLine)
      .filter(Boolean)
      .join(", ");
    addNotification(
      "Moved to In Progress",
      `${movable.length} incident(s) are now In Progress: ${names}. Open the In Progress tab to continue.`
    );
    setSelectedIds(new Set());
  }, [selectedIds, incidents, addNotification]);

  const markResolved = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      addNotification("Mark Resolved", "Select one or more incidents using the checkbox.");
      return;
    }
    const movable = ids.filter((id) => {
      const inc = incidents.find((i) => i.id === id);
      return inc?.status === "requires_attention" || inc?.status === "in_progress";
    });
    if (movable.length === 0) {
      addNotification("Mark Resolved", "Selected incidents are already resolved.");
      return;
    }
    setIncidents((prev) =>
      prev.map((i) =>
        movable.includes(i.id) ? { ...i, status: "resolved" as const } : i
      )
    );
    const names = movable
      .map((id) => incidents.find((i) => i.id === id)?.hostLine)
      .filter(Boolean)
      .join(", ");
    addNotification("Resolved", `Marked resolved: ${names}. Find them under the Resolved tab.`);
    setSelectedIds(new Set());
  }, [selectedIds, incidents, addNotification]);

  const moveToGroup = useCallback(
    (groupLabel: string) => {
      const ids = [...selectedIds];
      if (ids.length === 0) {
        addNotification("Move to Group", "Select at least one incident first.");
        return;
      }
      setIncidents((prev) =>
        prev.map((i) => {
          if (!ids.includes(i.id)) return i;
          return {
            ...i,
            groupName: groupLabel,
            host: { ...i.host, group: groupLabel },
          };
        })
      );
      addNotification("Group updated", `Moved ${ids.length} incident(s) to “${groupLabel}”.`);
    },
    [selectedIds, addNotification]
  );

  const promoteToIncidentManager = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      addNotification("Promote", "Select an incident to promote.");
      return;
    }
    addNotification(
      "Promoted (simulated)",
      `${ids.length} incident(s) sent to Incident Manager queue. (Training flow only — no external system.)`
    );
  }, [selectedIds, addNotification]);

  const value: SimulatorContextValue = {
    incidents,
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelect,
    selectOnly,
    clearSelection,
    resetAll,
    beginWork,
    markResolved,
    moveToGroup,
    promoteToIncidentManager,
    notifications,
    unreadCount,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    lastWorkflowAction,
    clearLastWorkflowAction,
    getIncidentWork,
    startScan,
    addIncidentComment,
    addLabIncident,
    activityLog,
    clearActivityLog,
    responseActions,
    logResponseAction,
  };

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
}

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error("useSimulator must be used within SimulatorProvider");
  return ctx;
}

export function countByStatus(incidents: Incident[], status: IncidentStatus): number {
  return incidents.filter((i) => i.status === status).length;
}
