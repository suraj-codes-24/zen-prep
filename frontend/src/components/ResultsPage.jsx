import { useState, useEffect } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { API, Bar, CircularScore, Spinner, ZenPrepLogo, THEME, useWindowSize } from "../shared";

function ResultsPage({ token, user, lastResult, onBack, onRetake }) {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  async function downloadPDF(sessionId) {
    if (!sessionId) { setPdfError("No session ID available for this result."); return; }
    setPdfLoading(true); setPdfError("");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(`${API}/reports/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) { setPdfError("PDF generation failed. Try again."); setPdfLoading(false); return; }
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `interview_report_${sessionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      clearTimeout(timer);
      setPdfError(e.name === "AbortError" ? "Request timed out. Please try again." : "Download failed. Is the backend running?");
    }
    setPdfLoading(false);
  }

  useEffect(() => {
    fetch(`${API}/analytics/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setAnalytics(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const score = lastResult?.total_score ?? analytics?.avg_nlp_score ?? 0;
  const answerQ = lastResult?.nlp_score ?? 0;
  const voiceC = lastResult?.voice_score ?? 0;
  const eyeC = lastResult?.face_score ?? 0;
  const feedback = lastResult?.feedback || "";

  const radarData = [
    { subject: "COMMUNICATION", A: Math.min(100, answerQ + 5) },
    { subject: "CONFIDENCE", A: voiceC },
    { subject: "CLARITY", A: Math.min(100, (answerQ + voiceC) / 2) },
    { subject: "TECHNICAL DEPTH", A: answerQ },
    { subject: "STRUCTURE", A: Math.min(100, answerQ - 5) },
  ];

  function parseStrengths() {
    if (answerQ >= 75) return [{ key: "Strong technical knowledge", desc: "Your answers showed solid understanding of core concepts." }];
    return [{ key: "Effort & thoroughness", desc: "You provided complete answers with good detail." }];
  }
  function parseImprovements() {
    const items = [];
    if (voiceC < 75) items.push({ key: "Filler words", desc: "Try to reduce use of \"um\" and \"like\" for clearer delivery." });
    if (eyeC < 75) items.push({ key: "On-camera presence", desc: "Try to maintain steadier eye contact and a more engaged camera presence." });
    if (items.length === 0) items.push({ key: "Pace", desc: "Maintain a steady speaking pace throughout your answers." });
    return items;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1E", position: "relative" }}>
      {/* Background effects */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)", top: -100, right: -100, pointerEvents: "none", zIndex: 0 }} />
      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 40px", background: "linear-gradient(90deg, #0F1629, #111A30, #0F1629)", borderBottom: "1px solid rgba(201,168,76,0.08)", position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
          <ZenPrepLogo size={isMobile ? 24 : 30} />
          <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, background: "linear-gradient(135deg, #F1F5F9 40%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZenPrep</span>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 8 : 12 }}>
          <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: "50%", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C", fontSize: isMobile ? 12 : 14, cursor: "pointer" }}>🔔</div>
          <div onClick={onBack} style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #A68B3C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: isMobile ? 12 : 13, cursor: "pointer", boxShadow: "0 0 12px rgba(201,168,76,0.25)" }}>{(user?.name || "U")[0].toUpperCase()}</div>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px", position: "relative", zIndex: 1 }}>
        <h1 style={{ textAlign: "center", fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: isMobile ? 24 : 32, background: "linear-gradient(135deg, #F1F5F9 30%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Performance Summary</h1>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}><Spinner /></div>
        ) : (
          <>
            {/* Score ring */}
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: isMobile ? 24 : 32 }}>
              <CircularScore score={Math.round(score)} size={isMobile ? 140 : 160} />
              {/* Performance badge */}
              {(() => {
                const s = Math.round(score);
                const badge = s >= 90 ? { label: "Expert", bg: "rgba(201,168,76,0.15)", color: "#E2C97E", border: "rgba(201,168,76,0.4)" }
                  : s >= 75 ? { label: "Strong", bg: "rgba(34,197,94,0.12)", color: "#4ADE80", border: "rgba(34,197,94,0.35)" }
                  : s >= 60 ? { label: "Improving", bg: "rgba(245,158,11,0.12)", color: "#FCD34D", border: "rgba(245,158,11,0.35)" }
                  : { label: "Needs Practice", bg: "rgba(239,68,68,0.1)", color: "#F87171", border: "rgba(239,68,68,0.3)" };
                return (
                  <div style={{ marginTop: 12, padding: "4px 18px", borderRadius: 20, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontWeight: 700, fontSize: 13, letterSpacing: "0.04em" }}>
                    {badge.label}
                  </div>
                );
              })()}
              <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 12, textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>
                {score >= 80 ? "Impressive performance! Your technical answers were highly structured, showing strong domain knowledge." :
                  score >= 60 ? "Good performance! Keep practicing to strengthen your weak areas." :
                  "Keep going! Consistent practice will improve your scores significantly."}
              </p>
            </div>

            {/* 3 score cards */}
            <div className="fade-in" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16, marginBottom: 24 }}>
              {[
                { label: "Answer Quality", value: Math.round(answerQ), color: "#22C55E", icon: "✓" },
                { label: "Voice Confidence", value: Math.round(voiceC), color: "#C9A84C", icon: "🎙" },
                { label: "Face Analysis", value: Math.round(eyeC), color: "#F59E0B", icon: "👁" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ color: "#94A3B8", fontSize: 13 }}>{s.label}</span>
                    <span style={{ color: s.color, fontSize: 18 }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}%</div>
                  <Bar value={s.value} color={s.color} />
                </div>
              ))}
            </div>

            {/* Radar + AI Feedback */}
            <div className="fade-in" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16, marginBottom: 24 }}>
              {/* Radar */}
              <div style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
                <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills Radar</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 10 }} />
                    <Radar name="Score" dataKey="A" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* AI Feedback */}
              <div style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
                <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Feedback Analysis</h3>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <span>✅</span> TOP STRENGTHS
                  </div>
                  {parseStrengths().map((s, i) => (
                    <div key={i} style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}>
                      <strong style={{ color: "#22C55E" }}>{s.key}:</strong> {s.desc}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <span>⚠</span> IMPROVEMENT AREAS
                  </div>
                  {parseImprovements().map((s, i) => (
                    <div key={i} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}>
                      <strong style={{ color: "#F59E0B" }}>{s.key}:</strong> {s.desc}
                    </div>
                  ))}
                  {feedback && (
                    <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}>
                      {feedback}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="fade-in" style={{ display: "flex", justifyContent: "center", gap: isMobile ? 12 : 16, flexDirection: isMobile ? "column" : "row" }}>
              <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#F1F5F9", padding: isMobile ? "10px 20px" : "12px 28px", borderRadius: 10, fontSize: isMobile ? 13 : 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                ⊞ Back to Dashboard
              </button>
              <button onClick={onRetake}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.5)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.3)"}
                style={{ background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 600, padding: isMobile ? "10px 20px" : "12px 28px", borderRadius: 10, fontSize: isMobile ? 13 : 14, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(99,102,241,0.3)", transition: "all 0.2s" }}>
                ↺ Retake Interview
              </button>
              {lastResult?.session_id && (
                <button onClick={() => downloadPDF(lastResult.session_id)} disabled={pdfLoading}
                  onMouseEnter={e => { if (!pdfLoading) e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.35)"; }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  style={{ background: pdfLoading ? "#334155" : "rgba(99,102,241,0.1)", border: `1px solid rgba(99,102,241,${pdfLoading ? "0.1" : "0.3"})`, color: pdfLoading ? "#64748B" : "#A5B4FC", fontWeight: 600, padding: isMobile ? "10px 20px" : "12px 28px", borderRadius: 10, fontSize: isMobile ? 13 : 14, display: "flex", alignItems: "center", gap: 8, cursor: pdfLoading ? "default" : "pointer", transition: "all 0.2s" }}>
                  {pdfLoading ? <><span className="spin">⟳</span> Generating report...</> : "⬇ Download PDF Report"}
                </button>
              )}
            </div>
            {pdfError && (
              <div style={{ marginTop: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "8px 14px", color: "#F87171", fontSize: 13 }}>
                ⚠ {pdfError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


export default ResultsPage;
