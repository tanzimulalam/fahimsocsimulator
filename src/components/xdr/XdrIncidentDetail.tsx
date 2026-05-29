import React, { useState } from 'react';
import type { XDRIncident } from '../../data/xdrIncidents';
import { XdrAttackGraph } from './XdrAttackGraph';
import { XdrResponsePlaybook } from './XdrResponsePlaybook';

interface XdrIncidentDetailProps {
  incident: XDRIncident;
  onStatusChange: (status: string) => void;
  onClose: () => void;
}

const TABS = ['Overview', 'Detection', 'Response'] as const;

function getPriorityColor(priority: number) {
  if (priority >= 1000) return '#D13438'; // Red
  if (priority >= 870) return '#C0472B'; // Dark orange-red
  if (priority >= 640) return '#E8A000'; // Amber
  return '#0078D4'; // Blue
}

function getTacticColor(tactic: string) {
  const t = tactic.toLowerCase();
  if (t.includes('lateral movement')) return '#E8A000'; // orange
  if (t.includes('defense evasion')) return '#8A2BE2'; // purple
  if (t.includes('command and control')) return '#D13438'; // red
  if (t.includes('initial access')) return '#0078D4'; // blue
  if (t.includes('credential access')) return '#D6C000'; // yellow
  if (t.includes('impact')) return '#8B0000'; // dark red
  if (t.includes('execution')) return '#6e7681'; // grey
  if (t.includes('persistence')) return '#008080'; // teal
  if (t.includes('exfiltration')) return '#ff69b4'; // hot pink
  return '#8b949e'; // default grey
}

export function XdrIncidentDetail({ incident, onStatusChange, onClose }: XdrIncidentDetailProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Detection' | 'Response'>('Overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const [isIsolated, setIsIsolated] = useState(() => {
    return localStorage.getItem(`xdr_isolated_${incident.id}`) === 'true';
  });
  const [isIsolating, setIsIsolating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !isInWatchlist;
    setIsInWatchlist(next);
    showToast(next ? 'Added to watchlist' : 'Removed from watchlist');
  };

  const handleIsolate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isIsolated) {
      localStorage.setItem(`xdr_isolated_${incident.id}`, 'false');
      setIsIsolated(false);
      showToast('Host isolation removed. Connectivity restored.');
      return;
    }
    setIsIsolating(true);
    showToast('Communicating with Secure Endpoint to isolate host...');
    setTimeout(() => {
      setIsIsolating(false);
      setIsIsolated(true);
      localStorage.setItem(`xdr_isolated_${incident.id}`, 'true');
      showToast(`Host ${incident.host} is now ISOLATED from the network.`);
    }, 2000);
  };

  const handleDownload = () => {
    showToast('Preparing JSON download...');
    setTimeout(() => {
      const blob = new Blob([JSON.stringify(incident.detectionEvents, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detection_events_${incident.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, 500);
  };

  // Filters for Detection tab
  const [sevFilter, setSevFilter] = useState('All');
  const [srcFilter, setSrcFilter] = useState('All');

  const filteredEvents = incident.detectionEvents.filter(ev => {
    if (sevFilter !== 'All' && ev.severity !== sevFilter) return false;
    if (srcFilter !== 'All' && ev.source !== srcFilter) return false;
    return true;
  });

  return (
    <div className="xdr-incident-detail" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Detail Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #30363d', background: '#0d1117' }}>
        <button className="link-btn" onClick={onClose} style={{ marginBottom: '12px' }}>← Back to Incidents</button>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ 
            background: getPriorityColor(incident.priority), 
            color: '#fff', padding: '4px 8px', borderRadius: '4px', 
            fontWeight: 'bold', fontSize: '14px', marginTop: '4px'
          }}>
            {incident.priority}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: '#e6edf3' }}>{incident.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ 
                background: '#21262d', border: '1px solid #30363d', 
                padding: '2px 8px', borderRadius: '12px', fontSize: '12px' 
              }}>
                {incident.status}
              </span>
              <span style={{ color: '#8b949e' }}>|</span>
              {incident.tactics.map(t => (
                <span key={t} style={{ 
                  background: getTacticColor(t), color: '#fff', 
                  padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #30363d', padding: '0 24px', background: '#0d1117' }}>
        {TABS.map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === t ? '3px solid #0070d2' : '3px solid transparent',
              padding: '12px 20px',
              color: activeTab === t ? '#e6edf3' : '#8b949e',
              cursor: 'pointer',
              fontWeight: activeTab === t ? 600 : 400,
              fontSize: '14px'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 8px', color: '#8b949e', fontSize: '13px' }}>
                  Reported by {incident.source.join(', ')} on {new Date(incident.created).toLocaleString()}
                </p>
                <p style={{ margin: 0, color: '#c9d1d9', fontSize: '14px', maxWidth: '800px' }}>
                  {incident.description}
                </p>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  Linked host: <a href="#" style={{ color: '#58a6ff' }}>{incident.host}</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn" onClick={() => showToast('Editing is disabled in the simulator.')}>Edit</button>
                <button className="btn btn-primary" onClick={() => showToast('New workflow launched!')} style={{ background: '#0070d2', color: '#fff' }}>Launch new incident workflow</button>
              </div>
            </div>

            <div className="panel" style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Attack Graph</h3>
              {incident.attackGraph && incident.attackGraph.nodes.length > 0 ? (
                <XdrAttackGraph nodes={incident.attackGraph.nodes} edges={incident.attackGraph.edges} />
              ) : (
                <div style={{ color: '#8b949e', fontStyle: 'italic' }}>No attack graph available.</div>
              )}
              <div style={{ marginTop: '16px' }}>
                <a href="#" style={{ color: '#58a6ff', fontSize: '13px' }}>Show timeline ↓</a>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="panel" style={{ padding: '16px', border: '1px solid #30363d', borderRadius: '8px', background: '#0d1117' }}>
                <h4 style={{ margin: '0 0 12px', color: '#8b949e', textTransform: 'uppercase', fontSize: '12px' }}>Assets</h4>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {incident.host}
                  {isIsolated && (
                    <span style={{ background: '#cf222e', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      ISOLATED
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <a href="#" style={{ color: '#58a6ff', fontSize: '12px', textDecoration: 'none' }}>Open profile</a>
                  <a href="#" onClick={handleIsolate} style={{ color: isIsolated ? '#8b949e' : '#f85149', fontSize: '12px', textDecoration: 'none', opacity: isIsolating ? 0.5 : 1 }}>
                    {isIsolating ? 'Isolating...' : isIsolated ? 'Remove Isolation' : 'Isolate Host'}
                  </a>
                </div>
              </div>
              
              <div className="panel" style={{ padding: '16px', border: '1px solid #30363d', borderRadius: '8px', background: '#0d1117' }}>
                <h4 style={{ margin: '0 0 12px', color: '#8b949e', textTransform: 'uppercase', fontSize: '12px' }}>Observables</h4>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {incident.c2Ips[0] || (incident.sha256[0] && incident.sha256[0].hash) || 'None'}
                </div>
                <div style={{ color: '#8b949e', fontSize: '12px' }}>Top active observable</div>
              </div>
              
              <div className="panel" style={{ padding: '16px', border: '1px solid #30363d', borderRadius: '8px', background: '#0d1117' }}>
                <h4 style={{ margin: '0 0 12px', color: '#8b949e', textTransform: 'uppercase', fontSize: '12px' }}>Indicators</h4>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {incident.detectionEvents[0]?.indicators[0] || 'Unknown'}
                </div>
                <a href="#" onClick={handleWatchlist} style={{ color: '#58a6ff', fontSize: '12px' }}>
                  {isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* DETECTION TAB */}
        {activeTab === 'Detection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <select className="select-like" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
                  <option value="All">Severity: All</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
                <select className="select-like" value={srcFilter} onChange={(e) => setSrcFilter(e.target.value)}>
                  <option value="All">Source: All</option>
                  {Array.from(new Set(incident.detectionEvents.map(e => e.source))).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button className="btn" onClick={handleDownload}>Download JSON ↓</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>First Seen</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Indicators</th>
                  <th>Observables</th>
                  <th>Assets</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No events match the filters.</td></tr>
                ) : filteredEvents.map(ev => {
                  const isExpanded = expandedEventId === ev.id;
                  
                  // Convert static timestamps to realistic dynamic relative times
                  let relativeTime = ev.firstSeen;
                  try {
                    const idx = incident.detectionEvents.indexOf(ev);
                    const hoursAgo = (idx * 2) + 1; // 1 hr ago, 3 hrs ago, etc.
                    relativeTime = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
                  } catch (e) {}

                  return (
                    <React.Fragment key={ev.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}>
                        <td style={{ whiteSpace: 'nowrap' }}>{relativeTime}</td>
                        <td>
                          <span style={{ 
                            background: ev.severity === 'Critical' ? '#D13438' : ev.severity === 'High' ? '#C0472B' : '#E8A000', 
                            color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' 
                          }}>
                            {ev.severity}
                          </span>
                        </td>
                        <td><a href="#" style={{ color: '#58a6ff' }}>{ev.source}</a></td>
                        <td>{ev.indicators.join(', ')}</td>
                        <td>
                          {ev.observables[0]} {ev.observables.length > 1 && <span style={{ color: '#8b949e', fontSize: '11px' }}>+{ev.observables.length - 1} more</span>}
                        </td>
                        <td>{ev.assets.join(', ')}</td>
                        <td>{isExpanded ? '▾' : '▸'}</td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: '#161b22' }}>
                          <td colSpan={7} style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '40px' }}>
                              <div>
                                <h5 style={{ margin: '0 0 8px', color: '#8b949e', textTransform: 'uppercase', fontSize: '11px' }}>All Observables</h5>
                                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                                  {ev.observables.map(obs => <li key={obs}>{obs}</li>)}
                                </ul>
                              </div>
                              <div>
                                <h5 style={{ margin: '0 0 8px', color: '#8b949e', textTransform: 'uppercase', fontSize: '11px' }}>All Indicators</h5>
                                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                                  {ev.indicators.map(ind => <li key={ind}>{ind}</li>)}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* RESPONSE TAB */}
        {activeTab === 'Response' && (
          <XdrResponsePlaybook incident={incident} onStatusChange={onStatusChange} />
        )}
      </div>

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: '#238636', color: '#fff', padding: '12px 24px',
          borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 9999, fontWeight: 600
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
