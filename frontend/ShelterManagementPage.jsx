
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  PawPrint,
  CheckCircle2,
} from "lucide-react";
import { api, clearSession, getErrorMessage } from "./api.js";

const listFrom = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : data?.shelters ?? data?.animals ?? [];
};

export default function ShelterManagementPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    capacity: "",
    contactPhone: "",
    description: "",
  });
  const [admission, setAdmission] = useState({
    animalId: "",
    shelterId: "",
    kennelNumber: "",
    notes: "",
  });

  const canCreateShelter = user?.role === "ADMINISTRATOR";
  const canAdmit = [
    "ADMINISTRATOR",
    "VOLUNTEER",
    "VETERINARIAN",
  ].includes(user?.role);
  const canCheckout = [
    "ADMINISTRATOR",
    "VOLUNTEER",
  ].includes(user?.role);

  const loadData = useCallback(async () => {
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

      const results = await Promise.allSettled([
        api.get("/shelters"),
        api.get("/shelters/stays?activeOnly=false"),
        api.get("/animals"),
      ]);

      const failures = [];

      if (results[0].status === "fulfilled") {
        setShelters(listFrom(results[0].value));
      } else {
        failures.push(`Shelters: ${getErrorMessage(results[0].reason)}`);
      }

      if (results[1].status === "fulfilled") {
        setStays(listFrom(results[1].value));
      } else {
        failures.push(`Shelter stays: ${getErrorMessage(results[1].reason)}`);
      }

      if (results[2].status === "fulfilled") {
        setAnimals(listFrom(results[2].value));
      } else {
        failures.push(`Animals: ${getErrorMessage(results[2].reason)}`);
      }

      if (failures.length) setError(failures.join(" "));
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
    loadData();
  }, [loadData]);

  async function createShelter(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        capacity: form.capacity === "" ? null : Number(form.capacity),
      };

      await api.post("/shelters", payload);
      setForm({
        name: "",
        address: "",
        city: "",
        state: "",
        capacity: "",
        contactPhone: "",
        description: "",
      });
      setSuccess("Shelter created successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function admitAnimal(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.post("/shelters/stays", {
        ...admission,
        kennelNumber: admission.kennelNumber || null,
        notes: admission.notes || null,
      });

      setAdmission({
        animalId: "",
        shelterId: "",
        kennelNumber: "",
        notes: "",
      });
      setSuccess("Animal admitted to the shelter successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function checkout(stayId) {
    if (!window.confirm("Check this animal out of the shelter?")) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.patch(`/shelters/stays/${stayId}/checkout`);
      setSuccess("Animal checked out successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const activeStays = stays.filter((stay) => !stay.check_out_at);

  if (loading) {
    return <main className="adoption-page"><p className="adoption-loading">Loading shelter workspace...</p></main>;
  }

  return (
    <main className="adoption-page">
      <header className="adoption-header">
        <button className="adoption-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={17} /> Dashboard
        </button>
        <div className="adoption-brand"><Building2 size={24} /> PawLink <b>AI</b></div>
        <button className="adoption-refresh" onClick={loadData} disabled={saving}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <section className="adoption-main">
        <div className="adoption-intro">
          <span className="adoption-eyebrow">ANIMAL CARE</span>
          <h1>Shelter management</h1>
          <p>Manage shelters, admissions, occupancy, and animal checkout.</p>
        </div>

        {error && <div className="adoption-message adoption-error" role="alert">{error}</div>}
        {success && <div className="adoption-message adoption-success" role="status">{success}</div>}

        <section className="adoption-section">
          <div className="adoption-section-heading">
            <div>
              <h2>Shelters</h2>
              <p>Organization shelters and current occupancy.</p>
            </div>
            <span className="adoption-count">{shelters.length} shelters</span>
          </div>

          {shelters.length === 0 ? (
            <div className="adoption-empty"><Building2 size={30} /><h3>No shelters found</h3><p>An administrator can create the first shelter.</p></div>
          ) : (
            <div className="adoption-animal-grid">
              {shelters.map((shelter) => (
                <article className="adoption-animal-card" key={shelter.id}>
                  <div className="adoption-animal-body">
                    <h3>{shelter.name}</h3>
                    <p>{[shelter.address, shelter.city, shelter.state].filter(Boolean).join(", ") || "Address not provided"}</p>
                    <p><strong>Occupancy:</strong> {shelter.current_occupancy ?? 0}{shelter.capacity != null ? ` / ${shelter.capacity}` : " (no capacity limit)"}</p>
                    <p><strong>Contact:</strong> {shelter.contact_phone || "Not provided"}</p>
                    {shelter.description && <p>{shelter.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {canCreateShelter && (
          <section className="adoption-section">
            <h2>Create a shelter</h2>
            <form className="adoption-animal-grid" onSubmit={createShelter}>
              {[
                ["name", "Shelter name", true],
                ["address", "Address"],
                ["city", "City"],
                ["state", "State"],
                ["capacity", "Capacity (optional)"],
                ["contactPhone", "Contact phone"],
                ["description", "Description"],
              ].map(([key, label, required]) => (
                <label className="adoption-notes-label" key={key}>
                  {label}
                  <input
                    className="adoption-search"
                    style={{ marginTop: 8, marginBottom: 0 }}
                    value={form[key]}
                    required={Boolean(required)}
                    type={key === "capacity" ? "number" : "text"}
                    min={key === "capacity" ? 1 : undefined}
                    step={key === "capacity" ? 1 : undefined}
                    onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))}
                  />
                </label>
              ))}
              <button className="adoption-primary-button" disabled={saving}>
                <Building2 size={16} /> {saving ? "Saving..." : "Create shelter"}
              </button>
            </form>
          </section>
        )}

        {canAdmit && (
          <section className="adoption-section">
            <h2>Admit an animal</h2>
            <p>Select an animal and shelter. The backend checks capacity and prevents duplicate active stays.</p>
            <form className="adoption-animal-grid" onSubmit={admitAnimal}>
              <label className="adoption-notes-label">
                Animal
                <select className="adoption-search" required value={admission.animalId} onChange={(e) => setAdmission((old) => ({ ...old, animalId: e.target.value }))}>
                  <option value="">Select animal</option>
                  {animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.name || animal.animal_type || animal.id} — {animal.status}</option>)}
                </select>
              </label>
              <label className="adoption-notes-label">
                Shelter
                <select className="adoption-search" required value={admission.shelterId} onChange={(e) => setAdmission((old) => ({ ...old, shelterId: e.target.value }))}>
                  <option value="">Select shelter</option>
                  {shelters.map((shelter) => <option key={shelter.id} value={shelter.id}>{shelter.name}</option>)}
                </select>
              </label>
              <label className="adoption-notes-label">
                Kennel number (optional)
                <input className="adoption-search" value={admission.kennelNumber} onChange={(e) => setAdmission((old) => ({ ...old, kennelNumber: e.target.value }))} />
              </label>
              <label className="adoption-notes-label">
                Notes (optional)
                <textarea className="adoption-search" rows={3} value={admission.notes} onChange={(e) => setAdmission((old) => ({ ...old, notes: e.target.value }))} />
              </label>
              <button className="adoption-primary-button" disabled={saving || shelters.length === 0 || animals.length === 0}>
                <PawPrint size={16} /> {saving ? "Admitting..." : "Admit animal"}
              </button>
            </form>
          </section>
        )}

        <section className="adoption-section">
          <div className="adoption-section-heading">
            <div><h2>Shelter stays</h2><p>Active stays and historical admissions.</p></div>
            <span className="adoption-count">{activeStays.length} active</span>
          </div>
          <div className="adoption-table-wrap">
            <table className="adoption-table">
              <thead><tr><th>Animal</th><th>Shelter</th><th>Kennel</th><th>Checked in</th><th>Status</th>{canCheckout && <th>Action</th>}</tr></thead>
              <tbody>
                {stays.map((stay) => (
                  <tr key={stay.id}>
                    <td>{stay.animal_name || stay.animal_id}</td>
                    <td>{stay.shelter_name || stay.shelter_id}</td>
                    <td>{stay.kennel_number || "—"}</td>
                    <td>{stay.check_in_at ? new Date(stay.check_in_at).toLocaleDateString() : "—"}</td>
                    <td><span className={`adoption-status ${stay.check_out_at ? "status-completed" : "status-approved"}`}>{stay.check_out_at ? "Checked out" : "Active"}</span></td>
                    {canCheckout && <td>{!stay.check_out_at && <button className="adoption-primary-button" disabled={saving} onClick={() => checkout(stay.id)}><CheckCircle2 size={15} /> Check out</button>}</td>}
                  </tr>
                ))}
                {stays.length === 0 && <tr><td colSpan={canCheckout ? 6 : 5} className="adoption-empty">No shelter stays found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
