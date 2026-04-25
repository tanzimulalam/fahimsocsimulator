import type { ResponseActionRecord } from "../context/SimulatorContext";
import type { LabScenario, StudentActivity, StudentProfile } from "../context/ClassroomContext";

export type ClassroomSnapshot = {
  students: StudentProfile[];
  scenarios: LabScenario[];
  activities: StudentActivity[];
  seenScenarioAt: Record<string, number>;
  grades: Record<string, { score: number; comment: string; updatedAt: number }>;
};

const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const apiBaseUrl = rawBase ? rawBase.replace(/\/+$/, "") : "";
export const apiEnabled = apiBaseUrl.length > 0;

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiEnabled) throw new Error("SOC backend API is not configured.");
  const resp = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `SOC backend request failed: ${resp.status}`);
  }
  return (await resp.json()) as T;
}

export const classroomApi = {
  enabled: apiEnabled,
  baseUrl: apiBaseUrl,

  getClassroom() {
    return requestJson<ClassroomSnapshot>("/api/classroom");
  },

  registerStudent(student: StudentProfile) {
    return requestJson<StudentProfile>("/api/students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  },

  publishScenario(scenario: LabScenario) {
    return requestJson<LabScenario>("/api/scenarios", {
      method: "POST",
      body: JSON.stringify(scenario),
    });
  },

  addActivity(data: StudentActivity) {
    return requestJson<StudentActivity>("/api/activity", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  gradeStudent(studentId: string, score: number, comment: string) {
    return requestJson<{ studentId: string; score: number; comment: string; updatedAt: number }>("/api/grades", {
      method: "POST",
      body: JSON.stringify({ studentId, score, comment }),
    });
  },

  markScenariosSeen(studentId: string) {
    return requestJson<{ studentId: string; seenAt: number }>("/api/seen-scenarios", {
      method: "POST",
      body: JSON.stringify({ studentId }),
    });
  },

  deleteStudent(studentId: string) {
    return requestJson<{ ok: true }>(`/api/students/${encodeURIComponent(studentId)}`, {
      method: "DELETE",
    });
  },

  getResponseActions() {
    return requestJson<ResponseActionRecord[]>("/api/response-actions");
  },

  addResponseAction(entry: Omit<ResponseActionRecord, "id" | "at">) {
    return requestJson<ResponseActionRecord>("/api/response-actions", {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },

  clearResponseActions() {
    return requestJson<{ ok: true }>("/api/response-actions", { method: "DELETE" });
  },

  async getLabState<T>(scope: string, key: string): Promise<T | null> {
    const out = await requestJson<{ value: T | null; updatedAt: number }>(
      `/api/lab-state/${encodeURIComponent(scope)}/${encodeURIComponent(key)}`
    );
    return out.value;
  },

  putLabState<T>(scope: string, key: string, value: T) {
    return requestJson<{ scope: string; key: string; updatedAt: number }>(
      `/api/lab-state/${encodeURIComponent(scope)}/${encodeURIComponent(key)}`,
      {
        method: "PUT",
        body: JSON.stringify({ value }),
      }
    );
  },
};
