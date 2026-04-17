import { useEffect, useRef, useState } from "react";
import { API, Spinner, ZenPrepLogo, THEME } from "../shared";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function LoginPage({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", branch: "", year: "1", code: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const googleButtonRef = useRef(null);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: k === "code" ? v.replace(/\D/g, "").slice(0, 6) : v }));
    setError("");
  };

  const readError = async (resp, fallback) => {
    try {
      const data = await resp.json();
      return data?.detail || data?.error?.message || data?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const finishLogin = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    onLogin(data.access_token, data.user);
  };

  async function post(path, body) {
    const resp = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(await readError(resp, "Request failed"));
    return resp.json();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (mode === "login") {
        const data = await post("/auth/login", { email: form.email, password: form.password });
        finishLogin(data);
      }
      if (mode === "register") {
        await post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          branch: form.branch,
          year: parseInt(form.year),
        });
        setMode("verify");
        setSuccessMsg("We sent a 6-digit verification code to your email.");
      }
      if (mode === "verify") {
        const data = await post("/auth/verify-email", { email: form.email, code: form.code });
        finishLogin(data);
      }
      if (mode === "forgot") {
        await post("/auth/forgot-password", { email: form.email });
        setMode("reset");
        setSuccessMsg("If this email exists, a reset code has been sent.");
      }
      if (mode === "reset") {
        await post("/auth/reset-password", { email: form.email, code: form.code, new_password: form.newPassword });
        setMode("login");
        setForm(f => ({ ...f, password: "", code: "", newPassword: "" }));
        setSuccessMsg("Password updated. Sign in with your new password.");
      }
    } catch (err) {
      setError(err.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await post("/auth/resend-verification", { email: form.email });
      setSuccessMsg("A fresh verification code has been sent.");
    } catch (err) {
      setError(err.message || "Could not resend code.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode !== "login" || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setLoading(true);
          setError("");
          setSuccessMsg("");
          try {
            const data = await post("/auth/google", { credential });
            finishLogin(data);
          } catch (err) {
            setError(err.message || "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "filled_black",
        size: "large",
        width: "360",
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);
  }, [mode]);

  const titleMap = {
    login: "Welcome back",
    register: "Create your account",
    verify: "Verify your email",
    forgot: "Reset your password",
    reset: "Choose a new password",
  };
  const subtitleMap = {
    login: "Sign in to continue your interview prep.",
    register: "Use an email you can verify.",
    verify: "Enter the 6-digit code from your inbox.",
    forgot: "We will send a 6-digit reset code.",
    reset: "Use the reset code and set a new password.",
  };
  const submitMap = {
    login: "Sign In",
    register: "Create Account",
    verify: "Verify and Continue",
    forgot: "Send Reset Code",
    reset: "Update Password",
  };

  const needsEmail = ["login", "register", "verify", "forgot", "reset"].includes(mode);
  const needsPassword = ["login", "register"].includes(mode);
  const needsCode = ["verify", "reset"].includes(mode);

  const inputStyle = {
    width: "100%",
    background: "#0F1629",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "12px 14px",
    color: "#F1F5F9",
    fontSize: 14,
  };
  const labelStyle = { fontSize: 12, color: "#94A3B8", marginBottom: 6, display: "block", fontWeight: 600 };
  const secondaryButton = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#CBD5E1",
    fontWeight: 600,
    padding: "11px 14px",
    borderRadius: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1E", display: "grid", gridTemplateColumns: "minmax(320px, 0.9fr) minmax(380px, 1fr)", fontFamily: "Inter" }}>
      <div style={{ padding: "42px 48px", background: "linear-gradient(160deg, #0F1629 0%, #131B36 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <ZenPrepLogo size={38} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 19 }}>ZenPrep</span>
        </div>
        <div>
          <p style={{ color: THEME.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Secure access</p>
          <h1 style={{ color: "#fff", fontSize: 38, lineHeight: 1.15, marginBottom: 16 }}>Practice starts after the right person is in.</h1>
          <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.7, maxWidth: 440 }}>
            Email accounts are verified with a 6-digit code. Google accounts are accepted only after Google confirms the email is verified.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["Email verification", "Google sign-in", "Password reset", "JWT sessions"].map(item => (
            <div key={item} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "13px 14px", color: "#CBD5E1", fontSize: 13, fontWeight: 600 }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 36 }}>
        <div style={{ width: "100%", maxWidth: 430 }}>
          <div style={{ display: "flex", background: "rgba(15,22,41,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(tab => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(""); setSuccessMsg(""); }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 6,
                  background: mode === tab ? THEME.indigo : "transparent",
                  color: mode === tab ? "#fff" : "#94A3B8",
                  fontWeight: 700,
                }}
              >
                {tab === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h2 style={{ color: "#fff", fontSize: 28, marginBottom: 6 }}>{titleMap[mode]}</h2>
          <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 24 }}>{subtitleMap[mode]}</p>

          {successMsg && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, padding: 12, color: "#86EFAC", fontSize: 13, marginBottom: 14 }}>{successMsg}</div>}
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: 12, color: "#FCA5A5", fontSize: 13, marginBottom: 14 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Your full name" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Branch</label>
                    <input value={form.branch} onChange={e => set("branch", e.target.value)} required placeholder="CSE" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <select value={form.year} onChange={e => set("year", e.target.value)} style={inputStyle}>
                      {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {needsEmail && (
              <div>
                <label style={labelStyle}>Email Address</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required placeholder="name@example.com" disabled={mode === "verify"} style={{ ...inputStyle, opacity: mode === "verify" ? 0.65 : 1 }} />
              </div>
            )}

            {needsPassword && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  {mode === "login" && <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }} style={{ background: "none", color: THEME.gold, fontSize: 12, fontWeight: 700 }}>Forgot password?</button>}
                </div>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} required minLength={6} placeholder="Minimum 6 characters" style={{ ...inputStyle, paddingRight: 72 }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", color: "#94A3B8", fontSize: 12, fontWeight: 700 }}>{showPw ? "Hide" : "Show"}</button>
                </div>
              </div>
            )}

            {needsCode && (
              <div>
                <label style={labelStyle}>6-Digit Code</label>
                <input inputMode="numeric" value={form.code} onChange={e => set("code", e.target.value)} required minLength={6} maxLength={6} placeholder="123456" style={{ ...inputStyle, letterSpacing: 8, textAlign: "center", fontSize: 18 }} />
              </div>
            )}

            {mode === "reset" && (
              <div>
                <label style={labelStyle}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showNewPw ? "text" : "password"} value={form.newPassword} onChange={e => set("newPassword", e.target.value)} required minLength={6} placeholder="Minimum 6 characters" style={{ ...inputStyle, paddingRight: 72 }} />
                  <button type="button" onClick={() => setShowNewPw(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", color: "#94A3B8", fontSize: 12, fontWeight: 700 }}>{showNewPw ? "Hide" : "Show"}</button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: loading ? "rgba(99,102,241,0.55)" : THEME.indigo, color: "#fff", fontWeight: 800, fontSize: 15, padding: "13px", borderRadius: 8, marginTop: 4 }}>
              {loading ? <Spinner /> : submitMap[mode]}
            </button>
          </form>

          {mode === "verify" && (
            <button onClick={resendCode} disabled={loading} style={{ ...secondaryButton, width: "100%", marginTop: 12 }}>
              Resend Code
            </button>
          )}

          {mode === "reset" && (
            <button onClick={() => setMode("forgot")} style={{ ...secondaryButton, width: "100%", marginTop: 12 }}>
              Send a New Code
            </button>
          )}

          {mode === "login" && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ color: "#64748B", fontSize: 11, fontWeight: 700 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>
              {GOOGLE_CLIENT_ID ? (
                <div ref={googleButtonRef} style={{ minHeight: 44, display: "flex", justifyContent: "center" }} />
              ) : (
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, color: "#94A3B8", fontSize: 13, textAlign: "center" }}>
                  Add VITE_GOOGLE_CLIENT_ID to enable Google sign-in.
                </div>
              )}
            </div>
          )}

          {mode !== "login" && mode !== "register" && (
            <button type="button" onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }} style={{ background: "none", color: THEME.gold, fontSize: 13, fontWeight: 700, marginTop: 20, width: "100%" }}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
