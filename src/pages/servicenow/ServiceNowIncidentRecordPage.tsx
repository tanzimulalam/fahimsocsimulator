import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  loadServiceNowTickets,
  saveServiceNowTickets,
  derivePriority,
  type SnTicket,
  type SnImpact,
  type SnUrgency,
  type SnState,
  type SnResolutionCode,
  type SnActivityEntry,
  type SnEmail
} from "../../data/serviceNowTickets";
import { applyTicketBlocklist, getBlockedEntries, isBlocked } from "../../data/ampBlocklist";
import { useClassroom } from "../../context/ClassroomContext";
import { useSimulator } from "../../context/SimulatorContext";
import { ServiceNowEmailViewer } from "../../components/servicenow/ServiceNowEmailViewer";
import { ServiceNowSpreadsheetViewer } from "../../components/servicenow/ServiceNowSpreadsheetViewer";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ServiceNowIncidentRecordPage() {
  const { number } = useParams();
  const navigate = useNavigate();
  const { session, students } = useClassroom();
  const { addNotification, logResponseAction } = useSimulator();

  const [ticket, setTicket] = useState<SnTicket | null>(null);
  const [activeTab, setActiveTab] = useState("notes");
  const [viewingEmail, setViewingEmail] = useState<SnEmail | null>(null);
  const [viewingSpreadsheet, setViewingSpreadsheet] = useState<string | null>(null);

  // Editable fields
  const [impact, setImpact] = useState<SnImpact>("3 - Low");
  const [urgency, setUrgency] = useState<SnUrgency>("3 - Low");
  const [state, setState] = useState<SnState>("New");
  const [assignmentGroup, setAssignmentGroup] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // Resolution info
  const [resolutionCode, setResolutionCode] = useState<SnResolutionCode | "">("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Notes inputs
  const [workNotes, setWorkNotes] = useState("");
  const [comments, setComments] = useState("");

  const initials = session?.name ? session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'SA';
  const authorName = session?.name || "System Administrator";

  useEffect(() => {
    const all = loadServiceNowTickets();
    const found = all.find(t => t.number === number);
    if (found) {
      setTicket(found);
      setImpact(found.impact);
      setUrgency(found.urgency);
      setState(found.state);
      setAssignmentGroup(found.assignmentGroup);
      setAssignedTo(found.assignedTo);
      setResolutionCode(found.resolutionCode || "");
      setResolutionNotes(found.resolutionNotes || "");
    }
  }, [number]);

  if (!ticket) return <div className="sn-loading">Loading ticket…</div>;

  const derivedPriority = derivePriority(impact, urgency);
  const ampDomains = [
    ...(ticket.ampPreBlockedDomains ?? []),
    ...(ticket.ampBlocklist?.domains ?? []),
  ];
  const hubspotBlocked = ampDomains.includes("hubspot.com") && isBlocked("hubspot.com", "domain");

  const handleSave = (returnToList = false) => {
    // Check resolve conditions
    if (state === "Resolved" && ticket.state !== "Resolved") {
      if (!resolutionCode || !resolutionNotes.trim()) {
        addNotification("Validation Error", "Resolution code and notes are required to resolve an incident.");
        setActiveTab("resolution");
        return;
      }
    }

    const all = loadServiceNowTickets();
    const idx = all.findIndex(t => t.number === ticket.number);
    if (idx === -1) return;

    const ts = new Date().toLocaleString("en-US", { hour12: true });
    
    // Determine field changes
    const newActivities: SnActivityEntry[] = [];
    
    const trackChange = (field: string, oldV: string, newV: string) => {
      if (oldV !== newV) {
        newActivities.push({
          id: uid(),
          timestamp: ts,
          type: "field_change",
          authorName,
          authorInitials: initials,
          field,
          oldValue: oldV,
          newValue: newV
        });
      }
    };

    trackChange("Impact", ticket.impact, impact);
    trackChange("Urgency", ticket.urgency, urgency);
    trackChange("Priority", ticket.priority, derivedPriority);
    trackChange("State", ticket.state, state);
    trackChange("Assignment group", ticket.assignmentGroup, assignmentGroup);
    trackChange("Assigned to", ticket.assignedTo, assignedTo);

    let resolvedBy = ticket.resolvedBy;
    let resolvedAt = ticket.resolvedAt;

    if (state === "Resolved" && ticket.state !== "Resolved") {
      resolvedBy = authorName;
      resolvedAt = ts;

      newActivities.push({
        id: uid(),
        timestamp: ts,
        type: "field_change",
        authorName,
        authorInitials: initials,
        field: "Resolution code",
        oldValue: ticket.resolutionCode ?? "",
        newValue: resolutionCode,
      });
      newActivities.push({
        id: uid(),
        timestamp: ts,
        type: "field_change",
        authorName,
        authorInitials: initials,
        field: "Resolution notes",
        oldValue: ticket.resolutionNotes ?? "",
        newValue: resolutionNotes,
      });

      newActivities.push({
        id: uid(),
        timestamp: ts,
        type: "email",
        authorName: "System",
        authorInitials: "SYS",
        subject: `${ticket.number}: Incident Resolved For - ${ticket.shortDescription}`,
        emailDetails: {
          from: "Data Group Help Desk",
          date: ts,
          to: ticket.email,
          subject: `${ticket.number}: Incident Resolved For - ${ticket.shortDescription}`,
          bodyHtml: `<p>Your incident ${ticket.number} has been resolved.</p><p>Resolution Notes:</p><p>${resolutionNotes}</p>`,
        },
      });

      addNotification("Incident Resolved", `Ticket ${ticket.number} marked resolved.`);
    }

    const updatedTicket: SnTicket = {
      ...ticket,
      impact,
      urgency,
      priority: derivedPriority,
      state,
      assignmentGroup,
      assignedTo,
      resolutionCode: resolutionCode as SnResolutionCode,
      resolutionNotes,
      resolvedBy,
      resolvedAt,
      activities: [...newActivities, ...ticket.activities],
    };

    all[idx] = updatedTicket;
    saveServiceNowTickets(all);
    setTicket(updatedTicket);

    if (state === "Resolved" && ticket.state !== "Resolved") {
      applyTicketBlocklist(updatedTicket);
      if (updatedTicket.ampBlocklist?.domains?.length || updatedTicket.importMsisacWeek) {
        logResponseAction({
          incidentId: updatedTicket.number,
          hostLine: updatedTicket.configurationItem || updatedTicket.shortDescription.slice(0, 60),
          source: "ServiceNow",
          action: "block_url",
          actor: authorName,
          tool: "Cisco Secure Endpoint",
          label: "IOCs synced to AMP block list",
          target: updatedTicket.number,
        });
        addNotification("AMP Integration", `IOCs from ${updatedTicket.number} pushed to AMP Outbreak Control block list.`);
      }
      if (updatedTicket.number === "INC0162850" && resolutionNotes.toLowerCase().includes("false positive")) {
        logResponseAction({
          incidentId: updatedTicket.number,
          hostLine: "hubspot.com",
          source: "ServiceNow",
          action: "block_url",
          actor: authorName,
          tool: "Cisco Secure Endpoint",
          label: "hubspot.com allowed (false positive)",
          target: "hubspot.com",
        });
        addNotification("AMP Integration", "hubspot.com allowed — check AMP Outbreak Control block list.");
      }
    }

    if (returnToList) {
      navigate("/servicenow/incidents");
    } else {
      addNotification("Saved", `Ticket ${ticket.number} saved successfully.`);
    }
  };

  const handleReopen = () => {
    if (state !== "Resolved" && state !== "Closed") return;
    setState("In Progress");
    addNotification("Reopened", "Ticket set back to In Progress. Please Save or Update.");
  };

  const handlePostNote = () => {
    if (!workNotes.trim() && !comments.trim()) return;
    
    const ts = new Date().toLocaleString("en-US", { hour12: true });
    const newActs: SnActivityEntry[] = [];
    
    if (workNotes.trim()) {
      newActs.push({
        id: uid(),
        timestamp: ts,
        type: "work_note",
        authorName,
        authorInitials: initials,
        text: workNotes.trim()
      });
    }
    
    if (comments.trim()) {
      newActs.push({
        id: uid(),
        timestamp: ts,
        type: "comment",
        authorName,
        authorInitials: initials,
        text: comments.trim()
      });
    }

    const all = loadServiceNowTickets();
    const idx = all.findIndex(t => t.number === ticket.number);
    if (idx !== -1) {
      all[idx].activities = [...newActs, ...all[idx].activities];
      saveServiceNowTickets(all);
      setTicket(all[idx]);
    }

    setWorkNotes("");
    setComments("");
    addNotification("Posted", "Notes added successfully.");
  };

  return (
    <div className="sn-record-page">
      <div className="sn-breadcrumb">
        <Link to="/servicenow/incidents">Incidents</Link> <span>&gt;</span> {ticket.number}
      </div>

      <div className="sn-record-header-bar">
        <h2 className="sn-record-title">
          <Link to="/servicenow/incidents" className="sn-back-link">
            &lt;
          </Link>
          Incident — {ticket.number} <span className="sn-star">☆</span>
        </h2>
        <div className="sn-record-actions">
          <button type="button" className="sn-btn">
            Discuss
          </button>
          <button type="button" className="sn-btn">
            Follow
          </button>
          <button type="button" className="sn-btn" onClick={() => handleSave(true)}>
            Update
          </button>
          <button type="button" className="sn-btn sn-btn-primary" onClick={() => handleSave(false)}>
            Save
          </button>
          <button type="button" className="sn-btn" onClick={handleReopen} disabled={state !== "Resolved" && state !== "Closed"}>
            Reopen
          </button>
        </div>
      </div>

      {ticket.relatedEmail && (
        <div className="sn-email-preview">
          <button type="button" className="link-btn sn-email-preview-link" onClick={() => setViewingEmail(ticket.relatedEmail!)}>
            Click here to view the full details of the email
          </button>
          <div className="sn-email-meta">
            <div>
              <strong>From:</strong> {ticket.relatedEmail.from}
            </div>
            <div>
              <strong>Subject:</strong> {ticket.relatedEmail.subject}
            </div>
          </div>
        </div>
      )}

      <div className="sn-form-container sn-record-form">
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="sn-form-group">
            <label className="sn-label">Number</label>
            <input className="sn-input" type="text" value={ticket.number} disabled />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Caller</label>
            <div style={{display: 'flex', gap: 4}}>
               <input className="sn-input" type="text" value={ticket.caller} disabled />
               <button className="sn-btn" style={{padding: '0 8px'}}>🔍</button>
            </div>
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Email</label>
            <input className="sn-input" type="text" value={ticket.email} disabled />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Phone Number</label>
            <input className="sn-input" type="text" value={ticket.phone} disabled />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Location</label>
            <input className="sn-input" type="text" value={ticket.location} disabled />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Category</label>
            <input className="sn-input" type="text" value={ticket.category} disabled />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Subcategory</label>
            <input className="sn-input" type="text" value={ticket.subcategory} disabled />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Business Services</label>
            <div style={{display: 'flex', gap: 4}}>
               <input className="sn-input" type="text" value={ticket.businessServices} disabled />
               <button className="sn-btn" style={{padding: '0 8px'}}>🔍</button>
            </div>
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Configuration Item</label>
            <div style={{display: 'flex', gap: 4}}>
               <input className="sn-input" type="text" value={ticket.configurationItem} disabled />
               <button className="sn-btn" style={{padding: '0 8px'}}>🔍</button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="sn-form-group">
            <label className="sn-label">Channel</label>
            <input className="sn-input" type="text" value={ticket.channel} disabled />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">State</label>
            <select className="sn-select" value={state} onChange={e => setState(e.target.value as SnState)}>
              <option>New</option>
              <option>In Progress</option>
              <option>On Hold</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Impact</label>
            <select className="sn-select" value={impact} onChange={e => setImpact(e.target.value as SnImpact)}>
              <option>1 - High</option>
              <option>2 - Medium</option>
              <option>3 - Low</option>
            </select>
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Urgency</label>
            <select className="sn-select" value={urgency} onChange={e => setUrgency(e.target.value as SnUrgency)}>
              <option>1 - High</option>
              <option>2 - Medium</option>
              <option>3 - Low</option>
            </select>
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Priority</label>
            <input className="sn-input" type="text" value={derivedPriority} disabled style={{ color: "#ef4444", fontWeight: "bold" }} />
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Assignment group</label>
            <div style={{display: 'flex', gap: 4}}>
               <input className="sn-input" type="text" list="group-list" value={assignmentGroup} onChange={e => setAssignmentGroup(e.target.value)} />
               <datalist id="group-list">
                 <option value="SOC" />
                 <option value="Network Telephony" />
                 <option value="IT Helpdesk" />
                 <option value="ITSS" />
                 <option value="CISO Office" />
               </datalist>
               <button className="sn-btn" style={{padding: '0 8px'}}>🔍</button>
            </div>
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Assigned to</label>
            <div style={{display: 'flex', gap: 4}}>
               <input className="sn-input" type="text" list="student-list" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
               <datalist id="student-list">
                 {students.map(s => (
                   <option key={s.id} value={s.name} />
                 ))}
               </datalist>
               <button className="sn-btn" style={{padding: '0 8px'}}>🔍</button>
               <button className="sn-btn" style={{padding: '0 8px', fontSize: 14}} onClick={() => setAssignedTo(session?.name || "")} title="Assign to me">🙋</button>
            </div>
          </div>
        </div>

        {/* Full width */}
        <div className="sn-form-group full-width">
          <label className="sn-label">Short description</label>
          <input className="sn-input" type="text" value={ticket.shortDescription} disabled />
        </div>
        <div className="sn-form-group full-width">
          <label className="sn-label">Description</label>
          <textarea className="sn-textarea" rows={4} value={ticket.description} disabled />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 13 }}>Manage Attachments ({ticket.attachments.length})</strong>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {ticket.attachments.map(att => (
            <div key={att.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", backgroundColor: "var(--sn-surface)", border: "1px solid var(--sn-border)", borderRadius: 16, fontSize: 12 }}>
              <span>{att.type === 'file' ? '📄' : '🖼️'}</span>
              <span>{att.name}</span>
              {att.isSpreadsheet ? (
                <button className="link-btn" style={{ fontSize: 11 }} onClick={() => setViewingSpreadsheet(att.name)}>[open]</button>
              ) : (
                <button className="link-btn" style={{ fontSize: 11 }}>[download]</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sn-tabs-container">
        <div className="sn-tab-strip">
          <button className={`sn-tab-button ${activeTab === "notes" ? "active" : ""}`} onClick={() => setActiveTab("notes")}>
            Notes
          </button>
          <button className={`sn-tab-button ${activeTab === "related" ? "active" : ""}`} onClick={() => setActiveTab("related")}>
            Related Records
          </button>
          <button className={`sn-tab-button ${activeTab === "resolution" ? "active" : ""}`} onClick={() => setActiveTab("resolution")}>
            Resolution Information
          </button>
        </div>

        <div className="sn-tab-content">
          {activeTab === "notes" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="sn-label" style={{ display: "flex", justifyContent: "space-between", textAlign: "left", width: "100%", padding: "0 0 4px 0", color: "white", fontSize: 11, fontWeight: "bold" }}>
                    <span>Watch list 🔍 🧑</span>
                    <span>Work notes list 🔍 🧑</span>
                  </label>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <label className="sn-label" style={{ width: 140, textAlign: "left", color: "white", fontSize: 11, fontWeight: "bold" }}>Work notes</label>
                  <div style={{ flex: 1 }}>
                    <textarea className="sn-textarea" rows={2} value={workNotes} onChange={e => setWorkNotes(e.target.value)} style={{ border: "1px solid #666", borderLeft: "4px solid #eab308", backgroundColor: "#2b2b2b", borderRadius: 4, width: "100%", padding: "8px" }} placeholder="Work notes" />
                  </div>
                  <button className="sn-btn" style={{ padding: "0 8px", height: "fit-content", alignSelf: "center", backgroundColor: "transparent", border: "none", fontSize: 16 }}>✏️</button>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <label className="sn-label" style={{ width: 140, textAlign: "left", color: "white", fontSize: 11, fontWeight: "bold" }}>Additional comments (Customer visible)</label>
                  <div style={{ flex: 1 }}>
                    <textarea className="sn-textarea" rows={2} value={comments} onChange={e => setComments(e.target.value)} style={{ border: "1px solid #666", backgroundColor: "#2b2b2b", borderRadius: 4, width: "100%", padding: "8px" }} placeholder="Additional comments (Customer visible)" />
                  </div>
                  <button className="sn-btn" style={{ padding: "0 8px", height: "fit-content", alignSelf: "center", backgroundColor: "transparent", border: "none", fontSize: 16 }}>✏️</button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24, paddingRight: 40 }}>
                <button className="sn-btn" style={{ backgroundColor: "#3a3652", color: "white", border: "none", padding: "4px 16px" }} onClick={handlePostNote}>Post</button>
              </div>

              <div className="sn-activity-stream" style={{ borderTop: "1px solid #444", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
                  <strong style={{ fontSize: 12, color: "white", marginLeft: 40 }}>Activities: {ticket.activities.length}</strong>
                  <button className="sn-btn" style={{ fontSize: 14, backgroundColor: "transparent", border: "1px solid #5c9bfa", color: "#5c9bfa", borderRadius: 4 }}>♈</button>
                </div>
                
                {ticket.activities.map(act => {
                  let borderLeft = "3px solid transparent";
                  if (act.type === "work_note") borderLeft = "3px solid #eab308";
                  else if (act.type === "field_change" || act.type === "email" || act.type === "attachment") borderLeft = "3px solid #666";

                  return (
                    <div key={act.id} className="sn-activity-card" style={{ display: "flex", gap: 12, backgroundColor: "transparent", border: "none", marginBottom: 12 }}>
                      <div style={{ width: 140, textAlign: "right", color: "white", fontSize: 11, fontWeight: "bold", display: "flex", justifyContent: "flex-end", gap: 4 }}>
                        {act.type === "email" ? "System" : act.authorInitials === "SYS" ? "System" : act.authorName}
                      </div>
                      <div style={{ flex: 1, backgroundColor: "#1e1e1e", border: "1px solid #444", borderLeft: borderLeft, borderRadius: 4, padding: "8px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            {act.type === "email" ? "✉️" : act.type === "work_note" ? "📓" : act.type === "field_change" ? "🟢" : "👤"}
                            <strong style={{ color: "white" }}>{act.type === "email" ? "Email sent" : act.type === "field_change" ? "Field changes" : act.type === "work_note" ? "Work notes" : "Additional comments"}</strong>
                          </span>
                          <span style={{ fontSize: 11, color: "#aaa" }}>{act.timestamp}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#ccc", marginLeft: 24 }}>
                          {act.type === "work_note" && <div>{act.text}</div>}
                          {act.type === "comment" && <div>{act.text}</div>}
                          {act.type === "field_change" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {act.field}: {act.oldValue} ➔ {act.newValue}
                            </div>
                          )}
                          {act.type === "email" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <div style={{ display: "flex" }}><span style={{ width: 60, color: "white", fontWeight: "bold" }}>Subject:</span> <span>{act.subject}</span></div>
                              <div style={{ display: "flex" }}><span style={{ width: 60, color: "white", fontWeight: "bold" }}>From:</span> <span>Data Group Help Desk</span></div>
                              <div style={{ display: "flex" }}><span style={{ width: 60, color: "white", fontWeight: "bold" }}>To:</span> <span>{act.emailDetails?.to}</span></div>
                              <button className="link-btn" style={{ fontSize: 11, textAlign: "left", marginTop: 4, color: "#5c9bfa" }} onClick={() => setViewingEmail(act.emailDetails!)}>Show email details</button>
                            </div>
                          )}
                          {act.type === "attachment" && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <strong>Attachment added:</strong> {act.fileName} ({act.size})
                              {(act.fileName.endsWith('.xlsx') || act.fileName.endsWith('.csv')) && (
                                <button className="link-btn" style={{ fontSize: 11, color: "#5c9bfa" }} onClick={() => setViewingSpreadsheet(act.fileName)}>[open]</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "related" && (
            <div className="sn-related-panel">
              <div className="sn-form-container">
                <div className="sn-form-group">
                  <label className="sn-label">Parent Incident</label>
                  <div className="sn-lookup-row">
                    <input className="sn-input" type="text" disabled />
                    <button type="button" className="sn-btn sn-btn-icon" disabled>
                      🔍
                    </button>
                  </div>
                </div>
                <div className="sn-form-group">
                  <label className="sn-label">Problem</label>
                  <div className="sn-lookup-row">
                    <input className="sn-input" type="text" disabled />
                    <button type="button" className="sn-btn sn-btn-icon" disabled>
                      🔍
                    </button>
                  </div>
                </div>
              </div>

              <div className="sn-integration-section">
                <h4>Integrated Security Tools</h4>
                <p className="sn-integration-hint">
                  Cross-tool links reflect the same investigation across AMP, XDR, Defender, and Sentinel.
                </p>
                <div className="sn-integration-links">
                  {ticket.linkedXdrIncidentId && (
                    <Link to={`/xdr/investigate?incident=${ticket.linkedXdrIncidentId}`} className="sn-integration-chip">
                      Cisco XDR — {ticket.linkedXdrIncidentId}
                    </Link>
                  )}
                  {ticket.linkedDefenderIncidentId && (
                    <Link to={`/defender/incidents/${ticket.linkedDefenderIncidentId}`} className="sn-integration-chip">
                      Defender — {ticket.linkedDefenderIncidentId}
                    </Link>
                  )}
                  {ticket.linkedSentinelIncidentId && (
                    <Link to={`/sentinel/incidents/${ticket.linkedSentinelIncidentId}`} className="sn-integration-chip">
                      Sentinel — {ticket.linkedSentinelIncidentId}
                    </Link>
                  )}
                  <Link to="/outbreak#blocklist" className="sn-integration-chip sn-integration-chip-amp">
                    AMP Block List ({getBlockedEntries().length} entries)
                  </Link>
                </div>

                {(ampDomains.length > 0 || ticket.importMsisacWeek) && (
                  <div className="sn-amp-status">
                    <strong>AMP block list status</strong>
                    <ul>
                      {ampDomains.map((d) => (
                        <li key={d}>
                          <code>{d}</code> — {isBlocked(d, "domain") ? "Blocked in AMP" : "Not blocked"}
                          {d === "hubspot.com" && hubspotBlocked && (
                            <span className="sn-badge-warn"> (verify false positive in Outbreak Control)</span>
                          )}
                        </li>
                      ))}
                      {ticket.importMsisacWeek && (
                        <li>MS-ISAC week {ticket.importMsisacWeek} IOCs — {ticket.state === "Resolved" ? "ingested into AMP" : "pending resolve"}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "resolution" && (
            <div className="sn-form-container">
              <div className="sn-form-group">
                <label className="sn-label">Resolution code</label>
                <select className="sn-select" value={resolutionCode} onChange={e => setResolutionCode(e.target.value as SnResolutionCode)}>
                  <option value="">-- None --</option>
                  <option>Solved (Permanently)</option>
                  <option>Solved (Work Around)</option>
                  <option>Solved Remotely (Permanently)</option>
                  <option>Not Solved (Not Reproducible)</option>
                  <option>Not Solved (Too Costly)</option>
                  <option>Closed/Resolved by Caller</option>
                </select>
              </div>
              <div className="sn-form-group">
                <label className="sn-label">Resolved by</label>
                <input className="sn-input" type="text" value={ticket.resolvedBy || ""} disabled />
              </div>
              <div className="sn-form-group">
                <label className="sn-label">Resolved at</label>
                <input className="sn-input" type="text" value={ticket.resolvedAt || ""} disabled />
              </div>
              <div className="sn-form-group full-width">
                <label className="sn-label">Resolution notes</label>
                <textarea className="sn-textarea" rows={4} value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {viewingEmail && (
        <ServiceNowEmailViewer email={viewingEmail} onClose={() => setViewingEmail(null)} />
      )}
      {viewingSpreadsheet && (
        <ServiceNowSpreadsheetViewer fileName={viewingSpreadsheet} onClose={() => setViewingSpreadsheet(null)} />
      )}
    </div>
  );
}
