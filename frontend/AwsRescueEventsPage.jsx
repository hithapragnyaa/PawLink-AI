
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  MapPin,
  PawPrint,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
  Pencil,
  Cloud,
  Zap,
} from "lucide-react";
import { api, clearSession, getErrorMessage, getAccessToken } from "./api.js";import "./AwsRescueEvents.css";

const API_BASE_URL = (
  import.meta.env.VITE_AWS_RESCUE_API_URL ||
  "https://qn5ni7slv3.execute-api.ap-south-1.amazonaws.com"
).replace(/\/+$/, "");

const EVENT_URL = `${API_BASE_URL}/events`;
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const STATUSES = [
  "REPORTED",
  "TEAM_ASSIGNED",
  "IN_PROGRESS",
  "RESCUED",
  "CLOSED",
];

const EMPTY_FORM = {
  RescueEventID: "",
  AnimalType: "Dog",
  Priority: "MEDIUM",
  Status: "REPORTED",
  Location: "",
  AssignedTeam: "",
};

const pretty = (value) =>
  String(value || "UNKNOWN").replaceAll("_", " ");

function getEventList(response) {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : data?.events ?? [];
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getError(error) {
  if (error.response?.status === 409) {
    return error.response?.data?.message ||
      "That rescue event ID already exists.";
  }
  if (error.response?.status === 404) {
    return error.response?.data?.message ||
      "The rescue event was not found. Refresh the dashboard.";
  }
  return error.response?.data?.message || getErrorMessage(error);
}

function PriorityBadge({ priority }) {
  return (
    <span className={`aws-badge priority-${String(priority || "LOW").toLowerCase()}`}>
      <span className="aws-badge-dot" />
      {pretty(priority)}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`aws-badge status-${String(status || "reported").toLowerCase()}`}>
      {pretty(status)}
    </span>
  );
}

export default function AwsRescueEventsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const loadEvents = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError("");

    try {
      const token = getAccessToken();

      const response = await fetch(EVENT_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });


      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message || `AWS API request failed (${response.status}).`
        );
      }

      const loadedEvents = Array.isArray(payload.data) ? payload.data : [];
      setEvents(loadedEvents);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.message ||
        "Unable to load AWS rescue events. Check API Gateway and the network."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data?.data?.user;

        if (!currentUser) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        if (currentUser.role !== "ADMINISTRATOR") {
          setUser(currentUser);
          setError(
            "The AWS rescue operations workspace is available to administrators only."
          );
          setLoading(false);
          return;
        }

        if (active) {
          setUser(currentUser);
          await loadEvents();
        }
      } catch (err) {
        if (err.response?.status === 401 || !err.response) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        if (active) {
          setError(getError(err));
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [navigate, loadEvents]);

  const stats = useMemo(() => ({
    total: events.length,
    high: events.filter((event) => event.Priority === "HIGH").length,
    active: events.filter(
      (event) => !["RESCUED", "CLOSED"].includes(event.Status)
    ).length,
    inProgress: events.filter(
      (event) => event.Status === "IN_PROGRESS"
    ).length,
  }), [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const searchable = [
          event.RescueEventID,
          event.AnimalType,
          event.Location,
          event.AssignedTeam,
          event.Status,
          event.Priority,
        ].join(" ").toLowerCase();

        return !query || searchable.includes(query);
      })
      .filter(
        (event) =>
          priorityFilter === "ALL" || event.Priority === priorityFilter
      )
      .filter(
        (event) =>
          statusFilter === "ALL" || event.Status === statusFilter
      )
      .sort((a, b) => {
        const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (rank[a.Priority] ?? 3) - (rank[b.Priority] ?? 3);
      });
  }, [events, search, priorityFilter, statusFilter]);

  const priorityCounts = useMemo(() => ({
    HIGH: events.filter((event) => event.Priority === "HIGH").length,
    MEDIUM: events.filter((event) => event.Priority === "MEDIUM").length,
    LOW: events.filter((event) => event.Priority === "LOW").length,
  }), [events]);

  function openCreateForm() {
    setEditingId("");
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowForm(true);
  }




  function openEditForm(event) {
    setEditingId(event.RescueEventID);
    setForm({
      RescueEventID: event.RescueEventID || "",
      AnimalType: event.AnimalType || "Dog",
      Priority: event.Priority || "MEDIUM",
      Status: event.Status || "REPORTED",
      Location: event.Location || "",
      AssignedTeam: event.AssignedTeam || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleaned = {
      RescueEventID: form.RescueEventID.trim(),
      AnimalType: form.AnimalType.trim(),
      Priority: form.Priority,
      Status: form.Status,
      Location: form.Location.trim(),
      AssignedTeam: form.AssignedTeam.trim(),
    };

    if (
      !cleaned.RescueEventID ||
      !cleaned.AnimalType ||
      !cleaned.Location
    ) {
      setError("Rescue event ID, animal type, and location are required.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `${EVENT_URL}/${encodeURIComponent(editingId)}`
        : EVENT_URL;

      const body = { ...cleaned };
      delete body.RescueEventID;

      if (!isEditing) {
        body.RescueEventID = cleaned.RescueEventID;
      }

      const token = getAccessToken();
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message || `Save failed (${response.status}).`
        );
      }

      setShowForm(false);
      setSuccess(
        isEditing
          ? `Rescue event ${editingId} updated successfully.`
          : `Rescue event ${cleaned.RescueEventID} created successfully.`
      );
      await loadEvents({ quiet: true });
    } catch (err) {
      setError(err.message || "Unable to save this rescue event.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event) {
    const id = event.RescueEventID;

    if (
      !window.confirm(
        `Delete rescue event ${id}?\n\nThis permanently removes the item from the AWS demo table and generates a DynamoDB REMOVE event.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const token = getAccessToken();
      const response = await fetch(
        `${EVENT_URL}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message || `Delete failed (${response.status}).`
        );
      }

      setSuccess(`Rescue event ${id} deleted successfully.`);
      await loadEvents({ quiet: true });
    } catch (err) {
      setError(err.message || "Unable to delete this rescue event.");
    } finally {
      setDeletingId("");
    }
  }

  function exportCsv() {
    const columns = [
      "RescueEventID",
      "AnimalType",
      "Priority",
      "Status",
      "Location",
      "AssignedTeam",
      "CreatedAt",
    ];

    const escapeCell = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const rows = [
      columns.map(escapeCell).join(","),
      ...filteredEvents.map((event) =>
        columns.map((column) => escapeCell(event[column])).join(",")
      ),
    ];

    const blob = new Blob([rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pawlink-aws-rescue-events.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const isAdmin = user?.role === "ADMINISTRATOR";

  return (
    <div className="aws-page">
      <header className="aws-header">
        <div className="aws-brand">
          <span className="aws-brand-icon"><PawPrint size={23} /></span>
          <span>PawLink <b>AI</b></span>
          <span className="aws-module-label">CLOUD OPERATIONS</span>
        </div>

        <div className="aws-header-actions">
          <span className="aws-cloud-indicator">
            <span className="aws-live-dot" />
            AWS DEMO
          </span>
          <button className="aws-button aws-button-light" onClick={() => navigate("/admin")}>
            <ArrowLeft size={16} /> Admin dashboard
          </button>
        </div>
      </header>

      <main className="aws-main">
        <section className="aws-hero">
          <div>
            <div className="aws-eyebrow"><Cloud size={15} /> SERVERLESS RESCUE MANAGEMENT</div>
            <h1>AWS Rescue Operations</h1>
            <p>
              Manage rescue events stored in Amazon DynamoDB and processed
              automatically through DynamoDB Streams and AWS Lambda.
            </p>
            <div className="aws-hero-meta">
              <span><Zap size={14} /> API Gateway connected</span>
              <span><Activity size={14} /> Stream processing enabled</span>
              {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
            </div>
          </div>

          <div className="aws-hero-mark">
            <div className="aws-hero-orbit aws-orbit-one" />
            <div className="aws-hero-orbit aws-orbit-two" />
            <div className="aws-hero-paw"><PawPrint size={48} /></div>
            <span className="aws-orbit-label">DYNAMODB</span>
            <span className="aws-orbit-label aws-orbit-label-two">LAMBDA</span>
          </div>
        </section>

        {!isAdmin && user && (
          <div className="aws-alert aws-alert-error">
            <ShieldAlert size={20} />
            <span>The AWS rescue operations workspace is restricted to administrators.</span>
          </div>
        )}

        {error && (
          <div className="aws-alert aws-alert-error" role="alert">
            <AlertTriangle size={19} />
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}><X size={17} /></button>
          </div>
        )}

        {success && (
          <div className="aws-alert aws-alert-success" role="status">
            <CheckCircle2 size={19} />
            <span>{success}</span>
            <button aria-label="Dismiss success" onClick={() => setSuccess("")}><X size={17} /></button>
          </div>
        )}

        {isAdmin && (
          <>
            <section className="aws-stats-grid">
              <article className="aws-stat-card">
                <div className="aws-stat-icon stat-purple"><Activity size={21} /></div>
                <div className="aws-stat-label">Total rescue events</div>
                <div className="aws-stat-value">{loading ? "—" : stats.total}</div>
                <div className="aws-stat-foot">Records in DynamoDB</div>
              </article>
              <article className="aws-stat-card">
                <div className="aws-stat-icon stat-red"><ShieldAlert size={21} /></div>
                <div className="aws-stat-label">High priority</div>
                <div className="aws-stat-value">{loading ? "—" : stats.high}</div>
                <div className="aws-stat-foot">Require urgent attention</div>
              </article>
              <article className="aws-stat-card">
                <div className="aws-stat-icon stat-amber"><Clock3 size={21} /></div>
                <div className="aws-stat-label">Open rescues</div>
                <div className="aws-stat-value">{loading ? "—" : stats.active}</div>
                <div className="aws-stat-foot">Not yet rescued or closed</div>
              </article>
              <article className="aws-stat-card">
                <div className="aws-stat-icon stat-green"><CheckCircle2 size={21} /></div>
                <div className="aws-stat-label">In progress</div>
                <div className="aws-stat-value">{loading ? "—" : stats.inProgress}</div>
                <div className="aws-stat-foot">Currently being handled</div>
              </article>
            </section>

            <section className="aws-analytics-grid">
              <article className="aws-panel aws-priority-panel">
                <div className="aws-panel-heading">
                  <div>
                    <h2>Priority distribution</h2>
                    <p>Breakdown of current rescue events</p>
                  </div>
                  <Activity size={19} />
                </div>

                {PRIORITIES.map((priority) => {
                  const count = priorityCounts[priority];
                  const percentage = stats.total
                    ? Math.round((count / stats.total) * 100)
                    : 0;

                  return (
                    <div className="aws-bar-row" key={priority}>
                      <div className="aws-bar-label">
                        <PriorityBadge priority={priority} />
                        <strong>{count}</strong>
                      </div>
                      <div className="aws-bar-track">
                        <div
                          className={`aws-bar-fill bar-${priority.toLowerCase()}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="aws-bar-percent">{percentage}%</span>
                    </div>
                  );
                })}
              </article>

              <article className="aws-panel aws-system-panel">
                <div className="aws-panel-heading">
                  <div>
                    <h2>Cloud pipeline</h2>
                    <p>Architecture used by this dashboard</p>
                  </div>
                  <Cloud size={20} />
                </div>
                <div className="aws-pipeline">
                  <div className="aws-pipeline-step">
                    <span className="pipeline-icon"><Activity size={18} /></span>
                    <div><strong>API Gateway</strong><small>CRUD HTTP endpoints</small></div>
                    <CheckCircle2 size={17} className="pipeline-check" />
                  </div>
                  <div className="aws-pipeline-connector" />
                  <div className="aws-pipeline-step">
                    <span className="pipeline-icon"><DatabaseIcon /></span>
                    <div><strong>Amazon DynamoDB</strong><small>Rescue-event storage</small></div>
                    <CheckCircle2 size={17} className="pipeline-check" />
                  </div>
                  <div className="aws-pipeline-connector" />
                  <div className="aws-pipeline-step">
                    <span className="pipeline-icon"><Zap size={18} /></span>
                    <div><strong>DynamoDB Streams + Lambda</strong><small>Automatic event processing</small></div>
                    <CheckCircle2 size={17} className="pipeline-check" />
                  </div>
                  <div className="aws-pipeline-connector" />
                  <div className="aws-pipeline-step">
                    <span className="pipeline-icon"><Activity size={18} /></span>
                    <div><strong>CloudWatch Logs</strong><small>Execution evidence</small></div>
                    <CheckCircle2 size={17} className="pipeline-check" />
                  </div>
                </div>
                <p className="aws-pipeline-note">
                  Pipeline indicators describe configured components; they do not replace AWS health checks.
                </p>
              </article>
            </section>

            <section className="aws-panel aws-events-panel">
              <div className="aws-events-heading">
                <div>
                  <h2>Rescue event registry</h2>
                  <p>Create, update, and manage records stored in your AWS demo table.</p>
                </div>
                <div className="aws-event-actions">
                  <button
                    className="aws-button aws-button-light"
                    onClick={exportCsv}
                    disabled={!filteredEvents.length}
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    className="aws-button aws-button-light"
                    onClick={() => loadEvents()}
                    disabled={loading}
                  >
                    <RefreshCw size={16} className={loading ? "aws-spin" : ""} />
                    Refresh
                  </button>
                  <button className="aws-button aws-button-primary" onClick={openCreateForm}>
                    <Plus size={17} /> New rescue event
                  </button>
                </div>
              </div>

              <div className="aws-filter-row">
                <label className="aws-search">
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search ID, animal, location, team..."
                  />
                  {search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}
                </label>

                <label className="aws-select-filter">
                  <Filter size={16} />
                  <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                    <option value="ALL">All priorities</option>
                    {PRIORITIES.map((priority) => <option key={priority} value={priority}>{pretty(priority)}</option>)}
                  </select>
                </label>

                <label className="aws-select-filter">
                  <Activity size={16} />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="ALL">All statuses</option>
                    {STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                  </select>
                </label>
              </div>

              <div className="aws-table-summary">
                <span><strong>{filteredEvents.length}</strong> result{filteredEvents.length === 1 ? "" : "s"}</span>
                <span>Source: Amazon DynamoDB · `PawLinkRescueEvents`</span>
              </div>

              <div className="aws-table-wrap">
                <table className="aws-table">
                  <thead>
                    <tr>
                      <th>Rescue event</th>
                      <th>Animal / location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned team</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="aws-table-message">Loading live AWS records...</td></tr>
                    ) : filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="aws-table-message">
                          <div className="aws-empty-state">
                            <PawPrint size={30} />
                            <strong>No rescue events found</strong>
                            <span>Try another filter or create a new event.</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredEvents.map((event) => (
                      <tr key={event.RescueEventID}>
                        <td>
                          <div className="aws-event-id">{event.RescueEventID}</div>
                          <span className="aws-cell-muted">AWS record</span>
                        </td>
                        <td>
                          <div className="aws-animal-name">{event.AnimalType || "Unknown animal"}</div>
                          <div className="aws-location"><MapPin size={13} /> {event.Location || "Location unavailable"}</div>
                        </td>
                        <td><PriorityBadge priority={event.Priority} /></td>
                        <td><StatusBadge status={event.Status} /></td>
                        <td>{event.AssignedTeam || <span className="aws-cell-muted">Unassigned</span>}</td>
                        <td className="aws-date-cell">{formatDate(event.CreatedAt)}</td>
                        <td>
                          <div className="aws-row-actions">
                            <button className="aws-icon-button" title="Edit rescue event" aria-label={`Edit ${event.RescueEventID}`} onClick={() => openEditForm(event)}>
                              <Pencil size={16} />
                            </button>
                            <button
                              className="aws-icon-button aws-delete-button"
                              title="Delete rescue event"
                              aria-label={`Delete ${event.RescueEventID}`}
                              disabled={deletingId === event.RescueEventID}
                              onClick={() => deleteEvent(event)}
                            >
                              {deletingId === event.RescueEventID ? <RefreshCw size={16} className="aws-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="aws-footer">
              <span><PawPrint size={15} /> PawLink AI · Cloud assignment workspace</span>
              <span>Independent AWS module · Existing application data unchanged</span>
            </footer>
          </>
        )}
      </main>

      {showForm && (
        <div className="aws-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setShowForm(false);
        }}>
          <section className="aws-modal" role="dialog" aria-modal="true" aria-labelledby="aws-modal-title">
            <div className="aws-modal-heading">
              <div>
                <span className="aws-eyebrow">{editingId ? "UPDATE AWS RECORD" : "CREATE AWS RECORD"}</span>
                <h2 id="aws-modal-title">{editingId ? "Edit rescue event" : "New rescue event"}</h2>
                <p>Changes are written to DynamoDB through API Gateway.</p>
              </div>
              <button className="aws-icon-button" aria-label="Close form" onClick={() => setShowForm(false)} disabled={saving}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={submitForm}>
              <div className="aws-form-grid">
                <label className="aws-field aws-field-full">
                  Rescue event ID
                  <input
                    value={form.RescueEventID}
                    onChange={(event) => updateForm("RescueEventID", event.target.value)}
                    placeholder="e.g. RESCUE006"
                    disabled={Boolean(editingId)}
                    required
                    maxLength={80}
                  />
                  <small>{editingId ? "The record key cannot be changed." : "Use a unique ID for each event."}</small>
                </label>

                <label className="aws-field">
                  Animal type
                  <select value={form.AnimalType} onChange={(event) => updateForm("AnimalType", event.target.value)} required>
                    {["Dog", "Cat", "Cow", "Bird", "Rabbit", "Other"].map((animal) => <option key={animal} value={animal}>{animal}</option>)}
                  </select>
                </label>

                <label className="aws-field">
                  Priority
                  <select value={form.Priority} onChange={(event) => updateForm("Priority", event.target.value)} required>
                    {PRIORITIES.map((priority) => <option key={priority} value={priority}>{pretty(priority)}</option>)}
                  </select>
                </label>

                <label className="aws-field">
                  Status
                  <select value={form.Status} onChange={(event) => updateForm("Status", event.target.value)} required>
                    {STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                  </select>
                </label>

                <label className="aws-field">
                  Location
                  <input value={form.Location} onChange={(event) => updateForm("Location", event.target.value)} placeholder="City or rescue location" required maxLength={160} />
                </label>

                <label className="aws-field aws-field-full">
                  Assigned team (optional)
                  <input value={form.AssignedTeam} onChange={(event) => updateForm("AssignedTeam", event.target.value)} placeholder="e.g. TEAM002" maxLength={100} />
                </label>
              </div>

              <div className="aws-modal-actions">
                <button type="button" className="aws-button aws-button-light" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="aws-button aws-button-primary" disabled={saving}>
                  {saving ? <RefreshCw size={16} className="aws-spin" /> : <CheckCircle2 size={17} />}
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create event"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function DatabaseIcon() {
  return <Activity size={18} />;
}
