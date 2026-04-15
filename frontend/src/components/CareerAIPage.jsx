import { useState, useRef } from "react";
import { API, THEME } from "../shared";
import { SidebarLayout } from "./Sidebar";

function CareerAIPage({ token, user, onNav, onLogout, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || "resume");

  // Resume state
  const [dragging, setDragging]       = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [targetRole, setTargetRole]   = useState("");
  const fileInputRef                  = useRef(null);

  // JD state
  const [jdText, setJdText]         = useState("");
  const [analysing, setAnalysing]   = useState(false);
  const [jdResult, setJdResult]     = useState(null);
  const [jdError, setJdError]       = useState("");

  const card = { background: "linear-gradient(135deg, #0F1629 0%, #111A30 100%)", border: "1px solid rgba(168,85,247,0.1)", borderRadius: 14, position: "relative", overflow: "hidden" };
  const labelSt = { fontSize: 10, color: "#7C8BA8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "block" };

  const TARGET_ROLES = [
    "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Python Developer", "Java Developer", "Data Scientist", "ML Engineer",
    "DevOps Engineer", "Cloud Engineer", "Mobile Developer", "QA Engineer",
    "Product Manager", "System Design Engineer", "Data Analyst", "Cybersecurity Analyst",
  ];

  // ── Resume upload ─────────────────────────────────────────────────────────
  async function uploadFile(file) {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setResumeError("Only PDF files are supported."); return;
    }
    setResumeError(""); setUploading(true); setResumeResult(null);
    const fd = new FormData();
    fd.append("file", file);
    if (targetRole) fd.append("target_role", targetRole);
    try {
      const r = await fetch(`${API}/resume/analyse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) setResumeError(d.detail || "Resume analysis failed.");
      else setResumeResult(d);
    } catch {
      setResumeError("Could not reach server. Is the backend running?");
    }
    setUploading(false);
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  // ── JD analysis ───────────────────────────────────────────────────────────
  async function analyseJD() {
    if (!jdText.trim() || jdText.trim().length < 20) {
      setJdError("Please paste a job description (at least 20 characters)."); return;
    }
    setJdError(""); setAnalysing(true); setJdResult(null);
    try {
      const r = await fetch(`${API}/jd/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jd_text: jdText }),
      });
      const d = await r.json();
      if (!r.ok) setJdError(d.detail || "JD analysis failed.");
      else setJdResult(d);
    } catch {
      setJdError("Could not reach server. Is Ollama running?");
    }
    setAnalysing(false);
  }

  function scColor(score) {
    if (score === null || score === undefined) return "#EF4444";
    if (score >= 70) return "#22C55E";
    if (score >= 45) return "#F59E0B";
    return "#EF4444";
  }

  function scLabel(score) {
    if (score === null || score === undefined) return "Not practiced";
    if (score >= 70) return `${Math.round(score)}%`;
    if (score >= 45) return `${Math.round(score)}%`;
    return `${Math.round(score)}%`;
  }

  const jdOverall = jdResult
    ? (() => {
        const scores = Object.values(jdResult.match_scores).filter(s => s !== null && s !== undefined);
        return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      })()
    : null;

  const atsColor = resumeResult
    ? resumeResult.ats_score >= 75 ? "#22C55E" : resumeResult.ats_score >= 50 ? "#F59E0B" : "#EF4444"
    : "#C9A84C";

  function resetResume() { setResumeResult(null); setResumeError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }
  function resetJD() { setJdResult(null); setJdError(""); setJdText(""); }

  return (
    <SidebarLayout active="career" user={user} onNav={onNav} onLogout={onLogout}>
      <div style={{ padding: "28px 36px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Header + Tab Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px 0", background: "linear-gradient(135deg, #F1F5F9 30%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Career AI</h1>
            <p style={{ color: "#5A6B85", fontSize: 13, margin: 0 }}>
              {activeTab === "resume" ? "Upload your resume — get ATS score, skill extraction, and role-specific feedback" : "Paste a job description — see skill gaps and get a prep plan"}
            </p>
          </div>
          <div style={{ display: "flex", background: "rgba(15,22,41,0.8)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: 3 }}>
            {[
              { id: "resume", label: "Resume Analysis", icon: "📄" },
              { id: "jd", label: "JD Gap Analyzer", icon: "🎯" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))" : "transparent",
                  border: activeTab === tab.id ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
                  color: activeTab === tab.id ? "#E2C97E" : "#5A6B85",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
                }}>
                <span style={{ fontSize: 14 }}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════ RESUME TAB ════════════════ */}
        {activeTab === "resume" && (
          <div style={{ display: "grid", gridTemplateColumns: resumeResult ? "340px 1fr" : "1fr", gap: 20 }}>
            {/* Left: Config + Upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Role selector */}
              <div style={{ ...card, padding: 20 }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
                <label style={labelSt}>Target Role</label>
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "10px 12px", color: "#F1F5F9", fontSize: 13, cursor: "pointer", appearance: "none", outline: "none" }}>
                  <option value="" style={{ background: "#1a1f2e", color: "#F1F5F9" }}>General (No specific role)</option>
                  {TARGET_ROLES.map(r => <option key={r} value={r} style={{ background: "#1a1f2e", color: "#F1F5F9" }}>{r}</option>)}
                </select>
                {targetRole && <div style={{ marginTop: 8, fontSize: 11, color: "#7C8BA8" }}>Resume will be scored specifically for <strong style={{ color: "#E2C97E" }}>{targetRole}</strong></div>}
              </div>

              {/* Upload zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  ...card, padding: resumeResult ? 20 : 40, textAlign: "center", cursor: uploading ? "default" : "pointer",
                  border: `2px dashed ${dragging ? "#A855F7" : "rgba(255,255,255,0.1)"}`,
                  background: dragging ? "rgba(168,85,247,0.06)" : "#0F1629",
                  boxShadow: dragging ? "0 0 24px rgba(168,85,247,0.2)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => uploadFile(e.target.files[0])} />
                {uploading ? (
                  <>
                    <span className="spin" style={{ fontSize: 24, color: "#C9A84C", display: "inline-block" }}>⟳</span>
                    <p style={{ color: "#C9A84C", marginTop: 8, fontSize: 13, fontWeight: 600 }}>Analyzing{targetRole ? ` for ${targetRole}` : ""}...</p>
                    <p style={{ color: "#475569", fontSize: 11 }}>Extracting skills — 20–60s</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.7 }}>📄</div>
                    <p style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Drop your resume here</p>
                    <p style={{ color: "#5A6B85", fontSize: 12 }}>PDF only · max 5 MB</p>
                  </>
                )}
              </div>

              {resumeError && (
                <div style={{ ...card, padding: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                  <span style={{ color: "#EF4444", fontSize: 12 }}>{resumeError}</span>
                </div>
              )}

              {/* ATS Score */}
              {resumeResult && (
                <div style={{ ...card, padding: 24, textAlign: "center" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${atsColor}60, transparent)` }} />
                  <div style={{ fontSize: 10, color: "#5A6B85", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {resumeResult.target_role ? `Match Score — ${resumeResult.target_role}` : "ATS Score"}
                  </div>
                  <div style={{ fontSize: 52, fontWeight: 800, color: atsColor, lineHeight: 1 }}>{resumeResult.ats_score}<span style={{ fontSize: 18, color: "#475569" }}>%</span></div>
                  <div style={{ marginTop: 8, fontSize: 12, color: atsColor, fontWeight: 600 }}>
                    {resumeResult.ats_score >= 75 ? "Strong match" : resumeResult.ats_score >= 50 ? "Needs improvement" : "Major gaps found"}
                  </div>
                  <button onClick={resetResume} style={{ marginTop: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7C8BA8", fontSize: 11, fontWeight: 500, padding: "6px 16px", borderRadius: 6, cursor: "pointer" }}>New Analysis</button>
                </div>
              )}
            </div>

            {/* Right: Results */}
            {resumeResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Skills */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)" }} />
                  <div style={labelSt}>Identified Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {resumeResult.skills.length > 0 ? resumeResult.skills.map((s, i) => (
                      <span key={i} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ADE80", fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20, boxShadow: "0 0 8px rgba(34,197,94,0.15)" }}>{s}</span>
                    )) : <span style={{ color: "#475569", fontSize: 12 }}>No skills detected</span>}
                  </div>
                </div>

                {/* Two-column: Suggestions + Strengths */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {/* Suggestions */}
                  <div style={{ ...card, padding: 20 }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />
                    <div style={labelSt}>Gap Analysis & Fixes</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {resumeResult.suggestions.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ color: "#F59E0B", fontSize: 8, marginTop: 5, flexShrink: 0 }}>●</span>
                          <span style={{ color: "#CBD5E1", fontSize: 12, lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Questions */}
                  <div style={{ ...card, padding: 20 }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />
                    <div style={labelSt}>Interview Questions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {resumeResult.questions.map((q, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ color: "#6366F1", fontWeight: 700, fontSize: 11, flexShrink: 0, marginTop: 1 }}>Q{i + 1}</span>
                          <span style={{ color: "#CBD5E1", fontSize: 12, lineHeight: 1.5 }}>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={() => onNav("interview_setup")}
                  style={{ background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 700, fontSize: 14, padding: "14px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                  Start Interview Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ JD GAP TAB ════════════════ */}
        {activeTab === "jd" && (
          <div style={{ display: "grid", gridTemplateColumns: jdResult ? "360px 1fr" : "1fr", gap: 20, alignItems: "start" }}>
            {/* Left: Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ ...card, padding: 20 }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.3), transparent)" }} />
                <label style={labelSt}>Job Description</label>
                <textarea
                  value={jdText} onChange={e => setJdText(e.target.value)}
                  placeholder={"Paste the full job description here...\n\ne.g. We are looking for a Software Engineer with:\n- Data Structures & Algorithms\n- System Design\n- Python or Java"}
                  style={{
                    width: "100%", height: 240, background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
                    color: "#F1F5F9", fontSize: 13, lineHeight: 1.6, padding: 14,
                    fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none",
                  }}
                />
                <button onClick={analyseJD} disabled={analysing}
                  style={{
                    marginTop: 12, width: "100%",
                    background: analysing ? "#3D4555" : "linear-gradient(135deg, #A855F7, #7C3AED)",
                    color: "#fff", fontWeight: 700, fontSize: 13, padding: "12px",
                    borderRadius: 8, border: "none", cursor: analysing ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: analysing ? "none" : "0 4px 16px rgba(168,85,247,0.25)",
                  }}>
                  {analysing ? <><span className="spin" style={{ display: "inline-block" }}>⟳</span> Analysing...</> : "Analyse Gap"}
                </button>
                {jdError && <div style={{ marginTop: 10, color: "#EF4444", fontSize: 12 }}>{jdError}</div>}
              </div>

              {/* Overall match */}
              {jdResult && jdOverall !== null && (
                <div style={{ ...card, padding: 24, textAlign: "center" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${scColor(jdOverall)}60, transparent)` }} />
                  <div style={{ fontSize: 10, color: "#5A6B85", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Overall Match</div>
                  <div style={{ fontSize: 52, fontWeight: 800, color: scColor(jdOverall), lineHeight: 1 }}>{jdOverall}<span style={{ fontSize: 18, color: "#475569" }}>%</span></div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#7C8BA8" }}>
                    {jdOverall >= 70 ? "Strong fit" : jdOverall >= 45 ? "Good with prep" : "Needs focused study"}
                  </div>
                  <button onClick={resetJD} style={{ marginTop: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7C8BA8", fontSize: 11, fontWeight: 500, padding: "6px 16px", borderRadius: 6, cursor: "pointer" }}>New Analysis</button>
                </div>
              )}
            </div>

            {/* Right: Results */}
            {jdResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Skill match bars */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)" }} />
                  <div style={labelSt}>Skill Match Analysis</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(jdResult.match_scores).map(([skill, score]) => (
                      <div key={skill}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: "#CBD5E1", fontWeight: 500 }}>{skill}</span>
                          <span style={{ color: scColor(score), fontWeight: 600, fontSize: 11 }}>{scLabel(score)}</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${score ?? 0}%`, height: "100%", background: scColor(score), borderRadius: 99 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing skills */}
                {jdResult.missing_skills.length > 0 && (
                  <div style={{ ...card, padding: 20, border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)" }} />
                    <div style={{ ...labelSt, color: "#F87171" }}>Skills to Improve</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {jdResult.missing_skills.map((s, i) => (
                        <span key={i} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5", fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 20, boxShadow: "0 0 8px rgba(239,68,68,0.2)" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7-day prep plan */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
                  <div style={labelSt}>7-Day Prep Plan</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {jdResult.prep_plan.map((task, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#E2C97E", flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ color: "#CBD5E1", fontSize: 12, lineHeight: 1.5 }}>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => onNav("interview_setup")}
                  style={{ background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 700, fontSize: 14, padding: "14px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                  Start Prep Interview
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

// ─── Replay Page — REMOVED (replay is now inline in Dashboard & Analytics) ──

// ReplayPage function deleted — functionality moved to Dashboard sections



// ─── Communication Test Page (Versant-Style) ────────────────────────────────

export default CareerAIPage;
