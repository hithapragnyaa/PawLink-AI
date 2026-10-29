
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  ClipboardList,
  LogOut,
  PawPrint,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { api, clearSession, getErrorMessage } from "./api.js";
import "./AuthStyles.css";
import "./VeterinarianDashboard.css";

function getList(response) {
  const body = response?.data;
  const data = body?.data;

  if (Array.isArray(data)) return data;

  for (const key of ["animals", "shelters", "stays", "records", "medicalRecords"]) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(body?.[key])) return body[key];
  }

  return [];
}

function getDate(record) {
  const value = record?.follow_up_date ?? record?.followUpDate;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VeterinarianDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [stays, setStays] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const meResponse = await api.get("/auth/me");
      const currentUser = meResponse.data?.data?.user;

      if (!currentUser) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (currentUser.role === "ADMINISTRATOR") {
        navigate("/admin", { replace: true });
        return;
      }

      if (currentUser.role !== "VETERINARIAN") {
        navigate("/dashboard", { replace: true });
        return;
      }

      setUser(currentUser);

      const results = await Promise.allSettled([
        api.get("/animals"),
        api.get("/shelters"),
        api.get("/shelters/stays?activeOnly=true"),
      ]);

      if (results[0].status !== "fulfilled") {
        throw results[0].reason;
      }

      const animalList = getList(results[0].value);
      setAnimals(animalList);
      setShelters(
        results[1].status === "fulfilled" ? getList(results[1].value) : []
      );
      setStays(
        results[2].status === "fulfilled" ? getList(results[2].value) : []
      );

      // Medical records are retrieved through the existing per-animal endpoint.
      // Keep the dashboard usable even if an individual animal has no records.
      const recordResults = await Promise.allSettled(
        animalList
          .filter((animal) => animal.id)
          .map((animal) =>
            api.get(
              `/medical-records/animals/${encodeURIComponent(animal.id)}`
            ).then((response) => ({
              animal,
              records: getList(response),
            }))
          )
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = recordResults
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) =>
          result.value.records
            .map((record) => ({
              ...record,
              animalName:
                result.value.animal.name ||
                result.value.animal.animalName ||
                result.value.animal.species ||
                "Animal",
              animalId: result.value.animal.id,
              followUp: getDate(record),
            }))
            .filter((record) => record.followUp && record.followUp >= today)
        )
        .sort((a, b) => a.followUp - b.followUp)
        .slice(0, 6);

      setFollowUps(upcoming);
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear the local session even if the API request fails.
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  if (loading && !user) {
    return (
      <main className="vet-page">
        <div className="vet-loading">Loading veterinarian workspace...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="vet-page">
        <div className="vet-loading">
          {error || "Redirecting to sign in..."}
        </div>
      </main>
    );
  }

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="vet-page">
      <div className="vet-shell">
        <header className="vet-header">
          <div className="vet-brand">
            <span className="vet-brand-icon">
              <PawPrint size={25} />
            </span>
            <span>
              PawLink <b>AI</b>
            </span>
          </div>

          <div className="vet-header-actions">
            <button
              className="vet-button vet-button-light"
              type="button"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              className="vet-button vet-button-light"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>

        <section className="vet-welcome">
          <div>
            <span className="vet-eyebrow">VETERINARIAN WORKSPACE</span>
            <h1>Welcome, {fullName || "Veterinarian"}!</h1>
            <p>
              Review animal medical history, manage treatment records, and
              keep track of upcoming follow-ups.
            </p>
            <div className="vet-user-meta">
              <span>{user.organizationName || "Your organization"}</span>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="vet-welcome-icon">
            <Stethoscope size={42} />
          </div>
        </section>

        {error && (
          <div className="vet-error" role="alert">
            {error}
          </div>
        )}

        <section className="vet-stats" aria-label="Workspace overview">
          <article className="vet-stat-card">
            <span className="vet-stat-icon">
              <PawPrint size={21} />
            </span>
            <span className="vet-stat-label">Animals</span>
            <strong>{animals.length}</strong>
            <span className="vet-stat-note">Available in your organization</span>
          </article>

          <article className="vet-stat-card">
            <span className="vet-stat-icon">
              <Building2 size={21} />
            </span>
            <span className="vet-stat-label">Shelters</span>
            <strong>{shelters.length}</strong>
            <span className="vet-stat-note">Registered shelters</span>
          </article>

          <article className="vet-stat-card">
            <span className="vet-stat-icon">
              <Activity size={21} />
            </span>
            <span className="vet-stat-label">Active shelter stays</span>
            <strong>{stays.length}</strong>
            <span className="vet-stat-note">Animals currently checked in</span>
          </article>

          <article className="vet-stat-card">
            <span className="vet-stat-icon">
              <CalendarClock size={21} />
            </span>
            <span className="vet-stat-label">Upcoming follow-ups</span>
            <strong>{followUps.length}</strong>
            <span className="vet-stat-note">Upcoming records shown below</span>
          </article>
        </section>

        <section className="vet-section">
          <div className="vet-section-heading">
            <div>
              <h2>Your clinical workspace</h2>
              <p>Open an existing PawLink workflow.</p>
            </div>
          </div>

          <div className="vet-workspace-grid">
            <button
              className="vet-workspace-card"
              type="button"
              onClick={() => navigate("/medical-records")}
            >
              <span className="vet-workspace-icon">
                <Stethoscope size={24} />
              </span>
              <span className="vet-workspace-copy">
                <strong>Medical records</strong>
                <span>Add diagnoses, treatments, medication details, and
                  follow-up dates. Review an animal's medical history.</span>
              </span>
              <ArrowRight size={19} />
            </button>

            <button
              className="vet-workspace-card"
              type="button"
              onClick={() => navigate("/shelters")}
            >
              <span className="vet-workspace-icon">
                <Building2 size={24} />
              </span>
              <span className="vet-workspace-copy">
                <strong>Shelter management</strong>
                <span>View shelters, admit animals, and coordinate their
                  shelter stays.</span>
              </span>
              <ArrowRight size={19} />
            </button>

            <button
              className="vet-workspace-card"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              <span className="vet-workspace-icon">
                <ClipboardList size={24} />
              </span>
              <span className="vet-workspace-copy">
                <strong>My account</strong>
                <span>Return to your general PawLink account workspace.</span>
              </span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>

        <section className="vet-section">
          <div className="vet-section-heading">
            <div>
              <h2>Upcoming medical follow-ups</h2>
              <p>Based on follow-up dates saved in existing medical records.</p>
            </div>
            <button
              className="vet-text-button"
              type="button"
              onClick={() => navigate("/medical-records")}
            >
              Open records <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="vet-empty">Refreshing your records...</div>
          ) : followUps.length === 0 ? (
            <div className="vet-empty">
              <CalendarClock size={26} />
              <strong>No upcoming follow-ups found</strong>
              <span>
                Follow-ups will appear here when medical records contain a
                current or future follow-up date.
              </span>
            </div>
          ) : (
            <div className="vet-followup-list">
              {followUps.map((record, index) => (
                <article
                  className="vet-followup-item"
                  key={record.id || `${record.animalId}-${index}`}
                >
                  <span className="vet-followup-icon">
                    <CalendarClock size={20} />
                  </span>
                  <div className="vet-followup-details">
                    <strong>{record.animalName}</strong>
                    <span>
                      {record.diagnosis || "Medical follow-up"}
                      {record.treatment ? ` · ${record.treatment}` : ""}
                    </span>
                  </div>
                  <time dateTime={record.followUp.toISOString()}>
                    {formatDate(record.followUp)}
                  </time>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="vet-footer">
          PawLink AI · Animal care starts with coordinated action.
        </footer>
      </div>
    </main>
  );
}
