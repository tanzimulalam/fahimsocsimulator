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

export function SocTutorChatbot() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "SOC Tutor ready. Ask about AMP, XDR, Defender, phishing triage, or response actions." },
  ]);
  const location = useLocation();
  const pageHint = useMemo(() => {
    if (location.pathname.startsWith("/xdr")) return "Context: XDR";
    if (location.pathname.startsWith("/defender")) return "Context: Defender";
    return "Context: AMP";
  }, [location.pathname]);

  function send() {
    const q = text.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "bot", text: answerFor(q, location.pathname) }]);
    setText("");
  }

  return (
    <>
      {open ? (
        <div className="soc-chat-panel panel">
          <div className="panel-h">
            SOC Tutor Chatbot
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close chatbot">×</button>
          </div>
          <div className="soc-chat-hint">{pageHint}</div>
          <div className="soc-chat-body">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`soc-chat-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
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
            <button type="button" className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      ) : null}
      <button type="button" className="soc-chat-fab" onClick={() => setOpen((v) => !v)} title="Open SOC Tutor chatbot">
        Tutor
      </button>
    </>
  );
}
