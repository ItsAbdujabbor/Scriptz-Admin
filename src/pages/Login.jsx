import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { authApi } from "../api/auth";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import "./Login.css";

export default function Login({ navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setSession = useAuthStore((s) => s.setSession);
  const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await authApi.login(email.trim(), password);
      setSession(session);
      toast.success("Welcome back");
      navigate("/");
    } catch (err) {
      setError(err.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <div className="login-brand-logo">S</div>
          <div>
            <div className="login-brand-name">Scriptz</div>
            <div className="login-brand-label">Admin Panel</div>
          </div>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="login-sub">Admin access only. Your activity is logged.</p>

        <div className="login-fields">
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@scriptz.co"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <Button type="submit" size="lg" loading={loading} className="login-submit">
          Sign in
        </Button>
      </form>
    </div>
  );
}
