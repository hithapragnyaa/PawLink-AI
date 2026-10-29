
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Heart, PawPrint } from "lucide-react";
import { api, getErrorMessage, saveSession } from "./api.js";
import "./AuthStyles.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    organizationId: "",
  });
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
    setLoading(true);

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      };

      if (form.organizationId.trim()) {
        payload.organizationId = form.organizationId.trim();
      }

      const response = await api.post("/auth/login", payload);
      const { user, accessToken } = response.data.data;

      saveSession(accessToken, user);

const destination =
  user.role === "ADMINISTRATOR"
    ? "/admin"
    : user.role === "REPORTER"
      ? "/reporter"
      : user.role === "VETERINARIAN"
        ? "/veterinarian"
        : "/dashboard";

navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-back">
        <ArrowLeft size={18} /> Back to home
      </Link>

      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon"><PawPrint size={25} /></span>
          <span>PawLink <b>AI</b></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Good to see you again!</h1>
          <p>Sign in to continue making a difference for animals.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={form.email}
            onChange={updateField}
            required
          />

          <label htmlFor="login-password">Password</label>
          <div className="auth-password">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={updateField}
              minLength={8}
              maxLength={128}
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

          <details className="auth-optional">
            <summary>Signing in with an organization-specific account?</summary>
            <label htmlFor="login-organization">Organization ID (optional)</label>
            <input
              id="login-organization"
              name="organizationId"
              placeholder="Organization UUID"
              value={form.organizationId}
              onChange={updateField}
            />
            <small>Only needed if your email is registered with multiple organizations.</small>
          </details>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing you in..." : "Sign in"}
            {!loading && <Heart size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          New to PawLink AI? <Link to="/register">Create an organization</Link>
        </p>

        <div className="auth-footer">Made with care for every paw.</div>
      </section>
    </main>
  );
}
