import { Link } from "react-router-dom";
import { useClassroom } from "../context/ClassroomContext";
import { useSimulator } from "../context/SimulatorContext";

export function StudentDeskPage() {
  const { session, scenarios, addStudentActivity } = useClassroom();
  const { addNotification } = useSimulator();
  if (!session || session.role !== "student") return null;

  return (
    <div className="page-scroll">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Desk</h1>
          <p className="console-subtitle">Welcome, {session.name}. Track instructor scenarios and record your incident notes.</p>
        </div>
        <div className="header-actions">
          <Link to="/student-notes" className="btn btn-primary">Open My Incident Notes</Link>
        </div>
      </div>
      <section className="panel">
        <div className="panel-h">Assigned Lab Scenarios</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Posted</th><th>Scenario</th><th>Instructions</th><th>Action</th></tr></thead>
            <tbody>
              {scenarios.length === 0 ? (
                <tr><td colSpan={4}>No scenarios posted yet.</td></tr>
              ) : scenarios.map((s) => (
                <tr key={s.id}>
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

