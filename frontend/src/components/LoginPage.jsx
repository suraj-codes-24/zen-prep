import { useEffect, useRef, useState } from "react";
import { API, Spinner, ZenPrepLogo, THEME, useWindowSize } from "../shared";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const MODE_CONFIG = {
  login: {
    eyebrow: "Secure access",
    heroTitle: "Walk back into prep",
    heroHighlight: "with momentum",
    accent: "#C9A84C",
    accentSoft: "rgba(201,168,76,0.2)",
    glow: "rgba(201,168,76,0.22)",
    panelLabel: "Interview arena",
  },
  register: {
    eyebrow: "Start your trial run",
    heroTitle: "Build your demo-ready",
    heroHighlight: "practice identity",
    accent: "#818CF8",
    accentSoft: "rgba(129,140,248,0.18)",
    glow: "rgba(99,102,241,0.24)",
    panelLabel: "Signup flow",
  },
  verify: {
    eyebrow: "Inbox checkpoint",
    heroTitle: "Verify once and enter",
    heroHighlight: "the full platform",
    accent: "#22C55E",
    accentSoft: "rgba(34,197,94,0.18)",
    glow: "rgba(34,197,94,0.22)",
    panelLabel: "Email verification",
  },
  forgot: {
    eyebrow: "Recovery mode",
    heroTitle: "Recover access",
    heroHighlight: "without friction",
    accent: "#F59E0B",
    accentSoft: "rgba(245,158,11,0.18)",
    glow: "rgba(245,158,11,0.22)",
    panelLabel: "Password reset",
  },
  reset: {
    eyebrow: "Final step",
    heroTitle: "Set a fresh password",
    heroHighlight: "and keep moving",
    accent: "#38BDF8",
    accentSoft: "rgba(56,189,248,0.18)",
    glow: "rgba(56,189,248,0.22)",
    panelLabel: "New credentials",
  },
};

const FEATURE_CARDS = [
  { code: "VA", title: "Voice Analysis", desc: "9-dimension speaking feedback", color: "#C9A84C" },
  { code: "CV", title: "Vision Tracking", desc: "Eye contact and posture signals", color: "#22C55E" },
  { code: "NLP", title: "Answer Scoring", desc: "Semantic depth and structure review", color: "#F59E0B" },
  { code: "DSA", title: "Coding Practice", desc: "Live editor for interview-style tasks", color: "#3B82F6" },
];

const MODE_STEPS = [
  { key: "register", label: "Profile", desc: "Basic account setup" },
  { key: "verify", label: "Verify", desc: "Enter your email code" },
  { key: "login", label: "Launch", desc: "Start practicing" },
];

function LoginPage({ onLogin, onBack }) {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const [mode, setMode] = useState("login");
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    branch: "",
    year: "1",
    code: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const googleButtonRef = useRef(null);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccessMsg("");
  };

  const set = (k, v) => {
    setForm((f) => ({
      ...f,
      [k]: k === "code" ? v.replace(/\D/g, "").slice(0, 6) : v,
    }));
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
        const data = await post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        finishLogin(data);
      }
      if (mode === "register") {
        await post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          branch: form.branch,
          year: parseInt(form.year, 10),
        });
        setMode("verify");
        setSuccessMsg("We sent a 6-digit verification code to your email.");
      }
      if (mode === "verify") {
        const data = await post("/auth/verify-email", {
          email: form.email,
          code: form.code,
        });
        finishLogin(data);
      }
      if (mode === "forgot") {
        await post("/auth/forgot-password", { email: form.email });
        setMode("reset");
        setSuccessMsg("If this email exists, a reset code has been sent.");
      }
      if (mode === "reset") {
        await post("/auth/reset-password", {
          email: form.email,
          code: form.code,
          new_password: form.newPassword,
        });
        setMode("login");
        setForm((f) => ({ ...f, password: "", code: "", newPassword: "" }));
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
    setMounted(true);
  }, []);

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
        width: isMobile ? "320" : "360",
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
  }, [mode, isMobile]);

  const titleMap = {
    login: "Welcome back",
    register: "Create your account",
    verify: "Verify your email",
    forgot: "Reset your password",
    reset: "Choose a new password",
  };
  const subtitleMap = {
    login: "Sign in to continue your interview prep.",
    register: "Use an email you can verify and start the platform with the same energy as the landing page.",
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
  const isSignupFlow = ["register", "verify"].includes(mode);
  const modeTheme = MODE_CONFIG[mode];

  const inputStyle = {
    width: "100%",
    background: "rgba(9,14,29,0.88)",
    border: `1px solid ${modeTheme.accentSoft}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
    borderRadius: 14,
    padding: "13px 14px",
    color: "#F1F5F9",
    fontSize: 14,
    transition: "border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
  };
  const labelStyle = {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 6,
    display: "block",
    fontWeight: 700,
    letterSpacing: "0.02em",
  };
  const secondaryButton = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#CBD5E1",
    fontWeight: 700,
    padding: "12px 14px",
    borderRadius: 14,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 32%), radial-gradient(circle at bottom right, rgba(201,168,76,0.14), transparent 34%), #080C18",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.08fr 0.92fr",
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes authFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -16px, 0); }
        }
        @keyframes authPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes authDrift {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(24px, -18px, 0) rotate(5deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }
        @keyframes authShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: isMobile ? "24px 20px 28px" : "40px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(160deg, rgba(10,14,30,0.98) 0%, rgba(14,20,42,0.95) 48%, rgba(8,12,24,0.98) 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: isMobile ? "52px 52px" : "64px 64px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.2))",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: isMobile ? 240 : 340,
            height: isMobile ? 240 : 340,
            borderRadius: "50%",
            background: modeTheme.glow,
            filter: "blur(36px)",
            animation: "authFloat 12s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: isMobile ? -100 : -60,
            top: isMobile ? 100 : 70,
            width: isMobile ? 220 : 280,
            height: isMobile ? 220 : 280,
            borderRadius: "50%",
            background: "rgba(56,189,248,0.12)",
            filter: "blur(34px)",
            animation: "authDrift 15s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: isMobile ? 18 : 36,
            bottom: isMobile ? 128 : 92,
            width: isMobile ? 84 : 110,
            height: isMobile ? 84 : 110,
            borderRadius: 28,
            border: `1px solid ${modeTheme.accentSoft}`,
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(10px)",
            transform: mounted ? "translateY(0) rotate(8deg)" : "translateY(24px) rotate(2deg)",
            opacity: mounted ? 1 : 0,
            transition: "all 0.7s ease 0.2s",
            animation: "authFloat 10s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        <div
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            position: "relative",
            zIndex: 1,
            cursor: "pointer",
            width: "fit-content",
            transform: mounted ? "translateY(0)" : "translateY(18px)",
            opacity: mounted ? 1 : 0,
            transition: "all 0.55s ease",
          }}
        >
          <div
            style={{
              width: isMobile ? 40 : 44,
              height: isMobile ? 40 : 44,
              borderRadius: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <ZenPrepLogo size={26} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>ZenPrep</div>
            <div style={{ color: "#64748B", fontSize: 12 }}>Back to landing</div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingTop: isMobile ? 28 : 14,
            paddingBottom: isMobile ? 28 : 16,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              width: "fit-content",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${modeTheme.accentSoft}`,
              color: "#E2E8F0",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 22,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              opacity: mounted ? 1 : 0,
              transition: "all 0.55s ease 0.08s",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: modeTheme.accent,
                boxShadow: `0 0 12px ${modeTheme.accent}`,
                animation: "authPulse 2.8s ease-in-out infinite",
              }}
            />
            {modeTheme.eyebrow}
          </div>

          <div
            style={{
              maxWidth: isMobile ? "100%" : 500,
              transform: mounted ? "translateY(0)" : "translateY(22px)",
              opacity: mounted ? 1 : 0,
              transition: "all 0.65s ease 0.14s",
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? 34 : 54,
                lineHeight: isMobile ? 1.08 : 1,
                fontWeight: 900,
                color: "#F8FAFC",
                marginBottom: 16,
                letterSpacing: "-0.04em",
              }}
            >
              {modeTheme.heroTitle}
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  background: `linear-gradient(90deg, ${modeTheme.accent}, #F8FAFC, #7DD3FC)`,
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "authShimmer 5s linear infinite alternate",
                }}
              >
                {modeTheme.heroHighlight}
              </span>
            </h1>
            <p
              style={{
                color: "#9AA7BD",
                fontSize: isMobile ? 14 : 16,
                lineHeight: 1.7,
                maxWidth: 470,
                marginBottom: 28,
              }}
            >
              The landing page already sets the tone. This auth screen now carries that same layered motion so signup feels like the beginning of the product, not a side form.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
              gap: 16,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                position: "relative",
                background: "rgba(10,15,28,0.7)",
                borderRadius: 28,
                border: `1px solid ${modeTheme.accentSoft}`,
                overflow: "hidden",
                boxShadow: "0 26px 80px rgba(0,0,0,0.32)",
                transform: mounted ? "translateY(0) scale(1)" : "translateY(28px) scale(0.98)",
                opacity: mounted ? 1 : 0,
                transition: "all 0.7s cubic-bezier(.2,.8,.2,1) 0.22s",
                backdropFilter: "blur(18px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: "#22C55E",
                    boxShadow: "0 0 12px rgba(34,197,94,0.6)",
                  }}
                />
                <span style={{ color: "#CBD5E1", fontSize: 12, fontWeight: 700 }}>
                  {modeTheme.panelLabel}
                </span>
                <span style={{ marginLeft: "auto", color: "#64748B", fontSize: 11 }}>
                  00:42 / 05:00
                </span>
              </div>

              <div style={{ padding: isMobile ? 18 : 22 }}>
                <div
                  style={{
                    borderRadius: 22,
                    padding: isMobile ? 18 : 20,
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
                    border: "1px solid rgba(255,255,255,0.07)",
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(circle at top right, ${modeTheme.glow}, transparent 42%)`,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: modeTheme.accent,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Current prompt
                      </div>
                      <div
                        style={{
                          color: "#F8FAFC",
                          fontSize: isMobile ? 15 : 16,
                          fontWeight: 700,
                          maxWidth: 260,
                          lineHeight: 1.5,
                        }}
                      >
                        {isSignupFlow
                          ? "Set up your profile and step straight into guided interview practice."
                          : "Explain how you would describe your strongest project in a real interview."}
                      </div>
                    </div>
                    <div
                      style={{
                        width: isMobile ? 60 : 76,
                        height: isMobile ? 60 : 76,
                        borderRadius: 24,
                        background: `linear-gradient(140deg, ${modeTheme.accentSoft}, rgba(255,255,255,0.04))`,
                        border: `1px solid ${modeTheme.accentSoft}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#F8FAFC",
                        fontWeight: 800,
                        fontSize: isMobile ? 18 : 22,
                        animation: "authFloat 8s ease-in-out infinite",
                      }}
                    >
                      AI
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {[
                      { label: "Voice", value: "82%", color: "#C9A84C" },
                      { label: "Vision", value: "75%", color: "#22C55E" },
                      { label: "NLP", value: "90%", color: "#F59E0B" },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 18,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div style={{ color: "#64748B", fontSize: 11, marginBottom: 6 }}>
                          {metric.label}
                        </div>
                        <div style={{ color: "#F8FAFC", fontSize: 18, fontWeight: 800 }}>
                          {metric.value}
                        </div>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.07)",
                            overflow: "hidden",
                            marginTop: 8,
                          }}
                        >
                          <div
                            style={{
                              width: metric.value,
                              height: "100%",
                              borderRadius: 999,
                              background: metric.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {FEATURE_CARDS.map((feature, index) => (
                    <div
                      key={feature.title}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "12px 14px",
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        transform: mounted ? "translateY(0)" : "translateY(18px)",
                        opacity: mounted ? 1 : 0,
                        transition: `all 0.55s ease ${0.3 + index * 0.08}s`,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          background: `${feature.color}18`,
                          border: `1px solid ${feature.color}28`,
                          color: "#F8FAFC",
                          fontSize: 11,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {feature.code}
                      </div>
                      <div>
                        <div style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 700 }}>
                          {feature.title}
                        </div>
                        <div style={{ color: "#64748B", fontSize: 11, lineHeight: 1.5 }}>
                          {feature.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                alignContent: "start",
                transform: mounted ? "translateY(0)" : "translateY(24px)",
                opacity: mounted ? 1 : 0,
                transition: "all 0.65s ease 0.32s",
              }}
            >
              {[
                { label: "Question bank", value: "482+", note: "Across interview tracks" },
                { label: "Communication", value: "8", note: "Sections with speaking drills" },
                { label: "Group discussion", value: "5 bots", note: "Live room personalities" },
              ].map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    padding: "18px 18px 16px",
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(14px)",
                    boxShadow:
                      index === 0
                        ? `0 18px 50px ${modeTheme.glow}`
                        : "0 18px 40px rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ color: "#64748B", fontSize: 11, marginBottom: 8 }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      color: "#F8FAFC",
                      fontSize: 26,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      marginBottom: 6,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6 }}>
                    {item.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            position: "relative",
            zIndex: 1,
            transform: mounted ? "translateY(0)" : "translateY(18px)",
            opacity: mounted ? 1 : 0,
            transition: "all 0.55s ease 0.38s",
          }}
        >
          {[
            { n: "482+", l: "Questions" },
            { n: "9", l: "Voice dims" },
            { n: "60+", l: "GD topics" },
          ].map((item) => (
            <div
              key={item.l}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ color: modeTheme.accent, fontWeight: 800, fontSize: 16 }}>
                {item.n}
              </span>
              <span style={{ color: "#64748B", fontSize: 11 }}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "20px 16px 30px" : 36,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top center, rgba(129,140,248,0.1), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0))",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: isMobile ? 18 : 42,
            right: isMobile ? 18 : 46,
            width: isMobile ? 72 : 110,
            height: isMobile ? 72 : 110,
            borderRadius: "50%",
            background: modeTheme.glow,
            filter: "blur(32px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: 470,
            position: "relative",
            zIndex: 1,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(28px) scale(0.98)",
            opacity: mounted ? 1 : 0,
            transition: "all 0.72s cubic-bezier(.2,.8,.2,1) 0.18s",
          }}
        >
          <div
            style={{
              position: "relative",
              padding: isMobile ? "20px 18px" : "26px 24px",
              borderRadius: 30,
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(11,16,31,0.96), rgba(7,10,20,0.94))",
              border: `1px solid ${modeTheme.accentSoft}`,
              boxShadow: `0 30px 100px rgba(0,0,0,0.42), 0 0 0 1px ${modeTheme.accentSoft}`,
              backdropFilter: "blur(22px)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at top left, ${modeTheme.glow}, transparent 34%)`,
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: modeTheme.accentSoft,
                  color: "#F8FAFC",
                  fontWeight: 700,
                  fontSize: 12,
                  border: `1px solid ${modeTheme.accentSoft}`,
                }}
              >
                {mode === "register" ? "Signup mode" : "Auth mode"}
              </div>
              <div style={{ color: "#64748B", fontSize: 12 }}>
                {mode === "register"
                  ? "Animated onboarding"
                  : "Secure and streamlined"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 18,
                padding: 5,
                marginBottom: 24,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  bottom: 5,
                  left: mode === "login" ? 5 : "calc(50% + 1px)",
                  width: "calc(50% - 6px)",
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${modeTheme.accent}, ${THEME.indigo})`,
                  boxShadow: `0 10px 26px ${modeTheme.glow}`,
                  transition: "all 0.35s ease",
                }}
              />
              {["login", "register"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => changeMode(tab)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 14,
                    background: "transparent",
                    color: mode === tab ? "#fff" : "#94A3B8",
                    fontWeight: 800,
                    fontSize: 14,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {tab === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {isSignupFlow && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  marginBottom: 22,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {MODE_STEPS.map((step) => {
                  const isActive = step.key === mode;
                  const isCompleted =
                    mode === "verify" ? step.key === "register" : false;
                  return (
                    <div
                      key={step.key}
                      style={{
                        padding: "12px 12px 10px",
                        borderRadius: 18,
                        background: isActive
                          ? modeTheme.accentSoft
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${
                          isActive || isCompleted
                            ? modeTheme.accentSoft
                            : "rgba(255,255,255,0.05)"
                        }`,
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          color: isActive ? "#F8FAFC" : isCompleted ? modeTheme.accent : "#94A3B8",
                          fontSize: 11,
                          fontWeight: 800,
                          marginBottom: 5,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {step.label}
                      </div>
                      <div style={{ color: "#64748B", fontSize: 11, lineHeight: 1.5 }}>
                        {step.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ position: "relative", zIndex: 1 }}>
              <h2
                style={{
                  color: "#fff",
                  fontSize: isMobile ? 28 : 32,
                  marginBottom: 8,
                  letterSpacing: "-0.03em",
                }}
              >
                {titleMap[mode]}
              </h2>
              <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 22, lineHeight: 1.6 }}>
                {subtitleMap[mode]}
              </p>
            </div>

            {successMsg && (
              <div
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 16,
                  padding: 13,
                  color: "#86EFAC",
                  fontSize: 13,
                  marginBottom: 14,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {successMsg}
              </div>
            )}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 16,
                  padding: 13,
                  color: "#FCA5A5",
                  fontSize: 13,
                  marginBottom: 14,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "relative",
                zIndex: 1,
              }}
            >
              {mode === "register" && (
                <>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                      placeholder="Your full name"
                      style={inputStyle}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Branch</label>
                      <input
                        value={form.branch}
                        onChange={(e) => set("branch", e.target.value)}
                        required
                        placeholder="CSE"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Year</label>
                      <select
                        value={form.year}
                        onChange={(e) => set("year", e.target.value)}
                        style={inputStyle}
                      >
                        {[1, 2, 3, 4].map((y) => (
                          <option key={y} value={y}>
                            Year {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {needsEmail && (
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    placeholder="name@example.com"
                    disabled={mode === "verify"}
                    style={{
                      ...inputStyle,
                      opacity: mode === "verify" ? 0.65 : 1,
                    }}
                  />
                </div>
              )}

              {needsPassword && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => changeMode("forgot")}
                        style={{
                          background: "none",
                          color: THEME.gold,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      style={{ ...inputStyle, paddingRight: 72 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        color: "#94A3B8",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              {needsCode && (
                <div>
                  <label style={labelStyle}>6-Digit Code</label>
                  <input
                    inputMode="numeric"
                    value={form.code}
                    onChange={(e) => set("code", e.target.value)}
                    required
                    minLength={6}
                    maxLength={6}
                    placeholder="123456"
                    style={{
                      ...inputStyle,
                      letterSpacing: isMobile ? 6 : 8,
                      textAlign: "center",
                      fontSize: 18,
                    }}
                  />
                </div>
              )}

              {mode === "reset" && (
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={form.newPassword}
                      onChange={(e) => set("newPassword", e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      style={{ ...inputStyle, paddingRight: 72 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((p) => !p)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        color: "#94A3B8",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {showNewPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading
                    ? "rgba(99,102,241,0.55)"
                    : `linear-gradient(135deg, ${modeTheme.accent}, ${THEME.indigo})`,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  padding: "14px",
                  borderRadius: 16,
                  marginTop: 4,
                  boxShadow: `0 18px 34px ${modeTheme.glow}`,
                }}
              >
                {loading ? <Spinner /> : submitMap[mode]}
              </button>
            </form>

            {mode === "register" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                  gap: 10,
                  marginTop: 14,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {[
                  "Email verification",
                  "Instant dashboard access",
                  "Ready for demo flow",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      color: "#CBD5E1",
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}

            {mode === "verify" && (
              <button
                onClick={resendCode}
                disabled={loading}
                style={{ ...secondaryButton, width: "100%", marginTop: 12, position: "relative", zIndex: 1 }}
              >
                Resend Code
              </button>
            )}

            {mode === "reset" && (
              <button
                onClick={() => changeMode("forgot")}
                style={{ ...secondaryButton, width: "100%", marginTop: 12, position: "relative", zIndex: 1 }}
              >
                Send a New Code
              </button>
            )}

            {mode === "login" && (
              <div style={{ marginTop: 22, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                  <span style={{ color: "#64748B", fontSize: 11, fontWeight: 700 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>
                {GOOGLE_CLIENT_ID ? (
                  <div ref={googleButtonRef} style={{ minHeight: 44, display: "flex", justifyContent: "center" }} />
                ) : (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 12,
                      color: "#94A3B8",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    Add VITE_GOOGLE_CLIENT_ID to enable Google sign-in.
                  </div>
                )}
              </div>
            )}

            {mode !== "login" && mode !== "register" && (
              <button
                type="button"
                onClick={() => changeMode("login")}
                style={{
                  background: "none",
                  color: THEME.gold,
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 20,
                  width: "100%",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
