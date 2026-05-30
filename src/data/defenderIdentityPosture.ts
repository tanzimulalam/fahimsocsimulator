/**
 * Seed data for the Microsoft Defender ITDR (Identity Threat Detection &
 * Response) dashboard. Static, deterministic teaching values matching the
 * reference portal. Mutable bits (insight acknowledgement, hardening checklist)
 * are persisted separately via useLabState under "defender-identity-posture-v1".
 */

export type InsightSeverity = "healthy" | "warning";

export interface IdentityInsight {
  id: string;
  text: string;
  severity: InsightSeverity;
  cta?: { label: string; to: string };
}

export interface DeploymentHealthItem {
  name: string;
  status: "Healthy" | "Needs attention";
}

export interface IdentityPosture {
  population: { cloud: number; onPrem: number; hybrid: number };
  topInsights: IdentityInsight[];
  deploymentHealth: DeploymentHealthItem[];
  identitySecureScorePct: number;
  highlyPrivileged: { globalAdmins: number; securityAdmins: number; taggedSensitive: number };
}

export const IDENTITY_POSTURE: IdentityPosture = {
  population: { cloud: 1209, onPrem: 1010, hybrid: 1024 },
  topInsights: [
    {
      id: "lateral-movement",
      text: "0 users were identified in a risky lateral movement path",
      severity: "healthy",
    },
    {
      id: "dormant-ad",
      text: "7 users are considered dormant in AD and should be removed from sensitive groups",
      severity: "warning",
      cta: { label: "View users and manage configurations", to: "/defender/identities/users?filter=dormant" },
    },
  ],
  deploymentHealth: [
    { name: "Defender for Identity sensors", status: "Healthy" },
    { name: "Entra ID Protection", status: "Healthy" },
    { name: "Domain controller coverage", status: "Needs attention" },
  ],
  identitySecureScorePct: 47.07,
  // TODO reconcile with user catalog — plausible values matching the reference portal
  highlyPrivileged: { globalAdmins: 17, securityAdmins: 5, taggedSensitive: 16 },
};

export interface IdentityHardeningItem {
  id: string;
  text: string;
}

export const IDENTITY_HARDENING: IdentityHardeningItem[] = [
  { id: "h1", text: "Reduce Global Administrators to fewer than 5 break-glass accounts" },
  { id: "h2", text: "Require phishing-resistant MFA for all privileged roles" },
  { id: "h3", text: "Remove dormant accounts from sensitive AD groups" },
  { id: "h4", text: "Enable risk-based Conditional Access policies" },
];

export const IDENTITY_POSTURE_KEY = "defender-identity-posture-v1";

export interface IdentityPostureState {
  dismissedInsights: string[];
  hardeningDone: string[];
}

export const initialIdentityPostureState: IdentityPostureState = {
  dismissedInsights: [],
  hardeningDone: [],
};
