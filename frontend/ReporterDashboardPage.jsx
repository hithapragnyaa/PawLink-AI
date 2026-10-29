import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { api, getErrorMessage } from "./api";

const initialForm = {
  
  address: "",
  description: "",
  imageUrl: "",

  // SVM rescue-priority assessment fields
  head_injury: "No",
  head_injury_severity: "Not applicable",
  svm_breathing_difficulty: "Normal",
  svm_consciousness: "Alert",
  bleeding_severity: "None",
  svm_mobility_status: "Normal",
  suspected_fracture: "No",
  seizures: "No",
  suspected_poisoning: "No",
  trapped: "No",
  roadside_danger: "No",
  orange_warning_symptoms: "",
};


 
  


// --- Injected Component Keyframe Styles ---
const inlineKeyframes = `
  @keyframes floatPulse {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0px); }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .reporter-input-field:focus {
    background: #ffffff !important;
    border-color: #8b72e8 !important;
    box-shadow: 0 0 0 4px rgba(139, 114, 232, 0.16) !important;
  }
  .reporter-stat-hover:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.95) !important;
    box-shadow: 0 14px 30px -6px rgba(139, 114, 232, 0.15) !important;
    border-color: rgba(186, 168, 245, 0.6) !important;
  }
  .reporter-btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(139, 114, 232, 0.32) !important;
    filter: brightness(1.03);
  }
  .reporter-btn-submit:active:not(:disabled) {
    transform: translateY(0px);
  }
  .reporter-btn-refresh:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #ffffff !important;
    border-color: #8b72e8 !important;
    color: #8b72e8 !important;
    box-shadow: 0 6px 18px rgba(139, 114, 232, 0.15) !important;
  }
  .reporter-feed-card:hover {
    transform: translateY(-2px);
    border-color: rgba(186, 168, 245, 0.6) !important;
    box-shadow: 0 10px 24px rgba(139, 114, 232, 0.08) !important;
  }
`;

// --- Inline Style Definitions (Unified Pastel Theme) ---
const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid rgba(230, 222, 245, 0.9)",
  borderRadius: "14px",
  fontSize: "14px",
  background: "rgba(255, 255, 255, 0.85)",
  color: "#322b45",
  fontFamily: "inherit",
  outline: "none",
  transition: "all 0.22s ease",
};

const labelStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "7px",
  color: "#322b45",
  letterSpacing: "-0.2px",
};

const cardStyle = {
  background: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(240, 235, 248, 0.85)",
  borderRadius: "24px",
  padding: "26px 28px",
  boxShadow: "0 6px 24px -4px rgba(120, 95, 175, 0.06)",
  minWidth: 0,
  transition: "all 0.25s ease",
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "14px",
  padding: "12px 24px",
  background: "linear-gradient(135deg, #8b72e8 0%, #a482f3 100%)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 750,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(139, 114, 232, 0.25)",
  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
};

function Field({ label, children, required = false }) {
  return (
    <div>
      <label style={labelStyle}>
        <span>{label}</span>
        {required && (
          <span style={{ color: "#d94b68", fontSize: "11px", fontWeight: 700 }}>
            * Required
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function SelectField({ name, label, value, onChange, options, required }) {
  return (
    <Field label={label} required={required}>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={fieldStyle}
        className="reporter-input-field"
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function getReportValue(report, camelCase, snakeCase) {
  return report?.[camelCase] ?? report?.[snakeCase] ?? "";
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function statusStyle(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized.includes("COMPLETED") || normalized.includes("RESOLVED")) {
    return {
      background: "#e6f8ee",
      color: "#278351",
      border: "1px solid #ceecd9",
    };
  }

  if (
    normalized.includes("REJECTED") ||
    normalized.includes("CANCELLED")
  ) {
    return {
      background: "#fff0f1",
      color: "#c84651",
      border: "1px solid #fcd5d8",
    };
  }

  if (
    normalized.includes("PROGRESS") ||
    normalized.includes("ASSIGNED") ||
    normalized.includes("APPROVED")
  ) {
    return {
      background: "#ebf3ff",
      color: "#4075c7",
      border: "1px solid #d3e4ff",
    };
  }

  return {
    background: "#fff3e6",
    color: "#c76d2e",
    border: "1px solid #f9ddce",
  };
}

function humanizeStatus(status) {
  if (!status) return "Submitted";

  return String(status)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ReporterDashboardPage() {
  const [form, setForm] = useState(initialForm);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/rescue-reports/mine");
      const payload = response.data;

      setReports(
        Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.reports)
          ? payload.data.reports
          : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.animalType || !form.description.trim()) {
      setError("Please select an animal type and describe the situation.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter the animal's location or a nearby landmark.");
      return;
    }

    const body = {
      animalType: form.animalType,
      ageGroup: form.ageGroup,
      injurySeverity: Number(form.injurySeverity),
      visibleBleeding: form.visibleBleeding,
      mobilityStatus: form.mobilityStatus,
      consciousness: form.consciousness,
      breathingDifficulty: form.breathingDifficulty,
      timeSinceInjuryHours:
        form.timeSinceInjuryHours === ""
          ? null
          : Number(form.timeSinceInjuryHours),
      locationType: form.locationType,
      trafficRisk: form.trafficRisk,
      weatherCondition: form.weatherCondition,
      previousReports: Number(form.previousReports),
      reporterConfidence: Number(form.reporterConfidence),
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      address: form.address.trim(),
      description: form.description.trim(),
            imageUrl: form.imageUrl.trim() || null,

      // Features sent to the SVM rescue-priority model
      svmFeatures: {
        head_injury: form.head_injury,
        head_injury_severity: form.head_injury_severity,
        breathing_difficulty: form.svm_breathing_difficulty,
        consciousness: form.svm_consciousness,
        bleeding_severity: form.bleeding_severity,
        mobility_status: form.svm_mobility_status,
        suspected_fracture: form.suspected_fracture,
        seizures: form.seizures,
        suspected_poisoning: form.suspected_poisoning,
        trapped: form.trapped,
        roadside_danger: form.roadside_danger,
        orange_warning_symptoms: form.orange_warning_symptoms,
      },
    };
    

    if (
      (body.latitude !== null &&
        (!Number.isFinite(body.latitude) ||
          body.latitude < -90 ||
          body.latitude > 90)) ||
      (body.longitude !== null &&
        (!Number.isFinite(body.longitude) ||
          body.longitude < -180 ||
          body.longitude > 180))
    ) {
      setError("Please enter valid latitude and longitude coordinates.");
      return;
    }

    if (
      (body.latitude === null) !== (body.longitude === null)
    ) {
      setError("Enter both latitude and longitude, or leave both blank.");
      return;
    }

    if (
      body.timeSinceInjuryHours !== null &&
      (!Number.isFinite(body.timeSinceInjuryHours) ||
        body.timeSinceInjuryHours < 0)
    ) {
      setError("Time since injury must be zero or greater.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/rescue-reports", body);
      setSuccess(
        "Your rescue report has been submitted! Help is on the way. 🐾✨"
      );
      setForm(initialForm);
      await loadReports();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const input = (name, type = "text", extra = {}) => (
    <input
      name={name}
      type={type}
      value={form[name]}
      onChange={updateField}
      style={fieldStyle}
      className="reporter-input-field"
      {...extra}
    />
  );

  const checkbox = (name, label) => {
    const isChecked = Boolean(form[name]);
    return (
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "9px",
          padding: "9px 16px",
          borderRadius: "999px",
          fontSize: "13.5px",
          fontWeight: 650,
          background: isChecked ? "#f3edff" : "rgba(255, 255, 255, 0.75)",
          border: `1px solid ${isChecked ? "#8b72e8" : "rgba(230, 222, 245, 0.9)"}`,
          color: isChecked ? "#8b72e8" : "#5d5473",
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.2s ease",
          boxShadow: isChecked ? "0 3px 12px rgba(139, 114, 232, 0.2)" : "none",
        }}
      >
        <input
          type="checkbox"
          name={name}
          checked={form[name]}
          onChange={updateField}
          style={{
            accentColor: "#8b72e8",
            width: "16px",
            height: "16px",
            cursor: "pointer",
          }}
        />
        {label}
      </label>
    );
  };

  const awaitingCount = reports.filter((report) => {
    const status = String(
      getReportValue(report, "status", "status") || ""
    ).toUpperCase();
    return (
      !status ||
      status.includes("SUBMITTED") ||
      status.includes("PENDING") ||
      status.includes("REPORTED")
    );
  }).length;

  const resolvedCount = reports.filter((report) => {
    const status = String(
      getReportValue(report, "status", "status") || ""
    ).toUpperCase();
    return status.includes("RESOLVED") || status.includes("COMPLETED");
  }).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(at 0% 0%, #fbf9ff 0px, transparent 50%),
                     radial-gradient(at 100% 0%, #fff0f6 0px, transparent 50%),
                     radial-gradient(at 100% 100%, #fffdec 0px, transparent 50%),
                     radial-gradient(at 0% 100%, #f4efff 0px, transparent 50%),
                     #faf9fe`,
        backgroundAttachment: "fixed",
        padding: "32px 18px 52px",
        color: "#322b45",
        fontFamily:
          '"Plus Jakarta Sans", "Quicksand", Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <style>{inlineKeyframes}</style>

      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {/* Top Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "18px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                color: "#8b72e8",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "1.5px",
              }}
            >
              <ShieldAlert size={18} />
              <span>PAWLINK AI · RESCUE DISPATCH</span>
            </div>
            <h1
              style={{
                fontSize: "29px",
                fontWeight: 850,
                letterSpacing: "-0.8px",
                margin: "0 0 6px",
                color: "#322b45",
              }}
            >
              Rescue reporting dashboard{" "}
              <span style={{ fontSize: "22px", color: "#8b72e8" }}>✨</span>
            </h1>
            <p style={{ margin: 0, color: "#6f6782", fontSize: "14px" }}>
              Report an animal in distress and track dispatch responses in real time.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="reporter-btn-refresh"
            style={{
              ...buttonStyle,
              background: "rgba(255, 255, 255, 0.85)",
              color: "#5d5473",
              border: "1px solid rgba(230, 222, 245, 0.9)",
              boxShadow: "0 4px 14px rgba(110, 89, 165, 0.05)",
              fontSize: "13px",
              padding: "10px 18px",
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: loading ? "spinSlow 1s linear infinite" : "none",
              }}
            />
            Refresh reports
          </button>
        </header>

        {/* Overview Stats Cards */}
        <section
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "26px",
  }}
>
          <div
            className="reporter-stat-hover"
            style={{
              ...cardStyle,
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "15px",
                background: "#f2edff",
                color: "#8b72e8",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <ClipboardList size={22} />
            </div>
            <div>
              <p
                style={{
                  color: "#9d95ad",
                  fontSize: "12px",
                  fontWeight: 700,
                  margin: "0 0 3px",
                }}
              >
                Total reports
              </p>
              <strong
                style={{
                  fontSize: "27px",
                  fontWeight: 850,
                  letterSpacing: "-0.8px",
                  color: "#322b45",
                }}
              >
                {loading ? "—" : reports.length}
              </strong>
            </div>
          </div>

          <div
            className="reporter-stat-hover"
            style={{
              ...cardStyle,
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "15px",
                background: "#fff0e7",
                color: "#dd7955",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <p
                style={{
                  color: "#9d95ad",
                  fontSize: "12px",
                  fontWeight: 700,
                  margin: "0 0 3px",
                }}
              >
                Awaiting review
              </p>
              <strong
                style={{
                  fontSize: "27px",
                  fontWeight: 850,
                  letterSpacing: "-0.8px",
                  color: "#322b45",
                }}
              >
                {loading ? "—" : awaitingCount}
              </strong>
            </div>
          </div>

          <div
            className="reporter-stat-hover"
            style={{
              ...cardStyle,
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "15px",
                background: "#eafaf1",
                color: "#3ba46e",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p
                style={{
                  color: "#9d95ad",
                  fontSize: "12px",
                  fontWeight: 700,
                  margin: "0 0 3px",
                }}
              >
                Resolved safely
              </p>
              <strong
                style={{
                  fontSize: "27px",
                  fontWeight: 850,
                  letterSpacing: "-0.8px",
                  color: "#322b45",
                }}
              >
                {loading ? "—" : resolvedCount}
              </strong>
            </div>
          </div>
        </section>

        {/* Status Alerts */}
        {error && (
          <div
            role="alert"
            style={{
              padding: "14px 18px",
              borderRadius: "16px",
              background: "#fff2f4",
              color: "#b53851",
              border: "1px solid #fed8df",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "11px",
              fontSize: "13.5px",
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(181, 56, 81, 0.08)",
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              padding: "14px 18px",
              borderRadius: "16px",
              background: "#f0fbf4",
              color: "#278351",
              border: "1px solid #c9f0d7",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "11px",
              fontSize: "13.5px",
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(39, 131, 81, 0.08)",
            }}
          >
            <Sparkles size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Submit Form Section */}
        <section style={{ ...cardStyle, marginBottom: "28px" }}>
          <div style={{ marginBottom: "22px" }}>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.4px",
                margin: "0 0 6px",
                color: "#322b45",
              }}
            >
              <FileText size={20} color="#8b72e8" />
              Submit a rescue report 🐾
            </h2>
            <p style={{ color: "#9d95ad", fontSize: "13.5px", margin: 0 }}>
              Provide as much accurate detail as possible to help dispatchers locate the animal swiftly.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div
            
  style={{
    marginBottom: "24px",
    padding: "22px",
    border: "1px solid rgba(186, 168, 245, 0.5)",
    borderRadius: "18px",
    background: "rgba(248, 245, 255, 0.75)",
  }}
>
  <h3 style={{ marginTop: 0, color: "#6e55bd" }}>
    AI Rescue Assessment
  </h3>
  <p style={{ color: "#756b87", fontSize: "13px", lineHeight: 1.6 }}>
    Select observations based on what you can actually see. Choose
    Unknown when a condition cannot be assessed. This assessment
    supports AI prioritization and does not replace veterinary advice.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
    }}
  >
    <SelectField
      name="head_injury"
      label="Head injury"
      value={form.head_injury}
      onChange={updateField}
      options={[
        { value: "No", label: "No visible head injury" },
        { value: "Yes", label: "Head injury suspected/visible" },
      ]}
    />

    <SelectField
      name="head_injury_severity"
      label="Head injury severity"
      value={form.head_injury_severity}
      onChange={updateField}
      options={[
        { value: "Not applicable", label: "Not applicable" },
        { value: "Minor", label: "Minor" },
        { value: "Moderate", label: "Moderate" },
        { value: "Severe", label: "Severe" },
      ]}
    />

    <SelectField
      name="svm_breathing_difficulty"
      label="Breathing"
      value={form.svm_breathing_difficulty}
      onChange={updateField}
      options={[
        { value: "Normal", label: "Appears normal" },
        { value: "Difficulty", label: "Difficulty breathing" },
        { value: "Severe difficulty", label: "Severe difficulty" },
        { value: "Unknown", label: "Unknown / cannot assess" },
      ]}
    />

    <SelectField
      name="svm_consciousness"
      label="Consciousness"
      value={form.svm_consciousness}
      onChange={updateField}
      options={[
        { value: "Alert", label: "Alert" },
        { value: "Weak/disoriented", label: "Weak / disoriented" },
        { value: "Unconscious", label: "Unconscious" },
        { value: "Unknown", label: "Unknown" },
      ]}
    />

    <SelectField
      name="bleeding_severity"
      label="Bleeding severity"
      value={form.bleeding_severity}
      onChange={updateField}
      options={[
        { value: "None", label: "None observed" },
        { value: "Minor", label: "Minor" },
        { value: "Moderate", label: "Moderate" },
        { value: "Heavy/uncontrolled", label: "Heavy / uncontrolled" },
        { value: "Unknown", label: "Unknown" },
      ]}
    />

    <SelectField
      name="svm_mobility_status"
      label="Mobility assessment"
      value={form.svm_mobility_status}
      onChange={updateField}
      options={[
        { value: "Normal", label: "Moving normally" },
        { value: "Limping/limited", label: "Limping / limited" },
        { value: "Unable to stand", label: "Unable to stand" },
        { value: "Unknown", label: "Unknown" },
      ]}
    />

    <SelectField
      name="suspected_fracture"
      label="Suspected fracture"
      value={form.suspected_fracture}
      onChange={updateField}
      options={[
        { value: "No", label: "Not suspected" },
        { value: "Suspected", label: "Suspected" },
        { value: "Unknown", label: "Unknown" },
      ]}
    />

    <SelectField
      name="seizures"
      label="Seizures"
      value={form.seizures}
      onChange={updateField}
      options={[
        { value: "No", label: "None observed" },
        { value: "Yes", label: "Observed / suspected" },
        { value: "Unknown", label: "Unknown" },
      ]}
    />

    <SelectField
      name="suspected_poisoning"
      label="Suspected poisoning"
      value={form.suspected_poisoning}
      onChange={updateField}
      options={[
        { value: "No", label: "Not suspected" },
        { value: "Suspected", label: "Suspected" },
        { value: "Unknown", label: "Unknown" },
      ]}
    />

    <SelectField
      name="trapped"
      label="Animal trapped?"
      value={form.trapped}
      onChange={updateField}
      options={[
        { value: "No", label: "No" },
        { value: "Yes", label: "Yes" },
      ]}
    />

    <SelectField
      name="roadside_danger"
      label="Immediate roadside danger"
      value={form.roadside_danger}
      onChange={updateField}
      options={[
        { value: "No", label: "No" },
        { value: "Yes", label: "Yes" },
      ]}
    />

    <SelectField
      name="orange_warning_symptoms"
      label="Additional warning symptom"
      value={form.orange_warning_symptoms}
      onChange={updateField}
      options={[
        { value: "", label: "None selected / not observed" },
        { value: "Blood in urine, stool or vomit", label: "Blood in urine, stool or vomit" },
        { value: "Drooping wing, cannot stay on the perch", label: "Drooping wing / cannot perch" },
        { value: "Droppings changed: liquid, bloody, unusual color", label: "Unusual or bloody droppings" },
        { value: "Eye: injury, kept shut or clouded", label: "Eye injury or cloudiness" },
        { value: "Lameness: not bearing weight on a limb at all", label: "Cannot bear weight on a limb" },
        { value: "Lethargy: hiding, not itself", label: "Lethargy / unusual behavior" },
        { value: "Not eating for over a day", label: "Not eating for over a day" },
        { value: "Not eating longer than usual and visibly losing weight", label: "Reduced eating and weight loss" },
        { value: "Pain: whining, crying out, won't let you touch", label: "Signs of pain" },
        { value: "Temperature above 39.5 °C", label: "Temperature above 39.5 °C" },
        { value: "Vomiting or diarrhea several times a day", label: "Repeated vomiting or diarrhea" },
      ]}
    />
   </div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  }}
>
              <SelectField
                label="Animal type 🐕"
                required
                name="animalType"
                value={form.animalType}
                onChange={updateField}
                options={[
                  { value: "Dog", label: "Dog 🐶" },
                  { value: "Cat", label: "Cat 🐱" },
                  { value: "Cow", label: "Cow 🐮" },
                  { value: "Bird", label: "Bird 🦜" },
                  { value: "Other", label: "Other 🐾" },
                ]}
              />

              <SelectField
                name="ageGroup"
                label="Age group"
                value={form.ageGroup}
                onChange={updateField}
                options={[
                  { value: "Unknown", label: "Unknown" },
                  { value: "Baby", label: "Baby / Kitten / Puppy" },
                  { value: "Young", label: "Young" },
                  { value: "Adult", label: "Adult" },
                  { value: "Senior", label: "Senior" },
                ]}
              />

              <SelectField
                name="injurySeverity"
                label="Injury severity"
                required
                value={form.injurySeverity}
                onChange={updateField}
                options={[1, 2, 3, 4, 5].map((number) => ({
                  value: String(number),
                  label: `${number}${number === 5 ? " — Critical Emergency 🚨" : ""}`,
                }))}
              />

              <SelectField
                name="mobilityStatus"
                label="Mobility"
                value={form.mobilityStatus}
                onChange={updateField}
                options={[
                  { value: "Unknown", label: "Unknown" },
                  { value: "Normal", label: "Walking normally" },
                  { value: "Difficulty", label: "Difficulty moving" },
                  { value: "Unable", label: "Unable to move" },
                ]}
              />

              <SelectField
                name="consciousness"
                label="Consciousness"
                value={form.consciousness}
                onChange={updateField}
                options={[
                  { value: "Conscious", label: "Conscious" },
                  { value: "Unconscious", label: "Unconscious" },
                  { value: "Unknown", label: "Unknown" },
                ]}
              />

              <SelectField
                name="locationType"
                label="Location type"
                value={form.locationType}
                onChange={updateField}
                options={[
                  { value: "Roadside", label: "Roadside" },
                  { value: "Residential", label: "Residential area" },
                  { value: "Public", label: "Public place" },
                  { value: "Other", label: "Other" },
                ]}
              />

              <SelectField
                name="trafficRisk"
                label="Traffic risk"
                value={form.trafficRisk}
                onChange={updateField}
                options={[
                  { value: "Low", label: "Low risk" },
                  { value: "Medium", label: "Medium risk" },
                  { value: "High", label: "High risk ⚠️" },
                  { value: "Unknown", label: "Unknown" },
                ]}
              />

              <SelectField
                name="weatherCondition"
                label="Weather"
                value={form.weatherCondition}
                onChange={updateField}
                options={[
                  { value: "Unknown", label: "Unknown" },
                  { value: "Clear", label: "Clear ☀️" },
                  { value: "Rainy", label: "Rainy 🌧️" },
                  { value: "Hot", label: "Hot 🌡️" },
                  { value: "Cold", label: "Cold ❄️" },
                  { value: "Other", label: "Other" },
                ]}
              />

              <SelectField
                name="previousReports"
                label="Previous reports at location"
                value={form.previousReports}
                onChange={updateField}
                options={[0, 1, 2, 3, 4, 5].map((number) => ({
                  value: String(number),
                  label: number === 5 ? "5 or more" : String(number),
                }))}
              />

              <SelectField
                name="reporterConfidence"
                label="Confidence in observation"
                value={form.reporterConfidence}
                onChange={updateField}
                options={[
                  { value: "25", label: "Low — 25%" },
                  { value: "50", label: "Medium — 50%" },
                  { value: "90", label: "High — 90% (Direct observation)" },
                ]}
              />

              <Field label="Hours since injury (if known)">
                {input("timeSinceInjuryHours", "number", {
                  min: 0,
                  step: "any",
                  placeholder: "e.g. 2",
                })}
              </Field>

              <Field label="Latitude (optional)">
                {input("latitude", "number", {
                  min: -90,
                  max: 90,
                  step: "any",
                  placeholder: "e.g. 12.9716",
                })}
              </Field>

              <Field label="Longitude (optional)">
                {input("longitude", "number", {
                  min: -180,
                  max: 180,
                  step: "any",
                  placeholder: "e.g. 77.5946",
                })}
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Location or nearby landmark" required>
                  {input("address", "text", {
                    required: true,
                    placeholder: "Street, area, landmark, or full address",
                  })}
                </Field>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Image URL (optional)">
                  {input("imageUrl", "url", {
                    placeholder: "https://example.com/animal-image.jpg",
                  })}
                </Field>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Describe the situation" required>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    required
                    rows={4}
                    maxLength={3000}
                    placeholder="Describe the animal's condition, behavior, exact spot, and immediate danger."
                    style={{ ...fieldStyle, resize: "vertical", minHeight: "105px" }}
                    className="reporter-input-field"
                  />
                </Field>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "4px",
                }}
              >
                {checkbox("visibleBleeding", "Visible bleeding 🩸")}
                {checkbox("breathingDifficulty", "Difficulty breathing 🫁")}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                className="reporter-btn-submit"
                style={buttonStyle}
              >
                <Send size={15} />
                <span>{submitting ? "Submitting dispatch..." : "Submit rescue report"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Reports History */}
        <section style={cardStyle}>
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.4px",
                margin: "0 0 6px",
                color: "#322b45",
              }}
            >
              My reports
            </h2>
            <p style={{ color: "#9d95ad", fontSize: "13.5px", margin: 0 }}>
              Live statuses and updates of rescue dispatches sent from your account.
            </p>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "38px 20px",
                color: "#8b72e8",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <RefreshCw
                size={26}
                style={{ animation: "spinSlow 1.2s linear infinite" }}
              />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#6f6782" }}>
                Loading your reports...
              </span>
            </div>
          ) : reports.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "rgba(255, 255, 255, 0.5)",
                border: "1px dashed rgba(215, 203, 238, 0.8)",
                borderRadius: "18px",
              }}
            >
              <ClipboardList
                size={34}
                color="#8b72e8"
                style={{
                  marginBottom: "10px",
                  animation: "floatPulse 3s ease-in-out infinite",
                }}
              />
              <p style={{ fontWeight: 750, margin: "0 0 5px", color: "#322b45" }}>
                No reports submitted yet
              </p>
              <p style={{ color: "#9d95ad", fontSize: "13.5px", margin: 0 }}>
                Use the form above to file a report whenever an animal is in need.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {reports.map((report, index) => {
                const id = getReportValue(report, "id", "id");
                const status = getReportValue(report, "status", "status");
                const animalType = getReportValue(
                  report,
                  "animalType",
                  "animal_type"
                );
                const address = getReportValue(report, "address", "address");
                const description = getReportValue(
                  report,
                  "description",
                  "description"
                );
                const createdAt = getReportValue(
                  report,
                  "createdAt",
                  "created_at"
                );

                return (
                  <article
                    key={id || index}
                    className="reporter-feed-card"
                    style={{
                      border: "1px solid rgba(235, 227, 248, 0.9)",
                      borderRadius: "18px",
                      padding: "20px 22px",
                      background: "rgba(255, 255, 255, 0.9)",
                      boxShadow: "0 4px 14px rgba(110, 89, 165, 0.04)",
                      transition: "all 0.22s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: "0 0 4px",
                            fontSize: "17px",
                            fontWeight: 800,
                            letterSpacing: "-0.3px",
                            color: "#322b45",
                          }}
                        >
                          {animalType || "Animal rescue report"}
                          {id !== "" && id !== null && id !== undefined
                            ? ` · #${id}`
                            : ""}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            color: "#9d95ad",
                            fontSize: "12.5px",
                          }}
                        >
                          {formatDate(createdAt)}
                        </p>
                      </div>

                      <span
                        style={{
                          ...statusStyle(status),
                          padding: "5px 12px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 750,
                          letterSpacing: "0.2px",
                        }}
                      >
                        {humanizeStatus(status)}
                      </span>
                    </div>

                    {address && (
                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          color: "#6f6782",
                          fontSize: "13.5px",
                          margin: "12px 0 6px",
                        }}
                      >
                        <MapPin
                          size={15}
                          color="#8b72e8"
                          style={{ flexShrink: 0 }}
                        />
                        <span>{address}</span>
                      </p>
                    )}

                    {description && (
                      <p
                        style={{
                          color: "#6f6782",
                          fontSize: "13.5px",
                          lineHeight: 1.6,
                          margin: "8px 0 0",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {description}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}