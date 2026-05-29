import { useState, useEffect, useMemo } from 'react';
import type { PlaybookState, XDRIncident } from '../../data/xdrIncidents';
import { useClassroom } from '../../context/ClassroomContext';
import { classroomApi } from '../../lib/apiClient';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface XdrResponsePlaybookProps {
  incident: XDRIncident;
  onStatusChange: (status: string) => void;
}

const PHASES = ['identification', 'containment', 'eradication', 'recovery'];

type TaskDef = {
  id: string;
  name: string;
  description: string;
  actionType: 'note' | 'execute' | 'both';
};

const PLAYBOOK_TASKS: Record<string, TaskDef[]> = {
  identification: [
    { id: 'id-1', name: 'Review Incident', description: 'Add a note to record the evidence for assigning a status of Rejected, Open, or Incident Reported.', actionType: 'note' },
    { id: 'id-2', name: 'Analyze Indicators', description: 'Create judgment(s), as necessary, and add a note confirming any Malicious or Suspicious reputations.', actionType: 'note' },
    { id: 'id-3', name: 'Identify Affected Hosts', description: 'Add a note with summary of findings on the investigations of hosts found with malicious indicators.', actionType: 'note' },
    { id: 'id-4', name: 'Confirm Incident', description: 'Update the incident status to Incident Reported and, if the incident has assignees start a chat room for triage and collaboration.', actionType: 'execute' },
    { id: 'id-5', name: 'Document and Notify', description: 'Create an incident ticket with the appropriate parameters and contextual incident information.', actionType: 'execute' },
  ],
  containment: [
    { id: 'ct-1', name: 'Contain Incident: Overview', description: 'Overview of how to contain Indicators of Compromise to stop the spread of malicious activity.', actionType: 'note' },
    { id: 'ct-2', name: 'Contain Incident: Assets (Devices)', description: 'Use asset-based containment to stop the spread of malicious activity.', actionType: 'execute' },
    { id: 'ct-3', name: 'Contain Incident: Assets (Users)', description: 'Use user-based containment to stop the spread of malicious activity.', actionType: 'execute' },
    { id: 'ct-4', name: 'Contain Incident: IP Addresses', description: 'Contain IP address indicators of compromise to stop the spread of malicious activity.', actionType: 'execute' },
    { id: 'ct-5', name: 'Contain Incident: Domains', description: 'Contain domain indicators of compromise to stop the spread of malicious activity.', actionType: 'execute' },
    { id: 'ct-6', name: 'Contain Incident: URLs', description: 'Contain URL indicators of compromise to stop the spread of malicious activity.', actionType: 'execute' },
    { id: 'ct-7', name: 'Contain Incident: File Hashes', description: 'Contain file hash indicators of compromise to stop the spread of malicious activity.', actionType: 'execute' },
  ],
  eradication: [
    { id: 'er-1', name: 'Mitigate or Remediate Vulnerabilities', description: 'Add a note about the affecting vulnerabilities and how mitigations or remediation will be done.', actionType: 'note' },
    { id: 'er-2', name: 'Remove Malicious Content', description: 'Add a note about the action achieved to ensure the removal of the malware.', actionType: 'both' },
    { id: 'er-3', name: 'Re-image Systems', description: 'Re-image systems, as needed.', actionType: 'note' },
  ],
  recovery: [
    { id: 'rc-1', name: 'Validate Eradicated Hosts and Unquarantine Assets', description: 'Confirm and acknowledge eradication steps are working as expected and number of infected host(s) is dropping.', actionType: 'execute' },
    { id: 'rc-2', name: 'Validate Re-imaged Hosts', description: 'Validate that each re-imaged system was completed by verifying new image creation date.', actionType: 'note' },
    { id: 'rc-3', name: 'Implement Recovery Monitoring', description: 'Add a note on how you are going to monitor newly recovered systems for anomalies or newly created incidents.', actionType: 'note' },
    { id: 'rc-4', name: 'Restore Contained Users', description: 'Confirm and acknowledge eradication steps are working as expected and that users can resume accessing systems.', actionType: 'execute' },
    { id: 'rc-5', name: 'Close and Export Incident', description: 'Incident closure and incident summary data retention in an external system.', actionType: 'execute' },
  ]
};

const DEFAULT_STATE: PlaybookState = {
  currentPhase: 'identification',
  completedTasks: [],
  notes: [],
  actionsLog: []
};

export function XdrResponsePlaybook({ incident, onStatusChange }: XdrResponsePlaybookProps) {
  const { session } = useClassroom();
  
  const initials = useMemo(() => {
    if (session?.name) {
      return session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'FT';
  }, [session]);

  const storageKey = `xdr_playbook_${incident.id}`;
  
  const [state, setState] = useState<PlaybookState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return DEFAULT_STATE;
  });

  const [backendHydrated, setBackendHydrated] = useState(!classroomApi.enabled);

  useEffect(() => {
    if (!classroomApi.enabled) return;
    let cancelled = false;
    async function load() {
      try {
        const remote = await classroomApi.getLabState<PlaybookState>("default", storageKey);
        if (!cancelled && remote) {
          setState(remote);
        }
      } catch (e) {
      } finally {
        if (!cancelled) setBackendHydrated(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (!classroomApi.enabled || !backendHydrated) return;
    const timer = window.setTimeout(() => {
      classroomApi.putLabState("default", storageKey, state).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [state, backendHydrated, storageKey]);

  const [activeNoteTask, setActiveNoteTask] = useState<TaskDef | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [closeDropdownOpen, setCloseDropdownOpen] = useState(false);

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleExecute = (task: TaskDef) => {
    const timestamp = new Date().toISOString();
    
    setState(prev => ({
      ...prev,
      completedTasks: prev.completedTasks.includes(task.id) ? prev.completedTasks : [...prev.completedTasks, task.id],
      actionsLog: [
        { description: `Executed Workflow for ${task.name}`, timestamp, authorInitials: initials, isWorkflow: true },
        ...prev.actionsLog
      ]
    }));
  };

  const saveNote = () => {
    if (!activeNoteTask || !noteText.trim()) return;
    
    const timestamp = new Date().toISOString();
    
    setState(prev => ({
      ...prev,
      completedTasks: prev.completedTasks.includes(activeNoteTask.id) ? prev.completedTasks : [...prev.completedTasks, activeNoteTask.id],
      notes: [...prev.notes, { taskId: activeNoteTask.id, text: noteText, timestamp, authorInitials: initials }],
      actionsLog: [
        { description: `Added note for ${activeNoteTask.name}`, timestamp, authorInitials: initials, isWorkflow: false },
        ...prev.actionsLog
      ]
    }));
    
    setActiveNoteTask(null);
    setNoteText('');
  };

  const handleGenerateAI = async () => {
    if (!activeNoteTask) return;
    setIsGenerating(true);
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      setNoteText("Error: VITE_OPENAI_API_KEY environment variable is missing.");
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a senior SOC analyst investigating a cybersecurity incident. Write a concise, professional analyst note for the given playbook task based on the incident details. Output only the note text." },
            { role: "user", content: `Incident Title: ${incident.title}\nTactics: ${incident.tactics.join(', ')}\nDescription: ${incident.description}\nHost: ${incident.host}\n\nTask: ${activeNoteTask.name}\nTask Description: ${activeNoteTask.description}\n\nGenerate the analyst note:` }
          ],
          max_tokens: 250,
          temperature: 0.7
        })
      });
      
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setNoteText(data.choices[0].message.content.trim());
      } else {
        setNoteText("Error generating note. Please try again.");
      }
    } catch (e) {
      setNoteText("Error generating note: " + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportJson = () => {
    const data = {
      incidentId: incident.id,
      title: incident.title,
      priority: incident.priority,
      tactics: incident.tactics,
      finalStatus: incident.status, // might be updated just before this
      notes: state.notes.map(n => {
        const t = Object.values(PLAYBOOK_TASKS).flat().find(x => x.id === n.taskId);
        return { ...n, taskName: t?.name };
      }),
      actionsLog: state.actionsLog
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xdr_incident_${incident.id}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #24292f; background: #ffffff;">
        <div style="text-align: center; border-bottom: 3px solid #0070d2; padding-bottom: 24px; margin-bottom: 32px;">
          <h1 style="color: #0070d2; margin: 0 0 8px 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 800;">
            DATA GROUP SOC SIMULATION LAB BY FAHIM
          </h1>
          <p style="color: #57606a; margin: 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            Official Incident Response Report
          </p>
        </div>
        
        <h2 style="color: #0969da; font-size: 20px; border-bottom: 1px solid #d0d7de; padding-bottom: 8px; margin-bottom: 16px;">Incident Profile</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #d0d7de; font-weight: 600; width: 25%; background: #f6f8fa;">Incident ID</td>
            <td style="padding: 10px; border: 1px solid #d0d7de;">${incident.id}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #d0d7de; font-weight: 600; background: #f6f8fa;">Title</td>
            <td style="padding: 10px; border: 1px solid #d0d7de; font-weight: 600;">${incident.title}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #d0d7de; font-weight: 600; background: #f6f8fa;">Priority</td>
            <td style="padding: 10px; border: 1px solid #d0d7de; color: #cf222e; font-weight: bold;">${incident.priority}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #d0d7de; font-weight: 600; background: #f6f8fa;">Final Status</td>
            <td style="padding: 10px; border: 1px solid #d0d7de;">${incident.status}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #d0d7de; font-weight: 600; background: #f6f8fa;">Handled By</td>
            <td style="padding: 10px; border: 1px solid #d0d7de; font-weight: 600; color: #0070d2;">${session?.name || 'Assigned SOC Analyst'}</td>
          </tr>
        </table>

        <h2 style="color: #0969da; font-size: 20px; border-bottom: 1px solid #d0d7de; padding-bottom: 8px; margin-bottom: 16px;">Analyst Notes & Documentation</h2>
        ${state.notes.length === 0 ? '<p style="color: #57606a; font-style: italic;">No documentation notes provided during investigation.</p>' : ''}
        ${state.notes.map(n => {
          const t = Object.values(PLAYBOOK_TASKS).flat().find(x => x.id === n.taskId);
          return `
            <div style="margin-bottom: 20px; padding: 16px; background: #f6f8fa; border-left: 4px solid #0969da; border-radius: 0 6px 6px 0;">
              <h4 style="margin: 0 0 6px 0; color: #0969da; font-size: 16px;">${t?.name || 'Task Note'}</h4>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #57606a;">Logged by Analyst ${n.authorInitials} at ${new Date(n.timestamp).toLocaleString()}</p>
              <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #24292f;">${n.text}</div>
            </div>
          `;
        }).join('')}

        <h2 style="color: #0969da; font-size: 20px; border-bottom: 1px solid #d0d7de; padding-bottom: 8px; margin-top: 32px; margin-bottom: 16px;">Action Log</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${state.actionsLog.map(log => `
            <li style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eaeef2; font-size: 13px; color: #24292f;">
              <strong style="color: #0969da; font-family: monospace;">[${new Date(log.timestamp).toLocaleString()}]</strong> 
              <span style="font-weight: 600; margin-right: 4px;">Analyst ${log.authorInitials}:</span> ${log.description}
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    const opt = {
      margin:       0.4,
      filename:     `Incident_Report_${incident.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt as any).from(element).save();
  };

  const closeIncident = () => {
    onStatusChange('Closed: Confirmed Threat');
    setState(prev => ({ ...prev, currentPhase: 'closed' }));
    setCloseDropdownOpen(false);
  };

  const closeAndExport = () => {
    closeIncident();
    exportJson();
  };

  return (
    <div className="xdr-playbook-container" style={{ display: 'flex', gap: '20px', height: '100%', minHeight: '600px' }}>
      {/* Left Sidebar - Phases */}
      <div className="xdr-playbook-sidebar" style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #30363d', paddingRight: '16px' }}>
        <h4 style={{ margin: '0 0 16px', color: '#8b949e', fontSize: '12px', textTransform: 'uppercase' }}>Playbook Phases</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PHASES.map((phase, idx) => {
            const isActive = state.currentPhase === phase;
            const isPast = PHASES.indexOf(state.currentPhase) > idx || state.currentPhase === 'closed';
            
            return (
              <button 
                key={phase}
                onClick={() => setState(prev => ({ ...prev, currentPhase: phase as any }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: isActive ? 'rgba(0, 112, 210, 0.1)' : 'transparent',
                  border: isActive ? '1px solid #0070d2' : '1px solid transparent',
                  borderLeft: isActive ? '3px solid #0070d2' : '3px solid transparent',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  color: isActive ? '#e6edf3' : isPast ? '#c9d1d9' : '#8b949e',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  textTransform: 'capitalize'
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  display: 'grid', placeItems: 'center', fontSize: '11px',
                  background: isPast ? '#0070d2' : isActive ? 'transparent' : '#21262d',
                  border: isActive ? '1px solid #0070d2' : 'none',
                  color: isPast ? '#fff' : isActive ? '#0070d2' : '#8b949e'
                }}>
                  {isPast ? '✓' : (idx + 1)}
                </div>
                {phase}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - Tasks */}
      <div className="xdr-playbook-main" style={{ flex: 1, paddingRight: '16px' }}>
        {state.currentPhase === 'closed' ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h3>Incident Closed</h3>
            <p>This incident's playbook has been completed and closed.</p>
          </div>
        ) : (
          <>
            <h2 style={{ textTransform: 'capitalize', margin: '0 0 20px', fontSize: '20px' }}>{state.currentPhase} Phase</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PLAYBOOK_TASKS[state.currentPhase].map(task => {
                const isCompleted = state.completedTasks.includes(task.id);
                const isExpanded = expandedTasks[task.id];
                
                return (
                  <div key={task.id} style={{ 
                    border: '1px solid #30363d', 
                    borderRadius: '6px', 
                    background: '#0d1117',
                    overflow: 'hidden'
                  }}>
                    <div 
                      onClick={() => toggleTask(task.id)}
                      style={{ 
                        padding: '12px 16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: '#161b22'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: '#58a6ff', fontWeight: 600, fontSize: '14px' }}>{task.name}</span>
                        {isCompleted && (
                          <span style={{ background: '#0070d2', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>
                            ✓ Complete
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#8b949e' }}>{isExpanded ? '▾' : '▸'}</span>
                    </div>
                    
                    {isExpanded && (
                      <div style={{ padding: '16px', borderTop: '1px solid #30363d' }}>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#c9d1d9' }}>{task.description}</p>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {(task.actionType === 'note' || task.actionType === 'both') && (
                            <button 
                              className="btn" 
                              onClick={() => setActiveNoteTask(task)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              ✨ Generate note
                            </button>
                          )}
                          {(task.actionType === 'execute' || task.actionType === 'both') && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleExecute(task)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#0070d2', border: '1px solid #0070d2' }}
                            >
                              ▶ Execute
                            </button>
                          )}
                          <button className="btn" style={{ background: 'transparent', border: '1px solid transparent' }}>
                            💬 Comments
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="btn" 
                disabled={state.currentPhase === 'identification'}
                onClick={() => {
                  const idx = PHASES.indexOf(state.currentPhase);
                  if (idx > 0) setState(prev => ({ ...prev, currentPhase: PHASES[idx-1] as any }));
                }}
              >
                ← Back
              </button>
              
              {state.currentPhase === 'recovery' ? (
                <div style={{ position: 'relative' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setCloseDropdownOpen(!closeDropdownOpen)}
                  >
                    Close Incident ↓
                  </button>
                  {closeDropdownOpen && (
                    <div style={{ 
                      position: 'absolute', bottom: '100%', right: 0, marginBottom: '4px',
                      background: '#161b22', border: '1px solid #30363d', borderRadius: '6px',
                      width: '200px', boxShadow: '0 -4px 12px rgba(0,0,0,0.3)', zIndex: 10
                    }}>
                      <button onClick={closeAndExport} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #30363d', color: '#e6edf3', cursor: 'pointer' }}>
                        Close and Export JSON
                      </button>
                      <button onClick={() => { closeIncident(); exportPdf(); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #30363d', color: '#e6edf3', cursor: 'pointer' }}>
                        Close and Export PDF
                      </button>
                      <button onClick={closeIncident} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#e6edf3', cursor: 'pointer' }}>
                        Close Incident
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const idx = PHASES.indexOf(state.currentPhase);
                    if (idx < PHASES.length - 1) setState(prev => ({ ...prev, currentPhase: PHASES[idx+1] as any }));
                  }}
                >
                  Go to {PHASES[PHASES.indexOf(state.currentPhase) + 1]} →
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Actions Taken */}
      <div className="xdr-playbook-actions" style={{ width: '280px', flexShrink: 0, borderLeft: '1px solid #30363d', paddingLeft: '16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '14px' }}>Actions Taken</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="link-btn" onClick={exportPdf} style={{ fontSize: '11px', color: '#f85149' }}>PDF ↓</button>
            <button className="link-btn" onClick={exportJson} style={{ fontSize: '11px' }}>JSON ↓</button>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {state.actionsLog.length === 0 ? (
            <div style={{ color: '#8b949e', fontSize: '12px', fontStyle: 'italic' }}>No actions taken yet.</div>
          ) : (
            state.actionsLog.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px' }}>
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', background: '#0070d2', 
                  color: '#fff', fontSize: '10px', fontWeight: 'bold', display: 'grid', placeItems: 'center', flexShrink: 0 
                }}>
                  {log.authorInitials}
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '2px' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e6edf3', lineHeight: 1.4 }}>
                    {log.description}
                  </div>
                  {log.isWorkflow && (
                    <button className="link-btn" style={{ fontSize: '11px', marginTop: '4px' }}>View run →</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Generate Note Modal */}
      {activeNoteTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'grid', placeItems: 'center'
        }}>
          <div style={{
            background: '#161b22', border: '1px solid #30363d', borderRadius: '8px',
            width: '500px', maxWidth: '90vw', padding: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 8px' }}>Generate Note</h3>
            <p style={{ color: '#8b949e', fontSize: '13px', margin: '0 0 16px' }}>For task: {activeNoteTask.name}</p>
            
            <button 
              onClick={handleGenerateAI} 
              disabled={isGenerating}
              style={{
                background: 'linear-gradient(45deg, #0070d2, #8a2be2)',
                color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px',
                cursor: isGenerating ? 'not-allowed' : 'pointer', fontWeight: 'bold',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              {isGenerating ? '⏳ Generating with AI...' : '✨ Auto-Generate with AI'}
            </button>
            <textarea 
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Type your investigation note here..."
              style={{
                width: '100%', height: '120px', background: '#0d1117',
                border: '1px solid #30363d', borderRadius: '4px',
                color: '#e6edf3', padding: '10px', fontFamily: 'inherit',
                resize: 'vertical', marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn" onClick={() => { setActiveNoteTask(null); setNoteText(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
