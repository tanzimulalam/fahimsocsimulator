// Shadow-IT discovery seed (ties to Class-5 Shadow IT / Umbrella concepts).
export type CloudAppCategory = "Cloud storage" | "Generative AI" | "Collaboration" | "Webmail" | "Code hosting";

export interface DiscoveredApp {
  id: string;
  name: string;
  category: CloudAppCategory;
  riskScore: number; // 1-10
  users: number;
  trafficMb: number;
  compliance: "Compliant" | "Review" | "Non-compliant";
}

export const DISCOVERED_APPS: DiscoveredApp[] = [
  { id: "app-mega", name: "MEGA", category: "Cloud storage", riskScore: 3, users: 14, trafficMb: 4200, compliance: "Non-compliant" },
  { id: "app-dropbox", name: "Dropbox", category: "Cloud storage", riskScore: 7, users: 62, trafficMb: 9100, compliance: "Review" },
  { id: "app-chatgpt", name: "ChatGPT", category: "Generative AI", riskScore: 6, users: 130, trafficMb: 2200, compliance: "Review" },
  { id: "app-deepseek", name: "DeepSeek", category: "Generative AI", riskScore: 2, users: 9, trafficMb: 310, compliance: "Non-compliant" },
  { id: "app-telegram", name: "Telegram Web", category: "Collaboration", riskScore: 4, users: 21, trafficMb: 880, compliance: "Non-compliant" },
  { id: "app-slack", name: "Slack", category: "Collaboration", riskScore: 8, users: 88, trafficMb: 5400, compliance: "Compliant" },
  { id: "app-protonmail", name: "Proton Mail", category: "Webmail", riskScore: 5, users: 7, trafficMb: 140, compliance: "Review" },
  { id: "app-github", name: "GitHub", category: "Code hosting", riskScore: 9, users: 44, trafficMb: 3300, compliance: "Compliant" },
  { id: "app-wetransfer", name: "WeTransfer", category: "Cloud storage", riskScore: 3, users: 18, trafficMb: 2700, compliance: "Non-compliant" },
];

export type CloudAppStatus = "sanctioned" | "unsanctioned";

export interface AppControlPolicy {
  id: string;
  name: string;
  target: string; // app or category
  action: "Block" | "Monitor" | "Warn";
  createdAt: string;
}

export interface CloudAppsState {
  status: Record<string, CloudAppStatus>;
  policies: AppControlPolicy[];
}

export const CLOUD_APPS_KEY = "defender-cloud-apps-v1";
export const initialCloudAppsState: CloudAppsState = { status: {}, policies: [] };
