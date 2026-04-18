import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

type Msg = { role: "user" | "bot"; text: string };

function answerFor(question: string, path: string): string {
  const q = question.toLowerCase();
  if (q.includes("block") && q.includes("allow")) {
    return "Block when confidence is high and behavior is malicious. Allow when file is signed/common and behavior is clean. If uncertain, isolate host first and collect more evidence.";
  }
  if (q.includes("xdr") || q.includes("investigate")) {
    return "XDR workflow: select incident -> inspect node verdict + confidence -> apply response action -> verify action appears in Response Ledger -> pivot back to AMP Inbox for host-level follow-up.";
  }
  if (q.includes("defender") || q.includes("explorer") || q.includes("email")) {
    return "Defender flow: Explorer preview -> Start investigation -> review graph/evidence -> approve pending actions -> mark remediated -> resolve incident with classification/comment.";
  }
  if (q.includes("amp") || q.includes("secure endpoint")) {
    return "AMP flow: open inbox incident, begin work, inspect observables and trajectories, run scan, document reasoning, and mark incident resolved when containment is complete.";
  }
  if (q.includes("phishing")) {
    return "For phishing labs, validate sender authenticity, inspect URL domain/path, check attachment type, then decide release/delete/quarantine based on combined evidence.";
  }
  if (q.includes("mitre") || q.includes("ttp")) {
    return "Map observed behavior to ATT&CK techniques (e.g., T1566 phishing, T1059 command execution, T1071 C2 traffic) to explain attacker progression.";
  }
  if (q.includes("what page") || q.includes("where am i")) {
    if (path.startsWith("/xdr")) return "You are in Cisco XDR simulator. Use Investigate for node triage and response actions.";
    if (path.startsWith("/defender")) return "You are in Microsoft Defender simulator. Use Explorer and Investigations for email incident lifecycle.";
    return "You are in AMP simulator. Use Inbox for incident triage and workflows.";
  }
  return "Good question. In this lab, explain your decision using: severity, confidence, prevalence, behavior, and blast radius. Then take the least risky action that still contains the threat.";
}

function parseChatContent(data: unknown): string | null {
  const d = data as { choices?: Array<{ message?: { content?: string } }> };
  return d.choices?.[0]?.message?.content?.trim() ?? null;
}

export function SocTutorChatbot() {
  const tutorApiUrl = (import.meta.env.VITE_TUTOR_API_URL as string | undefined)?.trim();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "SOC Tutor ready. Ask about AMP, XDR, Defender, phishing triage, or response actions." },
  ]);
  const location = useLocation();
  const pageHint = useMemo(() => {
    if (location.pathname.startsWith("/xdr")) return "Context: XDR";
    if (location.pathname.startsWith("/defender")) return "Context: Defender";
    return "Context: AMP";
  }, [location.pathname]);

  const transportHint = useMemo(() => {
    if (tutorApiUrl) return "Tutor: live (HTTPS proxy)";
    if (import.meta.env.DEV) return "Tutor: live (dev proxy) — use OPENAI_API_KEY or VITE_OPENAI_API_KEY in .env";
    return "Tutor: offline — browsers cannot call OpenAI directly; set GitHub Variable VITE_TUTOR_API_URL to your Worker URL (see README)";
  }, [tutorApiUrl]);

  async function askOnline(question: string): Promise<string | null> {
    const context =
      location.pathname.startsWith("/xdr")
        ? "XDR Investigate workflow, response actions, and IOC triage."
        : location.pathname.startsWith("/defender")
          ? "Microsoft Defender Explorer and Investigations lifecycle."
          : "Cisco AMP incident triage workflow.";

    const body = JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a SOC training tutor for AMP, Cisco XDR, and Microsoft Defender labs. Give concise, practical analyst guidance, explain why an action is chosen, and map answers to triage workflows.",
        },
        {
          role: "user",
          content: `Page context: ${context}\nQuestion: ${question}`,
        },
      ],
    });

    // Production (and recommended): HTTPS proxy — OpenAI blocks browser CORS on direct calls.
    if (tutorApiUrl) {
      const resp = await fetch(tutorApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!resp.ok) return null;
      const data = (await resp.json()) as unknown;
      return parseChatContent(data);
    }

    // Dev only: Vite proxies /__openai -> api.openai.com with server-side Authorization.
    if (import.meta.env.DEV) {
      const resp = await fetch("/__openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!resp.ok) return null;
      const data = (await resp.json()) as unknown;
      return parseChatContent(data);
    }

    return null;
  }

  async function send() {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setText("");
    setLoading(true);
    try {
      const online = await askOnline(q);
      const out = online ?? answerFor(q, location.pathname);
      setMessages((prev) => [...prev, { role: "bot", text: out }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: answerFor(q, location.pathname) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open ? (
        <div className="soc-chat-panel panel">
          <div className="panel-h">
            SOC Tutor Chatbot
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close chatbot">×</button>
          </div>
          <div className="soc-chat-hint">
            {pageHint}
            <span className="soc-chat-transport"> · {transportHint}</span>
          </div>
          <div className="soc-chat-body">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`soc-chat-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading ? <div className="soc-chat-msg bot">Thinking...</div> : null}
          </div>
          <div className="soc-chat-input-row">
            <input
              className="search-input"
              placeholder="Ask a cybersecurity question..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button type="button" className="btn btn-primary" onClick={send} disabled={loading}>Send</button>
          </div>
        </div>
      ) : null}
      <button type="button" className="soc-chat-fab" onClick={() => setOpen((v) => !v)} title="Open SOC Tutor chatbot">
        Tutor
      </button>
    </>
  );
}
