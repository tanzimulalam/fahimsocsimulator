import { useEffect, useState, useMemo } from "react";
import { loadServiceNowTickets, type SnTicket } from "../../data/serviceNowTickets";
import { Link, useSearchParams } from "react-router-dom";
import { useClassroom } from "../../context/ClassroomContext";

export function ServiceNowIncidentListPage() {
  const { session } = useClassroom();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<SnTicket[]>([]);
  
  const assignedToFilter = searchParams.get("assignedTo");
  const groupFilter = searchParams.get("group");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol, setSortCol] = useState<keyof SnTicket>("openedAt");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setTickets(loadServiceNowTickets());
  }, []);

  const filteredTickets = useMemo(() => {
    let res = [...tickets];

    if (assignedToFilter === "me") {
      res = res.filter(t => t.assignedTo === session?.name);
    }
    if (groupFilter === "soc") {
      res = res.filter(t => t.assignmentGroup.includes("Security Operations Center") || t.assignmentGroup.includes("SOC"));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(t => 
        t.number.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.caller.toLowerCase().includes(q) ||
        t.state.toLowerCase().includes(q) ||
        t.assignmentGroup.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
      );
    }

    res.sort((a, b) => {
      let aVal = a[sortCol] ?? "";
      let bVal = b[sortCol] ?? "";
      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

    return res;
  }, [tickets, assignedToFilter, groupFilter, searchQuery, sortCol, sortDesc, session]);

  const total = filteredTickets.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentData = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="sn-content">
      <div className="sn-table-wrapper">
        <div style={{ backgroundColor: "#292929", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "white" }}>
            <span style={{ fontSize: 16 }}>≡</span>
            <span style={{ color: "#aaa" }}>▼</span>
            <strong>Incidents</strong>
            <span style={{ backgroundColor: "#1e1e1e", border: "1px solid #444", padding: "2px 8px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              Assignment group ▼
            </span>
            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#111", border: "1px solid #444", borderRadius: 4, overflow: "hidden" }}>
              <span style={{ padding: "0 6px", color: "#888", borderRight: "1px solid #444" }}>Search</span>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }} 
                style={{ background: "transparent", border: "none", color: "white", padding: "2px 6px", width: 120, outline: "none", fontSize: 12 }} 
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="sn-btn" style={{ padding: "2px 8px", fontSize: 11 }}>Actions on selected rows...</button>
          </div>
        </div>

        <div style={{ padding: "8px 12px", fontSize: 11, color: "white", borderBottom: "1px solid #333", backgroundColor: "#2b2b2b" }}>
          <span style={{ color: "#aaa" }}>All &gt; Active = true &gt;</span> {groupFilter ? `Assignment group = ${groupFilter === 'soc' ? 'Security Operations Center' : 'DOIT'} >` : ''} {assignedToFilter === 'me' ? `Assigned to = ${session?.name || 'Me'} >` : ''}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="sn-table">
            <thead>
              <tr>
                <th style={{ width: 30, textAlign: "center" }}>🔍</th>
                <th>Number</th>
                <th>Opened</th>
                <th>Short description</th>
                <th>Caller</th>
                <th>Priority</th>
                <th>State</th>
                <th>Assignment group</th>
                <th>Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((t, i) => (
                <tr key={t.number} style={{ backgroundColor: i % 2 === 0 ? "#2b2b2b" : "#2f2f2f" }}>
                  <td style={{ textAlign: "center", color: "#888" }}>ℹ️</td>
                  <td>
                    <Link to={`/servicenow/incidents/${t.number}`} style={{ color: "#5c9bfa", textDecoration: "none" }}>{t.number}</Link>
                  </td>
                  <td>{t.openedAt}</td>
                  <td>{t.shortDescription}</td>
                  <td style={{ color: "#5c9bfa" }}>{t.caller}</td>
                  <td>{t.priority}</td>
                  <td>{t.state}</td>
                  <td style={{ color: "#5c9bfa" }}>{t.assignmentGroup}</td>
                  <td style={{ color: "#5c9bfa" }}>{t.assignedTo}</td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 24, color: "#888" }}>No records to display</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="sn-pagination">
          <span>{total > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total}</span>
          <div className="sn-pagination-arrows">
            <button className="sn-pagination-btn" disabled={page === 1} onClick={() => setPage(1)}>&lt;&lt;</button>
            <button className="sn-pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>&lt;</button>
            <button className="sn-pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>&gt;</button>
            <button className="sn-pagination-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>&gt;&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
