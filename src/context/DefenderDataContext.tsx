import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import {
  DEFENDER_INCIDENTS,
  type DefenderClassification,
  type DefenderDetermination,
  type DefenderIncidentRecord,
  type DefenderIncidentStatus,
  type DefenderSeverity,
} from "../data/defenderIncidents";
import {
  emptyMutable,
  defenderUid,
  type DefenderIncidentMutable,
  type DefenderIncidentStateMap,
} from "../data/defenderIncidentState";
import { useLabState, analystInitials } from "../lib/useLabState";
import { useSimulator, type ResponseActionKind } from "./SimulatorContext";
import { useClassroom } from "./ClassroomContext";

export type DeviceState = {
  isolated: boolean;
  appRestricted?: boolean;
  packageCollected?: boolean;
  lastAvScan?: string;
};

export type UserState = {
  compromised?: boolean;
  sessionsRevoked?: boolean;
  passwordReset?: boolean;
  safe?: boolean;
};

export type DefenderAssetState = {
  devices: Record<string, DeviceState>;
  users: Record<string, UserState>;
};

export type PendingAction = {
  id: string;
  createdAt: string;
  incidentId?: string;
  entity: string;
  actionLabel: string;
  action: ResponseActionKind;
  description: string;
  source: string;
};

export type CustomDetectionRule = {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: DefenderSeverity;
  enabled: boolean;
  createdAt: string;
  createdFrom: string;
  lastRun?: string;
  matches?: number;
  frequency: string;
  sentinelRuleId?: string;
  pushedToSentinel?: boolean;
};

type DefenderActionInput = {
  incidentId?: string;
  action: ResponseActionKind;
  label: string;
  target: string;
  source: string;
  sha256?: string;
};

type DefenderDataContextValue = {
  incidents: DefenderIncidentRecord[];
  getIncident: (id: string) => DefenderIncidentRecord | undefined;
  getMutable: (id: string) => DefenderIncidentMutable;
  updateIncident: (
    id: string,
    patch: Partial<{
      severity: DefenderSeverity;
      status: DefenderIncidentStatus;
      classification: DefenderClassification;
      determination: DefenderDetermination;
      assignedTo: string | null;
    }>,
    logDescription?: string
  ) => void;
  addIncidentNote: (id: string, text: string) => void;
  logDefenderAction: (input: DefenderActionInput) => void;
  // assets
  assetState: DefenderAssetState;
  getDeviceState: (name: string) => DeviceState;
  getUserState: (upn: string) => UserState;
  setDeviceState: (name: string, patch: Partial<DeviceState>, action: ResponseActionKind, label: string, incidentId?: string) => void;
  setUserState: (upn: string, patch: Partial<UserState>, action: ResponseActionKind, label: string, incidentId?: string) => void;
  // action center
  pendingActions: PendingAction[];
  addPendingAction: (a: Omit<PendingAction, "id" | "createdAt">) => void;
  approvePendingAction: (id: string) => void;
  rejectPendingAction: (id: string) => void;
  // custom detections
  customDetections: CustomDetectionRule[];
  addCustomDetection: (rule: Omit<CustomDetectionRule, "id" | "createdAt" | "enabled">) => CustomDetectionRule;
  toggleCustomDetection: (id: string) => void;
  runCustomDetection: (id: string, matches: number) => void;
  pushDetectionToSentinel: (id: string) => void;
  analyst: string;
};

const DefenderDataContext = createContext<DefenderDataContextValue | null>(null);

const initialAssetState: DefenderAssetState = { devices: {}, users: {} };

function seedPendingActions(): PendingAction[] {
  return [
    {
      id: "PA-seed-1",
      createdAt: "2026-05-29T13:10:00Z",
      incidentId: "DINC-0001",
      entity: "HR-LAPTOP-04",
      actionLabel: "Isolate device",
      action: "isolate_host",
      description: "Automated investigation recommends isolating HR-LAPTOP-04 (AsyncRAT C2 confirmed).",
      source: "Automated investigation",
    },
    {
      id: "PA-seed-2",
      createdAt: "2026-05-29T13:11:00Z",
      incidentId: "DINC-0001",
      entity: "AsyncRAT.exe",
      actionLabel: "Quarantine file",
      action: "block_sha256",
      description: "Automated investigation recommends quarantining AsyncRAT.exe across the tenant.",
      source: "Automated investigation",
    },
    {
      id: "PA-seed-3",
      createdAt: "2026-05-29T03:05:00Z",
      incidentId: "DINC-0006",
      entity: "elena.fisher@contoso.com",
      actionLabel: "Require user to sign in again",
      action: "require_signin",
      description: "Automated investigation recommends revoking sessions for elena.fisher (impossible travel).",
      source: "Automated investigation",
    },
  ];
}

export function DefenderDataProvider({ children }: { children: ReactNode }) {
  const { logResponseAction, addNotification } = useSimulator();
  const { session } = useClassroom();
  const analyst = session?.name ?? "Fahim Tanzimul";
  const initials = analystInitials(session?.name);

  const [incidentState, setIncidentState] = useLabState<DefenderIncidentStateMap>("defender-incidents-v1", {});
  const [assetState, setAssetState] = useLabState<DefenderAssetState>("defender-asset-state-v1", initialAssetState);
  const [pendingActions, setPendingActions] = useLabState<PendingAction[]>("defender-action-center-v1", seedPendingActions);
  const [customDetections, setCustomDetections] = useLabState<CustomDetectionRule[]>("defender-custom-detections-v1", []);

  const getMutable = useCallback(
    (id: string): DefenderIncidentMutable => incidentState[id] ?? emptyMutable(),
    [incidentState]
  );

  const incidents = useMemo<DefenderIncidentRecord[]>(
    () =>
      DEFENDER_INCIDENTS.map((inc) => {
        const m = incidentState[inc.id];
        if (!m) return inc;
        return {
          ...inc,
          severity: m.severity ?? inc.severity,
          status: m.status ?? inc.status,
          classification: m.classification ?? inc.classification,
          determination: m.determination ?? inc.determination,
          assignedTo: m.assignedTo !== undefined ? m.assignedTo : inc.assignedTo,
        };
      }),
    [incidentState]
  );

  const getIncident = useCallback((id: string) => incidents.find((i) => i.id === id), [incidents]);

  const appendLog = useCallback(
    (id: string, description: string, kind: "response" | "manage" | "note" | "alert") => {
      setIncidentState((prev) => {
        const cur = prev[id] ?? emptyMutable();
        return {
          ...prev,
          [id]: {
            ...cur,
            actionLog: [
              { id: defenderUid("log"), description, timestamp: new Date().toISOString(), authorInitials: initials, kind },
              ...cur.actionLog,
            ],
          },
        };
      });
    },
    [setIncidentState, initials]
  );

  const updateIncident: DefenderDataContextValue["updateIncident"] = useCallback(
    (id, patch, logDescription) => {
      setIncidentState((prev) => {
        const cur = prev[id] ?? emptyMutable();
        return { ...prev, [id]: { ...cur, ...patch } };
      });
      if (logDescription) appendLog(id, logDescription, "manage");
    },
    [setIncidentState, appendLog]
  );

  const addIncidentNote: DefenderDataContextValue["addIncidentNote"] = useCallback(
    (id, text) => {
      const t = text.trim();
      if (!t) return;
      setIncidentState((prev) => {
        const cur = prev[id] ?? emptyMutable();
        return {
          ...prev,
          [id]: {
            ...cur,
            notes: [
              ...cur.notes,
              { id: defenderUid("note"), text: t, timestamp: new Date().toISOString(), authorInitials: initials },
            ],
            actionLog: [
              { id: defenderUid("log"), description: "Added investigation note", timestamp: new Date().toISOString(), authorInitials: initials, kind: "note" },
              ...cur.actionLog,
            ],
          },
        };
      });
    },
    [setIncidentState, initials]
  );

  const logDefenderAction: DefenderDataContextValue["logDefenderAction"] = useCallback(
    ({ incidentId, action, label, target, source, sha256 }) => {
      logResponseAction({
        incidentId: incidentId ?? "—",
        hostLine: target,
        nodeLabel: target,
        sha256: sha256 ?? "",
        source,
        action,
        actor: analyst,
        tool: "Microsoft Defender XDR",
        label,
        target,
      });
      if (incidentId) appendLog(incidentId, `${label} — ${target}`, "response");
      addNotification(label, `${target} (Microsoft Defender XDR — simulated)`);
    },
    [logResponseAction, analyst, appendLog, addNotification]
  );

  const getDeviceState = useCallback(
    (name: string): DeviceState => assetState.devices[name] ?? { isolated: false },
    [assetState]
  );
  const getUserState = useCallback((upn: string): UserState => assetState.users[upn] ?? {}, [assetState]);

  const setDeviceState: DefenderDataContextValue["setDeviceState"] = useCallback(
    (name, patch, action, label, incidentId) => {
      setAssetState((prev) => ({
        ...prev,
        devices: { ...prev.devices, [name]: { ...(prev.devices[name] ?? { isolated: false }), ...patch } },
      }));
      logDefenderAction({ incidentId, action, label, target: name, source: "Defender for Endpoint" });
    },
    [setAssetState, logDefenderAction]
  );

  const setUserState: DefenderDataContextValue["setUserState"] = useCallback(
    (upn, patch, action, label, incidentId) => {
      setAssetState((prev) => ({
        ...prev,
        users: { ...prev.users, [upn]: { ...prev.users[upn], ...patch } },
      }));
      logDefenderAction({ incidentId, action, label, target: upn, source: "Defender for Identity" });
    },
    [setAssetState, logDefenderAction]
  );

  const addPendingAction: DefenderDataContextValue["addPendingAction"] = useCallback(
    (a) => {
      setPendingActions((prev) => [
        { ...a, id: defenderUid("PA"), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    },
    [setPendingActions]
  );

  const applyAssetEffect = useCallback(
    (a: PendingAction) => {
      if (a.action === "isolate_host") {
        setAssetState((prev) => ({ ...prev, devices: { ...prev.devices, [a.entity]: { ...(prev.devices[a.entity] ?? { isolated: false }), isolated: true } } }));
      }
      if (a.action === "require_signin" || a.action === "revoke_sessions") {
        setAssetState((prev) => ({ ...prev, users: { ...prev.users, [a.entity]: { ...prev.users[a.entity], sessionsRevoked: true } } }));
      }
      if (a.action === "mark_user_compromised") {
        setAssetState((prev) => ({ ...prev, users: { ...prev.users, [a.entity]: { ...prev.users[a.entity], compromised: true } } }));
      }
    },
    [setAssetState]
  );

  const approvePendingAction: DefenderDataContextValue["approvePendingAction"] = useCallback(
    (id) => {
      setPendingActions((prev) => {
        const a = prev.find((p) => p.id === id);
        if (a) {
          applyAssetEffect(a);
          logDefenderAction({ incidentId: a.incidentId, action: a.action, label: `Approved: ${a.actionLabel}`, target: a.entity, source: a.source });
        }
        return prev.filter((p) => p.id !== id);
      });
    },
    [setPendingActions, applyAssetEffect, logDefenderAction]
  );

  const rejectPendingAction: DefenderDataContextValue["rejectPendingAction"] = useCallback(
    (id) => {
      setPendingActions((prev) => {
        const a = prev.find((p) => p.id === id);
        if (a) {
          logDefenderAction({ incidentId: a.incidentId, action: a.action, label: `Rejected: ${a.actionLabel}`, target: a.entity, source: a.source });
        }
        return prev.filter((p) => p.id !== id);
      });
    },
    [setPendingActions, logDefenderAction]
  );

  const addCustomDetection: DefenderDataContextValue["addCustomDetection"] = useCallback(
    (rule) => {
      const created: CustomDetectionRule = { ...rule, id: defenderUid("CDR"), createdAt: new Date().toISOString(), enabled: true };
      setCustomDetections((prev) => [created, ...prev]);
      addNotification("Custom detection rule created", `${created.name} is now active (simulated).`);
      return created;
    },
    [setCustomDetections, addNotification]
  );

  const toggleCustomDetection: DefenderDataContextValue["toggleCustomDetection"] = useCallback(
    (id) => setCustomDetections((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))),
    [setCustomDetections]
  );

  const runCustomDetection: DefenderDataContextValue["runCustomDetection"] = useCallback(
    (id, matches) =>
      setCustomDetections((prev) =>
        prev.map((r) => (r.id === id ? { ...r, lastRun: new Date().toISOString(), matches } : r))
      ),
    [setCustomDetections]
  );

  const pushDetectionToSentinel: DefenderDataContextValue["pushDetectionToSentinel"] = useCallback(
    (id) => {
      setCustomDetections((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, pushedToSentinel: true, sentinelRuleId: r.sentinelRuleId ?? `AR-DEF-${r.id.slice(-4)}` }
            : r
        )
      );
      addNotification("Sentinel analytic rule created", "A matching scheduled rule was created in Microsoft Sentinel Analytics (simulated).");
    },
    [setCustomDetections, addNotification]
  );

  const value: DefenderDataContextValue = {
    incidents,
    getIncident,
    getMutable,
    updateIncident,
    addIncidentNote,
    logDefenderAction,
    assetState,
    getDeviceState,
    getUserState,
    setDeviceState,
    setUserState,
    pendingActions,
    addPendingAction,
    approvePendingAction,
    rejectPendingAction,
    customDetections,
    addCustomDetection,
    toggleCustomDetection,
    runCustomDetection,
    pushDetectionToSentinel,
    analyst,
  };

  return <DefenderDataContext.Provider value={value}>{children}</DefenderDataContext.Provider>;
}

export function useDefenderData(): DefenderDataContextValue {
  const ctx = useContext(DefenderDataContext);
  if (!ctx) throw new Error("useDefenderData must be used within DefenderDataProvider");
  return ctx;
}
