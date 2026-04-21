import { useState, useEffect } from "react";
import { API, ExamGuidanceModal, Spinner, THEME, useWindowSize } from "../shared";
import { SidebarLayout } from "./Sidebar";

function InterviewPage({ token, user, onNav, onLogout, onStart }) {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loadingT, setLoadingT] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [subtopics, setSubtopics] = useState([]);
  const [loadingST, setLoadingST] = useState(false);
  const [form, setForm] = useState({ subtopic_id: "", difficulty: "beginner", interview_type: "technical" });
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [showScoring, setShowScoring] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);

  useEffect(() => {
    fetch(`${API}/interview/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setSubjects(d); }).catch(() => {});
    fetch(`${API}/interview/active`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.active) setActiveInterview(d); }).catch(() => {});
  }, []);

  function handleSelectSubject(sub) {
    setSelectedSubject(sub); setSelectedTopic(null); setTopics([]); setSubtopics([]);
    setForm({ subtopic_id: "", difficulty: "beginner", interview_type: sub.name === "Behavioral" ? "hr" : "technical" });
    setLoadingT(true);
    fetch(`${API}/interview/topics?subject_id=${sub.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setTopics(d); setLoadingT(false); }).catch(() => setLoadingT(false));
  }

  function handleSelectTopic(t) {
    setSelectedTopic(t); setSubtopics([]); setForm(f => ({ ...f, subtopic_id: "" })); setLoadingST(true);
    fetch(`${API}/interview/subtopics?topic_id=${t.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setSubtopics(d); if (d.length > 0) setForm(f => ({ ...f, subtopic_id: d[0].id })); setLoadingST(false); })
      .catch(() => setLoadingST(false));
  }

  function handleStartClick() {
    if (!selectedSubject || !selectedTopic) { setError("Please select a subject and topic."); return; }
    setShowGuidance(true);
  }

  async function startInterview() {
    setError(""); setStarting(true);
    if (!selectedSubject || !selectedTopic) { setError("Please select a subject and topic."); setStarting(false); return; }
    try {
      const payload = { interview_type: form.interview_type, subject_id: selectedSubject.id, topic_id: selectedTopic.id, subtopic_id: form.subtopic_id ? Number(form.subtopic_id) : null, difficulty: form.difficulty };
      const r = await fetch(`${API}/interview/start`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.detail || "Failed to start"); setStarting(false); return; }
      onStart({ sessionId: d.session_id, subjectId: selectedSubject.id, topicId: selectedTopic.id, subtopicId: payload.subtopic_id, difficulty: payload.difficulty, interviewType: payload.interview_type, subjectName: selectedSubject.name });
    } catch { setError("Server error"); }
    setStarting(false);
  }

  function resumeActiveInterview() {
    if (!activeInterview) return;
    onStart({
      sessionId: activeInterview.session_id,
      subjectId: activeInterview.subject_id,
      topicId: activeInterview.topic_id,
      subtopicId: activeInterview.subtopic_id,
      difficulty: activeInterview.difficulty,
      interviewType: activeInterview.interview_type,
      subjectName: activeInterview.subject_name,
    });
  }

  async function startFreshInterview() {
    if (activeInterview) {
      try {
        await fetch(`${API}/interview/finish`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: activeInterview.session_id }),
        });
      } catch {}
      setActiveInterview(null);
    }
  }

  const diffColors = { beginner: "#22C55E", intermediate: "#F59E0B", advanced: "#C9A84C", expert: "#EF4444" };
  const subjectIcons = { DSA: "🔢", OOPS: "🧩", "System Design": "🏗", DBMS: "🗄", "OS & Networking": "⚡", "Machine Learning": "🤖", Behavioral: "💬" };
  const subjectColors = { DSA: "#C9A84C", OOPS: "#22C55E", "System Design": "#F59E0B", DBMS: "#3B82F6", "OS & Networking": "#EC4899", "Machine Learning": "#E2C97E", Behavioral: "#14B8A6" };
  const totalQs = subjects.reduce((s, sub) => s + (sub.question_count || 0), 0);
  const totalTopics = subjects.reduce((s, sub) => s + (sub.topic_count || 0), 0);

  return (
    <>
    <SidebarLayout active="interview_setup" user={user} onNav={onNav} onLogout={onLogout}>
      <div style={{ padding: isMobile ? "20px 16px" : "28px 36px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 16, padding: isMobile ? "20px 16px" : "24px 32px", marginBottom: isMobile ? 20 : 24, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 0, position: "relative", overflow: "hidden", animation: "fadeIn 0.5s ease" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #C9A84C40, transparent)" }} />
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, marginBottom: 4, background: "linear-gradient(135deg, #F1F5F9 30%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Mock Interview</h1>
            <p style={{ color: "#7C8BA8", fontSize: isMobile ? 12 : 13, margin: 0 }}>Multimodal AI interviewer — voice, face & content analysis in real-time</p>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 16 : 20, alignItems: "center" }}>
            {[{ v: totalQs, l: "Questions" }, { v: subjects.length, l: "Subjects" }, { v: totalTopics, l: "Topics" }, { v: "4", l: "Levels" }].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ color: "#E2C97E", fontWeight: 700, fontSize: 18 }}>{s.v}</div>
                <div style={{ color: "#5A6B85", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active interview resume banner */}
        {activeInterview && (
          <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: isMobile ? "14px 16px" : "16px 24px", marginBottom: 20, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 12 : 0, animation: "fadeIn 0.4s ease" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: "#F59E0B", animation: "pulse 2s infinite" }} />
                <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 14 }}>Active Interview Found</span>
              </div>
              <p style={{ color: "#7C8BA8", fontSize: isMobile ? 11 : 12, margin: 0 }}>
                {activeInterview.subject_name} · {activeInterview.difficulty} · {activeInterview.questions_answered} questions answered · started {activeInterview.start_time ? new Date(activeInterview.start_time).toLocaleString() : "recently"}
              </p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 8 : 10, flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : "auto" }}>
              <button onClick={resumeActiveInterview}
                style={{ background: "linear-gradient(135deg, #C9A84C, #E2C97E)", color: "#0B0F1E", border: "none", borderRadius: 8, padding: isMobile ? "10px 16px" : "10px 20px", fontWeight: 700, fontSize: isMobile ? 12 : 13, cursor: "pointer" }}>
                Resume
              </button>
              <button onClick={startFreshInterview}
                style={{ background: "rgba(255,255,255,0.05)", color: "#7C8BA8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: isMobile ? "10px 16px" : "10px 20px", fontWeight: 600, fontSize: isMobile ? 12 : 13, cursor: "pointer" }}>
                End & Start Fresh
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: isMobile ? 20 : 24 }}>
          {/* Left: Subjects + Topics */}
          <div>
            {/* Subject Cards */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 15, margin: 0 }}>Choose a Subject</h2>
                {selectedSubject && (
                  <button onClick={() => { setSelectedSubject(null); setSelectedTopic(null); setTopics([]); setSubtopics([]); }}
                    style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", color: "#C9A84C", fontSize: 11, padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 10, animation: "fadeInUp 0.4s ease" }}>
                {subjects.map((sub, idx) => {
                  const icon = subjectIcons[sub.name] || "📝";
                  const clr = subjectColors[sub.name] || "#C9A84C";
                  const selected = selectedSubject?.id === sub.id;
                  return (
                    <div key={sub.id} onClick={() => handleSelectSubject(sub)} style={{
                      background: selected ? `linear-gradient(135deg, ${clr}14, ${clr}06)` : "linear-gradient(135deg, #0F1629, #111A30)",
                      border: `1.5px solid ${selected ? `${clr}60` : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 14, padding: "16px 14px", cursor: "pointer", transition: "all 0.25s ease", position: "relative", overflow: "hidden",
                      boxShadow: selected ? `0 0 20px ${clr}10` : "none",
                      animation: `fadeInUp 0.35s ease ${idx * 0.04}s both`,
                    }}
                      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = `${clr}35`; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)"; } }}
                    >
                      {selected && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${clr}, transparent)` }} />}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${clr}10`, border: `1px solid ${clr}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
                        <div>
                          <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 13 }}>{sub.name}</div>
                          <div style={{ color: "#5A6B85", fontSize: 10, marginTop: 1 }}>{sub.topic_count || 0} topics</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ color: "#4A5568", fontSize: 10 }}>{sub.question_count || 0} questions</div>
                        {selected && <div style={{ width: 18, height: 18, borderRadius: 99, background: clr, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>✓</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Topics — inline expansion */}
            {selectedSubject && (
              <div style={{ marginTop: 16, animation: "fadeInUp 0.35s ease" }}>
                <div style={{ background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(201,168,76,0.06)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 99, background: subjectColors[selectedSubject.name] || "#C9A84C" }} />
                    <h3 style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 14, margin: 0 }}>Topics in {selectedSubject.name}</h3>
                    <span style={{ color: "#5A6B85", fontSize: 11, marginLeft: "auto" }}>{topics.length} available</span>
                  </div>
                  {loadingT ? (
                    <div style={{ textAlign: "center", padding: 32 }}><Spinner /></div>
                  ) : topics.length === 0 ? (
                    <div style={{ color: "#5A6B85", fontSize: 13, padding: "24px 20px" }}>No topics found.</div>
                  ) : (
                    <div style={{ maxHeight: 280, overflowY: "auto" }}>
                      {topics.map((t, i) => {
                        const sel = selectedTopic?.id === t.id;
                        const clr = subjectColors[selectedSubject.name] || "#C9A84C";
                        return (
                          <div key={t.id} onClick={() => handleSelectTopic(t)} style={{
                            padding: "12px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: sel ? `${clr}0a` : "transparent",
                            borderLeft: sel ? `3px solid ${clr}` : "3px solid transparent",
                            transition: "all 0.2s",
                          }}
                            onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                            onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div>
                              <div style={{ color: sel ? "#F1F5F9" : "#CBD5E1", fontWeight: sel ? 600 : 400, fontSize: 13 }}>{t.name}</div>
                              <div style={{ color: "#4A5568", fontSize: 11, marginTop: 2 }}>{t.subtopic_count} subtopics · {t.question_count} questions</div>
                            </div>
                            {sel ? (
                              <div style={{ width: 20, height: 20, borderRadius: 99, background: clr, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>✓</div>
                            ) : (
                              <span style={{ color: "#334155", fontSize: 12 }}>›</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* How Scoring Works — collapsible */}
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setShowScoring(p => !p)} style={{
                width: "100%", background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(201,168,76,0.06)", borderRadius: 12, padding: "14px 18px",
                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📊</span>
                  <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 500 }}>How Scoring Works</span>
                </div>
                <span style={{ color: "#4A5568", fontSize: 14, transform: showScoring ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
              </button>
              {showScoring && (
                <div style={{ background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(201,168,76,0.06)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "16px 18px", animation: "fadeIn 0.2s ease" }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 10 : 12 }}>
                    {[
                      { label: "NLP Analysis", pct: "70%", desc: "Semantic similarity, keywords, depth, structure", color: "#C9A84C" },
                      { label: "Voice Quality", pct: "20%", desc: "Pace, pronunciation, intonation + 6 more", color: "#22C55E" },
                      { label: "Face Analysis", pct: "10%", desc: "Eye contact, stability, engagement", color: "#3B82F6" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center", padding: "12px 8px" }}>
                        <div style={{ color: s.color, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{s.pct}</div>
                        <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ color: "#5A6B85", fontSize: 10, lineHeight: 1.4 }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Session Preview */}
          <div style={{ position: isMobile ? "relative" : "sticky", top: isMobile ? 0 : 24, alignSelf: "start" }}>
            <div style={{ background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: isMobile ? "14px 16px" : "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "linear-gradient(135deg, rgba(201,168,76,0.04), transparent)" }}>
                <h2 style={{ color: "#F1F5F9", fontWeight: 600, fontSize: isMobile ? 13 : 14, margin: 0 }}>Session Preview</h2>
              </div>

              <div style={{ padding: isMobile ? "14px 16px" : "16px 20px" }}>
                {/* Selection receipt */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  {/* Subject */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: selectedSubject ? `${subjectColors[selectedSubject.name] || "#C9A84C"}15` : "rgba(255,255,255,0.03)", border: `1px solid ${selectedSubject ? `${subjectColors[selectedSubject.name] || "#C9A84C"}30` : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {selectedSubject ? (subjectIcons[selectedSubject.name] || "📝") : "1"}
                    </div>
                    <div>
                      <div style={{ color: "#4A5568", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject</div>
                      <div style={{ color: selectedSubject ? "#F1F5F9" : "#334155", fontWeight: 500, fontSize: 13 }}>{selectedSubject?.name || "Not selected"}</div>
                    </div>
                    {selectedSubject && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 99, background: "#22C55E" }} />}
                  </div>

                  {/* Connector line */}
                  <div style={{ marginLeft: 13, width: 1, height: 8, background: selectedSubject ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)" }} />

                  {/* Topic */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: selectedTopic ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedTopic ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#5A6B85", flexShrink: 0 }}>
                      {selectedTopic ? "📋" : "2"}
                    </div>
                    <div>
                      <div style={{ color: "#4A5568", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Topic</div>
                      <div style={{ color: selectedTopic ? "#F1F5F9" : "#334155", fontWeight: 500, fontSize: 13 }}>{selectedTopic?.name || "Select a subject first"}</div>
                    </div>
                    {selectedTopic && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 99, background: "#22C55E" }} />}
                  </div>

                  {/* Connector */}
                  <div style={{ marginLeft: 13, width: 1, height: 8, background: selectedTopic ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)" }} />

                  {/* Subtopic */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#5A6B85", flexShrink: 0 }}>3</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#4A5568", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Subtopic</div>
                      {selectedTopic ? (
                        loadingST ? <Spinner /> : (
                          <select value={form.subtopic_id} onChange={e => setForm(f => ({ ...f, subtopic_id: e.target.value }))}
                            style={{ width: "100%", background: "#1A2038", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 6, padding: "6px 8px", color: "#F1F5F9", fontSize: 12 }}>
                            <option value="">Any Subtopic</option>
                            {subtopics.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                          </select>
                        )
                      ) : (
                        <div style={{ color: "#334155", fontSize: 12 }}>—</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Difficulty */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: "#5A6B85", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Difficulty</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {["beginner", "intermediate", "advanced", "expert"].map(d => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, difficulty: d }))} style={{
                        padding: "7px 0", borderRadius: 6, fontSize: 11, fontWeight: 500, textTransform: "capitalize",
                        background: form.difficulty === d ? diffColors[d] : "rgba(255,255,255,0.03)",
                        border: `1px solid ${form.difficulty === d ? diffColors[d] : "rgba(255,255,255,0.06)"}`,
                        color: form.difficulty === d ? "#fff" : "#5A6B85",
                        boxShadow: form.difficulty === d ? `0 0 12px ${diffColors[d]}25` : "none",
                        cursor: "pointer", transition: "all 0.2s",
                      }}>{d}</button>
                    ))}
                  </div>
                </div>

                {error && <div style={{ color: "#FCA5A5", fontSize: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", padding: "8px 10px", borderRadius: 8, marginBottom: 12 }}>{error}</div>}

                <button onClick={handleStartClick} disabled={starting || !selectedSubject || !selectedTopic}
                  onMouseEnter={e => { if (selectedSubject && selectedTopic) e.currentTarget.style.boxShadow = "0 0 28px rgba(99,102,241,0.5)"; }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.25)"}
                  style={{
                    width: "100%", background: (selectedSubject && selectedTopic) ? `linear-gradient(135deg, ${THEME.indigo}, #818CF8)` : "rgba(99,102,241,0.15)",
                    color: (selectedSubject && selectedTopic) ? "#fff" : "#5A6B85", fontWeight: 600, fontSize: 14, padding: "12px",
                    borderRadius: 8, border: "none", cursor: (selectedSubject && selectedTopic) ? "pointer" : "default",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.25)", transition: "all 0.3s",
                  }}>
                  {starting ? <Spinner /> : "Start Interview →"}
                </button>
              </div>
            </div>

            {/* Quick info */}
            <div style={{ marginTop: 14, background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(201,168,76,0.04)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "🎙", text: "Voice + Camera analysis during interview" },
                  { icon: "🤖", text: "AI-powered adaptive difficulty" },
                  { icon: "📄", text: "PDF report after each session" },
                ].map(t => (
                  <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12 }}>{t.icon}</span>
                    <span style={{ color: "#4A5568", fontSize: 11 }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
    {showGuidance && (
      <ExamGuidanceModal
        type="interview"
        onAccept={() => { setShowGuidance(false); startInterview(); }}
        onCancel={() => setShowGuidance(false)}
      />
    )}
    </>
  );
}


export default InterviewPage;
