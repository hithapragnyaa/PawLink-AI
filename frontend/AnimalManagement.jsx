
import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, RefreshCw, X, Save,
  PawPrint, AlertCircle, CheckCircle2
} from "lucide-react";
import { api, getErrorMessage } from "./api.js";
import "./AnimalManagement.css";

const STATUSES = [
  "REPORTED",
  "RESCUED",
  "UNDER_TREATMENT",
  "IN_SHELTER",
  "AVAILABLE_FOR_ADOPTION",
  "ADOPTION_PENDING",
  "ADOPTED",
  "RELEASED",
  "DECEASED",
];

const EMPTY_FORM = {
  name: "",
  animalType: "Dog",
  breed: "",
  gender: "UNKNOWN",
  ageYears: "",
  color: "",
  weightKg: "",
  status: "REPORTED",
  identificationMarks: "",
  description: "",
  photoUrl: "",
};

const readAnimals = (response) => {
  const data = response?.data?.data;
  return data?.animals ?? (Array.isArray(data) ? data : []);
};

const display = (value) =>
  String(value || "UNKNOWN").replaceAll("_", " ");

export default function AnimalManagement({ onChanged }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAnimals() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/animals");
      setAnimals(readAnimals(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnimals();
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEdit(animal) {
    setEditingId(animal.id);
    setForm({
      name: animal.name ?? "",
      animalType: animal.animalType ?? animal.animal_type ?? "Dog",
      breed: animal.breed ?? "",
      gender: animal.gender ?? "UNKNOWN",
      ageYears: animal.ageYears ?? animal.age_years ?? "",
      color: animal.color ?? "",
      weightKg: animal.weightKg ?? animal.weight_kg ?? "",
      status: animal.status ?? "REPORTED",
      identificationMarks:
        animal.identificationMarks ?? animal.identification_marks ?? "",
      description: animal.description ?? "",
      photoUrl: animal.photoUrl ?? animal.photo_url ?? "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.animalType.trim()) {
      setError("Animal type is required.");
      return;
    }

    const payload = {
      name: form.name.trim() || null,
      animalType: form.animalType.trim(),
      breed: form.breed.trim() || null,
      gender: form.gender,
      ageYears:
        form.ageYears === "" ? null : Number(form.ageYears),
      color: form.color.trim() || null,
      weightKg:
        form.weightKg === "" ? null : Number(form.weightKg),
      status: form.status,
      identificationMarks: form.identificationMarks.trim() || null,
      description: form.description.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
    };

    if (
      (payload.ageYears !== null &&
        (!Number.isFinite(payload.ageYears) || payload.ageYears < 0)) ||
      (payload.weightKg !== null &&
        (!Number.isFinite(payload.weightKg) || payload.weightKg <= 0))
    ) {
      setError("Age must be non-negative and weight must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/animals/${editingId}`, payload);
        setSuccess("Animal details updated successfully.");
      } else {
        await api.post("/animals", payload);
        setSuccess("Animal added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });

      await loadAnimals();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(animal, status) {
    const previousStatus = animal.status;

    setError("");
    setSuccess("");

    try {
      await api.patch(`/animals/${animal.id}/status`, { status });
      setSuccess(`Status changed to ${display(status)}.`);
      await loadAnimals();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err));
      // Preserve the original state; a refresh can reconcile server data.
      setAnimals((previous) =>
        previous.map((item) =>
          item.id === animal.id
            ? { ...item, status: previousStatus }
            : item
        )
      );
    }
  }

  async function deleteAnimal(animal) {
    const confirmed = window.confirm(
      `Delete ${animal.name || "this animal"} permanently? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/animals/${animal.id}`);
      setSuccess("Animal deleted successfully.");
      await loadAnimals();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const filteredAnimals = animals.filter((animal) => {
    const name = animal.name || "";
    const type = animal.animalType ?? animal.animal_type ?? "";
    const breed = animal.breed || "";

    const matchesSearch = [name, type, breed]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || animal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="animal-manager">
      <div className="animal-manager-toolbar">
        <div className="animal-manager-filters">
          <input
            aria-label="Search animals"
            placeholder="Search by name, type or breed..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {display(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="animal-manager-actions">
          <button
            type="button"
            className="animal-secondary-button"
            onClick={loadAnimals}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            className="animal-primary-button"
            onClick={startAdd}
          >
            <Plus size={17} />
            Add animal
          </button>
        </div>
      </div>

      {error && (
        <div className="animal-feedback error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="animal-feedback success" role="status">
          <CheckCircle2 size={17} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      {showForm && (
        <form className="animal-form" onSubmit={handleSubmit}>
          <div className="animal-form-heading">
            <div>
              <h3>{editingId ? "Edit animal" : "Register an animal"}</h3>
              <p>Enter the animal's details below.</p>
            </div>
            <button
              type="button"
              className="animal-close-button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              <X size={19} />
            </button>
          </div>

          <div className="animal-form-grid">
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} placeholder="Animal name" />
            </label>

            <label>
              Animal type *
              <select name="animalType" value={form.animalType} onChange={updateField} required>
                <option>Dog</option>
                <option>Cat</option>
                <option>Bird</option>
                <option>Cow</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Breed
              <input name="breed" value={form.breed} onChange={updateField} />
            </label>

            <label>
              Gender
              <select name="gender" value={form.gender} onChange={updateField}>
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>

            <label>
              Age (years)
              <input name="ageYears" type="number" min="0" step="0.1" value={form.ageYears} onChange={updateField} />
            </label>

            <label>
              Weight (kg)
              <input name="weightKg" type="number" min="0.01" step="0.1" value={form.weightKg} onChange={updateField} />
            </label>

            <label>
              Color
              <input name="color" value={form.color} onChange={updateField} />
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={updateField}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{display(status)}</option>
                ))}
              </select>
            </label>

            <label className="animal-form-wide">
              Identification marks
              <input name="identificationMarks" value={form.identificationMarks} onChange={updateField} />
            </label>

            <label className="animal-form-wide">
              Photo URL
              <input name="photoUrl" type="url" value={form.photoUrl} onChange={updateField} placeholder="https://..." />
            </label>

            <label className="animal-form-wide">
              Description
              <textarea name="description" rows="3" value={form.description} onChange={updateField} />
            </label>
          </div>

          <div className="animal-form-actions">
            <button
              type="button"
              className="animal-secondary-button"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="animal-primary-button" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : editingId ? "Save changes" : "Register animal"}
            </button>
          </div>
        </form>
      )}

      <div className="animal-manager-summary">
        <PawPrint size={17} />
        {loading
          ? "Loading animals..."
          : `${filteredAnimals.length} animal(s) shown · ${animals.length} total`}
      </div>

      {loading ? (
        <div className="animal-manager-empty">Loading records from PawLink AI...</div>
      ) : filteredAnimals.length === 0 ? (
        <div className="animal-manager-empty">
          <PawPrint size={30} />
          <strong>No animals found</strong>
          <span>Try another search or register an animal.</span>
        </div>
      ) : (
        <div className="animal-manager-table-wrap">
          <table className="animal-manager-table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Type / Breed</th>
                <th>Status</th>
                <th>Update status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.map((animal) => (
                <tr key={animal.id}>
                  <td>
                    <strong>{animal.name || "Unnamed animal"}</strong>
                    <small>
                      {animal.gender || "UNKNOWN"}
                      {animal.ageYears ?? animal.age_years
                        ? ` · ${animal.ageYears ?? animal.age_years} yrs`
                        : ""}
                    </small>
                  </td>
                  <td>
                    {animal.animalType ?? animal.animal_type ?? "—"}
                    <small>{animal.breed || "Breed not recorded"}</small>
                  </td>
                  <td>
                    <span className={`animal-status-pill status-${String(animal.status || "unknown").toLowerCase().replaceAll("_", "-")}`}>
                      {display(animal.status)}
                    </span>
                  </td>
                  <td>
                    <select
                      aria-label={`Change status for ${animal.name || "animal"}`}
                      value={animal.status || "REPORTED"}
                      onChange={(event) => changeStatus(animal, event.target.value)}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>{display(status)}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="animal-row-actions">
                      <button
                        type="button"
                        title="Edit animal"
                        aria-label={`Edit ${animal.name || "animal"}`}
                        onClick={() => startEdit(animal)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Delete animal"
                        aria-label={`Delete ${animal.name || "animal"}`}
                        className="animal-delete-button"
                        onClick={() => deleteAnimal(animal)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
