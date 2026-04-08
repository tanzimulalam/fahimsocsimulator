import { useEffect, useRef, useState } from "react";
import { useClassroom } from "../context/ClassroomContext";

export function StudentNotesPage() {
  const { session, notes, saveStudentNote, addStudentActivity } = useClassroom();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [color, setColor] = useState("#111111");
  const studentId = session?.role === "student" ? session.studentId : null;
  if (!studentId) return null;

  useEffect(() => {
    const html = notes[studentId]?.html;
    if (editorRef.current && html) editorRef.current.innerHTML = html;
  }, [notes, studentId]);

  function cmd(name: string, value?: string) {
    document.execCommand(name, false, value);
  }

  function save() {
    const html = editorRef.current?.innerHTML ?? "";
    saveStudentNote(studentId!, html);
    addStudentActivity("Incident note saved", "Updated student notebook");
  }

  return (
    <div className="page-scroll">
      <h1 className="page-title">My Incident Handler Notes</h1>
      <div className="def-toolbar">
        <button type="button" className="btn" onClick={() => cmd("bold")}><b>B</b></button>
        <button type="button" className="btn" onClick={() => cmd("italic")}><i>I</i></button>
        <button type="button" className="btn" onClick={() => cmd("underline")}><u>U</u></button>
        <button type="button" className="btn" onClick={() => cmd("hiliteColor", "yellow")}>Highlight</button>
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
              "<table border='1' style='border-collapse:collapse;width:100%'><tr><th>Time</th><th>Evidence</th><th>Action</th></tr><tr><td></td><td></td><td></td></tr></table><br/>"
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
  );
}

