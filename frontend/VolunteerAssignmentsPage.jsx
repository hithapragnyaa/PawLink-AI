
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  LogOut,
  MapPin,
  PawPrint,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { api, clearSession, getErrorMessage } from "./api.js";
import "./VolunteerAssignments.css";

function readAssignments(response) {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.assignments)) return payload.assignments;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function readable(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replaceAll("_", " ").toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  return String(status || "pending").toLowerCase().replaceAll("_", "-");
}

function priorityClass(priority) {
  return String(priority || "medium").toLowerCase();
}

function assignmentId(assignment) {
  return assignment.id || assignment.assignment_id;
}

function getCaseDetails(assignment) {
  return assignment.rescueCase || assignment.rescue_case || assignment.case || {};
}

export default function VolunteerAssignmentsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [rejectionNotes, setRejectionNotes] = useState({});

  const loadWorkspace = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const meResponse = await api.get("/auth/me");
      const currentUser = meResponse.data?.data?.user;

      if (!currentUser) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (currentUser.role !== "VOLUNTEER") {
        navigate(
          currentUser.role === "ADMINISTRATOR" ? "/admin" : "/dashboard",
          { replace: true }
        );
        return;
      }

      setUser(currentUser);

      const assignmentResponse = await api.get("/volunteer-assignments/my");
      setAssignments(readAssignments(assignmentResponse));
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const visibleAssignments = useMemo(() => {
    if (filter === "ALL") return assignments;
    return assignments.filter(
      (item) => String(item.status || "").toUpperCase() === filter
    );
  }, [assignments, filter]);

  const counts = useMemo(() => ({
    total: assignments.length,
    pending: assignments.filter(
      (item) => String(item.status).toUpperCase() === "PENDING"
    ).length,
    accepted: assignments.filter(
      (item) => ["ACCEPTED", "IN_PROGRESS"].includes(
        String(item.status).toUpperCase()
      )
    ).length,
    completed: assignments.filter(
      (item) => ["COMPLETED", "CANCELLED", "REJECTED"].includes(
        String(item.status).toUpperCase()
      )
    ).length,
  }), [assignments]);

  async function respondToAssignment(item, action) {
    const id = assignmentId(item);
    if (!id) {
      setError("This assignment is missing its ID. Refresh and try again.");
      return;
    }

    setBusyId(id);
    setError("");
    setNotice("");

    try {
      const path = `/volunteer-assignments/${id}/${action}`;
      const body = action === "reject"
        ? { notes: rejectionNotes[id]?.trim() || null }
        : {};

      const response = await api.patch(path, body);
      const updated = response.data?.data;

      setAssignments((current) =>
        current.map((assignment) =>
          assignmentId(assignment) === id && updated
            ? { ...assignment, ...updated }
            : assignmentId(assignment) === id
              ? {
                  ...assignment,
                  status: action === "accept" ? "ACCEPTED" : "REJECTED",
                  ...(action === "reject" ? { notes: body.notes } : {}),
                }
              : assignment
        )
      );

      setNotice(
        action === "accept"
          ? "Assignment accepted. Thank you for stepping up!"
          : "Assignment declined. The coordinator can reassign this rescue."
      );

      await loadWorkspace(false);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        getErrorMessage(requestError)
      );
    } finally {
      setBusyId("");
    }
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Always clear the local session even if the server is unavailable.
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  }

  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <main className="volunteer-page volunteer-centered">
        <div className="volunteer-loading">
          <PawPrint size={30} />
          <p>Preparing your rescue workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="volunteer-page">
      <header className="volunteer-topbar">
        <button
          className="volunteer-brand"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          <span className="volunteer-brand-icon"><PawPrint size={23} /></span>
          <span>PawLink <b>AI</b></span>
        </button>

        <div className="volunteer-top-actions">
          <span className="volunteer-user">
            <span className="volunteer-avatar">
              {(fullName || "V").charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{fullName || "Volunteer"}</strong>
              <small>Rescue volunteer</small>
            </span>
          </span>
          <button className="volunteer-logout" onClick={handleLogout} type="button">
            <LogOut size={16} /> <span>Sign out</span>
          </button>
        </div>
      </header>

      <section className="volunteer-content">
        <button
          className="volunteer-back"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <section className="volunteer-hero">
          <div className="volunteer-hero-copy">
            <span className="volunteer-eyebrow">
              <HeartHandshake size={15} /> EVERY RESCUE MATTERS
            </span>
            <h1>Your rescue missions</h1>
            <p>
              Review your assignments, respond to new rescue requests, and
              keep your team moving toward safer outcomes for animals.
            </p>
            <div className="volunteer-hero-meta">
              <span><ShieldAlert size={15} /> Organization-scoped workspace</span>
              <span><Stethoscope size={15} /> Team-based animal care</span>
            </div>
          </div>
          <div className="volunteer-hero-art" aria-hidden="true">
            <div className="volunteer-paw-orbit"><PawPrint size={76} /></div>
            <span className="volunteer-spark volunteer-spark-one">✦</span>
            <span className="volunteer-spark volunteer-spark-two">✧</span>
            <span className="volunteer-art-caption">Small actions.<br />Lives changed.</span>
          </div>
        </section>

        {error && (
          <div className="volunteer-alert volunteer-alert-error" role="alert">
            <XCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => loadWorkspace()} aria-label="Retry">
              Retry
            </button>
          </div>
        )}

        {notice && (
          <div className="volunteer-alert volunteer-alert-success" role="status">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        <section className="volunteer-stat-grid" aria-label="Assignment overview">
          <article className="volunteer-stat-card">
            <span className="volunteer-stat-icon stat-purple"><PawPrint size={20} /></span>
            <span className="volunteer-stat-label">Total assignments</span>
            <strong>{counts.total}</strong>
            <small>All your rescue missions</small>
          </article>
          <article className="volunteer-stat-card">
            <span className="volunteer-stat-icon stat-amber"><Clock3 size={20} /></span>
            <span className="volunteer-stat-label">Awaiting response</span>
            <strong>{counts.pending}</strong>
            <small>Pending your decision</small>
          </article>
          <article className="volunteer-stat-card">
            <span className="volunteer-stat-icon stat-green"><HeartHandshake size={20} /></span>
            <span className="volunteer-stat-label">Accepted / active</span>
            <strong>{counts.accepted}</strong>
            <small>Missions you have accepted</small>
          </article>
          <article className="volunteer-stat-card">
            <span className="volunteer-stat-icon stat-blue"><CheckCircle2 size={20} /></span>
            <span className="volunteer-stat-label">Other outcomes</span>
            <strong>{counts.completed}</strong>
            <small>Completed, declined or cancelled</small>
          </article>
        </section>

        <section className="volunteer-list-section">
          <div className="volunteer-list-heading">
            <div>
              <span className="volunteer-eyebrow">YOUR ASSIGNMENT BOARD</span>
              <h2>Rescue assignments</h2>
              <p>Accept a pending mission to confirm your participation.</p>
            </div>
            <button
              className="volunteer-refresh"
              type="button"
              onClick={() => loadWorkspace()}
              disabled={loading || Boolean(busyId)}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div className="volunteer-filter-row" aria-label="Filter assignments">
            {[
              ["ALL", "All assignments"],
              ["PENDING", "Pending"],
              ["ACCEPTED", "Accepted"],
              ["IN_PROGRESS", "In progress"],
              ["REJECTED", "Declined"],
              ["COMPLETED", "Completed"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`volunteer-filter ${filter === value ? "active" : ""}`}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>

          {visibleAssignments.length === 0 ? (
            <div className="volunteer-empty">
              <span className="volunteer-empty-icon"><PawPrint size={30} /></span>
              <h3>{assignments.length === 0 ? "Your board is ready for a mission" : "No assignments in this filter"}</h3>
              <p>
                {assignments.length === 0
                  ? "When a coordinator assigns a rescue to you, it will appear here. Thank you for being part of the PawLink community."
                  : "Try another filter to see your other assignments."}
              </p>
              {filter !== "ALL" && (
                <button type="button" className="volunteer-secondary-button" onClick={() => setFilter("ALL")}>
                  Show all assignments
                </button>
              )}
            </div>
          ) : (
            <div className="volunteer-assignment-grid">
              {visibleAssignments.map((item) => {
                const id = assignmentId(item);
                const rescueCase = getCaseDetails(item);
                const status = String(item.status || "PENDING").toUpperCase();
                const priority = item.final_priority || item.priority || rescueCase.final_priority || rescueCase.priority;
                const animalType = item.animal_type || rescueCase.animal_type || rescueCase.animalType;
                const caseStatus = item.case_status || rescueCase.status;
                const location = item.location || item.address || rescueCase.location || rescueCase.address;
                const isBusy = busyId === id;

                return (
                  <article className="volunteer-assignment-card" key={id || `${status}-${item.created_at}`}>
                    <div className="volunteer-card-topline">
                      <span className={`volunteer-priority priority-${priorityClass(priority)}`}>
                        <span /> {readable(priority, "Priority not set")} priority
                      </span>
                      <span className={`volunteer-status status-${statusClass(status)}`}>
                        {readable(status)}
                      </span>
                    </div>

                    <div className="volunteer-case-title">
                      <span className="volunteer-animal-icon"><PawPrint size={22} /></span>
                      <div>
                        <h3>{readable(animalType, "Animal rescue")}</h3>
                        <p>Rescue case {String(item.rescue_case_id || rescueCase.id || id || "").slice(0, 8)}</p>
                      </div>
                    </div>

                    <div className="volunteer-case-details">
                      <div>
                        <MapPin size={16} />
                        <span>{readable(location, "Location details unavailable")}</span>
                      </div>
                      <div>
                        <Clock3 size={16} />
                        <span>Case status: {readable(caseStatus, "Not provided")}</span>
                      </div>
                      {item.created_at && (
                        <div>
                          <CheckCircle2 size={16} />
                          <span>Assigned {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <div className="volunteer-assignment-note">
                        <strong>Coordinator note</strong>
                        <p>{item.notes}</p>
                      </div>
                    )}

                    {status === "PENDING" && (
                      <div className="volunteer-response-area">
                        <label htmlFor={`reject-note-${id}`}>Note for coordinator (optional)</label>
                        <textarea
                          id={`reject-note-${id}`}
                          rows={2}
                          maxLength={2000}
                          placeholder="Add a note if you need to decline..."
                          value={rejectionNotes[id] || ""}
                          onChange={(event) =>
                            setRejectionNotes((current) => ({
                              ...current,
                              [id]: event.target.value,
                            }))
                          }
                          disabled={isBusy}
                        />
                        <div className="volunteer-card-actions">
                          <button
                            className="volunteer-accept-button"
                            type="button"
                            onClick={() => respondToAssignment(item, "accept")}
                            disabled={isBusy}
                          >
                            <CheckCircle2 size={17} />
                            {isBusy ? "Saving..." : "Accept mission"}
                          </button>
                          <button
                            className="volunteer-reject-button"
                            type="button"
                            onClick={() => respondToAssignment(item, "reject")}
                            disabled={isBusy}
                          >
                            <XCircle size={17} /> Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {status === "ACCEPTED" && (
                      <div className="volunteer-state-message accepted-message">
                        <CheckCircle2 size={17} />
                        You have accepted this mission. Coordinate the next steps with your team.
                      </div>
                    )}

                    {status === "IN_PROGRESS" && (
                      <div className="volunteer-state-message progress-message">
                        <Clock3 size={17} />
                        This mission is in progress. Keep your rescue team updated.
                      </div>
                    )}

                    {["REJECTED", "COMPLETED", "CANCELLED"].includes(status) && (
                      <div className="volunteer-state-message">
                        <CheckCircle2 size={17} />
                        This assignment is {readable(status).toLowerCase()}.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="volunteer-footer">
          <PawPrint size={16} />
          <span>Every animal deserves a chance at safety, care, and a loving home.</span>
        </footer>
      </section>
    </main>
  );
}
