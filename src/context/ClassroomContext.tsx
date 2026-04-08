import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
};

export type StudentActivity = {
  id: string;
  studentId: string;
  studentName: string;
  action: string;
  details: string;
  at: number;
};

export type StudentNote = {
  studentId: string;
  html: string;
  updatedAt: number;
};

type ClassroomState = {
  students: StudentProfile[];
  scenarios: LabScenario[];
  activities: StudentActivity[];
  notes: Record<string, StudentNote>;
  seenScenarioAt: Record<string, number>;
};

const STORE_KEY = "socClassroomStateV1";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadState(): ClassroomState {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return { students: [], scenarios: [], activities: [], notes: {}, seenScenarioAt: {} };
  try {
    const p = JSON.parse(raw) as ClassroomState;
    return {
      students: p.students ?? [],
      scenarios: p.scenarios ?? [],
      activities: p.activities ?? [],
      notes: p.notes ?? {},
      seenScenarioAt: p.seenScenarioAt ?? {},
    };
  } catch {
    return { students: [], scenarios: [], activities: [], notes: {}, seenScenarioAt: {} };
  }
}

type Ctx = {
  session: ClassroomSession;
  setSession: (s: ClassroomSession) => void;
  students: StudentProfile[];
  scenarios: LabScenario[];
  activities: StudentActivity[];
  notes: Record<string, StudentNote>;
  registerStudent: (name: string) => StudentProfile;
  publishScenario: (data: Omit<LabScenario, "id" | "createdAt" | "createdBy">, by: string) => void;
  addStudentActivity: (action: string, details: string) => void;
  saveStudentNote: (studentId: string, html: string) => void;
  unseenScenariosForStudent: (studentId: string) => LabScenario[];
  markScenariosSeen: (studentId: string) => void;
};

const ClassroomContext = createContext<Ctx | null>(null);

export function ClassroomProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClassroomState>(() => loadState());
  const [session, setSession] = useState<ClassroomSession>(null);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    function onSimActivity(e: Event) {
      const ce = e as CustomEvent<{ title: string; message: string }>;
      if (!session || session.role !== "student") return;
      const d = ce.detail;
      if (!d) return;
      setState((prev) => ({
        ...prev,
        activities: [
          {
            id: uid(),
            studentId: session.studentId,
            studentName: session.name,
            action: d.title,
            details: d.message,
            at: Date.now(),
          },
          ...prev.activities,
        ].slice(0, 2000),
      }));
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
      notes: state.notes,
      registerStudent: (name: string) => {
        const n = name.trim();
        const existing = state.students.find((s) => s.name.toLowerCase() === n.toLowerCase());
        if (existing) return existing;
        const st: StudentProfile = { id: uid(), name: n, createdAt: Date.now() };
        setState((prev) => ({ ...prev, students: [...prev.students, st] }));
        return st;
      },
      publishScenario: (data, by) => {
        setState((prev) => ({
          ...prev,
          scenarios: [{ ...data, id: uid(), createdAt: Date.now(), createdBy: by }, ...prev.scenarios].slice(0, 200),
        }));
      },
      addStudentActivity: (action, details) => {
        if (!session || session.role !== "student") return;
        setState((prev) => ({
          ...prev,
          activities: [
            { id: uid(), studentId: session.studentId, studentName: session.name, action, details, at: Date.now() },
            ...prev.activities,
          ].slice(0, 2000),
        }));
      },
      saveStudentNote: (studentId, html) => {
        setState((prev) => ({ ...prev, notes: { ...prev.notes, [studentId]: { studentId, html, updatedAt: Date.now() } } }));
      },
      unseenScenariosForStudent: (studentId) => {
        const seen = state.seenScenarioAt[studentId] ?? 0;
        return state.scenarios.filter((s) => s.createdAt > seen);
      },
      markScenariosSeen: (studentId) => {
        setState((prev) => ({ ...prev, seenScenarioAt: { ...prev.seenScenarioAt, [studentId]: Date.now() } }));
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

