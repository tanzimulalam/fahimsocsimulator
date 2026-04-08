import { useState } from "react";
import { useClassroom } from "../context/ClassroomContext";

type Props = {
  onProceed: (studentId: string, name: string) => void;
};

export function StudentAccessPage({ onProceed }: Props) {
  const { students, registerStudent } = useClassroom();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("");

  function createAndContinue() {
    const n = name.trim();
    if (!n) return;
    const st = registerStudent(n);
    onProceed(st.id, st.name);
  }

  return (
    <div className="landing-wrap">
      <main className="landing-card">
        <h1>Student Classroom Access</h1>
        <p className="landing-sub">Register your name once, then select your profile for future labs.</p>

        <div className="grid-top">
          <section className="panel">
            <div className="panel-h">Register New Student</div>
            <div style={{ padding: 12 }}>
              <input
                className="search-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="btn btn-primary" onClick={createAndContinue}>Register & Continue</button>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-h">Registered Students</div>
            <div style={{ padding: 12 }}>
              <select className="select-like" style={{ width: "100%" }} value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">Select your name</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  disabled={!selected}
                  onClick={() => {
                    const s = students.find((x) => x.id === selected);
                    if (s) onProceed(s.id, s.name);
                  }}
                >
                  Continue as Selected Student
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

