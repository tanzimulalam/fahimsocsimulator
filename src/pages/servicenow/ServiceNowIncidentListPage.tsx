import { useEffect, useState, useMemo } from "react";
import { loadServiceNowTickets, type SnTicket, type SnState } from "../../data/serviceNowTickets";
import { Link, useSearchParams } from "react-router-dom";
import { useClassroom } from "../../context/ClassroomContext";

function stateChipClass(state: SnState): string {
  if (state === "Resolved" || state === "Closed") return "sn-state-chip sn-state-resolved";
  if (state === "In Progress") return "sn-state-chip sn-state-in-progress";
  return "sn-state-chip";
}

export function ServiceNowIncidentListPage() {
  const { session } = useClassroom();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<SnTicket[]>([]);

  const assignedToFilter = searchParams.get("assignedTo");
  const groupFilter = searchParams.get("group");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol] = useState<keyof SnTicket>("openedAt");
  const [sortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setTickets(loadServiceNowTickets());
    const onReset = () => setTickets(loadServiceNowTickets());
    window.addEventListener("lab-state-reset", onReset);
    return () => window.removeEventListener("lab-state-reset", onReset);
  }, []);

  const filteredTickets = useMemo(() => {
    let res = [...tickets];

    if (assignedToFilter === "me") {
      const me = session?.name ?? "Shirsendu Mondal";
      res = res.filter((t) => t.assignedTo === me || t.assignedTo === session?.name);
    }
    if (groupFilter === "soc") {
      res = res.filter(
        (t) => t.assignmentGroup.includes("Security Operations Center") || t.assignmentGroup.includes("SOC")
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (t) =>
          t.number.toLowerCase().includes(q) ||
          t.shortDescription.toLowerCase().includes(q) ||
          t.caller.toLowerCase().includes(q) ||
          t.state.toLowerCase().includes(q) ||
          t.assignmentGroup.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q)
      );
    }

    res.sort((a, b) => {
      const aVal = a[sortCol] ?? "";
      const bVal = b[sortCol] ?? "";
      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

    return res;
  }, [tickets, assignedToFilter, groupFilter, searchQuery, sortCol, sortDesc, session]);

  const total = filteredTickets.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentData = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

  const assigneeLabel =
    assignedToFilter === "me" ? session?.name || "Shirsendu Mondal" : null;

  return (
    <div className="sn-content">
      <div className="sn-table-wrapper">
        <div className="sn-list-toolbar">
          <div className="sn-list-toolbar-left">
            <span style={{ fontSize: 16 }}>≡</span>
            <strong>Incidents</strong>
            <span className="sn-list-filter-pill">Assignment group ▼</span>
            <div className="sn-list-search-wrap">
              <span className="sn-list-search-label">Search</span>
              <input
                type="text"
                className="sn-list-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <button type="button" className="sn-btn" style={{ padding: "2px 8px", fontSize: 11 }}>
            Actions on selected rows…
          </button>
        </div>

        <div className="sn-filter-breadcrumb">
          <span className="sn-filter-breadcrumb-muted">All &gt; Active = true &gt;</span>{" "}
          {groupFilter === "soc" ? "Assignment group = Network & Telephony > State = Resolved > " : ""}
          {assigneeLabel ? `Assigned to = ${assigneeLabel} >` : ""}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="sn-table">
            <thead>
              <tr>
                <th style={{ width: 30, textAlign: "center" }} />
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
                  <td style={{ textAlign: "center", color: "#888" }}>ℹ</td>
                  <td>
                    <Link to={`/servicenow/incidents/${t.number}`}>{t.number}</Link>
                  </td>
                  <td>{t.openedAt}</td>
                  <td>{t.shortDescription}</td>
                  <td>{t.caller}</td>
                  <td>{t.priority}</td>
                  <td>
                    <span className={stateChipClass(t.state)}>{t.state}</span>
                  </td>
                  <td>{t.assignmentGroup}</td>
                  <td>{t.assignedTo || "—"}</td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 24, color: "#888" }}>
                    No records to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="sn-pagination">
          <span>
            {total > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="sn-pagination-arrows">
            <button type="button" className="sn-pagination-btn" disabled={page === 1} onClick={() => setPage(1)}>
              &lt;&lt;
            </button>
            <button type="button" className="sn-pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
              &lt;
            </button>
            <button
              type="button"
              className="sn-pagination-btn"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              &gt;
            </button>
            <button
              type="button"
              className="sn-pagination-btn"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
