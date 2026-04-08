import { Link } from "react-router-dom";

export function XdrFloatingButton() {
  return (
    <Link
      to="/xdr/investigate"
      className="xdr-fab"
      title="Open Cisco XDR Investigate (simulator)"
    >
      <span className="xdr-fab-inner">XDR</span>
    </Link>
  );
}
