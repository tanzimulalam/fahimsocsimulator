import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { xdrIncidents, XDRIncident } from "../../data/xdrIncidents";
import { XdrIncidentDetail } from "../../components/xdr/XdrIncidentDetail";
import { useClassroom } from "../../context/ClassroomContext";

export function XdrIncidentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const incidentParam = searchParams.get("incident");

  const { students } = useClassroom();

  // Load state from localStorage for statuses and assignees
  const [localIncidents, setLocalIncidents] = useState<XDRIncident[]>(() => {
    return xdrIncidents.map(inc => {
      let modified = { ...inc };
      try {
        const storedStatus = localStorage.getItem(`xdr_incident_status_${inc.id}`);
        if (storedStatus) modified.status = storedStatus as any;
        
        const storedAssignee = localStorage.getItem(`xdr_incident_assigned_${inc.id}`);
        if (storedAssignee !== null) modified.assigned = storedAssignee || undefined;
      } catch (e) {}
      return modified;
    });
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    localStorage.setItem(`xdr_incident_status_${id}`, newStatus);
    setLocalIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus as any } : inc));
  };

  const handleAssignChange = (id: string, newAssignee: string) => {
    localStorage.setItem(`xdr_incident_assigned_${id}`, newAssignee);
    setLocalIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, assigned: newAssignee || undefined } : inc));
  };

  const activeIncident = useMemo(() => {
    if (!incidentParam) return null;
    return localIncidents.find(i => i.id === incidentParam) || null;
  }, [incidentParam, localIncidents]);

  // Filters
  const [filterType, setFilterType] = useState<'All' | 'New' | 'Open' | 'Unassigned'>('All');

  const filteredIncidents = useMemo(() => {
    return localIncidents.filter(inc => {
      if (filterType === 'New') return inc.status.startsWith('New:');
      if (filterType === 'Open') return inc.status.startsWith('Open:');
      if (filterType === 'Unassigned') return !inc.assigned && !inc.status.startsWith('Closed:');
      return true;
    }).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }, [localIncidents, filterType]);

  const stats = useMemo(() => {
    const total = localIncidents.length;
    const newInc = localIncidents.filter(i => i.status.startsWith('New:')).length;
    const openInc = localIncidents.filter(i => i.status.startsWith('Open:')).length;
    const unassignedInc = localIncidents.filter(i => !i.assigned && !i.status.startsWith('Closed:')).length;
    return { total, newInc, openInc, unassignedInc };
  }, [localIncidents]);

  function selectIncident(id: string | null) {
    if (id) {
      setSearchParams({ incident: id });
    } else {
      setSearchParams({});
    }
  }

  function getPriorityColor(priority: number) {
    if (priority >= 1000) return '#D13438'; // Red
    if (priority >= 870) return '#C0472B'; // Dark orange-red
    if (priority >= 640) return '#E8A000'; // Amber
    return '#0078D4'; // Blue
  }

  const STATUS_OPTIONS = [
    'New: Presented', 'Open: Investigating', 'Open: Reported', 'Open: Contained', 
    'Open: Recovered', 'Hold: Internal', 'Hold: External', 'Hold: Legal', 
    'Closed: Under Review', 'Closed: Confirmed Threat', 'Closed: Suspected', 
    'Closed: False Positive', 'Closed: Near-Miss', 'Closed: Other'
  ];

  if (activeIncident) {
    return (
      <div className="xdr-inc-page" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
        <XdrIncidentDetail 
          incident={activeIncident} 
          onStatusChange={(status) => handleStatusChange(activeIncident.id, status)}
          onClose={() => selectIncident(null)} 
        />
      </div>
    );
  }

  return (
    <div className="xdr-inc-page" style={{ padding: '24px', background: '#0a0a0a', color: '#e6edf3', minHeight: '100%' }}>
      {/* Top Stat Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div 
          onClick={() => setFilterType('All')}
          style={{ padding: '16px', background: filterType === 'All' ? '#161b22' : '#0d1117', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', borderLeft: filterType === 'All' ? '4px solid #0070d2' : '1px solid #30363d' }}
        >
          <div style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>Total Incidents</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
        </div>
        <div 
          onClick={() => setFilterType('New')}
          style={{ padding: '16px', background: filterType === 'New' ? '#161b22' : '#0d1117', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', borderLeft: filterType === 'New' ? '4px solid #0070d2' : '1px solid #30363d' }}
        >
          <div style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>New Incidents</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.newInc}</div>
        </div>
        <div 
          onClick={() => setFilterType('Open')}
          style={{ padding: '16px', background: filterType === 'Open' ? '#161b22' : '#0d1117', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', borderLeft: filterType === 'Open' ? '4px solid #0070d2' : '1px solid #30363d' }}
        >
          <div style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>Open Incidents</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.openInc}</div>
        </div>
        <div 
          onClick={() => setFilterType('Unassigned')}
          style={{ padding: '16px', background: filterType === 'Unassigned' ? '#161b22' : '#0d1117', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', borderLeft: filterType === 'Unassigned' ? '4px solid #0070d2' : '1px solid #30363d' }}
        >
          <div style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>Unassigned Incidents</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.unassignedInc}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search incidents..." 
          style={{ padding: '8px 12px', border: '1px solid #30363d', borderRadius: '6px', flex: 1, background: '#0d1117', color: '#e6edf3' }}
        />
        <input 
          type="text" 
          placeholder="Date range: Custom" 
          disabled
          style={{ padding: '8px 12px', border: '1px solid #30363d', borderRadius: '6px', width: '200px', background: '#161b22', color: '#8b949e' }}
        />
        <button style={{ padding: '8px 16px', border: '1px solid #30363d', borderRadius: '6px', background: '#161b22', color: '#e6edf3', cursor: 'pointer' }}>
          Filters
        </button>
      </div>

      {/* Active Filter Tags */}
      {filterType !== 'All' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <span style={{ padding: '4px 8px', background: '#0070d2', color: '#fff', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Filter: {filterType} <span style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setFilterType('All')}>×</span>
          </span>
        </div>
      )}

      {/* Incidents Table */}
      <div style={{ border: '1px solid #30363d', borderRadius: '6px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#e6edf3' }}>Priority</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#e6edf3' }}>Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#e6edf3' }}>Source</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#e6edf3' }}>Created</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#e6edf3' }}>Assigned</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#e6edf3' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>No incidents found.</td></tr>
            ) : filteredIncidents.map(inc => {
              const diffDays = Math.floor((new Date().getTime() - new Date(inc.created).getTime()) / (1000 * 3600 * 24));
              const createdText = diffDays === 0 ? 'Today' : `${diffDays} days ago`;

              return (
                <tr key={inc.id} style={{ borderBottom: '1px solid #30363d', cursor: 'pointer' }} className="xdr-table-row">
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      background: getPriorityColor(inc.priority), color: '#fff', 
                      padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px'
                    }}>
                      {inc.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); selectIncident(inc.id); }}
                      style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {inc.title}
                    </a>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#8b949e' }}>{inc.source.join(', ')}</td>
                  <td style={{ padding: '12px 16px', color: '#8b949e' }}>{createdText}</td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    <select 
                      value={inc.assigned || ""} 
                      onChange={(e) => handleAssignChange(inc.id, e.target.value)}
                      style={{ 
                        padding: '4px 8px', border: '1px solid #30363d', borderRadius: '4px', 
                        fontSize: '12px', background: '#0d1117', color: '#e6edf3', cursor: 'pointer',
                        width: '100px'
                      }}
                    >
                      <option value="">Unassigned</option>
                      {students.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                      {/* If the current assignee isn't in the students list (e.g. from mock data), show it anyway */}
                      {inc.assigned && !students.find(s => s.name === inc.assigned) && (
                        <option value={inc.assigned}>{inc.assigned}</option>
                      )}
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    <select 
                      value={inc.status} 
                      onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                      style={{ 
                        padding: '4px 8px', border: '1px solid #30363d', borderRadius: '4px', 
                        fontSize: '12px', background: '#0d1117', color: '#e6edf3', cursor: 'pointer'
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
