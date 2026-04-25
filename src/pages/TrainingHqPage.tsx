import { useMemo, useState } from "react";
import { useClassroom } from "../context/ClassroomContext";
import { useSimulator } from "../context/SimulatorContext";

type StudentSummary = {
  id: string;
  name: string;
  createdAt: number;
  lastAt: number | null;
  lastAction: string;
  actionCount: number;
};

export function TrainingHqPage() {
  const { session, students, activities, messages, publishInstructorMessage } = useClassroom();
  const { addNotification } = useSimulator();
  const [selectedStudentId, setSelectedStudentId] = useState("all");
  const [msgType, setMsgType] = useState<"announcement" | "assignment" | "update">("update");
  const [msgTitle, setMsgTitle] = useState("Class update");
  const [msgBody, setMsgBody] = useState("Please continue with your assigned incidents and post clear analyst comments before marking resolved.");

  const studentSummaries = useMemo<StudentSummary[]>(() => {
    return students.map((s) => {
      const mine = activities.filter((a) => a.studentId === s.id);
      const latest = mine[0];
      return {
        id: s.id,
        name: s.name,
        createdAt: s.createdAt,
        lastAt: latest?.at ?? null,
        lastAction: latest ? `${latest.action} — ${latest.details}` : "No activity yet",
        actionCount: mine.length,
      };
    });
  }, [students, activities]);

  const filteredActivity = useMemo(() => {
    if (selectedStudentId === "all") return activities.slice(0, 150);
    return activities.filter((a) => a.studentId === selectedStudentId).slice(0, 150);
  }, [activities, selectedStudentId]);

  const activeInLastHour = useMemo(
    () => studentSummaries.filter((s) => s.lastAt && Date.now() - s.lastAt < 60 * 60 * 1000).length,
    [studentSummaries]
  );

  const totalActionsToday = useMemo(
    () =>
      activities.filter((a) => {
        const d = new Date(a.at);
        const n = new Date();
        return (
          d.getFullYear() === n.getFullYear() &&
          d.getMonth() === n.getMonth() &&
          d.getDate() === n.getDate()
        );
      }).length,
    [activities]
  );

  function sendMessage() {
    if (!session || session.role !== "admin") return;
    const title = msgTitle.trim();
    const body = msgBody.trim();
    if (!title || !body) return;
    publishInstructorMessage({ title, body, kind: msgType }, session.name);
    addNotification("Student Desk update", `${msgType} posted to all students.`);
    setMsgBody("");
  }

  return (
    <div className="page-scroll">
      <div className="page-header">
        <div>
          <h1 className="page-title">Training HQ</h1>
          <p className="console-subtitle">
            Instructor console focused on live student activity and direct classroom communication.
          </p>
        </div>
      </div>

      <div className="dash-kpi-grid" style={{ marginBottom: 12 }}>
        <div className="dash-kpi"><div className="dash-kpi-value">{students.length}</div><div className="dash-kpi-label">Registered Students</div></div>
        <div className="dash-kpi"><div className="dash-kpi-value">{activeInLastHour}</div><div className="dash-kpi-label">Active (Last 60m)</div></div>
        <div className="dash-kpi"><div className="dash-kpi-value">{totalActionsToday}</div><div className="dash-kpi-label">Actions Today</div></div>
        <div className="dash-kpi"><div className="dash-kpi-value">{messages.length}</div><div className="dash-kpi-label">Instructor Messages Sent</div></div>
      </div>

      <div className="grid-top">
        <section className="panel">
          <div className="panel-h">1) Registered Students + Live Activity</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Registered</th>
                  <th>Last activity</th>
                  <th>Total actions</th>
                  <th>Latest event summary</th>
                </tr>
              </thead>
              <tbody>
                {studentSummaries.length === 0 ? (
                  <tr><td colSpan={5}>No registered students yet.</td></tr>
                ) : studentSummaries.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                    <td>{s.lastAt ? new Date(s.lastAt).toLocaleString() : "No activity"}</td>
                    <td>{s.actionCount}</td>
                    <td>{s.lastAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="def-toolbar" style={{ marginTop: 8 }}>
            <select
              className="select-like"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="all">Live log: All students</option>
              {students.map((s) => <option key={s.id} value={s.id}>Live log: {s.name}</option>)}
            </select>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Student</th><th>Action</th><th>Details</th></tr></thead>
              <tbody>
                {filteredActivity.length === 0 ? (
                  <tr><td colSpan={4}>No activity for this filter yet.</td></tr>
                ) : filteredActivity.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.at).toLocaleString()}</td>
                    <td>{a.studentName}</td>
                    <td>{a.action}</td>
                    <td>{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">2) Send Messages to All Students</div>
          <div style={{ padding: 12 }}>
            <label className="filter-check">
              Message type
              <select
                className="select-like"
                value={msgType}
                onChange={(e) => setMsgType(e.target.value as "announcement" | "assignment" | "update")}
              >
                <option value="announcement">Announcement</option>
                <option value="assignment">Assignment</option>
                <option value="update">Update</option>
              </select>
            </label>
            <label className="filter-check">
              Title
              <input
                className="def-search-inline"
                style={{ width: "100%" }}
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
              />
            </label>
            <label className="filter-check">
              Message
              <textarea
                className="analyst-comment-input"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={sendMessage}>Send to Student Desk</button>
            </div>
            <p className="dash-muted" style={{ marginTop: 6 }}>
              These messages appear in each student&apos;s Student Desk feed.
            </p>
          </div>
          <div className="panel-h">Recent Messages</div>
          <div className="student-feed">
            {messages.length === 0 ? (
              <p className="dash-muted">No instructor messages yet.</p>
            ) : messages.slice(0, 20).map((m) => (
              <article key={m.id} className={`student-feed-item ${m.kind}`}>
                <div className="student-feed-meta">
                  <span className="sev sev-medium">{m.kind}</span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                  <span>By {m.createdBy}</span>
                </div>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
