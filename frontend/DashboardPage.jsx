
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Stethoscope,
  HeartHandshake,
  ClipboardList,
  Heart,
  LogOut,
  PawPrint,
} from "lucide-react";
import { api, clearSession } from "./api.js";
import "./AuthStyles.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.get("/auth/me")
      .then((response) => {
        if (!active) return;

        const currentUser = response.data?.data?.user;

        if (!currentUser) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        if (currentUser.role === "ADMINISTRATOR") {
  navigate("/admin", { replace: true });
  return;
}

if (currentUser.role === "VETERINARIAN") {
  navigate("/veterinarian", { replace: true });
  return;
}

        setUser(currentUser);
      })
      .catch(() => {
        clearSession();

        if (active) {
          setError("Your session has expired. Please sign in again.");
          navigate("/login", { replace: true });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear the local session even if the logout request fails.
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  if (loading) {
    return (
      <main className="auth-page">
        <p>Loading your PawLink workspace...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-page">
        <p>{error || "Redirecting to sign in..."}</p>
      </main>
    );
  }

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  const isVolunteer = user.role === "VOLUNTEER";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">
            <PawPrint size={25} />
          </span>
          <span>
            PawLink <b>AI</b>
          </span>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR WORKSPACE</span>
          <h1>Welcome, {fullName || "PawLink member"}!</h1>
          <p>
            Your PawLink workspace is ready. Access the tools available
            for your account and help make a difference for animals.
          </p>
        </div>

        <div className="auth-section-title">Account details</div>
        <p><strong>Organization:</strong> {user.organizationName || "Not available"}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Email:</strong> {user.email}</p>

        {isVolunteer && (
          <div style={{ marginTop: 24 }}>
            <div className="auth-section-title">Volunteer workspace</div>
            <p>
              Review rescue assignments, respond to requests, and keep
              track of your missions.
            </p>

            <button
              className="auth-submit"
              type="button"
              onClick={() => navigate("/volunteer/assignments")}
            >
              <ClipboardList size={18} />
              Open my assignments
              <ArrowRight size={17} />
            </button>
          </div>
        )}
{["ADOPTER", "ADOPTION_COORDINATOR"].includes(user.role) && (
  <div style={{ marginTop: 24 }}>
    <div className="auth-section-title">
      {user.role === "ADOPTER"
        ? "Adoption workspace"
        : "Adoption coordination"}
    </div>

    <p>
      {user.role === "ADOPTER"
        ? "Browse animals, submit adoption applications, and track their progress."
        : "Review applications and manage approved adoptions."}
    </p>

    <button
      className="auth-submit"
      type="button"
      onClick={() => navigate("/adoptions")}
    >
      Open adoption workspace
      <HeartHandshake size={18} />
    </button>
  </div>
)}


{["ADMINISTRATOR", "VOLUNTEER", "VETERINARIAN"].includes(user.role) && (
  <div style={{ marginTop: 24 }}>
    <div className="auth-section-title">Shelter workspace</div>
    <p>Manage shelters, animal admissions, active stays, and checkout.</p>
    <button
      className="auth-submit"
      type="button"
      onClick={() => navigate("/shelters")}
    >
      <Building2 size={18} />
      Open shelter management
      <ArrowRight size={17} />
    </button>
  </div>
)}

{["VETERINARIAN", "ADMINISTRATOR"].includes(user.role) && (
  <div style={{ marginTop: 24 }}>
    <div className="auth-section-title">Medical workspace</div>
    <p>Record treatments and review animal medical history.</p>
    <button
      className="auth-submit"
      type="button"
      onClick={() => navigate("/medical-records")}
    >
      <Stethoscope size={18} />
      Open medical records
      <ArrowRight size={17} />
    </button>
  </div>
)}


        <p className="auth-switch">
          <Heart size={15} style={{ verticalAlign: "middle" }} />{" "}
          Your work can help save lives.
        </p>

        <button
          className="auth-submit"
          type="button"
          onClick={handleLogout}
        >
          Sign out <LogOut size={17} />
        </button>
      </section>
    </main>
  );
}
