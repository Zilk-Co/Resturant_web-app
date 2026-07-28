import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { ArrowLeft, UserPlus, ShieldCheck, Eye, EyeOff } from "lucide-react";

type Step = "form" | "otp";

export default function Signup() {
  const { signUp, verifySignup } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function fullPhone() {
    return `+92${phone.replace(/^0/, "")}`;
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) { setError("Please enter a valid phone number"); return; }
    if (!username.trim() || username.trim().length < 3) { setError("Username must be at least 3 characters"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(""); setSuccess("");

    try {
      const result = await signUp(fullPhone(), username.trim(), password, name.trim() || undefined);

      if (result?.devOtp) {
        setSuccess(`Dev mode — verification code: ${result.devOtp}`);
      } else {
        setSuccess("Verification code sent. Check server logs for the code.");
      }
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) { setError("Please enter the 6-digit code"); return; }
    setLoading(true); setError("");

    try {
      await verifySignup(fullPhone(), otpCode.trim());
      setLocation("/");
    } catch (err: any) {
      setError(err?.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setStep("form");
    setOtpCode("");
    setError("");
    setSuccess("");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-rembrandt">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson to-crimson-dark flex items-center justify-center mx-auto mb-4 shadow-xl shadow-crimson-glow">
            <span className="text-2xl font-bold text-white font-serif">THB</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-serif">
            {step === "form" ? "Create Account" : "Verify Phone"}
          </h1>
          <p className="text-sm text-off-white-dim mt-1">
            {step === "form" ? "Sign up to start ordering" : `Code sent to ${fullPhone()}`}
          </p>
        </div>

        {step === "otp" && (
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-off-white-dim hover:text-gold transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to form
          </button>
        )}

        {step === "form" ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-off-white-dim mb-1">Full Name (optional)</label>
              <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-jet text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all"
                placeholder="e.g. Muhammad Ali" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-off-white-dim mb-1">Phone Number</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-off-white-dim bg-slate px-3 py-3 rounded-xl border border-white/10">+92</span>
                <input id="phone" name="phone" type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-jet text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all"
                  placeholder="3XX-XXXXXXX" autoFocus />
              </div>
            </div>
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-off-white-dim mb-1">Username</label>
              <input id="username" name="username" type="text" value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-jet text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all"
                placeholder="e.g. muhammad_ali" />
              <p className="text-[10px] text-jet-muted mt-1">Letters, numbers, and underscores only</p>
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-off-white-dim mb-1">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-jet text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all pr-10"
                  placeholder="At least 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-jet-muted hover:text-jet transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <div className="bg-crimson/10 border border-crimson/30 text-crimson text-sm rounded-xl px-4 py-3">{error}</div>}
            {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3">{success}</div>}
            <button type="submit"
              disabled={loading || phone.trim().length < 10 || username.trim().length < 3 || password.length < 6}
              className="w-full py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-crimson-glow">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Send Verification Code</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-xs font-medium text-off-white-dim mb-1">6-Digit Code</label>
              <input id="otp" name="otp" type="text" inputMode="numeric" value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-jet text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all"
                placeholder="000000" autoFocus maxLength={6} />
            </div>
            {error && <div className="bg-crimson/10 border border-crimson/30 text-crimson text-sm rounded-xl px-4 py-3">{error}</div>}
            {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3">{success}</div>}
            <button type="submit" disabled={loading || otpCode.trim().length !== 6}
              className="w-full py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-crimson-glow">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><ShieldCheck className="w-4 h-4" /> Verify & Create Account</>}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-off-white-dim">
            Already have an account?{" "}
            <Link href="/login" className="text-gold font-semibold hover:text-gold/80 transition-colors">Sign In</Link>
          </p>
        </div>

        <Link href="/"
          className="w-full py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-all mt-4 no-underline flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m3 9 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><path d="M9 22v-4h6v4"></path></svg>
          Home Page
        </Link>
        <p className="text-xs text-jet-muted text-center mt-6">By signing up, you agree to our Terms &amp; Privacy Policy</p>
      </div>
    </div>
  );
}
