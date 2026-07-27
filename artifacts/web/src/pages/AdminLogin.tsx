import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_token", data.accessToken);
        setLocation("/admin/dashboard");
      } else {
        setError("Invalid username or password");
      }
    } catch {
      setError("Network error. Is the API server running?");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-destructive flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-foreground mb-1">Username</label>
            <input
              id="admin-username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter admin username"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-foreground mb-1">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                name="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button type="submit" disabled={!username || !password || loading} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">Authorized personnel only</p>
      </div>
    </div>
  );
}
