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

  const handleSort = (col: keyof SnTicket) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else {
      setSortCol(col);
      setSortDesc(false);
    }
  };

  const activeBreadcrumb = () => {
    const parts = ["All", "Active = true"];
    if (assignedToFilter === "me") parts.push(`Assigned to = ${session?.name || 'Me'}`);
    if (groupFilter === "soc") parts.push("Assignment group = Security Operations Center");
    if (searchQuery) parts.push(`Search = ${searchQuery}`);
    return parts.join(" > ");
  };

  return (
    <div>
      <div className="sn-table-wrapper">
        <div className="sn-table-toolbar">
          <div className="sn-breadcrumb">
            {activeBreadcrumb()}
          </div>
          <h2 style={{ margin: 0, fontSize: 16 }}>Incidents ⭐</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input 
              type="text" 
              className="sn-filter-input" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ width: 200 }}
            />
            <button className="sn-btn">Actions on selected rows...</button>
          </div>
        </div>
        <table className="sn-table">
          <thead>
            <tr>
              <th>☐</th>
              <th>🔍</th>
              <th onClick={() => handleSort("number")} style={{cursor: "pointer", userSelect: "none"}}>Number {sortCol === "number" ? (sortDesc ? "▼" : "▲") : ""}</th>
              <th onClick={() => handleSort("openedAt")} style={{cursor: "pointer", userSelect: "none"}}>Opened {sortCol === "openedAt" ? (sortDesc ? "▼" : "▲") : ""}</th>
              <th onClick={() => handleSort("shortDescription")} style={{cursor: "pointer", userSelect: "none"}}>Short description {sortCol === "shortDescription" ? (sortDesc ? "▼" : "▲") : ""}</th>
              <th onClick={() => handleSort("caller")} style={{cursor: "pointer", userSelect: "none"}}>Caller {sortCol === "caller" ? (sortDesc ? "▼" : "▲") : ""}</th>
              <th onClick={() => handleSort("priority")} style={{cursor: "pointer", userSelect: "none"}}>Priority {sortCol === "priority" ? (sortDesc ? "▼" : "▲") : ""}</th>
              <th onClick={() => handleSort("state")} style={{cursor: "pointer", userSelect: "none"}}>State {sortCol === "state" ? (sortDesc ? "▼" : "▲") : ""}</th>
              <th onClick={() => handleSort("assignmentGroup")} style={{cursor: "pointer", userSelect: "none"}}>Assignment group {sortCol === "assignmentGroup" ? (sortDesc ? "▼" : "▲") : ""}</th>
              <th onClick={() => handleSort("assignedTo")} style={{cursor: "pointer", userSelect: "none"}}>Assigned to {sortCol === "assignedTo" ? (sortDesc ? "▼" : "▲") : ""}</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr><td colSpan={10} style={{textAlign: "center", padding: 20}}>No records to display</td></tr>
            ) : currentData.map(t => (
              <tr key={t.number}>
                <td><input type="checkbox" /></td>
                <td>ℹ️</td>
                <td><Link to={`/servicenow/incidents/${t.number}`} style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "bold" }}>{t.number}</Link></td>
                <td>{t.openedAt}</td>
                <td>{t.shortDescription}</td>
                <td>{t.caller}</td>
                <td>{t.priority}</td>
                <td>{t.state}</td>
                <td>{t.assignmentGroup}</td>
                <td>{t.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
