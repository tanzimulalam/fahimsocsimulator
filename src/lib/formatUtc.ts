/** Format epoch ms as `YYYY-MM-DD HH:mm:ss UTC` for simulated logs */
export function formatUtcTraining(ts: number): string {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
