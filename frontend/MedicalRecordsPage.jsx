
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Stethoscope, ClipboardList } from "lucide-react";
import { api, clearSession, getErrorMessage } from "./api.js";

const listFrom = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : data?.animals ?? [];
};

export default function MedicalRecordsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [animalId, setAnimalId] = useState("");
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    diagnosis: "",
    treatment: "",
    medications: "",
    vaccinationHistory: "",
    injuryDetails: "",
    medicalNotes: "",
    followUpDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isVet = user?.role === "VETERINARIAN";
  const canView = ["VETERINARIAN", "ADMINISTRATOR"].includes(user?.role);

  const loadRecords = useCallback(async (id) => {
    if (!id) {
      setRecords([]);
      return;
    }

    try {
      const response = await api.get(`/medical-records/animals/${id}`);
      const data = response.data?.data;
      setRecords(Array.isArray(data) ? data : data?.records ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const me = await api.get("/auth/me");
      const currentUser = me.data?.data?.user;

      if (!currentUser) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);

      if (!["VETERINARIAN", "ADMINISTRATOR"].includes(currentUser.role)) {
        setAnimals([]);
        setRecords([]);
        return;
      }

      const response = await api.get("/animals");
      setAnimals(listFrom(response));
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

  useEffect(() => {
    loadRecords(animalId);
  }, [animalId, loadRecords]);

  async function submitRecord(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.post("/medical-records", {
        animalId,
        diagnosis: form.diagnosis.trim() || null,
        treatment: form.treatment.trim() || null,
        medications: form.medications.trim() || null,
        vaccinationHistory: form.vaccinationHistory.trim() || null,
        injuryDetails: form.injuryDetails.trim() || null,
        medicalNotes: form.medicalNotes.trim() || null,
        followUpDate: form.followUpDate || null,
      });

      setSuccess("Medical record saved successfully.");
      setForm({
        diagnosis: "",
        treatment: "",
        medications: "",
        vaccinationHistory: "",
        injuryDetails: "",
        medicalNotes: "",
        followUpDate: "",
      });
      await loadRecords(animalId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="adoption-page"><p className="adoption-loading">Loading medical workspace...</p></main>;
  }

  return (
    <main className="adoption-page">
      <header className="adoption-header">
        <button className="adoption-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={17} /> Dashboard
        </button>
        <div className="adoption-brand"><Stethoscope size={24} /> PawLink <b>AI</b></div>
        <button className="adoption-refresh" onClick={loadPage} disabled={saving}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <section className="adoption-main">
        <div className="adoption-intro">
          <span className="adoption-eyebrow">VETERINARY CARE</span>
          <h1>Medical records</h1>
          <p>Record treatment, track follow-ups, and review animal medical history.</p>
        </div>

        {error && <div className="adoption-message adoption-error" role="alert">{error}</div>}
        {success && <div className="adoption-message adoption-success" role="status">{success}</div>}

        {!canView ? (
          <section className="adoption-section">
            <h2>Access restricted</h2>
            <p>Medical records are available to veterinarians and administrators.</p>
          </section>
        ) : (
          <>
            <section className="adoption-section">
              <h2>Select an animal</h2>
              <label className="adoption-notes-label">
                Animal
                <select className="adoption-search" value={animalId} onChange={(event) => setAnimalId(event.target.value)}>
                  <option value="">Choose an animal to view its history</option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name || animal.animal_type || animal.id} — {animal.status}
                    </option>
                  ))}
                </select>
              </label>
              {animals.length === 0 && <p>No animals were returned by the API.</p>}
            </section>

            {isVet && (
              <section className="adoption-section">
                <h2>Add a medical record</h2>
                <p>Select an animal above before recording treatment.</p>
                <form className="adoption-animal-grid" onSubmit={submitRecord}>
                  {[
                    ["diagnosis", "Diagnosis"],
                    ["treatment", "Treatment"],
                    ["medications", "Medications"],
                    ["vaccinationHistory", "Vaccination history"],
                    ["injuryDetails", "Injury details"],
                    ["medicalNotes", "Medical notes"],
                  ].map(([key, label]) => (
                    <label className="adoption-notes-label" key={key}>
                      {label}
                      <textarea
                        className="adoption-search"
                        rows={3}
                        maxLength={10000}
                        value={form[key]}
                        onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))}
                      />
                    </label>
                  ))}
                  <label className="adoption-notes-label">
                    Follow-up date (optional)
                    <input
                      className="adoption-search"
                      type="date"
                      value={form.followUpDate}
                      onChange={(event) => setForm((old) => ({ ...old, followUpDate: event.target.value }))}
                    />
                  </label>
                  <button className="adoption-primary-button" disabled={saving || !animalId}>
                    <Stethoscope size={16} /> {saving ? "Saving..." : "Save medical record"}
                  </button>
                </form>
              </section>
            )}

            <section className="adoption-section">
              <div className="adoption-section-heading">
                <div><h2>Medical history</h2><p>Records for the selected animal.</p></div>
                <span className="adoption-count">{records.length} records</span>
              </div>

              {!animalId ? (
                <div className="adoption-empty"><ClipboardList size={30} /><h3>Select an animal</h3><p>Choose an animal to load its medical history.</p></div>
              ) : records.length === 0 ? (
                <div className="adoption-empty"><ClipboardList size={30} /><h3>No medical records</h3><p>No medical history is recorded for this animal yet.</p></div>
              ) : (
                <div className="adoption-animal-grid">
                  {records.map((record) => (
                    <article className="adoption-animal-card" key={record.id}>
                      <div className="adoption-animal-body">
                        <span className="adoption-available">
                          {record.record_date ? new Date(record.record_date).toLocaleDateString() : "Medical record"}
                        </span>
                        <h3>{record.diagnosis || "Diagnosis not specified"}</h3>
                        {record.treatment && <p><strong>Treatment:</strong> {record.treatment}</p>}
                        {record.medications && <p><strong>Medications:</strong> {record.medications}</p>}
                        {record.vaccination_history && <p><strong>Vaccination:</strong> {record.vaccination_history}</p>}
                        {record.injury_details && <p><strong>Injury details:</strong> {record.injury_details}</p>}
                        {record.medical_notes && <p><strong>Notes:</strong> {record.medical_notes}</p>}
                        {record.follow_up_date && <p><strong>Follow-up:</strong> {new Date(record.follow_up_date).toLocaleDateString()}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
