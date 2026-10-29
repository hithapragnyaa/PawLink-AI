
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Cloud,
  Users,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { api, clearSession, getErrorMessage } from "./api.js";
import {
  getResponseTeams,
  createResponseTeam,
  updateResponseTeam,
  deleteResponseTeam,
} from "./responseTeamsApi.js";
import "./AwsRescueEvents.css";
import "./AwsResponseTeamsPage.css";

const EMPTY_FORM = {
  TeamID: "",
  TeamName: "",
  Status: "AVAILABLE",
  Location: "",
  Specialization: "",
  Contact: "",
  Members: "",
};

export default function AwsResponseTeamsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getResponseTeams();
      setTeams(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
      } else {
        setError(
          err.response?.data?.message ||
          getErrorMessage(err)
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const result = await api.get("/auth/me");
        const currentUser = result.data?.data?.user;

        if (!currentUser) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        if (currentUser.role !== "ADMINISTRATOR") {
          setError("Response Teams is available to administrators only.");
          setUser(currentUser);
          setLoading(false);
          return;
        }

        if (active) {
          setUser(currentUser);
          await loadTeams();
        }
      } catch {
        clearSession();
        navigate("/login", { replace: true });
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [navigate, loadTeams]);

  function startCreate() {
    setEditingId("");
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEdit(team) {
    setEditingId(team.TeamID);
    setForm({
      TeamID: team.TeamID || "",
      TeamName: team.TeamName || "",
      Status: team.Status || "AVAILABLE",
      Location: team.Location || "",
      Specialization: team.Specialization || "",
      Contact: team.Contact || "",
      Members: Array.isArray(team.Members)
        ? team.Members.join(", ")
        : team.Members || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      TeamName: form.TeamName.trim(),
      Status: form.Status,
      Location: form.Location.trim(),
      Specialization: form.Specialization.trim(),
      Contact: form.Contact.trim(),
      Members: form.Members
        .split(",")
        .map((member) => member.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await updateResponseTeam(editingId, payload);
        setSuccess("Response team updated successfully.");
      } else {
        if (!form.TeamID.trim()) {
          setError("Team ID is required.");
          return;
        }

        await createResponseTeam({
          ...payload,
          TeamID: form.TeamID.trim(),
        });
        setSuccess("Response team created successfully.");
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId("");
      await loadTeams();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to save response team."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(team) {
    if (
      !window.confirm(
        `Delete response team "${team.TeamName}" (${team.TeamID})?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteResponseTeam(team.TeamID);
      setSuccess("Response team deleted successfully.");
      await loadTeams();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to delete response team."
      );
    }
  }

  const filteredTeams = teams.filter((team) =>
    [
      team.TeamID,
      team.TeamName,
      team.Status,
      team.Location,
      team.Specialization,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const availableCount = teams.filter(
    (team) => team.Status === "AVAILABLE"
  ).length;

  if (!user) {
    return (
      <div className="aws-page">
        <main className="aws-main">
          <div className="aws-panel">Loading your session...</div>
        </main>
      </div>
    );
  }

  if (user.role !== "ADMINISTRATOR") {
    return (
      <div className="aws-page">
        <main className="aws-main">
          <div className="aws-alert aws-alert-error">
            <ShieldAlert />
            <span>Administrator access is required.</span>
            <button onClick={() => navigate("/admin")}>Back</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="aws-page">
      <header className="aws-header">
        <div className="aws-brand">
          <span className="aws-brand-icon">
            <Users size={23} />
          </span>
          <span>PawLink <b>AI</b></span>
          <span className="aws-module-label">CLOUD OPERATIONS</span>
        </div>

        <div className="aws-header-actions">
          <span className="aws-cloud-indicator">
            <span className="aws-live-dot" />
            AWS CONNECTED
          </span>
          <button
            className="aws-button aws-button-light"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft size={16} />
            Admin dashboard
          </button>
        </div>
      </header>

      <main className="aws-main">
        <section className="aws-hero">
          <div>
            <div className="aws-eyebrow">
              <Cloud size={15} />
              RESPONSE TEAM MANAGEMENT
            </div>
            <h1>Rescue Response Teams</h1>
            <p>
              Manage rescue teams, availability, locations and
              specializations through Amazon API Gateway, AWS Lambda
              and DynamoDB.
            </p>
            <div className="aws-hero-meta">
              <span><Users size={14} /> {teams.length} total teams</span>
              <span><CheckCircle2 size={14} /> {availableCount} available</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="aws-alert aws-alert-error">
            <ShieldAlert size={20} />
            <span>{error}</span>
            <button onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="aws-alert aws-alert-success">
            <CheckCircle2 size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess("")}>
              <X size={18} />
            </button>
          </div>
        )}

        <section className="aws-stats-grid aws-team-stats">
          <div className="aws-stat-card">
            <div className="aws-stat-icon stat-purple">
              <Users size={24} />
            </div>
            <div className="aws-stat-label">Total Teams</div>
            <div className="aws-stat-value">{teams.length}</div>
            <div className="aws-stat-foot">Registered response teams</div>
          </div>

          <div className="aws-stat-card">
            <div className="aws-stat-icon stat-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="aws-stat-label">Available</div>
            <div className="aws-stat-value">{availableCount}</div>
            <div className="aws-stat-foot">Ready for assignments</div>
          </div>
        </section>

        <section className="aws-panel aws-events-panel">
          <div className="aws-events-heading">
            <div>
              <h2>Team Registry</h2>
              <p>Search, create, edit and remove response teams.</p>
            </div>

            <div className="aws-event-actions">
              <button
                className="aws-button aws-button-light"
                onClick={loadTeams}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                className="aws-button aws-button-primary"
                onClick={startCreate}
              >
                <Plus size={17} />
                Add team
              </button>
            </div>
          </div>

          <div className="aws-filter-row">
            <label className="aws-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams, locations or status..."
              />
            </label>
          </div>

          <div className="aws-table-summary">
            <span>
              Showing <strong>{filteredTeams.length}</strong> of{" "}
              <strong>{teams.length}</strong> teams
            </span>
            <span>Amazon DynamoDB</span>
          </div>

          <div className="aws-table-wrap">
            <table className="aws-table">
              <thead>
                <tr>
                  <th>TEAM</th>
                  <th>LOCATION</th>
                  <th>SPECIALIZATION</th>
                  <th>STATUS</th>
                  <th>MEMBERS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">Loading response teams...</td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      {search
                        ? "No teams match your search."
                        : "No response teams yet. Select Add team to create one."}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr key={`${team.TenantID}-${team.TeamID}`}>
                      <td>
                        <div className="aws-event-id">{team.TeamID}</div>
                        <div className="aws-cell-muted">{team.TeamName}</div>
                      </td>
                      <td>
                        <span className="aws-team-location">
                          <MapPin size={14} />
                          {team.Location || "Not specified"}
                        </span>
                      </td>
                      <td>{team.Specialization || "—"}</td>
                      <td>
                        <span
                          className={`aws-badge status-${String(
                            team.Status || "unknown"
                          ).toLowerCase()}`}
                        >
                          {String(team.Status || "UNKNOWN").replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        {Array.isArray(team.Members)
                          ? team.Members.join(", ") || "—"
                          : team.Members || "—"}
                      </td>
                      <td>
                        <div className="aws-row-actions">
                          <button
                            className="aws-icon-button"
                            title="Edit team"
                            onClick={() => startEdit(team)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="aws-icon-button aws-delete-button"
                            title="Delete team"
                            onClick={() => handleDelete(team)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showForm && (
          <div className="aws-team-modal-backdrop">
            <section
              className="aws-team-modal aws-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-form-title"
            >
              <div className="aws-events-heading">
                <div>
                  <h2 id="team-form-title">
                    {editingId ? "Edit Response Team" : "Create Response Team"}
                  </h2>
                  <p>Enter the team's operational details.</p>
                </div>
                <button
                  className="aws-icon-button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close form"
                >
                  <X size={18} />
                </button>
              </div>

              <form className="aws-team-form" onSubmit={handleSubmit}>
                {!editingId && (
                  <label>
                    Team ID *
                    <input
                      value={form.TeamID}
                      onChange={(event) =>
                        setForm({ ...form, TeamID: event.target.value })
                      }
                      placeholder="TEAM001"
                      required
                    />
                  </label>
                )}

                <label>
                  Team name *
                  <input
                    value={form.TeamName}
                    onChange={(event) =>
                      setForm({ ...form, TeamName: event.target.value })
                    }
                    placeholder="Central Rescue Team"
                    required
                  />
                </label>

                <label>
                  Status
                  <select
                    value={form.Status}
                    onChange={(event) =>
                      setForm({ ...form, Status: event.target.value })
                    }
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="DEPLOYED">Deployed</option>
                    <option value="OFF_DUTY">Off duty</option>
                  </select>
                </label>

                <label>
                  Location
                  <input
                    value={form.Location}
                    onChange={(event) =>
                      setForm({ ...form, Location: event.target.value })
                    }
                    placeholder="Vellore"
                  />
                </label>

                <label>
                  Specialization
                  <input
                    value={form.Specialization}
                    onChange={(event) =>
                      setForm({ ...form, Specialization: event.target.value })
                    }
                    placeholder="Animal rescue"
                  />
                </label>

                <label>
                  Contact
                  <input
                    value={form.Contact}
                    onChange={(event) =>
                      setForm({ ...form, Contact: event.target.value })
                    }
                    placeholder="Team contact details"
                  />
                </label>

                <label className="aws-team-full-width">
                  Members
                  <input
                    value={form.Members}
                    onChange={(event) =>
                      setForm({ ...form, Members: event.target.value })
                    }
                    placeholder="Enter member names separated by commas"
                  />
                </label>

                <div className="aws-team-form-actions">
                  <button
                    type="button"
                    className="aws-button aws-button-light"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="aws-button aws-button-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingId ? "Save changes" : "Create team"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
