import { Link } from "react-router-dom";

export function DefenderFloatingButton() {
  return (
    <Link
      to="/defender/home"
      className="defender-fab"
      title="Open Microsoft Defender simulator"
    >
      <span className="defender-fab-inner">Defender</span>
    </Link>
  );
}

