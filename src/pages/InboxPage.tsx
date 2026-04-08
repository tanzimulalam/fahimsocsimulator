import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  COMPROMISE_PERCENT,
  DATE_RANGE_DETAIL,
  DATE_RANGE_LABEL,
} from "../data/mockData";
import { TreemapWidget } from "../components/TreemapWidget";
import { ObservablesTable } from "../components/ObservablesTable";
import { EventTypesTable } from "../components/EventTypesTable";
import { IncidentSection } from "../components/IncidentSection";
import { Modal } from "../components/Modal";
import { useSimulator } from "../context/SimulatorContext";

const FILTERS_KEY = "amp-sim-inbox-filters-v1";

type InboxFilters = { onlyHigh: boolean; hideResolved: boolean; labTag: boolean };

function loadFilters(): InboxFilters {
  const defaults: InboxFilters = { onlyHigh: true, hideResolved: false, labTag: true };
  try {
    const raw = sessionStorage.getItem(FILTERS_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaults;
}

export function InboxPage() {
  const [searchParams] = useSearchParams();
  const fromIncident = searchParams.get("incident");
  const { resetAll, addNotification } = useSimulator();
  const [filterOpen, setFilterOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);

  const [filters, setFilters] = useState<InboxFilters>(() => loadFilters());

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

  return (
    <div className="page-scroll">
      <div className="sim-banner">
        Training simulator — not affiliated with Cisco. All incidents and endpoints are fictional.
      </div>

      {fromIncident ? (
        <div className="banner-info" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          Opened from <strong>XDR Investigate</strong> — incident <code>{fromIncident}</code>.
          <Link to="/inbox">Clear link</Link>
          <Link to="/xdr/investigate">← Back to XDR</Link>
        </div>
      ) : null}

      <div className="page-header">
        <div>
          <h1 className="page-title">Inbox</h1>
          <div className="compromise-line">
            <strong>{COMPROMISE_PERCENT}%</strong> compromised
            <div className="meter" aria-hidden>
              <div
                className="meter-fill"
                style={{ width: `${Math.min(COMPROMISE_PERCENT * 8, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => setResetConfirm(true)}>
            Reset
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setFilterOpen(true)}>
            New Filter
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              addNotification("Date range", "Date picker is simulated — range stays fixed for reproducible labs.")
            }
          >
            Change dates
          </button>
          <div className="date-pill">
            <strong>{DATE_RANGE_LABEL}</strong>
            <span>{DATE_RANGE_DETAIL}</span>
          </div>
        </div>
      </div>

      <div className="banner-info">
        No agentless global threat alerts events detected.{" "}
        <button type="button" className="link-btn" onClick={() => addNotification("Info", "Agentless alerts: explain in class what that means vs. connector-based telemetry.")}>
          What does this mean?
        </button>
      </div>

      <div className="grid-top">
        <TreemapWidget />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ObservablesTable emphasizeHigh={filters.onlyHigh} />
          <EventTypesTable />
        </div>
      </div>

      <IncidentSection expandIncidentId={fromIncident} instructorHideResolved={filters.hideResolved} />

      <footer className="footer-bar">
        <button
          type="button"
          className="link-btn"
          onClick={() => addNotification("Session", "Session timer is static in the training build.")}
        >
          Current session started about 1 hour ago (simulated).
        </button>
        <span>Data for this organization is hosted in North America (simulated).</span>
        <div className="footer-links">
          <span>© 2024 Cisco Systems, Inc. (UI homage — educational use only)</span>
          <button type="button" className="link-btn" onClick={() => setAgreementOpen(true)}>
            Service Agreement
          </button>
          <button
            type="button"
            className="btn"
            style={{ height: 28, fontSize: 11 }}
            onClick={() =>
              addNotification("Feedback", "Thanks — in production this would open a survey (simulated).")
            }
          >
            Give your feedback
          </button>
        </div>
      </footer>

      <Modal open={resetConfirm} title="Reset lab data?" onClose={() => setResetConfirm(false)}>
        <p>This restores all incidents, clears search, and clears your selection — same as day-1 state.</p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              resetAll();
              setResetConfirm(false);
            }}
          >
            Yes, reset
          </button>
          <button type="button" className="btn" onClick={() => setResetConfirm(false)}>
            Cancel
          </button>
        </div>
      </Modal>

      <Modal open={filterOpen} title="New Filter (simulated)" onClose={() => setFilterOpen(false)} wide>
        <p>Filters here only affect notifications in this demo — the list is still driven by incident state.</p>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.onlyHigh}
            onChange={(e) => setFilters((f) => ({ ...f, onlyHigh: e.target.checked }))}
          />
          Emphasize high-signal observables in class
        </label>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.hideResolved}
            onChange={(e) => setFilters((f) => ({ ...f, hideResolved: e.target.checked }))}
          />
          Hide resolved from discussion (conceptual)
        </label>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.labTag}
            onChange={(e) => setFilters((f) => ({ ...f, labTag: e.target.checked }))}
          />
          Tag exports as “SOC Lab”
        </label>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              addNotification(
                "Filter saved (simulated)",
                "Preferences stored in session storage. High-signal observables are highlighted when enabled."
              );
              setFilterOpen(false);
            }}
          >
            Apply
          </button>
          <button type="button" className="btn" onClick={() => setFilterOpen(false)}>
            Cancel
          </button>
        </div>
      </Modal>

      <Modal open={agreementOpen} title="Service Agreement (placeholder)" onClose={() => setAgreementOpen(false)}>
        <p>
          This is a local training application. No agreement with Cisco Systems is implied. Use only for education.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setAgreementOpen(false)}>
          Close
        </button>
      </Modal>
    </div>
  );
}
