import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/customers");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="eyebrow">Dockmaster · Ops Portal</div>
        <h1>Sign in</h1>
        <p style={{ color: "var(--text-soft)", fontSize: 14, marginTop: 4, marginBottom: 24 }}>
          Customers, inventory, and challans — one dock, one login.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="accent" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-hint">
          TEST LOGINS (password: password123)<br />
          admin@example.com · sales@example.com<br />
          warehouse@example.com · accounts@example.com
        </p>
      </div>
    </div>
  );
}
