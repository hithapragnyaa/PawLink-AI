
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  PawPrint,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { api, clearSession, getErrorMessage } from "./api.js";
import "./AdoptionPage.css";

const AVAILABLE = "AVAILABLE_FOR_ADOPTION";

const pretty = (value) =>
  String(value || "UNKNOWN").replaceAll("_", " ");

const readAnimalList = (response) => {
  const data = response?.data?.data;
  return data?.animals ?? (Array.isArray(data) ? data : []);
};

const readApplications = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : data?.applications ?? [];
};

const animalType = (animal) =>
  animal.animalType ?? animal.animal_type ?? "Animal";

export default function AdoptionPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState({});
  const [decisions, setDecisions] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCoordinator = user?.role === "ADOPTION_COORDINATOR";
  const isAdopter = user?.role === "ADOPTER";
  const canUsePage = isCoordinator || isAdopter;

  const loadPage = useCallback(async () => {
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

      if (
        !["ADOPTER", "ADOPTION_COORDINATOR"].includes(
          currentUser.role
        )
      ) {
        setUser(currentUser);
        setError(
          "Adoption management is available to adopters and adoption coordinators."
        );
        return;
      }

      setUser(currentUser);

      const applicationResponse = await api.get("/adoptions");
      setApplications(readApplications(applicationResponse));

      if (currentUser.role === "ADOPTER") {
        const animalResponse = await api.get("/animals");
        setAnimals(
          readAnimalList(animalResponse).filter(
            (animal) => animal.status === AVAILABLE
          )
        );
      } else {
        setAnimals([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  async function submitApplication(animal) {
    setError("");
    setSuccess("");
    setWorkingId(animal.id);

    try {
      await api.post("/adoptions", {
        animalId: animal.id,
        applicationNotes: notes[animal.id]?.trim() || null,
      });

      setSuccess(
        `Your adoption application for ${animal.name || animalType(animal)} was submitted.`
      );

      setNotes((previous) => ({
        ...previous,
        [animal.id]: "",
      }));

      await loadPage();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWorkingId("");
    }
  }

  async function reviewApplication(application) {
    const decision = decisions[application.id] || "APPROVED";
    const reason = decisions[`${application.id}-reason`] || "";

    if (
      decision === "REJECTED" &&
      !reason.trim()
    ) {
      setError("Enter a rejection reason before rejecting an application.");
      return;
    }

    setError("");
    setSuccess("");
    setWorkingId(application.id);

    try {
      await api.patch(`/adoptions/${application.id}/review`, {
        decision,
        rejectionReason:
          decision === "REJECTED" ? reason.trim() : null,
      });

      setSuccess(`Application ${decision.toLowerCase()} successfully.`);
      await loadPage();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWorkingId("");
    }
  }

  async function completeAdoption(application) {
    const confirmed = window.confirm(
      `Complete the adoption for ${application.animal_name || "this animal"}? This will mark the animal as adopted.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setWorkingId(application.id);

    try {
      await api.patch(`/adoptions/${application.id}/complete`);

      setSuccess("Adoption completed successfully.");
      await loadPage();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWorkingId("");
    }
  }

  const filteredAnimals = animals.filter((animal) => {
    const searchable = [
      animal.name,
      animalType(animal),
      animal.breed,
      animal.color,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(search.toLowerCase());
  });

  const filteredApplications = applications.filter((application) => {
    const matchesSearch = [
      application.animal_name,
      application.adopter_first_name,
      application.adopter_last_name,
      application.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    return (
      matchesSearch &&
      (statusFilter === "ALL" ||
        application.status === statusFilter)
    );
  });

  if (loading) {
    return (
      <main className="adoption-page">
        <p className="adoption-loading">Loading adoption workspace...</p>
      </main>
    );
  }

  return (
    <main className="adoption-page">
      <header className="adoption-header">
        <button
          className="adoption-back"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={17} /> Dashboard
        </button>

        <div className="adoption-brand">
          <PawPrint size={25} />
          <span>PawLink <b>AI</b></span>
        </div>

        <button
          type="button"
          className="adoption-refresh"
          onClick={loadPage}
          disabled={loading || Boolean(workingId)}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <section className="adoption-main">
        <div className="adoption-intro">
          <span className="adoption-eyebrow">
            {isCoordinator ? "COORDINATOR WORKSPACE" : "FIND A COMPANION"}
          </span>

          <h1>
            {isCoordinator
              ? "Adoption applications"
              : "Give an animal a loving home"}
          </h1>

          <p>
            {isCoordinator
              ? "Review applications carefully and manage each adoption through completion."
              : "Meet animals looking for a home, apply to adopt, and track your applications."}
          </p>
        </div>

        {error && (
          <div className="adoption-message adoption-error" role="alert">
            <XCircle size={19} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="adoption-message adoption-success" role="status">
            <CheckCircle2 size={19} />
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss message"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {!canUsePage ? (
          <div className="adoption-empty">
            <PawPrint size={32} />
            <h2>Role access required</h2>
            <p>{error || "This page is not available for your account."}</p>
          </div>
        ) : (
          <>
            {isAdopter && (
              <section className="adoption-section">
                <div className="adoption-section-heading">
                  <div>
                    <h2>Animals available for adoption</h2>
                    <p>Choose an animal and tell us a little about your application.</p>
                  </div>
                  <span className="adoption-count">
                    {filteredAnimals.length} animals
                  </span>
                </div>

                <input
                  className="adoption-search"
                  type="search"
                  placeholder="Search by name, type, breed or color..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                {filteredAnimals.length === 0 ? (
                  <div className="adoption-empty">
                    <PawPrint size={32} />
                    <h3>No available animals found</h3>
                    <p>Try another search or check again later.</p>
                  </div>
                ) : (
                  <div className="adoption-animal-grid">
                    {filteredAnimals.map((animal) => (
                      <article
                        className="adoption-animal-card"
                        key={animal.id}
                      >
                        {animal.photo_url || animal.photoUrl ? (
                          <img
                            className="adoption-animal-photo"
                            src={animal.photo_url || animal.photoUrl}
                            alt={animal.name || animalType(animal)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="adoption-animal-placeholder">
                            <PawPrint size={38} />
                          </div>
                        )}

                        <div className="adoption-animal-body">
                          <span className="adoption-available">
                            Available for adoption
                          </span>

                          <h3>{animal.name || "Waiting for a name"}</h3>

                          <p className="adoption-animal-meta">
                            {animalType(animal)}
                            {animal.breed ? ` · ${animal.breed}` : ""}
                          </p>

                          <p className="adoption-animal-description">
                            {animal.description ||
                              "Meet this animal and learn more through your adoption application."}
                          </p>

                          <label className="adoption-notes-label">
                            Application notes
                            <textarea
                              rows={3}
                              maxLength={5000}
                              placeholder="Tell the coordinator about your home and why you would like to adopt..."
                              value={notes[animal.id] || ""}
                              onChange={(event) =>
                                setNotes((previous) => ({
                                  ...previous,
                                  [animal.id]: event.target.value,
                                }))
                              }
                            />
                          </label>

                          <button
                            type="button"
                            className="adoption-primary-button"
                            disabled={Boolean(workingId)}
                            onClick={() => submitApplication(animal)}
                          >
                            <Heart size={17} />
                            {workingId === animal.id
                              ? "Submitting..."
                              : "Apply to adopt"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="adoption-section">
              <div className="adoption-section-heading">
                <div>
                  <h2>
                    {isCoordinator
                      ? "Manage applications"
                      : "My applications"}
                  </h2>
                  <p>
                    {isCoordinator
                      ? "Review submitted applications and complete approved adoptions."
                      : "Track the current status of your adoption applications."}
                  </p>
                </div>
                <span className="adoption-count">
                  {filteredApplications.length} applications
                </span>
              </div>

              <div className="adoption-filters">
                <input
                  className="adoption-search"
                  type="search"
                  placeholder={
                    isCoordinator
                      ? "Search animal, adopter or status..."
                      : "Search by animal or status..."
                  }
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                {isCoordinator && (
                  <select
                    className="adoption-status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                  >
                    <option value="ALL">All statuses</option>
                    {[
                      "APPLICATION_SUBMITTED",
                      "UNDER_REVIEW",
                      "APPROVED",
                      "REJECTED",
                      "COMPLETED",
                      "CANCELLED",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {pretty(status)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {filteredApplications.length === 0 ? (
                <div className="adoption-empty">
                  <Heart size={30} />
                  <h3>No applications found</h3>
                  <p>
                    {isCoordinator
                      ? "Applications will appear here when adopters apply."
                      : "Your submitted applications will appear here."}
                  </p>
                </div>
              ) : (
                <div className="adoption-table-wrap">
                  <table className="adoption-table">
                    <thead>
                      <tr>
                        <th>Animal</th>
                        {isCoordinator && <th>Adopter</th>}
                        <th>Applied</th>
                        <th>Status</th>
                        {isCoordinator && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr key={application.id}>
                          <td>
                            <strong>
                              {application.animal_name || "Animal"}
                            </strong>
                            {application.application_notes && (
                              <small className="adoption-notes-preview">
                                {application.application_notes}
                              </small>
                            )}
                          </td>

                          {isCoordinator && (
                            <td>
                              {[
                                application.adopter_first_name,
                                application.adopter_last_name,
                              ]
                                .filter(Boolean)
                                .join(" ") || "Adopter"}
                            </td>
                          )}

                          <td>
                            {application.application_date
                              ? new Date(
                                  application.application_date
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td>
                            <span
                              className={`adoption-status status-${String(
                                application.status
                              ).toLowerCase().replaceAll("_", "-")}`}
                            >
                              {pretty(application.status)}
                            </span>
                          </td>

                          {isCoordinator && (
                            <td>
                              {[
                                "APPLICATION_SUBMITTED",
                                "UNDER_REVIEW",
                              ].includes(application.status) && (
                                <div className="adoption-review-controls">
                                  <select
                                    aria-label={`Decision for ${application.animal_name || "application"}`}
                                    value={decisions[application.id] || "APPROVED"}
                                    onChange={(event) =>
                                      setDecisions((previous) => ({
                                        ...previous,
                                        [application.id]: event.target.value,
                                      }))
                                    }
                                  >
                                    <option value="APPROVED">Approve</option>
                                    <option value="REJECTED">Reject</option>
                                  </select>

                                  {(decisions[application.id] || "APPROVED") ===
                                    "REJECTED" && (
                                    <textarea
                                      rows={2}
                                      maxLength={2000}
                                      placeholder="Reason for rejection (required)"
                                      value={
                                        decisions[`${application.id}-reason`] || ""
                                      }
                                      onChange={(event) =>
                                        setDecisions((previous) => ({
                                          ...previous,
                                          [`${application.id}-reason`]:
                                            event.target.value,
                                        }))
                                      }
                                    />
                                  )}

                                  <button
                                    type="button"
                                    className="adoption-primary-button"
                                    disabled={Boolean(workingId)}
                                    onClick={() =>
                                      reviewApplication(application)
                                    }
                                  >
                                    {workingId === application.id
                                      ? "Saving..."
                                      : "Submit decision"}
                                  </button>
                                </div>
                              )}

                              {application.status === "APPROVED" && (
                                <button
                                  type="button"
                                  className="adoption-primary-button"
                                  disabled={Boolean(workingId)}
                                  onClick={() =>
                                    completeAdoption(application)
                                  }
                                >
                                  {workingId === application.id
                                    ? "Completing..."
                                    : "Complete adoption"}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
