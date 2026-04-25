import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { classroomApi, type ClassroomSnapshot } from "../lib/apiClient";

export type ClassroomSession =
  | { role: "admin"; name: string }
  | { role: "student"; studentId: string; name: string }
  | null;

export type StudentProfile = {
  id: string;
  name: string;
  createdAt: number;
};

export type LabScenario = {
  id: string;
  title: string;
  instructions: string;
  ampSeed: string;
  xdrSeed: string;
  defenderSeed: string;
  createdAt: number;
  createdBy: string;
  startPath?: string;
};

export type StudentActivity = {
  id: string;
  studentId: string;
  studentName: string;
  action: string;
  details: string;
  at: number;
};

type ClassroomState = {
  students: StudentProfile[];
  scenarios: LabScenario[];
  activities: StudentActivity[];
  seenScenarioAt: Record<string, number>;
  grades: Record<string, { score: number; comment: string; updatedAt: number }>;
};

const STORE_KEY = "socClassroomStateV1";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadState(): ClassroomState {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return {
    students: [], scenarios: [], activities: [], seenScenarioAt: {}, grades: {},
  };
  try {
    const p = JSON.parse(raw) as ClassroomState;
    return {
      students: p.students ?? [],
      scenarios: p.scenarios ?? [],
      activities: p.activities ?? [],
      seenScenarioAt: p.seenScenarioAt ?? {},
      grades: p.grades ?? {},
    };
  } catch {
    return {
      students: [], scenarios: [], activities: [], seenScenarioAt: {}, grades: {},
    };
  }
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  local.forEach((item) => map.set(item.id, item));
  remote.forEach((item) => map.set(item.id, item));
  return [...map.values()];
}

function mergeClassroomState(local: ClassroomState, remote: ClassroomSnapshot): ClassroomState {
  return {
    students: mergeById(local.students, remote.students ?? []).sort((a, b) => a.createdAt - b.createdAt),
    scenarios: mergeById(local.scenarios, remote.scenarios ?? [])
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 200),
    activities: mergeById(local.activities, remote.activities ?? [])
      .sort((a, b) => b.at - a.at)
      .slice(0, 2000),
    seenScenarioAt: { ...local.seenScenarioAt, ...(remote.seenScenarioAt ?? {}) },
    grades: { ...local.grades, ...(remote.grades ?? {}) },
  };
}

type Ctx = {
  session: ClassroomSession;
  setSession: (s: ClassroomSession) => void;
  students: StudentProfile[];
  scenarios: LabScenario[];
  activities: StudentActivity[];
  grades: Record<string, { score: number; comment: string; updatedAt: number }>;
  registerStudent: (name: string) => StudentProfile;
  publishScenario: (data: Omit<LabScenario, "id" | "createdAt" | "createdBy">, by: string) => void;
  addStudentActivity: (action: string, details: string) => void;
  gradeStudent: (studentId: string, score: number, comment: string) => void;
  unseenScenariosForStudent: (studentId: string) => LabScenario[];
  markScenariosSeen: (studentId: string) => void;
  deleteStudent: (studentId: string) => void;
};

const ClassroomContext = createContext<Ctx | null>(null);

export function ClassroomProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClassroomState>(() => loadState());
  const [session, setSession] = useState<ClassroomSession>(null);

  useEffect(() => {
    if (!classroomApi.enabled) return;
    let cancelled = false;
    void classroomApi
      .getClassroom()
      .then((remote) => {
        if (!cancelled) setState((local) => mergeClassroomState(local, remote));
      })
      .catch((err) => {
        console.warn("SOC backend unavailable; using local classroom state.", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    function onSimActivity(e: Event) {
      const ce = e as CustomEvent<{ title: string; message: string }>;
      if (!session || session.role !== "student") return;
      const d = ce.detail;
      if (!d) return;
      const activity: StudentActivity = {
        id: uid(),
        studentId: session.studentId,
        studentName: session.name,
        action: d.title,
        details: d.message,
        at: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        activities: [activity, ...prev.activities].slice(0, 2000),
      }));
      if (classroomApi.enabled) {
        void classroomApi.addActivity(activity).catch((err) => {
          console.warn("Failed to sync student activity.", err);
        });
      }
    }
    window.addEventListener("sim-activity", onSimActivity as EventListener);
    return () => window.removeEventListener("sim-activity", onSimActivity as EventListener);
  }, [session]);

  const value: Ctx = useMemo(
    () => ({
      session,
      setSession,
      students: state.students,
      scenarios: state.scenarios,
      activities: state.activities,
      grades: state.grades,
      registerStudent: (name: string) => {
        const n = name.trim();
        const existing = state.students.find((s) => s.name.toLowerCase() === n.toLowerCase());
        if (existing) return existing;
        const st: StudentProfile = { id: uid(), name: n, createdAt: Date.now() };
        setState((prev) => ({ ...prev, students: [...prev.students, st] }));
        if (classroomApi.enabled) {
          void classroomApi.registerStudent(st).catch((err) => {
            console.warn("Failed to sync student registration.", err);
          });
        }
        return st;
      },
      publishScenario: (data, by) => {
        const scenario: LabScenario = { ...data, id: uid(), createdAt: Date.now(), createdBy: by };
        setState((prev) => ({
          ...prev,
          scenarios: [scenario, ...prev.scenarios].slice(0, 200),
        }));
        if (classroomApi.enabled) {
          void classroomApi.publishScenario(scenario).catch((err) => {
            console.warn("Failed to sync published scenario.", err);
          });
        }
      },
      addStudentActivity: (action, details) => {
        if (!session || session.role !== "student") return;
        const activity: StudentActivity = {
          id: uid(),
          studentId: session.studentId,
          studentName: session.name,
          action,
          details,
          at: Date.now(),
        };
        setState((prev) => ({
          ...prev,
          activities: [activity, ...prev.activities].slice(0, 2000),
        }));
        if (classroomApi.enabled) {
          void classroomApi.addActivity(activity).catch((err) => {
            console.warn("Failed to sync student activity.", err);
          });
        }
      },
      gradeStudent: (studentId, score, comment) => {
        const updatedAt = Date.now();
        setState((prev) => ({
          ...prev,
          grades: { ...prev.grades, [studentId]: { score, comment, updatedAt } },
        }));
        if (classroomApi.enabled) {
          void classroomApi.gradeStudent(studentId, score, comment).catch((err) => {
            console.warn("Failed to sync grade.", err);
          });
        }
      },
      unseenScenariosForStudent: (studentId) => {
        const seen = state.seenScenarioAt[studentId] ?? 0;
        return state.scenarios.filter((s) => s.createdAt > seen);
      },
      markScenariosSeen: (studentId) => {
        const seenAt = Date.now();
        setState((prev) => ({ ...prev, seenScenarioAt: { ...prev.seenScenarioAt, [studentId]: seenAt } }));
        if (classroomApi.enabled) {
          void classroomApi.markScenariosSeen(studentId).catch((err) => {
            console.warn("Failed to sync scenario seen marker.", err);
          });
        }
      },
      deleteStudent: (studentId) => {
        setState((prev) => {
          const students = prev.students.filter((s) => s.id !== studentId);
          const activities = prev.activities.filter((a) => a.studentId !== studentId);
          const grades = { ...prev.grades };
          const seenScenarioAt = { ...prev.seenScenarioAt };
          delete grades[studentId];
          delete seenScenarioAt[studentId];
          return { ...prev, students, activities, grades, seenScenarioAt };
        });
        if (classroomApi.enabled) {
          void classroomApi.deleteStudent(studentId).catch((err) => {
            console.warn("Failed to sync deleted student.", err);
          });
        }
      },
    }),
    [session, state]
  );

  return <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>;
}

export function useClassroom() {
  const c = useContext(ClassroomContext);
  if (!c) throw new Error("useClassroom must be used within ClassroomProvider");
  return c;
}

