
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  MapPin,
  CalendarDays,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { api, getErrorMessage } from "./api.js";
import "./RescueReportManagement.css";

const STATUSES = [
  "ALL",
  "REPORTED",
  "OPEN",
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

const ADMIN_TRANSITIONS = {
  OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESCUED", "CANCELLED"],
  RESCUED: ["MEDICAL_CARE", "SHELTERED", "CLOSED"],
  MEDICAL_CARE: ["SHELTERED", "CLOSED"],
  SHELTERED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

function getReports(response) {
  const data = response?.data?.data;
  return data?.reports ?? (Array.isArray(data) ? data : []);
}

function getPayload(response) {
  return response?.data?.data;
}

function readable(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value).replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleString();
}

function field(object, camelName, snakeName) {
  return object?.[camelName] ?? object?.[snakeName];
}

function Detail({ label, value }) {
  return (
    <div className="rescue-detail">
      <span>{label}</span>
      <strong>{readable(value)}</strong>
    </div>
  );
}

function isNotFound(error) {
  return error?.response?.status === 404;
}

function getCaseFromResponse(response) {
  const data = getPayload(response);
  return data?.rescueCase ?? data?.case ?? data ?? null;
}

export default function RescueReportManagement({ onChanged }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [rescueCase, setRescueCase] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);

  const [finalPriority, setFinalPriority] = useState("");
  const [adminDecision, setAdminDecision] = useState("true");
  const [decisionReason, setDecisionReason] = useState("");

  const [nextStatus, setNextStatus] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
const [volunteersLoading, setVolunteersLoading] = useState(false);
const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
const [assigningVolunteer, setAssigningVolunteer] = useState(false);
const [lastAssignedVolunteer, setLastAssignedVolunteer] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadReports(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await api.get("/rescue-reports");
      setReports(getReports(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const type = field(report, "animalType", "animal_type") ?? "";
      const location =
        report.address ??
        field(report, "locationType", "location_type") ??
        "";
      const description = report.description ?? "";
      const id = report.id ?? "";
      const status = String(report.status || "REPORTED").toUpperCase();

      const matchesSearch = [type, location, description, id]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  function resetWorkflow() {
    setRescueCase(null);
    setFinalPriority("");
    setAdminDecision("true");
    setDecisionReason("");
    setNextStatus("");
    setSuccess("");
  }

  async function loadCase(reportId) {
    setCaseLoading(true);

    try {
      const response = await api.get(
        `/rescue-cases/reports/${reportId}`
      );

      const loadedCase = getCaseFromResponse(response);
      setRescueCase(loadedCase);
if (
  loadedCase &&
  ["OPEN", "ASSIGNED"].includes(
    String(loadedCase.status || "").toUpperCase()
  )
) {
  await loadVolunteers();
} else {
  setVolunteers([]);
  setSelectedVolunteerId("");
}
setSelectedVolunteerId("");
setLastAssignedVolunteer(null);
      const currentStatus = String(
        field(loadedCase, "status", "status") ?? ""
      ).toUpperCase();

      setNextStatus(ADMIN_TRANSITIONS[currentStatus]?.[0] ?? "");

      return loadedCase;
    } catch (err) {
      if (isNotFound(err)) {
        setRescueCase(null);
        setNextStatus("");
        return null;
      }

      setError(
        `Could not load the rescue case. ${getErrorMessage(err)}`
      );
      return null;
    } finally {
      setCaseLoading(false);
    }
  }

  async function loadVolunteers() {
  setVolunteersLoading(true);

  try {
    const response = await api.get("/users");
    const users = response.data?.data?.users;

    if (!Array.isArray(users)) {
      throw new Error("The server returned an unexpected users response.");
    }

    const activeVolunteers = users.filter(
      (user) =>
        String(user.role || "").toUpperCase() === "VOLUNTEER" &&
        String(user.status || "").toUpperCase() === "ACTIVE"
    );

    setVolunteers(activeVolunteers);

    setSelectedVolunteerId((currentId) =>
      activeVolunteers.some((user) => user.id === currentId)
        ? currentId
        : activeVolunteers[0]?.id || ""
    );
  } catch (err) {
    setVolunteers([]);
    setSelectedVolunteerId("");
    setError(`Could not load active volunteers. ${getErrorMessage(err)}`);
  } finally {
    setVolunteersLoading(false);
  }
}

  async function openReport(report) {
    setSelectedReport(report);
    setDetailLoading(true);
    setError("");
    resetWorkflow();

    try {
      const response = await api.get(`/rescue-reports/${report.id}`);
      const data = getPayload(response);
      const fullReport = data?.report ?? data;

      if (fullReport && typeof fullReport === "object") {
        setSelectedReport(fullReport);
      }
    } catch (err) {
      setError(
        `Could not load additional report details. ${getErrorMessage(err)}`
      );
    } finally {
      setDetailLoading(false);
    }

    await loadCase(report.id);
  }

  function closeReport() {
    setSelectedReport(null);
    resetWorkflow();
    setError("");
  }

  async function submitReview(event) {
    event.preventDefault();

    if (!selectedReport?.id) {
      setError("The selected report has no valid ID.");
      return;
    }

    if (!PRIORITIES.includes(finalPriority)) {
      setError("Please select a final rescue priority.");
      return;
    }

    if (
      adminDecision === "false" &&
      !decisionReason.trim()
    ) {
      setError("Please provide a reason when overriding the recommendation.");
      return;
    }

    setSavingReview(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `/rescue-cases/reports/${selectedReport.id}/review`,
        {
          finalPriority,
          adminDecision: adminDecision === "true",
          adminDecisionReason: decisionReason.trim(),
        }
      );

      const data = getPayload(response);
      const returnedCase = data?.rescueCase ?? data?.case ?? null;

      if (returnedCase) {
        setRescueCase(returnedCase);

        const currentStatus = String(returnedCase.status ?? "")
          .toUpperCase();

        setNextStatus(ADMIN_TRANSITIONS[currentStatus]?.[0] ?? "");
      } else {
        await loadCase(selectedReport.id);
      }

      setSuccess(
        response?.data?.message ||
          "The rescue report review was saved successfully."
      );

      await loadReports(true);

      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingReview(false);
    }
  }

  async function submitStatusUpdate(event) {
    event.preventDefault();

    const caseId = rescueCase?.id;

    if (!caseId) {
      setError("No rescue case ID was returned by the backend.");
      return;
    }

    if (!nextStatus) {
      setError("There is no available next status for this case.");
      return;
    }

    setSavingStatus(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/rescue-cases/${caseId}/status`,
        { status: nextStatus }
      );

      const updatedCase = getCaseFromResponse(response);

      if (updatedCase && typeof updatedCase === "object") {
        setRescueCase(updatedCase);

        const currentStatus = String(updatedCase.status ?? "")
          .toUpperCase();

        setNextStatus(ADMIN_TRANSITIONS[currentStatus]?.[0] ?? "");
      } else {
        await loadCase(selectedReport.id);
      }

      setSuccess(
        response?.data?.message ||
          "The rescue case status was updated successfully."
      );

      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingStatus(false);
    }
  }

  async function submitVolunteerAssignment(event) {
  event.preventDefault();

  if (!rescueCase?.id) {
    setError("A valid rescue case is required before assigning a volunteer.");
    return;
  }

  const status = String(rescueCase.status || "").toUpperCase();

  if (!["OPEN", "ASSIGNED"].includes(status)) {
    setError("Volunteers can only be assigned to OPEN or ASSIGNED cases.");
    return;
  }

  if (!selectedVolunteerId) {
    setError("Please select an active volunteer.");
    return;
  }

  setAssigningVolunteer(true);
  setError("");
  setSuccess("");
  setLastAssignedVolunteer(null);

  try {
    const response = await api.post(
      `/volunteer-assignments/cases/${rescueCase.id}/assign`,
      { volunteerId: selectedVolunteerId }
    );

    const data = response.data?.data;
    const assignedVolunteer = data?.volunteer;
    const volunteerName = assignedVolunteer
      ? [assignedVolunteer.first_name, assignedVolunteer.last_name]
          .filter(Boolean)
          .join(" ")
      : volunteers.find((user) => user.id === selectedVolunteerId)
          ? [
              volunteers.find((user) => user.id === selectedVolunteerId)
                .first_name,
              volunteers.find((user) => user.id === selectedVolunteerId)
                .last_name,
            ]
              .filter(Boolean)
              .join(" ")
          : "Selected volunteer";

    setLastAssignedVolunteer({
      id: selectedVolunteerId,
      name: volunteerName || "Selected volunteer",
      assignment: data?.assignment || null,
    });

    setSuccess(
      response.data?.message ||
        `${volunteerName || "Volunteer"} assigned successfully.`
    );

    const updatedCase = data?.rescueCase;

    if (updatedCase) {
      setRescueCase(updatedCase);
      const statusNow = String(updatedCase.status || "").toUpperCase();
      setNextStatus(ADMIN_TRANSITIONS[statusNow]?.[0] ?? "");
    } else {
      await loadCase(selectedReport.id);
    }

    if (typeof onChanged === "function") {
      onChanged();
    }
  } catch (err) {
    setError(
      err.response?.data?.message || getErrorMessage(err)
    );
  } finally {
    setAssigningVolunteer(false);
  }
}

  const currentCaseStatus = String(rescueCase?.status ?? "")
    .toUpperCase();

  const availableTransitions =
    ADMIN_TRANSITIONS[currentCaseStatus] ?? [];

  return (
    <section className="rescue-manager">
      <div className="rescue-manager-toolbar">
        <div className="rescue-manager-search">
          <Search size={17} />
          <input
            aria-label="Search rescue reports"
            placeholder="Search reports, locations or descriptions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="rescue-manager-actions">
          <select
            aria-label="Filter rescue reports by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : readable(status)}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="rescue-secondary-button"
            onClick={() => loadReports(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rescue-message" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="rescue-message" role="status">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="rescue-manager-summary">
        <ClipboardList size={17} />
        {loading
          ? "Loading rescue reports..."
          : `${filteredReports.length} report(s) shown · ${reports.length} total`}
      </div>

      {loading ? (
        <div className="rescue-empty">
          Loading reports from PawLink AI...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="rescue-empty">
          <ClipboardList size={30} />
          <strong>No rescue reports found</strong>
          <span>Try changing the search or status filter.</span>
        </div>
      ) : (
        <div className="rescue-table-wrap">
          <table className="rescue-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date reported</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.map((report) => {
                const type = field(report, "animalType", "animal_type");
                const severity = field(
                  report,
                  "injurySeverity",
                  "injury_severity"
                );
                const location =
                  report.address ??
                  field(report, "locationType", "location_type");

                return (
                  <tr key={report.id}>
                    <td>
                      <strong>{readable(type || "Animal report")}</strong>
                      <small>#{String(report.id).slice(0, 8)}</small>
                    </td>

                    <td>
                      <span className="rescue-location">
                        <MapPin size={13} />
                        {readable(location)}
                      </span>
                    </td>

                    <td>
                      {severity != null
                        ? `${severity}/5`
                        : "Not provided"}
                    </td>

                    <td>
                      <span
                        className={`rescue-status status-${String(
                          report.status || "reported"
                        )
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        {readable(report.status || "REPORTED")}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        field(report, "createdAt", "created_at")
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="rescue-view-button"
                        onClick={() => openReport(report)}
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div
          className="rescue-modal-backdrop"
          onClick={closeReport}
        >
          <section
            className="rescue-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rescue-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="rescue-modal-header">
              <div>
                <span className="rescue-eyebrow">RESCUE REPORT</span>
                <h3 id="rescue-modal-title">
                  {readable(
                    field(selectedReport, "animalType", "animal_type") ??
                      "Animal report"
                  )}
                </h3>
                <small>Reference: {selectedReport.id}</small>
              </div>

              <button
                type="button"
                className="rescue-close-button"
                onClick={closeReport}
                aria-label="Close report details"
              >
                <X size={19} />
              </button>
            </header>

            {detailLoading && (
              <p className="rescue-detail-loading">
                Loading full report...
              </p>
            )}

            <div className="rescue-detail-grid">
              <Detail label="Report status" value={selectedReport.status} />
              <Detail
                label="Injury severity (1–5)"
                value={field(
                  selectedReport,
                  "injurySeverity",
                  "injury_severity"
                )}
              />
              <Detail
                label="Age group"
                value={field(selectedReport, "ageGroup", "age_group")}
              />
              <Detail
                label="Mobility"
                value={field(
                  selectedReport,
                  "mobilityStatus",
                  "mobility_status"
                )}
              />
              <Detail
                label="Consciousness"
                value={selectedReport.consciousness}
              />
              <Detail
                label="Visible bleeding"
                value={field(
                  selectedReport,
                  "visibleBleeding",
                  "visible_bleeding"
                )}
              />
              <Detail
                label="Breathing difficulty"
                value={field(
                  selectedReport,
                  "breathingDifficulty",
                  "breathing_difficulty"
                )}
              />
              <Detail
                label="Traffic risk"
                value={field(
                  selectedReport,
                  "trafficRisk",
                  "traffic_risk"
                )}
              />
              <Detail
                label="Weather"
                value={field(
                  selectedReport,
                  "weatherCondition",
                  "weather_condition"
                )}
              />
              <Detail
                label="Time since injury (hours)"
                value={field(
                  selectedReport,
                  "timeSinceInjuryHours",
                  "time_since_injury_hours"
                )}
              />
              <Detail label="Latitude" value={selectedReport.latitude} />
              <Detail label="Longitude" value={selectedReport.longitude} />
              <Detail
                label="Reported on"
                value={formatDate(
                  field(selectedReport, "createdAt", "created_at")
                )}
              />
              <Detail
                label="Location"
                value={
                  selectedReport.address ??
                  field(
                    selectedReport,
                    "locationType",
                    "location_type"
                  )
                }
              />
            </div>

            <div className="rescue-description">
              <span>Description</span>
              <p>{readable(selectedReport.description)}</p>
            </div>

            {(field(selectedReport, "imageUrl", "image_url")) && (
              <div className="rescue-description">
                <span>Attached image</span>
                <a
                  href={field(selectedReport, "imageUrl", "image_url")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open report image
                </a>
              </div>
            )}

            <div className="rescue-workflow-section">
              <h4>
                <ShieldCheck size={18} />
                Administrator review
              </h4>

              <p className="rescue-workflow-help">
                Select the final priority and record your review decision.
                This action creates a rescue case or updates the existing
                case for this report.
              </p>

              <form onSubmit={submitReview}>
                <label className="rescue-workflow-label">
                  Final rescue priority
                  <select
                    value={finalPriority}
                    onChange={(event) =>
                      setFinalPriority(event.target.value)
                    }
                    required
                  >
                    <option value="">Select priority</option>
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rescue-workflow-label">
                  Administrator decision
                  <select
                    value={adminDecision}
                    onChange={(event) =>
                      setAdminDecision(event.target.value)
                    }
                  >
                    <option value="true">
                      Accept the current recommendation
                    </option>
                    <option value="false">
                      Override the recommendation
                    </option>
                  </select>
                </label>

                {adminDecision === "false" && (
                  <label className="rescue-workflow-label">
                    Reason for override
                    <textarea
                      value={decisionReason}
                      onChange={(event) =>
                        setDecisionReason(event.target.value)
                      }
                      placeholder="Explain why the recommendation is being overridden..."
                      rows={3}
                      required
                    />
                  </label>
                )}

                <button
                  type="submit"
                  className="rescue-view-button"
                  disabled={savingReview || detailLoading}
                >
                  <CheckCircle2 size={15} />
                  {savingReview
                    ? "Saving review..."
                    : rescueCase
                      ? "Save review"
                      : "Review report and create case"}
                </button>
              </form>
            </div>

            <div className="rescue-workflow-section">
              <h4>
                <ClipboardList size={18} />
                Rescue case
              </h4>

              {caseLoading ? (
                <p>Checking whether a rescue case exists...</p>
              ) : !rescueCase ? (
                <p className="rescue-workflow-help">
                  No rescue case is currently available for this report.
                  Submit the administrator review above to create one.
                </p>
              ) : (
                <>
                  <div className="rescue-detail-grid">
                    <Detail
                      label="Case reference"
                      value={rescueCase.id}
                    />
                    <Detail
                      label="Current case status"
                      value={rescueCase.status}
                    />
                    <Detail
                      label="Final priority"
                      value={field(
                        rescueCase,
                        "finalPriority",
                        "final_priority"
                      )}
                    />
                  </div>

                  {availableTransitions.length > 0 ? (
                    <form onSubmit={submitStatusUpdate}>
                      <label className="rescue-workflow-label">
                        Change case status
                        <select
                          value={nextStatus}
                          onChange={(event) =>
                            setNextStatus(event.target.value)
                          }
                          required
                        >
                          <option value="">Select next status</option>
                          {availableTransitions.map((status) => (
                            <option key={status} value={status}>
                              {readable(status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="submit"
                        className="rescue-view-button"
                        disabled={savingStatus || !nextStatus}
                      >
                        <RefreshCw size={15} />
                        {savingStatus
                          ? "Updating status..."
                          : "Update case status"}
                      </button>
                    </form>
                  ) : (
                    <p className="rescue-workflow-help">
                      This case has no further administrator status
                      transitions available.
                    </p>
                  )}

                  <button
                    type="button"
                    className="rescue-secondary-button"
                    onClick={() => loadCase(selectedReport.id)}
                    disabled={caseLoading}
                  >
                    <RefreshCw size={15} />
                    Refresh case
                  </button>
                </>
              )}
            </div>
            
<div className="rescue-workflow-section">
  <h4>
    <ClipboardList size={18} />
    Assign a rescue volunteer
  </h4>

  {!rescueCase ? (
    <p className="rescue-workflow-help">
      Review this report first to create a rescue case before assigning
      a volunteer.
    </p>
  ) : !["OPEN", "ASSIGNED"].includes(
      String(rescueCase.status || "").toUpperCase()
    ) ? (
    <p className="rescue-workflow-help">
      Volunteer assignment is unavailable for this case status.
    </p>
  ) : (
    <>
      <p className="rescue-workflow-help">
        Select an active volunteer from your organization. The selected
        volunteer will receive this rescue assignment in their workspace.
      </p>

      <form onSubmit={submitVolunteerAssignment}>
        <label className="rescue-workflow-label">
          Active volunteer
          <select
            value={selectedVolunteerId}
            onChange={(event) =>
              setSelectedVolunteerId(event.target.value)
            }
            disabled={volunteersLoading || assigningVolunteer}
            required
          >
            <option value="">
              {volunteersLoading
                ? "Loading volunteers..."
                : volunteers.length
                  ? "Select a volunteer"
                  : "No active volunteers available"}
            </option>

            {volunteers.map((volunteer) => (
              <option key={volunteer.id} value={volunteer.id}>
                {[
                  volunteer.first_name,
                  volunteer.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") || volunteer.email}
                {" — "}
                {volunteer.email}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rescue-view-button"
          disabled={
            assigningVolunteer ||
            volunteersLoading ||
            !selectedVolunteerId ||
            !volunteers.length
          }
        >
          <CheckCircle2 size={15} />
          {assigningVolunteer
            ? "Assigning volunteer..."
            : "Assign volunteer"}
        </button>
      </form>

      {lastAssignedVolunteer && (
        <div className="rescue-message" role="status">
          <CheckCircle2 size={18} />
          <span>
            Latest assignment: {lastAssignedVolunteer.name}
            {lastAssignedVolunteer.assignment?.status
              ? ` (${readable(lastAssignedVolunteer.assignment.status)})`
              : ""}
          </span>
        </div>
      )}
    </>
  )}
</div>


            <footer className="rescue-modal-footer">
              <span>
                <CalendarDays size={15} />
                Report and case management
              </span>

              <button
                type="button"
                className="rescue-secondary-button"
                onClick={closeReport}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
