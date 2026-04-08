export type DefenderInvestigationAction = {
  id: string;
  label: string;
  status: "Pending" | "Approved" | "Remediated";
};

export type DefenderInvestigation = {
  id: string;
  mailId: string;
  subject: string;
  sender: string;
  recipient: string;
  createdAt: number;
  status: "Pending actions" | "In progress" | "Remediated" | "Resolved";
  severity: "High" | "Medium" | "Low";
  verdict: "Malicious" | "Suspicious" | "Clean";
  graphNodes: string[];
  evidence: string[];
  actions: DefenderInvestigationAction[];
  incidentStatus: "Active" | "Resolved";
  classification: "Phishing" | "Malware" | "Clean";
  comment: string;
  linkedIncidentId?: string;
  linkedHostLine?: string;
  history: Array<{ at: number; event: string }>;
};

export const DEFENDER_INVESTIGATIONS_KEY = "defenderInvestigationStateV1";

export function loadDefenderInvestigations(): DefenderInvestigation[] {
  const raw = localStorage.getItem(DEFENDER_INVESTIGATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DefenderInvestigation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDefenderInvestigations(items: DefenderInvestigation[]) {
  localStorage.setItem(DEFENDER_INVESTIGATIONS_KEY, JSON.stringify(items));
}

export function shortId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 6)}${Date.now().toString(16).slice(-4)}`;
}
