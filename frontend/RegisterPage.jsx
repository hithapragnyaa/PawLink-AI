
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Heart, PawPrint } from "lucide-react";
import { api, getErrorMessage, saveSession } from "./api.js";
import "./AuthStyles.css";

const initialForm = {
  organizationName: "",
  organizationEmail: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8 || form.password.length > 128) {
      setError("Password must contain between 8 and 128 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        organizationName: form.organizationName.trim(),
        organizationEmail: form.organizationEmail.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });

      const { user, accessToken } = response.data.data;
      saveSession(accessToken, user);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page-register">
      <Link to="/" className="auth-back">
        <ArrowLeft size={18} /> Back to home
      </Link>

      <section className="auth-card auth-card-register">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon"><PawPrint size={25} /></span>
          <span>PawLink <b>AI</b></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">LET'S MAKE A DIFFERENCE</span>
          <h1>Start your PawLink journey</h1>
          <p>Register your animal welfare organization and create its administrator account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-section-title">Organization details</h2>

          <label htmlFor="organization-name">Organization name *</label>
          <input
            id="organization-name"
            name="organizationName"
            value={form.organizationName}
            onChange={updateField}
            placeholder="e.g. Happy Paws Rescue"
            maxLength={100}
            required
          />

          <div className="auth-field-grid">
            <div>
              <label htmlFor="organization-email">Organization email</label>
              <input
                id="organization-email"
                name="organizationEmail"
                type="email"
                value={form.organizationEmail}
                onChange={updateField}
                placeholder="contact@example.org"
              />
            </div>
            <div>
              <label htmlFor="organization-phone">Phone</label>
              <input
                id="organization-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={updateField}
                placeholder="Contact number"
              />
            </div>
          </div>

          <h2 className="auth-section-title">Administrator details</h2>

          <div className="auth-field-grid">
            <div>
              <label htmlFor="first-name">First name *</label>
              <input
                id="first-name"
                name="firstName"
                value={form.firstName}
                onChange={updateField}
                placeholder="First name"
                maxLength={100}
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <label htmlFor="last-name">Last name *</label>
              <input
                id="last-name"
                name="lastName"
                value={form.lastName}
                onChange={updateField}
                placeholder="Last name"
                maxLength={100}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <label htmlFor="register-email">Login email *</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Password *</label>
          <div className="auth-password">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={updateField}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="auth-eye"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          <label htmlFor="confirm-password">Confirm password *</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={updateField}
            placeholder="Enter the same password again"
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            required
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating your organization..." : "Create organization"}
            {!loading && <Heart size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="auth-footer">One team. More lives saved.</div>
      </section>
    </main>
  );
}
