import { useState } from "react";
import { eventTypes } from "../data/mockData";
import type { Severity } from "../types";
import { Modal } from "./Modal";
import { useSimulator } from "../context/SimulatorContext";

function sevClass(s: Severity): string {
  if (s === "low") return "sev-low";
  if (s === "medium") return "sev-medium";
  return "sev-high";
}

export function EventTypesTable() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { addNotification } = useSimulator();

  function openRow(n: string) {
    setName(n);
    setOpen(true);
  }

  return (
    <>
      <div className="panel">
        <div className="panel-h">Compromise Event Types</div>
        <div className="table-wrap">
          <table className="data-table event-type-row">
            <tbody>
              {eventTypes.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ width: 88 }}>
                    <span className={"sev " + sevClass(row.severity)}>{row.severity}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="event-row-btn et-row-btn"
                      style={{ width: "100%", textAlign: "left" }}
                      onClick={() => openRow(row.name)}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="bar-cell">
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(row.count / row.maxInDataset) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td style={{ width: 48, textAlign: "right" }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title="Event type — teaching notes" onClose={() => setOpen(false)} wide>
        <p>
          <strong>{name}</strong>
        </p>
        <p>
          In class, map this label to your runbooks: <em>What do you verify first?</em> (prevalence,
          containment, false-positive rate, user impact). This simulator does not run real detection logic.
        </p>
        <p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              addNotification("Drill", `Discussed event type: ${name}`);
              setOpen(false);
            }}
          >
            Log “discussed in class”
          </button>
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
