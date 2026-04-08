import { Link } from "react-router-dom";

export function NotepadFloatingButton() {
  return (
    <Link to="/notepad" className="notepad-fab" title="Open instructor notepad">
      <span className="notepad-fab-inner">Notepad</span>
    </Link>
  );
}

