import { useState } from "react";
import { API, Spinner, ZenPrepLogo, THEME } from "../shared";

function LoginPage({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", branch: "", year: "1" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [pwStrength, setPwStrength] = useState(0);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === "password" && mode === "register") {
      let s = 0;
      if (v.length >= 6) s++;
      if (v.length >= 8) s++;
      if (/[A-Z]/.test(v)) s++;
      if (/[0-9]/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      setPwStrength(s);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setInfoMsg(""); setSuccessMsg(""); setLoading(true);
    
    // Frontend validation to prevent unnecessary API calls
    if (new TextEncoder().encode(form.password).length > 128) {
      setError("Password too long (maximum 128 characters)");
      setLoading(false);
      return;
    }
    
    try {
      if (mode === "login") {
        const r = await fetch(`${API}/auth/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const d = await r.json();
        if (!r.ok) { setError(d.detail || "Login failed"); setLoading(false); return; }
        localStorage.setItem("token", d.access_token);
        localStorage.setItem("user", JSON.stringify(d.user));
        onLogin(d.access_token, d.user);
      } else {
        const r = await fetch(`${API}/auth/register`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, branch: form.branch, year: parseInt(form.year) }),
        });
        const d = await r.json();
        if (!r.ok) { setError(d.detail || "Registration failed"); setLoading(false); return; }
        setSuccessMsg("Account created successfully! Redirecting to login...");
        setTimeout(() => { setMode("login"); setSuccessMsg(""); setError(""); setForm(f => ({ ...f, password: "" })); }, 1500);
      }
    } catch { setError("Server error. Check that backend is running."); }
    setLoading(false);
  }

  const inputStyle = (field) => ({
    width: "100%", background: "#0F1629", border: `1.5px solid ${focusedField === field ? THEME.indigo : "rgba(255,255,255,0.08)"}`,
    borderRadius: 10, padding: "12px 14px 12px 40px", color: "#F1F5F9", fontSize: 14,
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: focusedField === field ? `0 0 0 3px ${THEME.indigoTint}, 0 0 16px rgba(99,102,241,0.2)` : "none",
  });

  const features = [
    { icon: "🎙", title: "Voice Analysis", desc: "9-dimension speech scoring", color: "#C9A84C" },
    { icon: "👁", title: "Vision Tracking", desc: "Real-time face analysis", color: "#22C55E" },
    { icon: "🧠", title: "NLP Scoring", desc: "AI-powered answer evaluation", color: "#F59E0B" },
    { icon: "💻", title: "Code Editor", desc: "Monaco-powered sandbox", color: "#3B82F6" },
  ];

  const pwColors = ["#EF4444", "#F59E0B", "#EAB308", "#22C55E", "#10B981"];
  const pwLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1E", display: "grid", gridTemplateColumns: "1.1fr 1fr", fontFamily: "Inter", overflow: "hidden" }}>
      {/* Left panel — Showcase */}
      <div style={{ background: "linear-gradient(160deg, #0F1629 0%, #131B36 50%, #0F1629 100%)", padding: "40px 48px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {/* Animated background orbs */}
        <div style={{ position: "absolute", top: "15%", left: "10%", width: 280, height: 280, background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", borderRadius: "50%", animation: "orbFloat1 12s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 220, height: 220, background: "radial-gradient(circle, rgba(226,201,126,0.1) 0%, transparent 70%)", borderRadius: "50%", animation: "orbFloat2 15s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "60%", left: "50%", width: 160, height: 160, background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", borderRadius: "50%", animation: "orbFloat1 18s ease-in-out infinite", pointerEvents: "none" }} />

        {/* Grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

        {/* Floating particles */}
        {[15, 35, 55, 75, 25, 65, 85, 45].map((l, i) => (
          <div key={i} style={{ position: "absolute", width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2, background: i % 3 === 0 ? "#C9A84C" : "#E2C97E", borderRadius: "50%", left: `${l}%`, top: `${(i * 15 + 8) % 85}%`, opacity: 0, animation: `floatUp ${6 + i * 0.8}s ease-in ${i * 0.6}s infinite`, pointerEvents: "none" }} />
        ))}

        {/* Logo */}
        <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48, position: "relative", zIndex: 1, animation: "fadeIn 0.6s ease both", cursor: "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          <ZenPrepLogo size={36} />
          <span style={{ fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>ZenPrep</span>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          {/* Tagline */}
          <div style={{ marginBottom: 32, animation: "slideUp 0.7s ease both 0.2s" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 10 }}>
              Focus Flows
              <span style={{ display: "block", background: "linear-gradient(90deg, #C9A84C, #E2C97E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Here.</span>
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>
              AI-powered interview prep with voice, vision, and NLP — precision feedback in real time.
            </p>
          </div>

          {/* Demo card */}
          <div style={{ background: "rgba(15,22,41,0.8)", backdropFilter: "blur(12px)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,168,76,0.15)", marginBottom: 28, animation: "scaleIn 0.6s ease both 0.4s", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(201,168,76,0.04)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.5)", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 500 }}>Live Interview Session</span>
              <span style={{ marginLeft: "auto", color: "#64748B", fontSize: 11 }}>00:42 / 05:00</span>
            </div>

            {/* AI Avatar area */}
            <div style={{ height: 140, background: "linear-gradient(160deg, rgba(201,168,76,0.05), rgba(226,201,126,0.03))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(201,168,76,0.25), rgba(226,201,126,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: "2px solid rgba(201,168,76,0.3)" }}>🤖</div>
                <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1.5px solid rgba(201,168,76,0.2)", animation: "ringPulse 3s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.1)", animation: "ringPulse 3s ease-in-out 0.5s infinite" }} />
              </div>
              {/* Floating badge */}
              <div style={{ position: "absolute", top: 12, right: 16, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 10, color: "#E2C97E", fontWeight: 600, animation: "float 4s ease-in-out infinite" }}>
                AI-Powered
              </div>
            </div>

            {/* Question */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>CURRENT QUESTION</div>
              <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 13 }}>Explain the Quicksort algorithm and its time complexity.</div>
            </div>

            {/* Score bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "rgba(255,255,255,0.03)" }}>
              {[{ label: "Voice", val: 82, color: "#C9A84C", icon: "🎙" }, { label: "Vision", val: 75, color: "#22C55E", icon: "👁" }, { label: "NLP", val: 90, color: "#F59E0B", icon: "🧠" }].map((s, i) => (
                <div key={s.label} style={{ background: "rgba(15,22,41,0.6)", padding: "10px 12px", animation: `fadeIn 0.5s ease both ${0.6 + i * 0.15}s` }}>
                  <div style={{ color: "#64748B", fontSize: 10, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10 }}>{s.icon}</span> {s.label}
                  </div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{s.val}<span style={{ fontSize: 11, color: "#64748B", fontWeight: 400 }}>%</span></div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.val}%`, background: s.color, borderRadius: 2, transition: "width 1.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature chips */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, animation: "slideUp 0.7s ease both 0.6s" }}>
            {features.map((f, i) => (
              <div key={f.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(15,22,41,0.5)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, animation: `fadeIn 0.4s ease both ${0.7 + i * 0.1}s` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ color: "#F1F5F9", fontSize: 12, fontWeight: 600 }}>{f.title}</div>
                  <div style={{ color: "#64748B", fontSize: 10 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 1, animation: "fadeIn 0.6s ease both 0.8s" }}>
          {[{ n: "482+", l: "Questions" }, { n: "9", l: "Voice Dims" }, { n: "8", l: "Comm Sections" }].map(s => (
            <div key={s.l} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 16 }}>{s.n}</span>
              <span style={{ color: "#64748B", fontSize: 11 }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — Form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", position: "relative", overflow: "hidden" }}>
        {/* Subtle gradient */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 3, background: "linear-gradient(90deg, transparent, #C9A84C, #E2C97E, transparent)" }} />

        <div style={{ width: "100%", maxWidth: 420, animation: "fadeInUp 0.6s ease both" }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", background: "rgba(15,22,41,0.6)", borderRadius: 12, padding: 4, marginBottom: 32, border: "1px solid rgba(255,255,255,0.06)" }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccessMsg(""); }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 9, fontSize: 14, fontWeight: 600, transition: "all 0.3s ease",
                  background: mode === m ? `linear-gradient(135deg, ${THEME.indigo}, #818CF8)` : "transparent", color: mode === m ? "#fff" : "#64748B",
                  boxShadow: mode === m ? `0 4px 16px rgba(99,102,241,0.35)` : "none",
                }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>
              {mode === "login" ? "Welcome back" : "Get started free"}
            </h1>
            <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.5 }}>
              {mode === "login" ? "Enter your credentials to access your dashboard" : "Create your account and start practicing today"}
            </p>
          </div>

          {/* Success message */}
          {successMsg && (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "12px 16px", color: "#4ADE80", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, animation: "scaleIn 0.3s ease both" }}>
              <span style={{ fontSize: 18 }}>✓</span> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {mode === "register" && (
              <div style={{ animation: "fadeIn 0.3s ease both" }}>
                <label style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6, display: "block", fontWeight: 500 }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#4B5563", fontSize: 14 }}>👤</span>
                  <input value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Your full name"
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField("")}
                    style={inputStyle("name")} />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6, display: "block", fontWeight: 500 }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#4B5563", fontSize: 14 }}>✉</span>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required placeholder="name@company.com"
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField("")}
                  style={inputStyle("email")} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Password</label>
                {mode === "login" && (
                  <span style={{ fontSize: 11, color: "#C9A84C", cursor: "pointer", fontWeight: 500 }}
                    onClick={() => setInfoMsg("Password reset is not available in local mode. Contact your admin.")}>
                    Forgot password?
                  </span>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#4B5563", fontSize: 14 }}>🔒</span>
                <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} required placeholder="••••••••"
                  onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField("")}
                  style={{ ...inputStyle("password"), paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", color: "#4B5563", fontSize: 14, padding: 2 }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              {/* Password strength indicator */}
              {mode === "register" && form.password.length > 0 && (
                <div style={{ marginTop: 8, animation: "fadeIn 0.3s ease both" }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < pwStrength ? pwColors[pwStrength - 1] : "rgba(255,255,255,0.06)", transition: "background 0.3s ease" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: pwStrength > 0 ? pwColors[pwStrength - 1] : "#64748B" }}>
                    {pwStrength > 0 ? pwLabels[pwStrength - 1] : "Too short"}
                  </span>
                </div>
              )}
            </div>

            {mode === "register" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animation: "fadeIn 0.3s ease both" }}>
                <div>
                  <label style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6, display: "block", fontWeight: 500 }}>Branch</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#4B5563", fontSize: 14 }}>🎓</span>
                    <input value={form.branch} onChange={e => set("branch", e.target.value)} placeholder="CSE" required
                      onFocus={() => setFocusedField("branch")} onBlur={() => setFocusedField("")}
                      style={inputStyle("branch")} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6, display: "block", fontWeight: 500 }}>Year</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#4B5563", fontSize: 14 }}>📅</span>
                    <select value={form.year} onChange={e => set("year", e.target.value)}
                      onFocus={() => setFocusedField("year")} onBlur={() => setFocusedField("")}
                      style={{ ...inputStyle("year"), appearance: "none", cursor: "pointer" }}>
                      {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13, display: "flex", alignItems: "center", gap: 8, animation: "scaleIn 0.3s ease both" }}>
                <span style={{ fontSize: 16 }}>⚠</span> {error}
              </div>
            )}
            {infoMsg && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", color: "#FDE68A", fontSize: 13, display: "flex", alignItems: "center", gap: 8, animation: "scaleIn 0.3s ease both" }}>
                <span style={{ fontSize: 16 }}>ℹ</span> {infoMsg}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                background: loading ? `rgba(99,102,241,0.5)` : `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 600,
                fontSize: 15, padding: "13px", borderRadius: 10, marginTop: 4, position: "relative", overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: `0 4px 20px rgba(99,102,241,0.35)`,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(99,102,241,0.55)`; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px rgba(99,102,241,0.35)`; }}>
              {loading ? <Spinner /> : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {mode === "login" && (
            <div style={{ animation: "fadeIn 0.4s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                <span style={{ color: "#4B5563", fontSize: 11, fontWeight: 500, letterSpacing: "0.05em" }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>
              <button onClick={() => setInfoMsg("Google login is not available in local mode. Use email + password.")}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9", fontWeight: 500, fontSize: 14, padding: "12px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s ease" }}
                onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.4 0-9.9-3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.2-2.7-.4-3.9z"/></svg>
                Continue with Google
              </button>
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#64748B" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span style={{ color: "#C9A84C", cursor: "pointer", fontWeight: 600, transition: "color 0.2s" }}
              onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); setSuccessMsg(""); }}
              onMouseEnter={e => e.target.style.color = "#E2C97E"} onMouseLeave={e => e.target.style.color = "#C9A84C"}>
              {mode === "login" ? "Create Account" : "Sign In"}
            </span>
          </p>

          {/* Security badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 28, color: "#374151", fontSize: 11 }}>
            <span>🔒</span> SSL secured · Your data is encrypted and safe
          </div>
        </div>
      </div>
    </div>
  );
}


export default LoginPage;
