import { useEffect, useState } from "react";
import { useSimulator } from "../context/SimulatorContext";

/** Brief on-screen confirmation for the latest notification */
export function ToastStrip() {
  const { notifications } = useSimulator();
  const [visible, setVisible] = useState(false);
  const latest = notifications[0];

  useEffect(() => {
    if (!latest) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(t);
  }, [latest?.id]);

  if (!latest || !visible) return null;

  return (
    <div className="toast-strip" role="status">
      <strong>{latest.title}</strong>
      <span>{latest.message}</span>
    </div>
  );
}
