import { useClassroom } from "../context/ClassroomContext";
import { useSimulator } from "../context/SimulatorContext";

export function StudentDeskPage() {
  const { session, scenarios, grades, activities, messages, unseenScenariosForStudent, addStudentActivity } = useClassroom();
  const { addNotification } = useSimulator();
  if (!session || session.role !== "student") return null;

  const myUpdates = activities
    .filter((a) => a.studentId === session.studentId)
    .slice(0, 8);
  const latestMessages = messages.slice(0, 10);
  const newAssignments = unseenScenariosForStudent(session.studentId);
  const newAssignmentIds = new Set(newAssignments.map((s) => s.id));
  const score = grades[session.studentId];

  return (
    <div className="page-scroll">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Desk</h1>
          <p className="console-subtitle">Welcome, {session.name}. See instructor messages, assignments, and your latest updates in one place.</p>
          <p className="dash-muted">Current grade: {score?.score ?? "N/A"} {score?.comment ? `- ${score.comment}` : ""}</p>
        </div>
      </div>
      <div className="dash-kpi-grid" style={{ marginBottom: 12 }}>
        <div className="dash-kpi"><div className="dash-kpi-value">{newAssignments.length}</div><div className="dash-kpi-label">New Assignments</div></div>
        <div className="dash-kpi"><div className="dash-kpi-value">{latestMessages.length}</div><div className="dash-kpi-label">Instructor Messages</div></div>
        <div className="dash-kpi"><div className="dash-kpi-value">{myUpdates.length}</div><div className="dash-kpi-label">Your Recent Actions</div></div>
        <div className="dash-kpi"><div className="dash-kpi-value">{score?.score ?? "--"}</div><div className="dash-kpi-label">Current Score</div></div>
      </div>
      <div className="grid-top">
        <section className="panel">
          <div className="panel-h">Instructor Messages & Updates</div>
          <div className="student-feed">
            {latestMessages.length === 0 ? (
              <p className="dash-muted">No instructor messages yet.</p>
            ) : latestMessages.map((m) => (
              <article key={m.id} className={`student-feed-item ${m.kind}`}>
                <div className="student-feed-meta">
                  <span className="sev sev-medium">{m.kind}</span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                  <span>From: {m.createdBy}</span>
                </div>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">Your Latest Activity</div>
          <div className="student-feed">
            {myUpdates.length === 0 ? (
              <p className="dash-muted">No activity yet. Open an assignment to start.</p>
            ) : myUpdates.map((a) => (
              <article key={a.id} className="student-feed-item update">
                <div className="student-feed-meta">
                  <span>{new Date(a.at).toLocaleString()}</span>
                  <span>{a.action}</span>
                </div>
                <p>{a.details}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-h">Assignments from Instructor</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Status</th><th>Posted</th><th>Scenario</th><th>Instructions</th><th>Action</th></tr></thead>
            <tbody>
              {scenarios.length === 0 ? (
                <tr><td colSpan={5}>No scenarios posted yet.</td></tr>
              ) : scenarios.map((s) => (
                <tr key={s.id}>
                  <td>{newAssignmentIds.has(s.id) ? "New" : "Open"}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{s.title}</td>
                  <td>{s.instructions}</td>
                  <td>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        addStudentActivity("Scenario opened", s.title);
                        addNotification("Lab Scenario", `Instructor posted: ${s.title}`);
                        if (s.startPath) window.location.href = s.startPath;
                      }}
                    >
                      Start
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

