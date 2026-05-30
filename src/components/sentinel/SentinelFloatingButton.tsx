import { Link } from "react-router-dom";

export function SentinelFloatingButton() {
  return (
    <Link to="/sentinel/overview" className="sentinel-fab" title="Open Microsoft Sentinel simulator">
      <span className="sentinel-fab-inner">Sentinel</span>
    </Link>
  );
}
