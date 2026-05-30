import type { SnEmail } from "../../data/serviceNowTickets";

export function ServiceNowEmailViewer({ email, onClose }: { email: SnEmail, onClose: () => void }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ backgroundColor: "#110e24", width: 800, maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, display: "flex", flexDirection: "column", border: "1px solid #3b3366" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #3b3366", backgroundColor: "#181531" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Email Message</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#e6e6e6", fontSize: 20, cursor: "pointer" }}>&times;</button>
        </div>
        
        <div style={{ padding: 20, borderBottom: "1px solid #3b3366", backgroundColor: "#1b1736", fontSize: 13 }}>
          <div style={{ marginBottom: 8 }}><strong>From:</strong> {email.from}</div>
          <div style={{ marginBottom: 8 }}><strong>Date:</strong> {email.date}</div>
          <div style={{ marginBottom: 8 }}><strong>To:</strong> {email.to}</div>
          <div><strong>Subject:</strong> {email.subject}</div>
        </div>

        <div style={{ padding: 20, flex: 1, overflowY: "auto", backgroundColor: "white", color: "black" }}>
          <div dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
        </div>
      </div>
    </div>
  );
}
