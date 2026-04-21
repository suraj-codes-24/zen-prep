import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar as RechartsBar,
} from "recharts";
import { API, Bar, Spinner, THEME, useWindowSize } from "../shared";
import { SidebarLayout } from "./Sidebar";

function AnalyticsPage({ token, user, onNav, onLogout }) {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const [analytics, setAnalytics] = useState(null);
  const [commHistory, setCommHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState("interview");
  const [replaySession, setReplaySession] = useState(null);
  const [replayAnswers, setReplayAnswers] = useState([]);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayCoaching, setReplayCoaching] = useState(null);
  const [replayCoachLoading, setReplayCoachLoading] = useState(false);
  const [expandedQ, setExpandedQ] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/analytics/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setAnalytics(d); setLoading(false); }).catch(() => setLoading(false));
    fetch(`${API}/comm/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setCommHistory(d); }).catch(() => {});
  }, []);

  function scoreColor(s) {
    if (!s && s !== 0) return "#64748B";
    if (s >= 70) return "#22C55E";
    if (s >= 45) return "#F59E0B";
    return "#EF4444";
  }

  async function loadInterviewReplay(sessionId) {
    if (replaySession === sessionId) { setReplaySession(null); setReplayAnswers([]); setReplayCoaching(null); setExpandedQ(null); return; }
    setReplaySession(sessionId); setReplayAnswers([]); setReplayCoaching(null); setExpandedQ(null); setReplayLoading(true);
    try {
      const r = await fetch(`${API}/interview/sessions/${sessionId}/answers`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setReplayAnswers(d.answers || []); }
    } catch {}
    setReplayLoading(false);
  }

  async function fetchCoaching(sessionId) {
    setReplayCoachLoading(true);
    try {
      const r = await fetch(`${API}/ai/session-feedback`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ session_id: sessionId }) });
      if (r.ok) { const d = await r.json(); setReplayCoaching(d); }
    } catch {}
    setReplayCoachLoading(false);
  }

  async function downloadPDF(sessionId) {
    setPdfLoading(true);
    try { const r = await fetch(`${API}/reports/session/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `interview_report_${sessionId}.pdf`; a.click(); URL.revokeObjectURL(url); } } catch {}
    setPdfLoading(false);
  }

  async function downloadCommPDF(sessionId) {
    setPdfLoading(true);
    try { const r = await fetch(`${API}/reports/comm/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `comm_report_${sessionId}.pdf`; a.click(); URL.revokeObjectURL(url); } } catch {}
    setPdfLoading(false);
  }

  async function downloadGDPDF(sessionId) {
    setPdfLoading(true);
    try { const r = await fetch(`${API}/reports/gd/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `gd_report_${sessionId}.pdf`; a.click(); URL.revokeObjectURL(url); } } catch {}
    setPdfLoading(false);
  }

  // ── Interview data ──
  const recent = analytics?.recent_sessions || [];
  const subjectBreakdown = analytics?.subject_breakdown || {};
  const topicBreakdown = analytics?.topic_breakdown || {};
  const comm = analytics?.communication || {};
  const coding = analytics?.coding || {};
  const gd = analytics?.gd || {};

  const chartData = recent.length > 0
    ? [...recent].reverse().map((s, i) => ({ name: `S${i + 1}`, score: s.avg_score || 0, target: 75 }))
    : null;

  const subjectEntries = Object.entries(subjectBreakdown);
  const barData = subjectEntries.map(([k, v]) => ({ name: k, score: Math.round(v) }));
  const radarData = subjectEntries.length >= 3
    ? subjectEntries.slice(0, 5).map(([k, v]) => ({ subject: k.toUpperCase(), A: v }))
    : null;

  const allTopics = Object.entries(topicBreakdown).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value);

  const scoreBuckets = [
    { label: "80-100", color: "#22C55E", count: recent.filter(s => (s.avg_score || 0) >= 80).length },
    { label: "60-79", color: "#C9A84C", count: recent.filter(s => (s.avg_score || 0) >= 60 && (s.avg_score || 0) < 80).length },
    { label: "40-59", color: "#F59E0B", count: recent.filter(s => (s.avg_score || 0) >= 40 && (s.avg_score || 0) < 60).length },
    { label: "0-39", color: "#EF4444", count: recent.filter(s => (s.avg_score || 0) < 40).length },
  ];
  const maxBucket = Math.max(1, ...scoreBuckets.map(b => b.count));

  const diffColors = { beginner: "#22C55E", intermediate: "#F59E0B", advanced: "#C9A84C", expert: "#EF4444" };
  const diffScores = {};
  const diffCounts = {};
  for (const s of recent) {
    const d = s.difficulty || "beginner";
    diffScores[d] = (diffScores[d] || 0) + (s.avg_score || 0);
    diffCounts[d] = (diffCounts[d] || 0) + 1;
  }

  const commSections = comm.section_averages ? Object.entries(comm.section_averages) : [];
  const sectionNames = { A: "Read Aloud", B: "Repeat", C: "Short Answer", D: "Arrange", E: "Story Retell", F: "Open Question", G: "Describe Image", H: "Listening" };
  const hasAnyAnalyticsData =
    (analytics?.total_sessions ?? 0) > 0 ||
    (analytics?.total_answers ?? 0) > 0 ||
    (coding.total_sessions ?? 0) > 0 ||
    (comm.tests_taken ?? 0) > 0 ||
    (gd.total_sessions ?? 0) > 0;

  // ── Coding chart data ──
  const codingRecent = coding.recent_sessions || [];
  const codingChartData = codingRecent.length > 0
    ? [...codingRecent].reverse().map((s, i) => ({ name: `S${i + 1}`, score: s.score || 0, target: 75 }))
    : null;
  const companyBarData = Object.entries(coding.company_breakdown || {}).map(([k, v]) => ({ name: k, score: Math.round(v) }));
  const codingScoreBuckets = [
    { label: "80-100", color: "#22C55E", count: codingRecent.filter(s => (s.score || 0) >= 80).length },
    { label: "60-79", color: "#C9A84C", count: codingRecent.filter(s => (s.score || 0) >= 60 && (s.score || 0) < 80).length },
    { label: "40-59", color: "#F59E0B", count: codingRecent.filter(s => (s.score || 0) >= 40 && (s.score || 0) < 60).length },
    { label: "0-39", color: "#EF4444", count: codingRecent.filter(s => (s.score || 0) < 40).length },
  ];
  const codingMaxBucket = Math.max(1, ...codingScoreBuckets.map(b => b.count));
  const levelScores = {};
  const levelCounts = {};
  for (const s of codingRecent) {
    const l = `Level ${s.level || 1}`;
    levelScores[l] = (levelScores[l] || 0) + (s.score || 0);
    levelCounts[l] = (levelCounts[l] || 0) + 1;
  }

  // ── GD chart data ──
  const gdRecent = gd.recent_sessions || [];
  const gdChartData = gdRecent.length > 0
    ? [...gdRecent].reverse().map((s, i) => ({ name: `S${i + 1}`, score: s.overall_score || 0, target: 75 }))
    : null;
  const gdDimData = gd.dimension_averages
    ? Object.entries(gd.dimension_averages).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), score: Math.round(v) }))
    : [];
  const categoryColors = { Technology: "#6366F1", Business: "#22C55E", Society: "#F59E0B", Policy: "#EC4899", Abstract: "#06B6D4" };

  // ── Communication chart data ──
  const commCompleted = commHistory.filter(s => s.status === "completed");
  const commAvgScore = commCompleted.length > 0 ? Math.round(commCompleted.reduce((a, s) => a + (s.overall_score || 0), 0) / commCompleted.length) : 0;
  const commChartData = commHistory.length > 0
    ? commHistory.slice(0, 5).reverse().map((s, i) => ({ name: `T${i + 1}`, score: s.overall_score || 0, target: 75 }))
    : null;
  const sectionBarData = commSections.map(([k, v]) => ({ name: k, score: Math.round(v) }));
  const commScoreBuckets = [
    { label: "80-100", color: "#22C55E", count: commHistory.filter(s => (s.overall_score || 0) >= 80).length },
    { label: "60-79", color: "#C9A84C", count: commHistory.filter(s => (s.overall_score || 0) >= 60 && (s.overall_score || 0) < 80).length },
    { label: "40-59", color: "#F59E0B", count: commHistory.filter(s => (s.overall_score || 0) >= 40 && (s.overall_score || 0) < 60).length },
    { label: "0-39", color: "#EF4444", count: commHistory.filter(s => (s.overall_score || 0) < 40).length },
  ];
  const commMaxBucket = Math.max(1, ...commScoreBuckets.map(b => b.count));

  // ── Shared card/chart style helpers ──
  const cardStyle = (accent) => ({ background: "linear-gradient(135deg, #0F1629, #111A30)", border: `1px solid ${accent}10`, borderRadius: 14, padding: 24, position: "relative", overflow: "hidden" });
  const glowLine = (accent) => ({ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` });

  return (
    <SidebarLayout active="analytics" user={user} onNav={onNav} onLogout={onLogout} showUser>
      <div style={{ padding: isMobile ? "20px 16px" : "32px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", marginBottom: isMobile ? 20 : 28, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 0, animation: "fadeIn 0.5s ease" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, marginBottom: 6, background: "linear-gradient(135deg, #F1F5F9 30%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Performance Analytics</h1>
            <p style={{ color: "#7C8BA8", fontSize: isMobile ? 13 : 14 }}>Deep dive into your interview readiness and growth metrics.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><Spinner /></div>
        ) : (!analytics || !hasAnyAnalyticsData) ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, filter: "drop-shadow(0 0 8px rgba(201,168,76,0.3))" }}>📊</div>
            <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>No data yet</h3>
            <p style={{ color: "#5A6B85", fontSize: 14, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
              Complete your first session to see analytics.
            </p>
            <button onClick={() => onNav("interview_setup")} style={{ background: "linear-gradient(135deg, #C9A84C, #A68B3C)", color: "#fff", fontWeight: 600, padding: "10px 24px", borderRadius: 8, fontSize: 14, boxShadow: "0 4px 16px rgba(201,168,76,0.2)" }}>
              Start Your First Interview
            </button>
          </div>
        ) : (
          <>
            {/* ── Tab Bar ── */}
            <div style={{ display: "flex", gap: isMobile ? 2 : 4, marginBottom: isMobile ? 16 : 20, background: "linear-gradient(135deg, #0F1629, #111A30)", borderRadius: 12, padding: 4, border: "1px solid rgba(201,168,76,0.06)", overflowX: "auto" }}>
              {[
                { id: "interview", label: "Interview", icon: "◉", color: "#C9A84C", count: analytics?.total_sessions ?? 0 },
                { id: "coding", label: "Coding", icon: "💻", color: "#22C55E", count: coding.total_sessions ?? 0 },
                { id: "comm", label: "Communication", icon: "🎤", color: "#F59E0B", count: comm.tests_taken ?? 0 },
                { id: "gd", label: "Group Discussion", icon: "💬", color: "#06B6D4", count: gd.total_sessions ?? 0 },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setReplaySession(null); setReplayAnswers([]); setReplayCoaching(null); setExpandedQ(null); setShowAll(false); }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 6 : 8, padding: isMobile ? "10px 12px" : "12px 16px", borderRadius: 8, fontSize: isMobile ? 11 : 13, fontWeight: activeTab === tab.id ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap",
                    background: activeTab === tab.id ? `linear-gradient(135deg, ${tab.color}15, ${tab.color}08)` : "transparent",
                    color: activeTab === tab.id ? tab.color : "#5A6B85",
                    border: activeTab === tab.id ? `1px solid ${tab.color}25` : "1px solid transparent",
                    boxShadow: activeTab === tab.id ? `0 0 16px ${tab.color}20` : "none",
                    transition: "all 0.2s",
                  }}>
                  <span>{tab.icon}</span> {isMobile ? tab.label.slice(0, 4) : tab.label}
                  <span style={{ background: `${tab.color}15`, color: tab.color, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4 }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* ═══════════════════ INTERVIEW TAB ═══════════════════ */}
            {activeTab === "interview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, animation: "fadeIn 0.3s ease" }}>
                {analytics?.total_sessions > 0 ? (
                  <>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14 }}>
                      {[
                        { label: "Total Sessions", value: analytics?.total_sessions ?? 0, icon: "📋", color: "#C9A84C", sub: `${analytics?.completed_sessions ?? 0} completed` },
                        { label: "Avg Score", value: `${analytics?.avg_total_score ?? 0}%`, icon: "🎯", color: "#22C55E", sub: `NLP: ${analytics?.avg_nlp_score ?? 0}%` },
                        { label: "Best Score", value: `${analytics?.best_score ?? 0}%`, icon: "🏆", color: "#F59E0B", sub: analytics?.performance || "" },
                        { label: "Completion", value: `${analytics?.completion_rate ?? 0}%`, icon: "✓", color: "#E2C97E", sub: `${analytics?.completed_sessions ?? 0}/${analytics?.total_sessions ?? 0}` },
                      ].map((s, idx) => (
                        <div key={s.label} className="hover-lift" style={{ ...cardStyle(s.color), padding: "16px 18px", animation: `fadeInUp 0.4s ease ${idx * 0.05}s both` }}>
                          <div style={glowLine(s.color)} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ color: "#7C8BA8", fontSize: 11, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 3, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
                              <div style={{ color: "#4A5568", fontSize: 11 }}>{s.sub}</div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{s.icon}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Score Trend + Subject Performance */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: isMobile ? 12 : 16 }}>
                      <div style={cardStyle("#C9A84C")}>
                        <div style={glowLine("#C9A84C")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Score Trend</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Performance over sessions</p>
                        {chartData ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }} />
                              <Area type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={2} fill="url(#intGrad)" dot={{ fill: "#C9A84C", r: 3 }} />
                              <Area type="monotone" dataKey="target" stroke="#334155" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: isMobile ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>📈 Complete interviews to see trend</div>
                        )}
                      </div>

                      <div style={cardStyle("#C9A84C")}>
                        <div style={glowLine("#C9A84C")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Subject Performance</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Average score by subject</p>
                        {barData.length >= 2 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                            <BarChart data={barData}>
                              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }} />
                              <RechartsBar dataKey="score" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: isMobile ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>📊 Practice more subjects to compare</div>
                        )}
                      </div>
                    </div>

                    {/* Topic Mastery + Skills Radar */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16 }}>
                      <div style={cardStyle("#C9A84C")}>
                        <div style={glowLine("#C9A84C")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Topic Mastery</h3>
                        {allTopics.length > 0 ? (
                          <>
                            <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 8 }}>
                              {allTopics.map(t => {
                                const c = t.value >= 80 ? "#22C55E" : t.value >= 60 ? "#C9A84C" : "#F59E0B";
                                return (
                                  <div key={t.name}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                      <span style={{ color: "#F1F5F9" }}>{t.name}</span>
                                      <span style={{ color: c, fontWeight: 600 }}>{t.value}%</span>
                                    </div>
                                    <Bar value={t.value} color={c} />
                                  </div>
                                );
                              })}
                            </div>
                            {analytics?.weakest_topic && analytics.weakest_topic !== "N/A" && (
                              <div style={{ marginTop: 14, background: "rgba(201,168,76,0.08)", borderRadius: 8, padding: "10px 14px" }}>
                                <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>FOCUS AREA</div>
                                <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.5 }}>
                                  Practice <strong style={{ color: "#fff" }}>{analytics.weakest_topic}</strong> to boost your overall score.
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>🎯 Submit answers to see mastery</div>
                        )}
                      </div>

                      <div style={cardStyle("#C9A84C")}>
                        <div style={glowLine("#C9A84C")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Skills Profile</h3>
                        <p style={{ color: "#5A6B85", fontSize: 12, marginBottom: 4 }}>Performance by subject area</p>
                        {radarData ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="rgba(255,255,255,0.07)" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 9 }} />
                              <Radar name="Skills" dataKey="A" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.3} isAnimationActive={false} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>🕸 Practice 3+ subjects for radar</div>
                        )}
                      </div>
                    </div>

                    {/* Score Distribution + Difficulty */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={cardStyle("#22C55E")}>
                        <div style={glowLine("#22C55E")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Score Distribution</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {scoreBuckets.map(b => (
                            <div key={b.label}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                <span style={{ color: "#94A3B8" }}>{b.label}</span>
                                <span style={{ color: b.color, fontWeight: 600 }}>{b.count} session{b.count !== 1 ? "s" : ""}</span>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                                <div style={{ width: `${(b.count / maxBucket) * 100}%`, height: "100%", background: b.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={cardStyle("#F59E0B")}>
                        <div style={glowLine("#F59E0B")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Difficulty Performance</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {["beginner", "intermediate", "advanced", "expert"].map(d => {
                            const avg = diffCounts[d] ? Math.round(diffScores[d] / diffCounts[d]) : 0;
                            const c = diffColors[d];
                            return (
                              <div key={d}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                  <span style={{ color: "#F1F5F9", textTransform: "capitalize" }}>{d}</span>
                                  <span style={{ color: c, fontWeight: 600 }}>{diffCounts[d] ? `${avg}%` : "—"}</span>
                                </div>
                                <Bar value={avg} color={c} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Session History */}
                    <div style={cardStyle("#C9A84C")}>
                      <div style={glowLine("#C9A84C")} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15 }}>Session History</h3>
                        <span style={{ background: "rgba(201,168,76,0.15)", color: "#E2C97E", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>{recent.length} sessions</span>
                      </div>
                      <p style={{ color: "#5A6B85", fontSize: 12, marginBottom: 14 }}>Click any session to view detailed replay</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(showAll ? recent : recent.slice(0, 5)).map((s, i) => {
                          const isReplay = replaySession === s.session_id;
                          return (
                            <div key={s.session_id || i}>
                              <div onClick={() => { loadInterviewReplay(s.session_id); }}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: isReplay ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.02)", borderRadius: 10, border: isReplay ? "1px solid rgba(201,168,76,0.15)" : "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { if (!isReplay) e.currentTarget.style.background = "rgba(201,168,76,0.05)"; }} onMouseLeave={e => { if (!isReplay) e.currentTarget.style.background = isReplay ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.02)"; }}>
                                <span style={{ color: "#5A6B85", fontSize: 11, flex: "0 0 80px" }}>{s.date}</span>
                                <span style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 500, flex: 1 }}>{s.subject} — {s.difficulty}</span>
                                <div style={{ width: 50 }}><Bar value={s.avg_score ?? 0} color="#C9A84C" /></div>
                                <span style={{ color: scoreColor(s.avg_score ?? 0), fontWeight: 700, fontSize: 14, width: 32, textAlign: "right" }}>{Math.round(s.avg_score ?? 0)}</span>
                                {s.status === "active" && <span style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>ACTIVE</span>}
                                <button onClick={e => { e.stopPropagation(); downloadPDF(s.session_id); }} disabled={pdfLoading}
                                  style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", color: "#C9A84C", fontWeight: 600, padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: pdfLoading ? "default" : "pointer" }}>PDF</button>
                                <span style={{ color: "#475569", fontSize: 14, transform: isReplay ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
                              </div>
                              {isReplay && (
                                <div style={{ padding: "12px 0 4px", animation: "fadeIn 0.3s ease" }}>
                                  {replayLoading ? (
                                    <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>
                                  ) : (
                                    <>
                                      {/* Stats bar */}
                                      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                                        {[
                                          { l: "Questions", v: replayAnswers.length },
                                          { l: "Avg Score", v: replayAnswers.length > 0 ? `${Math.round(replayAnswers.reduce((a, q) => a + (q.total_score || 0), 0) / replayAnswers.length)}%` : "—" },
                                          { l: "Best", v: replayAnswers.length > 0 ? `${Math.round(Math.max(...replayAnswers.map(q => q.total_score || 0)))}%` : "—" },
                                        ].map(st => (
                                          <div key={st.l} style={{ flex: 1, background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                                            <div style={{ color: "#5A6B85", fontSize: 10, marginBottom: 2 }}>{st.l}</div>
                                            <div style={{ color: "#E2C97E", fontWeight: 700, fontSize: 16 }}>{st.v}</div>
                                          </div>
                                        ))}
                                      </div>
                                      {/* AI Coaching */}
                                      {!replayCoaching && !replayCoachLoading && (
                                        <button onClick={() => fetchCoaching(s.session_id)} style={{ width: "100%", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", color: "#C9A84C", fontWeight: 600, padding: "8px", borderRadius: 8, fontSize: 12, cursor: "pointer", marginBottom: 10 }}>
                                          🤖 Load AI Coaching Summary
                                        </button>
                                      )}
                                      {replayCoachLoading && <div style={{ textAlign: "center", padding: 12 }}><Spinner /></div>}
                                      {replayCoaching && (
                                        <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                            {[
                                              { title: "Strengths", items: replayCoaching.strengths, color: "#22C55E" },
                                              { title: "Weaknesses", items: replayCoaching.weaknesses, color: "#EF4444" },
                                              { title: "Action Items", items: replayCoaching.action_items, color: "#F59E0B" },
                                            ].map(sec => (
                                              <div key={sec.title}>
                                                <div style={{ color: sec.color, fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{sec.title}</div>
                                                {(sec.items || []).map((item, j) => (
                                                  <div key={j} style={{ color: "#94A3B8", fontSize: 11, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${sec.color}30` }}>{item}</div>
                                                ))}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {/* Q&A list */}
                                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {replayAnswers.map((q, qi) => {
                                          const isExp = expandedQ === `a-${qi}`;
                                          return (
                                            <div key={qi}>
                                              <div onClick={() => setExpandedQ(isExp ? null : `a-${qi}`)}
                                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: isExp ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
                                                <span style={{ color: "#5A6B85", fontSize: 11, fontWeight: 600, width: 24 }}>Q{qi + 1}</span>
                                                <span style={{ color: "#CBD5E1", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question_text}</span>
                                                <span style={{ color: scoreColor(q.total_score || 0), fontWeight: 700, fontSize: 13 }}>{Math.round(q.total_score || 0)}%</span>
                                                <span style={{ color: "#475569", fontSize: 11, transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
                                              </div>
                                              {isExp && (
                                                <div style={{ padding: "10px 12px 6px 46px", animation: "fadeIn 0.2s ease" }}>
                                                  <div style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 11 }}>
                                                    <span style={{ color: "#7C8BA8" }}>NLP: <strong style={{ color: scoreColor(q.nlp_score) }}>{Math.round(q.nlp_score || 0)}%</strong></span>
                                                    <span style={{ color: "#7C8BA8" }}>Voice: <strong style={{ color: scoreColor(q.voice_score) }}>{Math.round(q.voice_score || 0)}%</strong></span>
                                                    <span style={{ color: "#7C8BA8" }}>Face: <strong style={{ color: scoreColor(q.face_score) }}>{Math.round(q.face_score || 0)}%</strong></span>
                                                  </div>
                                                  {q.answer_text && <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6, padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 6, borderLeft: "2px solid #334155" }}>{q.answer_text}</div>}
                                                  {q.ai_feedback && <div style={{ color: "#7C8BA8", fontSize: 11, fontStyle: "italic", padding: "4px 10px", borderLeft: "2px solid rgba(201,168,76,0.3)" }}>💡 {q.ai_feedback}</div>}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {recent.length > 5 && (
                        <button onClick={() => setShowAll(!showAll)} style={{ width: "100%", marginTop: 12, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.1)", color: "#C9A84C", fontWeight: 600, padding: "8px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                          {showAll ? "Show Less" : `Show All (${recent.length})`}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ ...cardStyle("#C9A84C"), padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>◉</div>
                    <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No interview sessions yet</h3>
                    <p style={{ color: "#5A6B85", fontSize: 13, marginBottom: 20 }}>Start a mock interview to see your performance analytics.</p>
                    <button onClick={() => onNav("interview_setup")} style={{ background: "linear-gradient(135deg, #C9A84C, #A68B3C)", color: "#fff", fontWeight: 600, padding: "10px 24px", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer" }}>Start Interview</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════ CODING TAB ═══════════════════ */}
            {activeTab === "coding" && (
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, animation: "fadeIn 0.3s ease" }}>
                {coding.total_sessions > 0 ? (
                  <>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14 }}>
                      {[
                        { label: "Total Sessions", value: coding.total_sessions ?? 0, icon: "💻", color: "#22C55E", sub: `${coding.completed_sessions ?? 0} completed` },
                        { label: "Avg Score", value: `${coding.avg_score ?? 0}%`, icon: "🎯", color: "#22C55E", sub: `${coding.completed_sessions ?? 0} scored` },
                        { label: "Best Score", value: `${coding.best_score ?? 0}%`, icon: "🏆", color: "#F59E0B", sub: coding.best_score >= 80 ? "Excellent" : coding.best_score >= 60 ? "Good" : "Keep going" },
                        { label: "Completed", value: `${coding.completed_sessions ?? 0}`, icon: "✓", color: "#E2C97E", sub: `of ${coding.total_sessions ?? 0} started` },
                      ].map((s, idx) => (
                        <div key={s.label} className="hover-lift" style={{ ...cardStyle(s.color), padding: "16px 18px", animation: `fadeInUp 0.4s ease ${idx * 0.05}s both` }}>
                          <div style={glowLine(s.color)} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ color: "#7C8BA8", fontSize: 11, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 3, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
                              <div style={{ color: "#4A5568", fontSize: 11 }}>{s.sub}</div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{s.icon}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Score Trend + Company Performance */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: isMobile ? 12 : 16 }}>
                      <div style={cardStyle("#22C55E")}>
                        <div style={glowLine("#22C55E")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Score Trend</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Performance over coding sessions</p>
                        {codingChartData ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                            <AreaChart data={codingChartData}>
                              <defs>
                                <linearGradient id="codGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }} />
                              <Area type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={2} fill="url(#codGrad)" dot={{ fill: "#22C55E", r: 3 }} />
                              <Area type="monotone" dataKey="target" stroke="#334155" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: isMobile ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>📈 Complete sessions to see trend</div>
                        )}
                      </div>

                      <div style={cardStyle("#22C55E")}>
                        <div style={glowLine("#22C55E")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Company Performance</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Average score by company</p>
                        {companyBarData.length >= 2 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                            <BarChart data={companyBarData}>
                              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }} />
                              <RechartsBar dataKey="score" fill="#22C55E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: isMobile ? 200 : 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748B", gap: 8 }}>
                            <span style={{ fontSize: 28 }}>🏢</span>
                            <span style={{ fontSize: 13 }}>Complete more companies to compare</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score Distribution + Level Performance */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16 }}>
                      <div style={cardStyle("#22C55E")}>
                        <div style={glowLine("#22C55E")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Score Distribution</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {codingScoreBuckets.map(b => (
                            <div key={b.label}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                <span style={{ color: "#94A3B8" }}>{b.label}</span>
                                <span style={{ color: b.color, fontWeight: 600 }}>{b.count} session{b.count !== 1 ? "s" : ""}</span>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                                <div style={{ width: `${(b.count / codingMaxBucket) * 100}%`, height: "100%", background: b.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={cardStyle("#22C55E")}>
                        <div style={glowLine("#22C55E")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Level Performance</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {Object.keys(levelScores).length > 0 ? Object.keys(levelScores).sort().map(l => {
                            const avg = Math.round(levelScores[l] / levelCounts[l]);
                            const c = avg >= 80 ? "#22C55E" : avg >= 60 ? "#C9A84C" : "#F59E0B";
                            return (
                              <div key={l}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                  <span style={{ color: "#F1F5F9" }}>{l}</span>
                                  <span style={{ color: c, fontWeight: 600 }}>{avg}% <span style={{ color: "#5A6B85", fontWeight: 400 }}>({levelCounts[l]})</span></span>
                                </div>
                                <Bar value={avg} color={c} />
                              </div>
                            );
                          }) : (
                            <div style={{ color: "#64748B", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Complete sessions to see level breakdown</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Session List */}
                    <div style={cardStyle("#22C55E")}>
                      <div style={glowLine("#22C55E")} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15 }}>Recent Coding Sessions</h3>
                        <span style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>{codingRecent.length} sessions</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {codingRecent.slice(0, showAll ? 20 : 5).map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(34,197,94,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)", transition: "all 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,0.02)"}>
                            <span style={{ color: "#5A6B85", fontSize: 11, flex: "0 0 80px" }}>{s.date}</span>
                            <span style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 500, flex: 1 }}>{s.company} — L{s.level} ({s.topic})</span>
                            <div style={{ width: 50 }}><Bar value={s.score ?? 0} color="#22C55E" /></div>
                            <span style={{ color: s.score != null ? scoreColor(s.score) : "#4A5568", fontWeight: 700, fontSize: 14, width: 32, textAlign: "right" }}>{s.score != null ? `${Math.round(s.score)}` : "—"}</span>
                            {s.status === "active" && <span style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>ACTIVE</span>}
                          </div>
                        ))}
                      </div>
                      {codingRecent.length > 5 && (
                        <button onClick={() => setShowAll(!showAll)} style={{ width: "100%", marginTop: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)", color: "#22C55E", fontWeight: 600, padding: "8px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                          {showAll ? "Show Less" : `Show All (${codingRecent.length})`}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ ...cardStyle("#22C55E"), padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💻</div>
                    <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No coding sessions yet</h3>
                    <p style={{ color: "#5A6B85", fontSize: 13, marginBottom: 20 }}>Start a coding challenge to see your performance here.</p>
                    <button onClick={() => onNav("coding")} style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", color: "#fff", fontWeight: 600, padding: "10px 24px", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer" }}>Start Coding Challenge</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════ COMMUNICATION TAB ═══════════════════ */}
            {activeTab === "comm" && (
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, animation: "fadeIn 0.3s ease" }}>
                {comm.tests_taken > 0 ? (
                  <>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14 }}>
                      {[
                        { label: "Tests Taken", value: comm.tests_taken ?? 0, icon: "🎤", color: "#F59E0B", sub: `${commCompleted.length} completed` },
                        { label: "Avg Score", value: `${commAvgScore}%`, icon: "🎯", color: "#22C55E", sub: `Latest: ${comm.latest_score ?? 0}%` },
                        { label: "Best Score", value: `${comm.best_score ?? 0}%`, icon: "🏆", color: "#F59E0B", sub: comm.best_score >= 80 ? "Excellent" : comm.best_score >= 60 ? "Good" : "Keep going" },
                        { label: "Latest Band", value: comm.latest_band ?? "N/A", icon: "🎖", color: "#E2C97E", sub: `Score: ${comm.latest_score ?? 0}%` },
                      ].map((s, idx) => (
                        <div key={s.label} className="hover-lift" style={{ ...cardStyle(s.color), padding: "16px 18px", animation: `fadeInUp 0.4s ease ${idx * 0.05}s both` }}>
                          <div style={glowLine(s.color)} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ color: "#7C8BA8", fontSize: 11, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 3, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
                              <div style={{ color: "#4A5568", fontSize: 11 }}>{s.sub}</div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{s.icon}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Score Trend + Section Performance */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: isMobile ? 12 : 16 }}>
                      <div style={cardStyle("#F59E0B")}>
                        <div style={glowLine("#F59E0B")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Score Trend</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Performance over communication tests</p>
                        {commChartData ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                            <AreaChart data={commChartData}>
                              <defs>
                                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }} />
                              <Area type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={2} fill="url(#commGrad)" dot={{ fill: "#F59E0B", r: 3 }} />
                              <Area type="monotone" dataKey="target" stroke="#334155" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: isMobile ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>📈 Complete tests to see trend</div>
                        )}
                      </div>

                      <div style={cardStyle("#F59E0B")}>
                        <div style={glowLine("#F59E0B")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Section Performance</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Average score by section (A-H)</p>
                        {sectionBarData.length >= 2 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                            <BarChart data={sectionBarData}>
                              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }} />
                              <RechartsBar dataKey="score" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: isMobile ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>📊 Complete tests to see section breakdown</div>
                        )}
                      </div>
                    </div>

                    {/* Section Mastery + Score Distribution */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16 }}>
                      <div style={cardStyle("#F59E0B")}>
                        <div style={glowLine("#F59E0B")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Section Mastery</h3>
                        {commSections.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {commSections.map(([sec, score]) => {
                              const v = Math.round(score);
                              const c = v >= 80 ? "#22C55E" : v >= 60 ? "#C9A84C" : "#F59E0B";
                              return (
                                <div key={sec}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                    <span style={{ color: "#F1F5F9" }}>Section {sec} — {sectionNames[sec] || sec}</span>
                                    <span style={{ color: c, fontWeight: 600 }}>{v}%</span>
                                  </div>
                                  <Bar value={v} color={c} height={5} />
                                </div>
                              );
                            })}
                            {(() => {
                              const weakest = commSections.reduce((a, b) => a[1] < b[1] ? a : b, commSections[0]);
                              if (weakest) return (
                                <div style={{ marginTop: 8, background: "rgba(245,158,11,0.08)", borderRadius: 8, padding: "10px 14px" }}>
                                  <div style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>FOCUS AREA</div>
                                  <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.5 }}>
                                    Practice <strong style={{ color: "#fff" }}>Section {weakest[0]} ({sectionNames[weakest[0]]})</strong> to boost your overall score.
                                  </p>
                                </div>
                              );
                              return null;
                            })()}
                          </div>
                        ) : (
                          <div style={{ color: "#64748B", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Complete tests to see section mastery</div>
                        )}
                      </div>

                      <div style={cardStyle("#F59E0B")}>
                        <div style={glowLine("#F59E0B")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Score Distribution</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {commScoreBuckets.map(b => (
                            <div key={b.label}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                <span style={{ color: "#94A3B8" }}>{b.label}</span>
                                <span style={{ color: b.color, fontWeight: 600 }}>{b.count} test{b.count !== 1 ? "s" : ""}</span>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                                <div style={{ width: `${(b.count / commMaxBucket) * 100}%`, height: "100%", background: b.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Session List */}
                    <div style={cardStyle("#F59E0B")}>
                      <div style={glowLine("#F59E0B")} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15 }}>Recent Communication Tests</h3>
                        <span style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>{commHistory.length} tests</span>
                      </div>
                      <p style={{ color: "#5A6B85", fontSize: 12, marginBottom: 14 }}>Click any session to view section scores and voice breakdown</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {commHistory.map((s, i) => {
                          const isReplay = replaySession === `comm-${s.id}`;
                          return (
                            <div key={s.id || i}>
                              <div onClick={() => { if (isReplay) { setReplaySession(null); } else { setReplaySession(`comm-${s.id}`); } }}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: isReplay ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.02)", borderRadius: 10, border: isReplay ? "1px solid rgba(245,158,11,0.15)" : "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { if (!isReplay) e.currentTarget.style.background = "rgba(245,158,11,0.05)"; }} onMouseLeave={e => { if (!isReplay) e.currentTarget.style.background = isReplay ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.02)"; }}>
                                <span style={{ color: "#5A6B85", fontSize: 11, flex: "0 0 80px" }}>{s.date || (s.start_time ? s.start_time.split("T")[0] : "—")}</span>
                                <span style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 500, flex: 1 }}>Band: {s.band || "—"}</span>
                                <div style={{ width: 50 }}><Bar value={s.overall_score ?? 0} color="#F59E0B" /></div>
                                <span style={{ color: scoreColor(s.overall_score ?? 0), fontWeight: 700, fontSize: 14, width: 32, textAlign: "right" }}>{Math.round(s.overall_score ?? 0)}</span>
                                {s.status === "active" && <span style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>ACTIVE</span>}
                                <button onClick={e => { e.stopPropagation(); downloadCommPDF(s.id); }} disabled={pdfLoading}
                                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#F59E0B", fontWeight: 600, padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: pdfLoading ? "default" : "pointer" }}>PDF</button>
                                <span style={{ color: "#475569", fontSize: 14, transform: isReplay ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
                              </div>
                              {isReplay && (
                                <div style={{ padding: "12px 0 4px", animation: "fadeIn 0.3s ease" }}>
                                  {s.section_scores && Object.keys(s.section_scores).length > 0 ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                                      {Object.entries(s.section_scores).map(([sec, score]) => {
                                        const v = Math.round(score);
                                        const c = v >= 80 ? "#22C55E" : v >= 60 ? "#C9A84C" : "#F59E0B";
                                        return (
                                          <div key={sec} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                                            <div style={{ color: "#5A6B85", fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>Section {sec} — {sectionNames[sec] || sec}</div>
                                            <div style={{ color: c, fontWeight: 700, fontSize: 16 }}>{v}%</div>
                                            <Bar value={v} color={c} height={3} />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div style={{ textAlign: "center", padding: "12px 0", color: "#5A6B85", fontSize: 12 }}>No section scores available for this session.</div>
                                  )}
                                  {s.voice_breakdown && (
                                    <div style={{ marginTop: 10, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "10px 12px" }}>
                                      <div style={{ color: "#5A6B85", fontSize: 10, marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>Voice Breakdown</div>
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                                        {Object.entries(s.voice_breakdown).map(([k, v]) => (
                                          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                            <span style={{ color: "#7C8BA8", textTransform: "capitalize" }}>{k}</span>
                                            <span style={{ color: scoreColor(v), fontWeight: 600 }}>{Math.round(v)}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ ...cardStyle("#F59E0B"), padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
                    <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No communication tests yet</h3>
                    <p style={{ color: "#5A6B85", fontSize: 13, marginBottom: 20 }}>Take a Versant-style communication test to track your performance.</p>
                    <button onClick={() => onNav("communication")} style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#fff", fontWeight: 600, padding: "10px 24px", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer" }}>Start Communication Test</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════ GD TAB ═══════════════════ */}
            {activeTab === "gd" && (
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, animation: "fadeIn 0.3s ease" }}>
                {(gd.total_sessions ?? 0) > 0 ? (
                  <>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14 }}>
                      {[
                        { label: "Total Sessions", value: gd.total_sessions ?? 0, icon: "💬", color: "#06B6D4", sub: "completed GDs" },
                        { label: "Avg Score", value: `${gd.avg_score ?? 0}%`, icon: "🎯", color: "#22C55E", sub: `Best: ${gd.best_score ?? 0}%` },
                        { label: "Latest Score", value: `${gd.latest_score ?? 0}%`, icon: "📈", color: "#6366F1", sub: `Band: ${gd.latest_band ?? "—"}` },
                        { label: "Latest Band", value: gd.latest_band ?? "N/A", icon: "🎖", color: "#F59E0B", sub: `Score: ${gd.latest_score ?? 0}%` },
                      ].map((s, idx) => (
                        <div key={s.label} className="hover-lift" style={{ ...cardStyle(s.color), padding: "16px 18px", animation: `fadeInUp 0.4s ease ${idx * 0.05}s both` }}>
                          <div style={glowLine(s.color)} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ color: "#7C8BA8", fontSize: 11, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 3, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
                              <div style={{ color: "#4A5568", fontSize: 11 }}>{s.sub}</div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{s.icon}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Score Trend + Dimension Radar */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: isMobile ? 12 : 16 }}>
                      <div style={cardStyle("#06B6D4")}>
                        <div style={glowLine("#06B6D4")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Score Trend</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Performance over GD sessions</p>
                        {gdChartData ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                            <AreaChart data={gdChartData}>
                              <defs>
                                <linearGradient id="gdGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#0F1629", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 8, fontSize: 11 }} />
                              <Area type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={2} fill="url(#gdGrad)" />
                              <Area type="monotone" dataKey="target" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" strokeWidth={1} fill="none" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ height: isMobile ? 200 : 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6B85", fontSize: 13 }}>Not enough data</div>
                        )}
                      </div>

                      <div style={cardStyle("#6366F1")}>
                        <div style={glowLine("#6366F1")} />
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: isMobile ? 13 : 15, marginBottom: 4 }}>Dimension Averages</h3>
                        <p style={{ color: "#5A6B85", fontSize: isMobile ? 11 : 12, marginBottom: 16 }}>Across all GD sessions</p>
                        {gdDimData.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {gdDimData.map(({ name, score }) => {
                              const c = score >= 70 ? "#22C55E" : score >= 45 ? "#F59E0B" : "#EF4444";
                              return (
                                <div key={name}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: "#94A3B8" }}>{name}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{score}%</span>
                                  </div>
                                  <Bar value={score} color={c} height={5} />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6B85", fontSize: 13 }}>No dimension data</div>
                        )}
                      </div>
                    </div>

                    {/* Recent Sessions */}
                    <div style={cardStyle("#06B6D4")}>
                      <div style={glowLine("#06B6D4")} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15 }}>Recent Group Discussions</h3>
                        <span style={{ background: "rgba(6,182,212,0.15)", color: "#06B6D4", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>{gd.total_sessions} sessions</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {gdRecent.map((s, i) => {
                          const catColor = categoryColors[s.category] || "#94A3B8";
                          const sc = s.overall_score ?? 0;
                          return (
                            <div key={s.session_id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(6,182,212,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)" }}>
                              <span style={{ color: "#5A6B85", fontSize: 11, flex: "0 0 80px" }}>{s.date || "—"}</span>
                              <span style={{ background: `${catColor}15`, color: catColor, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flex: "0 0 70px", textAlign: "center" }}>{s.category || "—"}</span>
                              <span style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.topic || "—"}</span>
                              <span style={{ color: "#5A6B85", fontSize: 11, flex: "0 0 50px", textAlign: "center" }}>{s.bot_count} bots</span>
                              <div style={{ width: 50 }}><Bar value={sc} color="#06B6D4" /></div>
                              <span style={{ color: scoreColor(sc), fontWeight: 700, fontSize: 14, width: 32, textAlign: "right" }}>{Math.round(sc)}</span>
                              <span style={{ background: "rgba(6,182,212,0.1)", color: "#06B6D4", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{s.band || "—"}</span>
                              <button onClick={() => downloadGDPDF(s.session_id)} disabled={pdfLoading}
                                style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", color: "#06B6D4", fontWeight: 600, padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: pdfLoading ? "default" : "pointer" }}>PDF</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ ...cardStyle("#06B6D4"), padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                    <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No group discussions yet</h3>
                    <p style={{ color: "#5A6B85", fontSize: 13, marginBottom: 20 }}>Practice GD topics with AI bots to build your discussion skills.</p>
                    <button onClick={() => onNav("gd")} style={{ background: "linear-gradient(135deg, #06B6D4, #0891B2)", color: "#fff", fontWeight: 600, padding: "10px 24px", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer" }}>Start Group Discussion</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}


export default AnalyticsPage;
