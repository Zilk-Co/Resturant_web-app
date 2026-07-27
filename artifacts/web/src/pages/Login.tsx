import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) { setError("Please enter username and password"); return; }
    setLoading(true); setError("");
    try {
      await login(username.trim(), password);
      setLocation("/");
    } catch (err: any) {
      setError(err?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-rembrandt">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson to-crimson-dark flex items-center justify-center mx-auto mb-4 shadow-xl shadow-crimson-glow">
            <span className="text-2xl font-bold text-white font-serif">THB</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-serif">Welcome Back</h1>
          <p className="text-sm text-off-white-dim mt-1">Sign in with your username and password</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-off-white-dim mb-1">Username</label>
            <input
              id="username" name="username" type="text" value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-jet text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all"
              placeholder="Enter your username" autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-off-white-dim mb-1">Password</label>
            <div className="relative">
              <input
                id="password" name="password" type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-jet text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-jet-muted hover:text-jet transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <div className="bg-crimson/10 border border-crimson/30 text-crimson text-sm rounded-xl px-4 py-3">{error}</div>}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-crimson-glow"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-off-white-dim">
            Don't have an account?{" "}
            <Link href="/signup" className="text-gold font-semibold hover:text-gold/80 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="w-full py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-all mt-4 no-underline flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m3 9 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><path d="M9 22v-4h6v4"></path></svg>
          Home Page
        </Link>
        <p className="text-xs text-jet-muted text-center mt-6">By signing in, you agree to our Terms &amp; Privacy Policy</p>
      </div>
    </div>
  );
}
