import { Link } from "react-router-dom";

export function AmpFloatingButton() {
  return (
    <Link
      to="/inbox"
      className="amp-fab"
      title="Open AMP inbox"
    >
      <span className="amp-fab-inner">AMP</span>
    </Link>
  );
}

