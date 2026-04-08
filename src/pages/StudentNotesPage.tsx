import { useEffect, useRef, useState } from "react";
import { useClassroom } from "../context/ClassroomContext";
import { useSimulator } from "../context/SimulatorContext";

export function StudentNotesPage() {
  const { session, notes, grades, instructorPages, createNotebookPage, setActiveNotebookPage, saveStudentNote, addStudentActivity } = useClassroom();
  const { addNotification } = useSimulator();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [color, setColor] = useState("#111111");
  const [title, setTitle] = useState("");
  const [viewTab, setViewTab] = useState<"my" | "instructor" | "template">("my");
  const studentId = session?.role === "student" ? session.studentId : null;
  if (!studentId) return null;
  const sid = studentId;
  const notebook = notes[sid];
  const activePageId = notebook?.activePageId ?? notebook?.pages[0]?.id ?? "";
  const activePage = notebook?.pages.find((p) => p.id === activePageId);

  useEffect(() => {
    const html = activePage?.html ?? "";
    if (editorRef.current && html) editorRef.current.innerHTML = html;
  }, [activePage?.id, activePage?.html]);

  function cmd(name: string, value?: string) {
    document.execCommand(name, false, value);
  }

  function save() {
    const html = editorRef.current?.innerHTML ?? "";
    if (!activePageId) return;
    saveStudentNote(sid, activePageId, html);
    addStudentActivity("Incident note saved", "Updated student notebook");
    addNotification("Notes", "Your incident note has been saved.");
  }

  function newPage() {
    const t = title.trim() || `Daily Work - ${new Date().toLocaleDateString()}`;
    createNotebookPage(sid, t);
    setTitle("");
    addStudentActivity("Notebook page created", t);
  }

  return (
    <div className="page-scroll">
      <h1 className="page-title">My Incident Handler Notes</h1>
      <p className="dash-muted">OneNote-style notebook with daily pages. Instructor can review and grade your notes.</p>
      <div className="def-tabs" style={{ marginBottom: 10 }}>
        <button type="button" className={"btn" + (viewTab === "my" ? " btn-primary" : "")} onClick={() => setViewTab("my")}>My Notebook</button>
        <button type="button" className={"btn" + (viewTab === "instructor" ? " btn-primary" : "")} onClick={() => setViewTab("instructor")}>Instructor Notes (view only)</button>
        <button type="button" className={"btn" + (viewTab === "template" ? " btn-primary" : "")} onClick={() => setViewTab("template")}>Incident Handler Template (view only)</button>
      </div>
      {viewTab === "my" ? (
      <div className="grid-top" style={{ gridTemplateColumns: "260px 1fr" }}>
        <section className="panel">
          <div className="panel-h">Notebook Pages</div>
          <div style={{ padding: 10 }}>
            <input className="def-search-inline" style={{ width: "100%" }} placeholder="New page title (e.g., Day 1 triage)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={newPage}>Add Page</button>
            </div>
            <ul className="dash-list">
              {(notebook?.pages ?? []).map((p) => (
                <li key={p.id}>
                  <button type="button" className="link-btn" onClick={() => setActiveNotebookPage(sid, p.id)}>
                    {p.title}
                  </button>
                </li>
              ))}
            </ul>
            <p className="dash-muted">Grade: {grades[sid]?.score ?? "N/A"}</p>
            {grades[sid]?.comment ? <p className="dash-muted">Instructor feedback: {grades[sid]?.comment}</p> : null}
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">{activePage?.title ?? "Select or create a page"}</div>
          <div style={{ padding: 10 }}>
      <div className="def-toolbar">
        <button type="button" className="btn" onClick={() => cmd("bold")}><b>B</b></button>
        <button type="button" className="btn" onClick={() => cmd("italic")}><i>I</i></button>
        <button type="button" className="btn" onClick={() => cmd("underline")}><u>U</u></button>
        <button type="button" className="btn" onClick={() => cmd("hiliteColor", "yellow")}>Highlight Y</button>
        <button type="button" className="btn" onClick={() => cmd("hiliteColor", "#93c5fd")}>Highlight Blue</button>
        <button type="button" className="btn" onClick={() => cmd("hiliteColor", "#86efac")}>Highlight Green</button>
        <button type="button" className="btn" onClick={() => cmd("hiliteColor", "#fca5a5")}>Highlight Red</button>
        <label className="filter-check">
          Text color
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <button type="button" className="btn" onClick={() => cmd("foreColor", color)}>Apply color</button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            cmd(
              "insertHTML",
              "<table class='student-note-table'><tr><th>Time</th><th>Evidence</th><th>Action</th></tr><tr><td></td><td></td><td></td></tr></table><br/>"
            )
          }
        >
          Insert table
        </button>
        <button type="button" className="btn btn-primary" onClick={save}>Save Notes</button>
      </div>
      <div className="notepad-wrap" style={{ minHeight: "60vh" }}>
        <div ref={editorRef} className="notepad-editor" contentEditable suppressContentEditableWarning spellCheck />
      </div>
          </div>
        </section>
      </div>
      ) : null}

      {viewTab === "instructor" ? (
        <section className="panel">
          <div className="panel-h">Instructor Notes</div>
          <div style={{ padding: 12 }} dangerouslySetInnerHTML={{ __html: instructorPages.instructorNotes }} />
        </section>
      ) : null}

      {viewTab === "template" ? (
        <section className="panel">
          <div className="panel-h">Incident Handler Template</div>
          <div style={{ padding: 12 }} dangerouslySetInnerHTML={{ __html: instructorPages.incidentTemplate }} />
        </section>
      ) : null}
    </div>
  );
}

