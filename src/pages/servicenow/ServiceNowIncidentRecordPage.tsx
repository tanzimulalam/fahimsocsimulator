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
  const { session } = useClassroom();
  const { addNotification } = useSimulator();

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

  if (!ticket) return <div style={{padding: 20}}>Loading ticket...</div>;

  const derivedPriority = derivePriority(impact, urgency);

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
        type: "email",
        authorName: "System",
        authorInitials: "SYS",
        subject: `Incident Resolved For - ${ticket.shortDescription}`,
        emailDetails: {
          from: "DoIT Helpdesk",
          date: ts,
          to: ticket.email,
          subject: `Incident Resolved For - ${ticket.shortDescription}`,
          bodyHtml: `<p>Your incident ${ticket.number} has been resolved.</p><p>Resolution Notes:</p><p>${resolutionNotes}</p>`
        }
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
      activities: [...newActivities, ...ticket.activities]
    };

    all[idx] = updatedTicket;
    saveServiceNowTickets(all);
    setTicket(updatedTicket);

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
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="sn-breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/servicenow/incidents">Incidents</Link> <span>&gt;</span> {ticket.number}
      </div>

      <div className="sn-record-header">
        <h2 className="sn-record-title">Incident · {ticket.number} ⭐</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="sn-btn">Discuss</button>
          <button className="sn-btn">Follow</button>
          <button className="sn-btn" onClick={() => handleSave(true)}>Update</button>
          <button className="sn-btn" onClick={() => handleSave(false)}>Save</button>
          <button className="sn-btn" onClick={handleReopen} disabled={state !== "Resolved" && state !== "Closed"}>Reopen</button>
        </div>
      </div>

      <div className="sn-form-container">
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
               <input className="sn-input" type="text" value={assignmentGroup} onChange={e => setAssignmentGroup(e.target.value)} />
               <button className="sn-btn" style={{padding: '0 8px'}}>🔍</button>
            </div>
          </div>
          <div className="sn-form-group">
            <label className="sn-label">Assigned to</label>
            <div style={{display: 'flex', gap: 4}}>
               <input className="sn-input" type="text" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
               <button className="sn-btn" style={{padding: '0 8px'}}>🔍</button>
               <button className="sn-btn" style={{padding: '0 8px'}} onClick={() => setAssignedTo(session?.name || "")}>🙋</button>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
                <div>
                  <label className="sn-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Work notes (Private)</span>
                  </label>
                  <textarea className="sn-textarea" rows={3} value={workNotes} onChange={e => setWorkNotes(e.target.value)} style={{ borderLeft: "3px solid #eab308" }} />
                </div>
                <div>
                  <label className="sn-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Additional comments (Customer visible)</span>
                  </label>
                  <textarea className="sn-textarea" rows={3} value={comments} onChange={e => setComments(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="sn-btn sn-btn-primary" onClick={handlePostNote}>Post</button>
              </div>

              <div className="sn-activity-stream">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sn-border)", paddingBottom: 8 }}>
                  <strong style={{ fontSize: 14 }}>Activities: {ticket.activities.length}</strong>
                  <button className="sn-btn">⚙️ Filter</button>
                </div>
                
                {ticket.activities.map(act => {
                  let badgeColor = "#3b82f6";
                  let borderLeft = "3px solid transparent";
                  
                  if (act.type === "work_note") {
                    badgeColor = "#eab308";
                    borderLeft = "3px solid #eab308";
                  } else if (act.type === "field_change" || act.type === "email" || act.type === "attachment") {
                    badgeColor = "#6b7280";
                  }

                  return (
                    <div key={act.id} className="sn-activity-card">
                      <div className="sn-avatar" style={{ backgroundColor: badgeColor }}>{act.authorInitials}</div>
                      <div className="sn-activity-body" style={{ borderLeft }}>
                        <div className="sn-activity-header">
                          <span><strong>{act.authorName}</strong></span>
                          <span>{act.timestamp}</span>
                        </div>
                        {act.type === "work_note" && (
                          <div className="sn-activity-content"><strong>Work notes:</strong><br />{act.text}</div>
                        )}
                        {act.type === "comment" && (
                          <div className="sn-activity-content"><strong>Additional comments:</strong><br />{act.text}</div>
                        )}
                        {act.type === "field_change" && (
                          <div className="sn-activity-content field-change">
                            {act.field}: {act.oldValue} → {act.newValue}
                          </div>
                        )}
                        {act.type === "email" && (
                          <div className="sn-activity-content">
                            <strong>System Email:</strong> {act.subject}
                            <div style={{ marginTop: 8 }}>
                              <button className="sn-btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setViewingEmail(act.emailDetails)}>Show email details</button>
                            </div>
                          </div>
                        )}
                        {act.type === "attachment" && (
                          <div className="sn-activity-content">
                            <strong>Attachment added:</strong> {act.fileName} ({act.size})
                            {(act.fileName.endsWith('.xlsx') || act.fileName.endsWith('.csv')) && (
                              <button className="link-btn" style={{ fontSize: 11, marginLeft: 8 }} onClick={() => setViewingSpreadsheet(act.fileName)}>[open]</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "related" && (
            <div className="sn-form-container">
              <div className="sn-form-group">
                <label className="sn-label">Parent Incident</label>
                <div style={{display: 'flex', gap: 4}}><input className="sn-input" type="text" disabled /><button className="sn-btn" style={{padding: '0 8px'}} disabled>🔍</button></div>
              </div>
              <div className="sn-form-group">
                <label className="sn-label">Problem</label>
                <div style={{display: 'flex', gap: 4}}><input className="sn-input" type="text" disabled /><button className="sn-btn" style={{padding: '0 8px'}} disabled>🔍</button></div>
              </div>
              <div className="sn-form-group">
                <label className="sn-label">Change Request</label>
                <div style={{display: 'flex', gap: 4}}><input className="sn-input" type="text" disabled /><button className="sn-btn" style={{padding: '0 8px'}} disabled>🔍</button></div>
              </div>
              <div className="sn-form-group">
                <label className="sn-label">Caused by Change</label>
                <div style={{display: 'flex', gap: 4}}><input className="sn-input" type="text" disabled /><button className="sn-btn" style={{padding: '0 8px'}} disabled>🔍</button></div>
              </div>
              
              {ticket.linkedXdrIncidentId && (
                <div className="sn-form-group full-width" style={{ marginTop: 16 }}>
                  <label className="sn-label">Integrated Security Alerts</label>
                  <Link to={`/xdr/investigate?incident=${ticket.linkedXdrIncidentId}`} className="sn-btn" style={{ display: "inline-block", width: "fit-content", textDecoration: "none" }}>
                    🛡️ Open related Cisco XDR case
                  </Link>
                </div>
              )}
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
