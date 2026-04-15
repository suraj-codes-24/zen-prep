import { useState } from "react";
import { THEME } from "../shared";

function OnboardingPage({ user, onFinish }) {
  const [step, setStep]           = useState(1);
  const [micOk, setMicOk]         = useState(null);   // null=untested, true=ok, false=denied
  const [camOk, setCamOk]         = useState(null);
  const [companies, setCompanies] = useState("");
  const [role, setRole]           = useState("");
  const [weakTopics, setWeakTopics] = useState([]);

  const SUBJECTS = ["DSA", "OOPS", "System Design", "DBMS", "OS & Networking", "Machine Learning", "Behavioral"];

  async function testHardware() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(t => t.stop());
      setMicOk(true); setCamOk(true);
    } catch {
      // Try audio only
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
        setMicOk(true); setCamOk(false);
      } catch {
        setMicOk(false); setCamOk(false);
      }
    }
  }

  function toggleTopic(t) {
    setWeakTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function finish() {
    if (companies) localStorage.setItem("target_companies", companies);
    if (role)      localStorage.setItem("target_role", role);
    if (weakTopics.length) localStorage.setItem("weak_topics", JSON.stringify(weakTopics));
    onFinish();
  }

  const inputStyle = { width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "11px 14px", color: "#F1F5F9", fontSize: 14 };

  // ── Step dots ──
  function StepDots() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, justifyContent: "center" }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: n === step ? 28 : 10, height: 10, borderRadius: 99, background: n === step ? `linear-gradient(90deg, ${THEME.indigo}, #818CF8)` : n < step ? `rgba(99,102,241,0.45)` : "rgba(255,255,255,0.1)", transition: "all 0.2s", boxShadow: n === step ? `0 0 8px rgba(99,102,241,0.5)` : "none" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
        <div style={{ width: 34, height: 34, background: "#C9A84C", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>◈</div>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>ZenPrep</span>
        <span style={{ color: "#64748B", fontSize: 13, marginLeft: 8 }}>Step {step} / 4</span>
      </div>

      <div style={{ width: "100%", maxWidth: 520, background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "36px 40px" }}>
        <StepDots />

        {/* ── Step 1: Welcome ─────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", marginBottom: 28 }}>
              Let's set up your experience in 4 quick steps.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {[
                { icon: "🧠", title: "AI Answer Evaluation",   desc: "NLP engine scores your answers against ideal responses" },
                { icon: "🎙", title: "Voice Confidence Analysis", desc: "Whisper transcribes and rates your pace, filler words, and tone" },
                { icon: "👁", title: "Facial Behaviour Tracking", desc: "MediaPipe tracks eye contact, head stability, and emotion" },
                { icon: "📈", title: "Adaptive Difficulty",    desc: "Questions get harder or easier based on your performance" },
              ].map(f => (
                <div key={f.title} style={{ display: "flex", gap: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{f.title}</div>
                    <div style={{ color: "#64748B", fontSize: 12 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ width: "100%", background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 600, padding: "12px", borderRadius: 8, fontSize: 14, boxShadow: `0 4px 16px rgba(99,102,241,0.35)` }}>
              Get Started →
            </button>
          </>
        )}

        {/* ── Step 2: Hardware Test ────────────────────────────────── */}
        {step === 2 && (
          <>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Test Your Hardware</h2>
            <p style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", marginBottom: 28 }}>
              Grant camera and microphone access for the full experience.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Microphone", status: micOk, icon: "🎙" },
                { label: "Camera",     status: camOk, icon: "📷" },
              ].map(h => (
                <div key={h.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "14px 16px" }}>
                  <span style={{ color: "#F1F5F9", fontSize: 14 }}>{h.icon}  {h.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: h.status === null ? "#64748B" : h.status ? "#22C55E" : "#F87171" }}>
                    {h.status === null ? "Not tested" : h.status ? "✓ Detected" : "✗ Permission denied"}
                  </span>
                </div>
              ))}
            </div>
            {micOk === null && (
              <button onClick={testHardware} style={{ width: "100%", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "#E2C97E", fontWeight: 600, padding: "11px", borderRadius: 8, fontSize: 14, marginBottom: 12 }}>
                🎙 Test Camera & Microphone
              </button>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(3)} style={{ flex: 1, background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 600, padding: "11px", borderRadius: 8, fontSize: 14, boxShadow: `0 4px 16px rgba(99,102,241,0.35)` }}>
                Next →
              </button>
              <button onClick={() => setStep(3)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748B", padding: "11px 18px", borderRadius: 8, fontSize: 14 }}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Goals ────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Set Your Goals</h2>
            <p style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", marginBottom: 28 }}>
              Tell us your targets so we can personalise your practice.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div>
                <label style={{ fontSize: 13, color: "#94A3B8", marginBottom: 6, display: "block" }}>Target Companies</label>
                <input value={companies} onChange={e => setCompanies(e.target.value)} placeholder="e.g. Google, Amazon, Microsoft" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#94A3B8", marginBottom: 6, display: "block" }}>Preferred Role</label>
                <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer, ML Engineer" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(4)} style={{ flex: 1, background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 600, padding: "11px", borderRadius: 8, fontSize: 14, boxShadow: `0 4px 16px rgba(99,102,241,0.35)` }}>
                Next →
              </button>
              <button onClick={() => setStep(4)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748B", padding: "11px 18px", borderRadius: 8, fontSize: 14 }}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Weak Topics ──────────────────────────────────── */}
        {step === 4 && (
          <>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Select Weak Topics</h2>
            <p style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
              We'll prioritise these in your practice sessions.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {SUBJECTS.map(t => {
                const on = weakTopics.includes(t);
                return (
                  <div key={t} onClick={() => toggleTopic(t)} style={{ display: "flex", alignItems: "center", gap: 10, background: on ? `rgba(99,102,241,0.1)` : "rgba(255,255,255,0.03)", border: `1px solid ${on ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: on ? THEME.indigo : "transparent", border: `2px solid ${on ? THEME.indigo : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {on && <div style={{ width: 8, height: 8, background: "#fff", borderRadius: 2 }} />}
                    </div>
                    <span style={{ color: on ? "#A5B4FC" : "#94A3B8", fontSize: 13, fontWeight: on ? 600 : 400 }}>{t}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={finish} style={{ width: "100%", background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 700, padding: "13px", borderRadius: 8, fontSize: 15, boxShadow: `0 4px 20px rgba(99,102,241,0.4)` }}>
              Start Your First Interview 🚀
            </button>
            <button onClick={finish} style={{ width: "100%", marginTop: 10, background: "transparent", color: "#64748B", fontSize: 13, padding: "8px" }}>
              Skip Setup
            </button>
          </>
        )}
      </div>

      {/* Back button */}
      {step > 1 && (
        <button onClick={() => setStep(s => s - 1)} style={{ marginTop: 20, background: "transparent", color: "#64748B", fontSize: 13 }}>
          ← Back
        </button>
      )}
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────

export default OnboardingPage;
