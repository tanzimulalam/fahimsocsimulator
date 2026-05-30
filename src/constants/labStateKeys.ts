/**
 * Central registry of resettable Defender / Sentinel lab-state keys.
 * The instructor class-reset (SimulatorContext.resetAll) clears every key here
 * from localStorage and (when a backend is configured) from the D1 lab_state table.
 *
 * NEVER add the instructor Notepad keys (socNotepadEditorHtml / socNotepadTemplates)
 * here — those must survive a class reset.
 */
export const DEFENDER_SENTINEL_LAB_KEYS: string[] = [
  // Defender
  "defender-incidents-v1",
  "defenderInvestigationStateV1",
  "defender-asset-state-v1",
  "defender-action-center-v1",
  "defender-alert-tuning-v1",
  "defender-custom-detections-v1",
  "defender-threat-analytics-v1",
  "defender-vuln-v1",
  "defender-cloud-apps-v1",
  "defender-attack-sim-v1",
  "defender-settings-v1",
  "defender-identity-posture-v1",
  // Sentinel
  "sentinel-incidents-v1",
  "sentinel-rules-v1",
  "sentinel-connectors-v1",
  "sentinel-watchlists-v1",
  "sentinel-bookmarks-v1",
  "sentinel-playbook-runs-v1",
  "sentinel-settings-v1",
  // ServiceNow
  "servicenow-tickets-v2",
  // AMP cross-tool blocklist
  "amp-blocklist-v1",
];
