import { useState, useEffect } from "react";
import "./LoginPage.css";
import logo from "../../components/assets/logo.jpeg"; // place logo.jpeg inside src/assets/
import { loginUser } from "../../services/loginApi";
import { checkLockout, recordFailure, clearAttempts, syncLockout } from "../../utils/loginRateLimiter";

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus]     = useState("idle");   // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [ripples, setRipples]   = useState([]);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  // Format milliseconds to a readable countdown timer
  const formatTimeLeft = (ms) => {
    const totalSecs = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Check lockout on email input changes
  useEffect(() => {
    if (email) {
      const check = checkLockout(email);
      if (check.locked) {
        setLockoutTimeLeft(check.remaining);
        setErrorMsg(`Too many failed attempts. Please wait ${formatTimeLeft(check.remaining)} before trying again.`);
        setStatus("error");
      } else {
        setLockoutTimeLeft(0);
        setErrorMsg("");
        setStatus("idle");
      }
    } else {
      setLockoutTimeLeft(0);
      setErrorMsg("");
      setStatus("idle");
    }
  }, [email]);

  // Real-time decrement of the countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setErrorMsg("");
          setStatus("idle");
          return 0;
        }
        const updated = prev - 1000;
        setErrorMsg(`Too many failed attempts. Please wait ${formatTimeLeft(updated)} before trying again.`);
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if currently locked out
    const lockout = checkLockout(email);
    if (lockout.locked) {
      setLockoutTimeLeft(lockout.remaining);
      setStatus("error");
      setErrorMsg(`Too many failed attempts. Please wait ${formatTimeLeft(lockout.remaining)} before trying again.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setStatus("error");
      setErrorMsg("Please enter both email and password.");
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const result = await loginUser(email, password);

      setStatus("success");
      clearAttempts(email); // Clear attempts on success

      if (typeof onLogin === "function") {
        onLogin(result.user, result.token);
      }
    } catch (error) {
      setStatus("error");
      const response = error.response;

      if (response && response.status === 429) {
        // Enforce lockout synchronized from the backend
        const backendMessage = response.data?.message || "";
        setErrorMsg(backendMessage);

        let durationMs = 10 * 60 * 1000; // 10 mins default
        if (backendMessage.includes("hour")) {
          durationMs = 60 * 60 * 1000;
          if (backendMessage.includes("8 hours")) durationMs = 8 * 60 * 60 * 1000;
          if (backendMessage.includes("24 hours") || backendMessage.includes("1 day")) durationMs = 24 * 60 * 60 * 1000;
        } else if (backendMessage.includes("minute")) {
          const match = backendMessage.match(/(\d+)\s*minute/);
          if (match) {
            durationMs = parseInt(match[1], 10) * 60 * 1000;
          }
        }

        syncLockout(email, durationMs);
        setLockoutTimeLeft(durationMs);
      } else {
        // Record regular failure count
        recordFailure(email);
        
        // Inspect if this new failure triggers a local lockout threshold
        const postCheck = checkLockout(email);
        if (postCheck.locked) {
          setLockoutTimeLeft(postCheck.remaining);
          setErrorMsg(response?.data?.message || `Invalid credentials. Locked out for ${formatTimeLeft(postCheck.remaining)}.`);
        } else {
          setErrorMsg(response?.data?.message || "Invalid credentials.");
          setTimeout(() => setStatus("idle"), 2800);
        }
      }
    }
  };

  const addRipple = (e) => {
    const btn = e.currentTarget.getBoundingClientRect();
    const id  = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - btn.left, y: e.clientY - btn.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
  };

  const btnLabel = {
    idle:    "Login →",
    loading: "Verifying…",
    success: "✓ Welcome Back!",
    error:   "Try Again",
  }[status];

  return (
    <div className="gs-page">
      {/* LEFT PANEL */}
      <div className="gs-left">
        <div className="gs-left__bg-letter">G</div>
        <div className="gs-brand">
          <img className="gs-brand__logo" src={logo} alt="Gupta Sandwich Logo" />
          <h1 className="gs-brand__name">
            Gupta<span>Sandwich</span>
          </h1>
          <p className="gs-brand__tagline">Fresh · Tasty · Always</p>
          <div className="gs-brand__badge">🥪 Order. Enjoy. Repeat.</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="gs-right">
        <div className="gs-right__dots" aria-hidden="true" />

        <div className="gs-card">
          <span className="gs-card__pill">🥗 Staff Portal</span>
          <h2 className="gs-card__title">Welcome Back!</h2>
          <p className="gs-card__sub">Sign in to access the POS dashboard</p>

          <form className="gs-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="gs-field">
              <label className="gs-label" htmlFor="gs-email">Email Address</label>
              <div className="gs-input-wrap">
                <svg className="gs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <input
                  id="gs-email"
                  type="email"
                  className={`gs-input${status === 'error' ? ' gs-input--error' : ''}`}
                  placeholder="you@guptasandwich.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setErrorMsg(""); }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="gs-field">
              <label className="gs-label" htmlFor="gs-password">Password</label>
              <div className="gs-input-wrap">
                <svg className="gs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 11V7a4 4 0 10-8 0v4M5 11h14l1 9H4l1-9z"/>
                </svg>
                <input
                  id="gs-password"
                  type={showPass ? "text" : "password"}
                  className={`gs-input${status === 'error' ? ' gs-input--error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setStatus("idle"); setErrorMsg(""); }}
                />
                <button
                  type="button"
                  className="gs-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.96 9.96 0 014.9 1.275M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <line x1="3" y1="3" x2="21" y2="21"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="gs-error-msg" role="alert">
                ⚠ {errorMsg}
              </div>
            )}

            {/* Remember + Forgot */}
            <div className="gs-row">
              <label className="gs-check-label">
                <input
                  type="checkbox"
                  className="gs-check"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a className="gs-forgot" href="#">Forgot Password?</a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`gs-btn gs-btn--${status}`}
              disabled={status === "loading" || status === "success" || lockoutTimeLeft > 0}
              onMouseDown={addRipple}
            >
              {ripples.map((r) => (
                <span key={r.id} className="gs-ripple" style={{ left: r.x, top: r.y }} />
              ))}
              {lockoutTimeLeft > 0 ? `Locked (${formatTimeLeft(lockoutTimeLeft)})` : btnLabel}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="gs-divider"><span>demo credentials</span></div>
          <div className="gs-demo-box">
            <div className="gs-demo-row">
              <span className="gs-demo-role">Admin</span>
              <code>SuperAdmin@guptasandwich.com</code>
              <code>SuperAdmin@123</code>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}