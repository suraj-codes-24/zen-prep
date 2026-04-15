import { useState, useEffect } from "react";
import { API, Bar, Spinner, THEME } from "../shared";
import { SidebarLayout } from "./Sidebar";

function DashboardPage({ token, user, onNav, onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [commHistory, setCommHistory] = useState([]);
  const [loadingA, setLoadingA] = useState(true);

  useEffect(() => {
    fetch(`${API}/analytics/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) onLogout(); return r.json(); })
      .then(d => { setAnalytics(d); setLoadingA(false); })
      .catch(() => setLoadingA(false));
    fetch(`${API}/comm/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setCommHistory(d); }).catch(() => {});
  }, []);

  function scoreColor(s) {
    if (!s && s !== 0) return "#64748B";
    if (s >= 70) return "#22C55E";
    if (s >= 45) return "#F59E0B";
    return "#EF4444";
  }

  const codingS = analytics?.coding || {};
  const commS = analytics?.communication || {};
  const gdS = analytics?.gd || {};
  const totalAll = (analytics?.total_sessions ?? 0) + (codingS.total_sessions ?? 0) + (commS.tests_taken ?? 0) + (gdS.total_sessions ?? 0);
  const completedAll = (analytics?.completed_sessions ?? 0) + (codingS.completed_sessions ?? 0);

  const features = [
    { id: "interview_setup", icon: "◉", title: "Interview", desc: "Practice AI-driven mock interviews", color: THEME.indigo },
    { id: "coding", icon: "💻", title: "Coding", desc: "Solve problems with Monaco editor", color: THEME.green },
    { id: "communication", icon: "🎤", title: "Comm Test", desc: "Versant-style communication test", color: THEME.amber },
    { id: "gd", icon: "🎭", title: "GD Room", desc: "Group discussion with AI bots", color: THEME.cyan },
    { id: "career", icon: "📄", title: "Career AI", desc: "Resume analysis & JD gap finder", color: THEME.purple },
    { id: "analytics", icon: "▦", title: "Analytics", desc: "Track your performance trends", color: "#A78BFA" },
  ];

  // Merge recent activity from all sources, sorted by date
  const recentActivity = [];
  (analytics?.recent_sessions || []).forEach(s => {
    recentActivity.push({ type: "interview", date: s.date, label: s.subject || "Interview", score: s.avg_score, difficulty: s.difficulty, status: s.status });
  });
  (codingS.recent_sessions || []).forEach(s => {
    recentActivity.push({ type: "coding", date: s.date, label: `${s.company} — L${s.level}`, score: s.score, status: s.status });
  });
  commHistory.slice(0, 5).forEach(s => {
    recentActivity.push({ type: "comm", date: s.date || (s.start_time ? s.start_time.split("T")[0] : "—"), label: `Band: ${s.band || "—"}`, score: s.overall_score, status: s.status });
  });
  (gdS.recent_sessions || []).forEach(s => {
    recentActivity.push({ type: "gd", date: s.date, label: s.topic || "Group Discussion", score: s.overall_score, status: "completed" });
  });
  // Sort newest first (rough string sort works for "Mon DD, YYYY" format)
  recentActivity.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const activitySlice = recentActivity.slice(0, 8);

  const typeConfig = {
    interview: { color: "#C9A84C", badge: "Interview", nav: "analytics" },
    coding:    { color: "#22C55E", badge: "Coding",    nav: "coding" },
    comm:      { color: "#F59E0B", badge: "Comm",      nav: "analytics" },
    gd:        { color: "#06B6D4", badge: "GD",        nav: "analytics" },
  };

  return (
    <SidebarLayout active="dashboard" user={user} onNav={onNav} onLogout={onLogout}>
      <div style={{ padding: "32px 40px", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, animation: "fadeIn 0.5s ease" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, background: "linear-gradient(135deg, #F1F5F9 30%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Welcome back, {user?.name?.split(" ")[0] || "there"}</h1>
            <p style={{ color: "#7C8BA8", fontSize: 14 }}>Here's your overview. Pick a feature to get started.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => onNav("profile")} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #A68B3C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 0 16px rgba(201,168,76,0.25)", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 24px rgba(201,168,76,0.4)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 16px rgba(201,168,76,0.25)"}>
              {(user?.name || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24, animation: "fadeInUp 0.5s ease 0.1s both" }}>
          {[
            { label: "Total Sessions", value: loadingA ? "…" : totalAll, sub: `${analytics?.total_sessions ?? 0} interview · ${codingS.total_sessions ?? 0} coding · ${commS.tests_taken ?? 0} comm · ${gdS.total_sessions ?? 0} GD`, icon: "✓", color: "#C9A84C" },
            { label: "Avg Score", value: loadingA ? "…" : `${analytics?.avg_total_score ?? 0}%`, sub: `Coding: ${codingS.avg_score ?? 0}% · Comm: ${commS.latest_score ?? 0}%`, icon: "↗", color: "#22C55E" },
            { label: "Best Score", value: loadingA ? "…" : `${analytics?.best_score ?? 0}%`, sub: `Coding best: ${codingS.best_score ?? 0}%`, icon: "★", color: "#F59E0B" },
            { label: "Completion", value: loadingA ? "…" : `${analytics?.completion_rate ?? 0}%`, sub: `${completedAll} completed overall`, icon: "◎", color: "#E2C97E" },
          ].map((s, idx) => (
            <div key={s.label} className="hover-lift" style={{ background: "linear-gradient(135deg, #0F1629 0%, #111A30 100%)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", overflow: "hidden", animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.05}s both` }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
              <div>
                <div style={{ color: "#7C8BA8", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
                <div style={{ color: "#4A5568", fontSize: 11 }}>{s.sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}12`, border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, fontSize: 18 }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24, animation: "fadeInUp 0.5s ease 0.15s both" }}>
          {features.map((f, idx) => (
            <div key={f.id} onClick={() => onNav(f.id)} style={{
              background: `linear-gradient(135deg, #0F1629 0%, #111A30 100%)`, border: `1px solid ${f.color}18`, borderRadius: 14, padding: "22px 20px",
              cursor: "pointer", transition: "all 0.25s ease", display: "flex", alignItems: "flex-start", gap: 14, position: "relative", overflow: "hidden",
              animation: `fadeInUp 0.4s ease ${0.15 + idx * 0.04}s both`,
              boxShadow: `inset 0 0 40px ${f.color}04`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}55`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${f.color}20, inset 0 0 40px ${f.color}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${f.color}18`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `inset 0 0 40px ${f.color}04`; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}10`, border: `1px solid ${f.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{f.title}</div>
                <div style={{ color: "#5A6B85", fontSize: 12, lineHeight: 1.4 }}>{f.desc}</div>
              </div>
              <span style={{ color: `${f.color}60`, fontSize: 16, marginTop: 2, transition: "all 0.2s" }}>→</span>
            </div>
          ))}
        </div>

        {/* Two-column bottom: Recent Activity + Quick Tips */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, animation: "fadeInUp 0.5s ease 0.25s both" }}>
          {/* Recent Activity */}
          <div style={{ background: "linear-gradient(135deg, #0F1629 0%, #111A30 100%)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Activity</h3>
              <span onClick={() => onNav("analytics")} style={{ color: THEME.indigo, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>View all →</span>
            </div>
            {loadingA ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}><Spinner /></div>
            ) : activitySlice.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#4A5568", fontSize: 13 }}>
                No activity yet. Start a session to see your history here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {activitySlice.map((item, i) => {
                  const cfg = typeConfig[item.type];
                  const sc = item.score ?? 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                      <span style={{ color: "#5A6B85", fontSize: 11, flex: "0 0 80px" }}>{item.date}</span>
                      <span style={{ background: `${cfg.color}15`, color: cfg.color, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", flexShrink: 0 }}>{cfg.badge}</span>
                      <span style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                      {item.difficulty && (
                        <span style={{ color: item.difficulty === "expert" ? "#EF4444" : item.difficulty === "advanced" ? "#C9A84C" : item.difficulty === "intermediate" ? "#F59E0B" : "#22C55E", fontSize: 10, fontWeight: 600, textTransform: "capitalize" }}>{item.difficulty}</span>
                      )}
                      <div style={{ width: 44 }}><Bar value={sc} /></div>
                      <span style={{ color: scoreColor(sc), fontWeight: 700, fontSize: 14, width: 30, textAlign: "right" }}>{sc != null ? Math.round(sc) : "—"}</span>
                      {item.status === "active" && <span style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>ACTIVE</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div style={{ background: "linear-gradient(135deg, #0F1629 0%, #111A30 100%)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />
            <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Tips</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { tip: "Practice consistently — even 2-3 sessions per week builds strong habits.", color: "#C9A84C" },
                { tip: "Use the voice & camera features to get multimodal feedback on your delivery.", color: "#22C55E" },
                { tip: "Review your Analytics page to identify weak topics and focus your prep.", color: "#A78BFA" },
                { tip: "Try the Communication test to improve fluency, pacing, and pronunciation.", color: "#F59E0B" },
                { tip: "Upload your resume and a job description to get a personalized gap analysis.", color: "#3B82F6" },
                { tip: "Try the GD Room to practice group discussions — raise your hand to get speaking turns.", color: "#06B6D4" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, marginTop: 6, flexShrink: 0 }} />
                  <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}


export default DashboardPage;
