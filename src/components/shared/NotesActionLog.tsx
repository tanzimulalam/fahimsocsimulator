import { useState } from "react";

export type SharedNote = { id?: string; text: string; timestamp: string; authorInitials: string };
export type SharedLogEntry = { id?: string; description: string; timestamp: string; authorInitials: string };

interface NotesActionLogProps {
  notes: SharedNote[];
  actionLog: SharedLogEntry[];
  onAddNote: (text: string) => void;
  /** Context passed to the optional AI note generator (key-gated, degrades gracefully). */
  aiContext?: string;
}

function fmt(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export function NotesActionLog({ notes, actionLog, onAddNote, aiContext }: NotesActionLogProps) {
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  const save = () => {
    if (!draft.trim()) return;
    onAddNote(draft.trim());
    setDraft("");
  };

  const generate = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setAiMsg("AI note generation is optional and disabled (no VITE_OPENAI_API_KEY set). Type your note manually.");
      return;
    }
    setGenerating(true);
    setAiMsg(null);
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a senior SOC analyst. Write one concise, professional investigation note. Output only the note text." },
            { role: "user", content: aiContext ?? "Write an investigation note for this security incident." },
          ],
          max_tokens: 220,
          temperature: 0.7,
        }),
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) setDraft(text);
      else setAiMsg("Could not generate a note. Type one manually.");
    } catch (e) {
      setAiMsg("AI request failed: " + (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="def-incident-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <section className="panel">
        <div className="panel-h">Investigation notes</div>
        <div style={{ padding: 12 }}>
          <textarea
            className="def-query"
            style={{ minHeight: 90 }}
            placeholder="Add an investigation note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={save}>Add note</button>
            <button type="button" className="btn" onClick={generate} disabled={generating}>
              {generating ? "Generating…" : "✨ Generate with AI (optional)"}
            </button>
          </div>
          {aiMsg ? <p className="dash-muted" style={{ fontSize: 12, marginTop: 8 }}>{aiMsg}</p> : null}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {notes.length === 0 ? (
              <p className="dash-muted" style={{ fontSize: 12 }}>No notes yet.</p>
            ) : (
              notes
                .slice()
                .reverse()
                .map((n, i) => (
                  <div key={n.id ?? i} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 10 }}>
                    <div style={{ fontSize: 11, color: "#9aa4b2" }}>
                      Analyst {n.authorInitials} · {fmt(n.timestamp)}
                    </div>
                    <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{n.text}</div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-h">Action log</div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {actionLog.length === 0 ? (
            <p className="dash-muted" style={{ fontSize: 12 }}>No actions taken yet.</p>
          ) : (
            actionLog.map((l, i) => (
              <div key={l.id ?? i} style={{ display: "flex", gap: 10 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {l.authorInitials}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9aa4b2" }}>{fmt(l.timestamp)}</div>
                  <div style={{ fontSize: 13 }}>{l.description}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
