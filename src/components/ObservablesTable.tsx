import { useMemo, useState } from "react";
import { observables } from "../data/mockData";
import type { ObservableRow } from "../types";
import { Modal } from "./Modal";
import { useSimulator } from "../context/SimulatorContext";

const PAGE_SIZE = 3;

export function ObservablesTable({ emphasizeHigh = false }: { emphasizeHigh?: boolean }) {
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<ObservableRow | null>(null);
  const { addNotification } = useSimulator();

  const totalPages = Math.max(1, Math.ceil(observables.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages - 1);
  const slice = useMemo(() => {
    const start = pageClamped * PAGE_SIZE;
    return observables.slice(start, start + PAGE_SIZE);
  }, [pageClamped]);

  function go(p: number) {
    setPage(Math.max(0, Math.min(totalPages - 1, p)));
  }

  async function copyHash(row: ObservableRow) {
    try {
      await navigator.clipboard.writeText(row.fullHash);
      addNotification("Observable", "Full hash copied — compare with VT / internal intel.");
    } catch {
      addNotification("Copy", "Clipboard unavailable.");
    }
  }

  return (
    <>
      <div className={"panel" + (emphasizeHigh ? " obs-emphasize" : "")}>
        <div className="panel-h">Significant Compromise Observables</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name / Hash</th>
                <th style={{ width: 80 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((o) => (
                <tr key={o.id}>
                  <td>{o.type}</td>
                  <td>
                    <button
                      type="button"
                      className="event-row-btn obs-row-btn"
                      onClick={() => setDetail(o)}
                      title="Click for full SHA-256"
                    >
                      <code>{o.hash}</code>
                    </button>
                  </td>
                  <td>
                    <span className={"badge-count " + o.variant}>{o.count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination" aria-label="Pagination">
          <button type="button" disabled={pageClamped <= 0} onClick={() => go(0)}>
            ≪
          </button>
          <button type="button" disabled={pageClamped <= 0} onClick={() => go(pageClamped - 1)}>
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={i === pageClamped ? "active" : undefined}
              onClick={() => go(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={pageClamped >= totalPages - 1}
            onClick={() => go(pageClamped + 1)}
          >
            ›
          </button>
          <button
            type="button"
            disabled={pageClamped >= totalPages - 1}
            onClick={() => go(totalPages - 1)}
          >
            ≫
          </button>
        </div>
      </div>

      <Modal open={!!detail} title="Observable — full hash" onClose={() => setDetail(null)} wide>
        {detail ? (
          <>
            <p>
              <strong>Type:</strong> {detail.type} · <strong>hits:</strong> {detail.count}
            </p>
            <p>Full SHA-256 (use for pivoting / allowlisting exercises):</p>
            <div className="hash-block">{detail.fullHash}</div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => void copyHash(detail)}>
                Copy hash
              </button>
              <button type="button" className="btn" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}
