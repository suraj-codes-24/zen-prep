import { useState, useEffect, useRef } from "react";
import { API, Spinner, THEME } from "../shared";
import { SidebarLayout } from "./Sidebar";

function ProfilePage({ token, user, onNav, onLogout, onUpdateUser }) {
  const [name, setName]       = useState(user?.name || "");
  const [branch, setBranch]   = useState(user?.branch || "");
  const [year, setYear]       = useState(user?.year || "");
  const [college, setCollege] = useState(user?.college || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState("");
  const [profileError, setProfileError]   = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwMsg, setPwMsg]         = useState("");
  const [pwError, setPwError]     = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem(`profile_pic_${user?.id || "user"}`) || "");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/analytics/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setAnalytics(d); setAnalyticsLoading(false); })
      .catch(() => setAnalyticsLoading(false));
  }, [token]);

  function handlePicChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("Image must be under 3 MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setProfilePic(dataUrl);
      localStorage.setItem(`profile_pic_${user?.id || "user"}`, dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function removePic() {
    setProfilePic("");
    localStorage.removeItem(`profile_pic_${user?.id || "user"}`);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg(""); setProfileError("");
    try {
      const r = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, branch, year: year ? parseInt(year) : null, college }),
      });
      const d = await r.json();
      if (!r.ok) { setProfileError(d.detail || "Update failed"); }
      else { onUpdateUser(d); setProfileMsg("Profile saved successfully."); setTimeout(() => setProfileMsg(""), 3000); }
    } catch { setProfileError("Server error. Please try again."); }
    setProfileSaving(false);
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) { setPwError("Both fields are required."); return; }
    if (newPassword.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    setPwSaving(true); setPwMsg(""); setPwError("");
    try {
      const r = await fetch(`${API}/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const d = await r.json();
      if (!r.ok) { setPwError(d.detail || "Password change failed"); }
      else { setPwMsg("Password updated successfully."); setCurrentPassword(""); setNewPassword(""); setTimeout(() => setPwMsg(""), 3000); }
    } catch { setPwError("Server error. Please try again."); }
    setPwSaving(false);
  }

  async function readApiError(resp, fallback) {
    try {
      const data = await resp.json();
      return data?.detail || data?.error?.message || data?.message || fallback;
    } catch {
      return fallback;
    }
  }

  async function sendPasswordResetCode() {
    setPwSaving(true); setPwMsg(""); setPwError("");
    try {
      const r = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });
      if (!r.ok) { setPwError(await readApiError(r, "Could not send reset code")); }
      else { setResetCodeSent(true); setPwMsg("A 6-digit reset code has been sent to your email."); }
    } catch { setPwError("Server error. Please try again."); }
    setPwSaving(false);
  }

  async function resetPasswordWithCode() {
    if (resetCode.length !== 6 || !resetNewPassword) { setPwError("Code and new password are required."); return; }
    if (resetNewPassword.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    setPwSaving(true); setPwMsg(""); setPwError("");
    try {
      const r = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, code: resetCode, new_password: resetNewPassword }),
      });
      if (!r.ok) { setPwError(await readApiError(r, "Password reset failed")); }
      else {
        setPwMsg("Password updated successfully.");
        setResetCode(""); setResetNewPassword(""); setResetMode(false); setResetCodeSent(false);
        setTimeout(() => setPwMsg(""), 3000);
      }
    } catch { setPwError("Server error. Please try again."); }
    setPwSaving(false);
  }

  const inp = (focused) => ({
    width: "100%", background: "rgba(15,22,41,0.7)",
    border: `1px solid ${focused ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 10, padding: "11px 14px", color: "#F1F5F9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none", outline: "none",
  });
  const labelStyle = { fontSize: 11, color: "#7C8BA8", marginBottom: 7, display: "block", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" };
  const cardBase = { background: "linear-gradient(135deg, #0F1629 0%, #111A30 100%)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" };

  const initials = (name || user?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—";

  // ── Derived analytics ───────────────────────────────────────────────────────
  const totalInterviews  = analytics?.total_sessions || 0;
  const avgScore         = analytics?.avg_total_score || 0;
  const bestScore        = analytics?.best_score || 0;
  const totalAnswers     = analytics?.total_answers || 0;
  const perfBand         = analytics?.performance?.band || null;
  const strongestTopic   = analytics?.strongest_topic || null;
  const weakestTopic     = analytics?.weakest_topic || null;
  const codingTotal      = analytics?.coding?.total_sessions || 0;
  const codingAvg        = analytics?.coding?.avg_score || 0;
  const codingBest       = analytics?.coding?.best_score || 0;
  const gdTotal          = analytics?.gd?.total_sessions || 0;
  const gdAvg            = analytics?.gd?.avg_score || 0;
  const gdBest           = analytics?.gd?.best_score || 0;
  const commTotal        = analytics?.communication?.tests_taken || 0;
  const commBest         = analytics?.communication?.best_score || 0;
  const commLatest       = analytics?.communication?.latest_score || 0;
  const recentSessions   = analytics?.recent_sessions || [];
  const gdDims           = analytics?.gd?.dimension_averages || {};

  const BAND_COLORS = { Excellent: "#22C55E", Good: "#6366F1", Average: "#F59E0B", Poor: "#EF4444" };

  const moduleCards = [
    {
      icon: "🎤", label: "Mock Interview", color: "#6366F1",
      primary: totalInterviews, primaryLabel: "Sessions",
      secondary: avgScore ? `${avgScore}% avg` : "—",
      best: bestScore ? `${bestScore}% best` : "—",
      extra: perfBand ? { label: perfBand, color: BAND_COLORS[perfBand] || "#6366F1" } : null,
      page: "interview_setup",
    },
    {
      icon: "💻", label: "Coding", color: "#22C55E",
      primary: codingTotal, primaryLabel: "Sessions",
      secondary: codingAvg ? `${codingAvg}% avg` : "—",
      best: codingBest ? `${codingBest}% best` : "—",
      extra: null,
      page: "coding",
    },
    {
      icon: "🗣", label: "GD Room", color: "#06B6D4",
      primary: gdTotal, primaryLabel: "Sessions",
      secondary: gdAvg ? `${gdAvg}% avg` : "—",
      best: gdBest ? `${gdBest}% best` : "—",
      extra: analytics?.gd?.latest_band && analytics.gd.latest_band !== "N/A" ? { label: analytics.gd.latest_band, color: BAND_COLORS[analytics.gd.latest_band] || "#06B6D4" } : null,
      page: "gd",
    },
    {
      icon: "🎯", label: "Comm Test", color: "#A855F7",
      primary: commTotal, primaryLabel: "Tests",
      secondary: commLatest ? `${commLatest}% latest` : "—",
      best: commBest ? `${commBest}% best` : "—",
      extra: analytics?.communication?.latest_band && analytics.communication.latest_band !== "N/A" ? { label: analytics.communication.latest_band, color: BAND_COLORS[analytics.communication.latest_band] || "#A855F7" } : null,
      page: "communication",
    },
  ];

  // ── Achievements ─────────────────────────────────────────────────────────────
  const allAchievements = [
    { icon: "🎤", label: "First Interview",   desc: "Completed your first mock interview",          color: "#6366F1", unlocked: totalInterviews >= 1 },
    { icon: "🏆", label: "Interview Pro",     desc: "Completed 10+ mock interviews",                color: "#F59E0B", unlocked: totalInterviews >= 10 },
    { icon: "🌟", label: "Top Scorer",        desc: "Achieved 90%+ in an interview",                color: "#F59E0B", unlocked: bestScore >= 90 },
    { icon: "💻", label: "First Code",        desc: "Completed your first coding session",          color: "#22C55E", unlocked: codingTotal >= 1 },
    { icon: "⚡", label: "Consistent Coder",  desc: "Completed 5+ coding sessions",                 color: "#22C55E", unlocked: codingTotal >= 5 },
    { icon: "🗣", label: "First Discussion",  desc: "Participated in your first GD session",        color: "#06B6D4", unlocked: gdTotal >= 1 },
    { icon: "👥", label: "GD Champion",       desc: "Completed 5+ group discussions",               color: "#06B6D4", unlocked: gdTotal >= 5 },
    { icon: "🎯", label: "Communicator",      desc: "Completed your first communication test",      color: "#A855F7", unlocked: commTotal >= 1 },
    { icon: "🔥", label: "All-Rounder",       desc: "Used all 4 modules of ZenPrep",                color: "#EF4444", unlocked: totalInterviews >= 1 && codingTotal >= 1 && gdTotal >= 1 && commTotal >= 1 },
    { icon: "📚", label: "Question Master",   desc: "Answered 50+ interview questions",             color: "#818CF8", unlocked: totalAnswers >= 50 },
  ];
  const unlockedCount = allAchievements.filter(a => a.unlocked).length;

  const quickLinks = [
    { icon: "🎤", label: "Interview",  page: "interview_setup", color: "#6366F1" },
    { icon: "💻", label: "Coding",     page: "coding",          color: "#22C55E" },
    { icon: "🎯", label: "Comm Test",  page: "communication",   color: "#A855F7" },
    { icon: "📊", label: "Analytics",  page: "analytics",       color: "#06B6D4" },
  ];

  return (
    <SidebarLayout active="profile" user={user} onNav={onNav} onLogout={onLogout} showUser>
      <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Profile Header Banner ─────────────────────────────────────────── */}
        <div style={{ background: "linear-gradient(135deg, #0F1629 0%, #131B33 50%, #0F1629 100%)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(6,182,212,0.3), transparent)" }} />
          <div style={{ position: "absolute", top: -80, right: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePicChange} style={{ display: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div onClick={() => fileRef.current?.click()}
                style={{ width: 96, height: 96, borderRadius: 22, overflow: "hidden", cursor: "pointer",
                  background: profilePic ? "transparent" : "linear-gradient(135deg, #6366F1, #818CF8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.3)", border: "2px solid rgba(99,102,241,0.4)",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 32px rgba(99,102,241,0.55)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,0.3)"}
              >
                {profilePic
                  ? <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ color: "#fff", fontWeight: 800, fontSize: 32, letterSpacing: "-0.02em" }}>{initials}</span>
                }
              </div>
              <div onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366F1, #818CF8)", border: "2px solid #0F1629", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13 }}>📷</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F1F5F9", margin: "0 0 4px 0" }}>{name || user?.name || "Your Name"}</h1>
              <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 12px 0" }}>{user?.email || ""}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>● Active</span>
                <span style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#A5B4FC", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>Joined {memberSince}</span>
                {(branch || user?.branch) && <span style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#22D3EE", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>{branch || user?.branch}{(year || user?.year) ? ` · Year ${year || user?.year}` : ""}</span>}
                {(college || user?.college) && <span style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#C084FC", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>{college || user?.college}</span>}
                {unlockedCount > 0 && <span style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#FCD34D", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>🏅 {unlockedCount} Achievements</span>}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <button onClick={saveProfile} disabled={profileSaving}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 28px rgba(99,102,241,0.55)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.3)"}
                style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", color: "#fff", fontWeight: 600, padding: "10px 28px", borderRadius: 10, fontSize: 13, opacity: profileSaving ? 0.7 : 1, boxShadow: "0 4px 16px rgba(99,102,241,0.3)", transition: "all 0.2s", border: "none", cursor: profileSaving ? "default" : "pointer" }}>
                {profileSaving ? <Spinner /> : "Save Changes"}
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => fileRef.current?.click()}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}>
                  {profilePic ? "Change Photo" : "Upload Photo"}
                </button>
                {profilePic && (
                  <button onClick={removePic}
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#F87171", fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {profileMsg   && <div style={{ marginTop: 16, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#86EFAC", fontSize: 12, padding: "8px 14px", borderRadius: 8 }}>✓ {profileMsg}</div>}
          {profileError && <div style={{ marginTop: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5", fontSize: 12, padding: "8px 14px", borderRadius: 8 }}>✗ {profileError}</div>}
        </div>

        {/* ── Stats Strip ───────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Interviews",    value: totalInterviews, sub: "total sessions",    color: "#6366F1" },
            { label: "Avg Score",     value: avgScore ? `${avgScore}%` : "—", sub: "interview avg", color: "#818CF8" },
            { label: "Best Score",    value: bestScore ? `${bestScore}%` : "—", sub: "all time high", color: "#22C55E" },
            { label: "Coding",        value: codingTotal, sub: "sessions done",         color: "#3B82F6" },
            { label: "GD + Comm",     value: gdTotal + commTotal, sub: `${gdTotal} GD · ${commTotal} comm`, color: "#06B6D4" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(15,22,41,0.6)", border: `1px solid ${s.color}20`, borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, background: `linear-gradient(135deg, ${s.color}, ${s.color}AA)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{analyticsLoading ? "—" : s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1", marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main Content — 3 columns ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 0.85fr", gap: 20, alignItems: "start" }}>

          {/* ── COL 1: Personal Info + Password ─────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Personal Information */}
            <div style={cardBase}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>👤</div>
                <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>Personal Information</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField("")}
                    style={inp(focusedField === "name")} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input value={user?.email || ""} disabled style={{ ...inp(false), color: "#4A5568", cursor: "not-allowed", background: "rgba(15,22,41,0.4)" }} />
                </div>
                <div>
                  <label style={labelStyle}>Branch / Department</label>
                  <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. CSE, ECE, MBA"
                    onFocus={() => setFocusedField("branch")} onBlur={() => setFocusedField("")}
                    style={inp(focusedField === "branch")} />
                </div>
                <div>
                  <label style={labelStyle}>Year of Study</label>
                  <select value={year} onChange={e => setYear(e.target.value)}
                    onFocus={() => setFocusedField("year")} onBlur={() => setFocusedField("")}
                    style={{ ...inp(focusedField === "year"), cursor: "pointer", appearance: "none" }}>
                    <option value="">Select year</option>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>College / Institution</label>
                  <input value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. PSIT Kanpur, IIT Delhi"
                    onFocus={() => setFocusedField("college")} onBlur={() => setFocusedField("")}
                    style={inp(focusedField === "college")} />
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div style={cardBase}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔒</div>
                <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>Change Password</h3>
              </div>
              {!resetMode ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showCurPw ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••"
                        onFocus={() => setFocusedField("curpw")} onBlur={() => setFocusedField("")}
                        style={{ ...inp(focusedField === "curpw"), paddingRight: 42 }} />
                      <button type="button" onClick={() => setShowCurPw(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", color: "#4B5563", fontSize: 14, padding: 2, border: "none", cursor: "pointer" }}>{showCurPw ? "🙈" : "👁"}</button>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                        onFocus={() => setFocusedField("newpw")} onBlur={() => setFocusedField("")}
                        style={{ ...inp(focusedField === "newpw"), paddingRight: 42 }} />
                      <button type="button" onClick={() => setShowNewPw(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", color: "#4B5563", fontSize: 14, padding: 2, border: "none", cursor: "pointer" }}>{showNewPw ? "🙈" : "👁"}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.5 }}>
                    We will send a 6-digit code to {user?.email}. Use it here to set a new password.
                  </p>
                  <button onClick={sendPasswordResetCode} disabled={pwSaving}
                    style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#E2C97E", fontWeight: 600, padding: "10px", borderRadius: 8, cursor: pwSaving ? "default" : "pointer" }}>
                    {resetCodeSent ? "Send New Code" : "Send Reset Code"}
                  </button>
                  {resetCodeSent && (
                    <>
                      <div>
                        <label style={labelStyle}>6-Digit Code</label>
                        <input value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456"
                          onFocus={() => setFocusedField("resetcode")} onBlur={() => setFocusedField("")}
                          style={{ ...inp(focusedField === "resetcode"), letterSpacing: 6, textAlign: "center" }} />
                      </div>
                      <div>
                        <label style={labelStyle}>New Password</label>
                        <input type="password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} placeholder="Min. 6 characters"
                          onFocus={() => setFocusedField("resetpw")} onBlur={() => setFocusedField("")}
                          style={inp(focusedField === "resetpw")} />
                      </div>
                    </>
                  )}
                </div>
              )}
              {pwMsg   && <div style={{ marginTop: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#86EFAC", fontSize: 12, padding: "8px 12px", borderRadius: 8 }}>✓ {pwMsg}</div>}
              {pwError && <div style={{ marginTop: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5", fontSize: 12, padding: "8px 12px", borderRadius: 8 }}>✗ {pwError}</div>}
              <button onClick={resetMode && resetCodeSent ? resetPasswordWithCode : changePassword} disabled={pwSaving || (resetMode && !resetCodeSent)}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
                style={{ marginTop: 16, width: "100%", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93C5FD", fontWeight: 600, padding: "11px", borderRadius: 10, fontSize: 14, cursor: pwSaving ? "default" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: pwSaving ? 0.7 : 1 }}>
                {pwSaving ? <Spinner /> : <><span>🔑</span> {resetMode ? "Reset Password with Code" : "Update Password"}</>}
              </button>
              <button type="button" onClick={() => { setResetMode(v => !v); setPwMsg(""); setPwError(""); }}
                style={{ marginTop: 10, width: "100%", background: "transparent", color: "#C9A84C", fontWeight: 600, fontSize: 12 }}>
                {resetMode ? "I know my current password" : "I do not know my current password"}
              </button>
            </div>
          </div>

          {/* ── COL 2: Module Performance + Topic Insights ───────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Module Performance */}
            <div style={cardBase}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📊</div>
                  <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>Module Performance</h3>
                </div>
                <button onClick={() => onNav("analytics")} style={{ fontSize: 11, color: "#6366F1", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Full Analytics →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {moduleCards.map((m, i) => (
                  <div key={i} onClick={() => onNav(m.page)} style={{ background: `${m.color}08`, border: `1px solid ${m.color}20`, borderRadius: 12, padding: "14px", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${m.color}45`; e.currentTarget.style.background = `${m.color}12`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${m.color}20`; e.currentTarget.style.background = `${m.color}08`; }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      {m.extra && <span style={{ fontSize: 9, fontWeight: 700, color: m.extra.color, background: `${m.extra.color}18`, border: `1px solid ${m.extra.color}35`, padding: "2px 7px", borderRadius: 10 }}>{m.extra.label}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{analyticsLoading ? "—" : m.primary}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{analyticsLoading ? "" : m.primaryLabel}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "#64748B", background: "rgba(255,255,255,0.04)", padding: "3px 7px", borderRadius: 6 }}>{m.secondary}</span>
                      <span style={{ fontSize: 10, color: m.color, background: `${m.color}10`, padding: "3px 7px", borderRadius: 6 }}>{m.best}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* GD dimension bars */}
              {gdTotal > 0 && Object.values(gdDims).some(v => v > 0) && (
                <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(6,182,212,0.04)", borderRadius: 10, border: "1px solid rgba(6,182,212,0.1)" }}>
                  <div style={{ fontSize: 10, color: "#06B6D4", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>GD DIMENSION AVERAGES</div>
                  {Object.entries(gdDims).map(([dim, val]) => (
                    <div key={dim} style={{ marginBottom: 7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748B", marginBottom: 3 }}>
                        <span style={{ textTransform: "capitalize" }}>{dim.replace("_", " ")}</span>
                        <span style={{ color: "#22D3EE" }}>{val}%</span>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${val}%`, background: "linear-gradient(90deg, #06B6D4, #22D3EE)", borderRadius: 2, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic Insights */}
            {(strongestTopic || weakestTopic) && (
              <div style={cardBase}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📈</div>
                  <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>Topic Insights</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {strongestTopic && (
                    <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: "14px" }}>
                      <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>▲ STRONGEST</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", lineHeight: 1.3 }}>{strongestTopic.topic}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#22C55E", marginTop: 6 }}>{strongestTopic.avg_score}%</div>
                    </div>
                  )}
                  {weakestTopic && (
                    <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "14px" }}>
                      <div style={{ fontSize: 10, color: "#F87171", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>▼ NEEDS WORK</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", lineHeight: 1.3 }}>{weakestTopic.topic}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#F87171", marginTop: 6 }}>{weakestTopic.avg_score}%</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── COL 3: Achievements + Sign Out ──────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Achievements — badge grid */}
            <div style={cardBase}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🏅</div>
                  <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>Achievements</h3>
                </div>
                <span style={{ fontSize: 11, color: "#64748B" }}>{unlockedCount}/{allAchievements.length}</span>
              </div>
              {/* Progress bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(unlockedCount / allAchievements.length) * 100}%`, background: "linear-gradient(90deg, #F59E0B, #FBBF24)", borderRadius: 2, transition: "width 0.8s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 5 }}>{unlockedCount} of {allAchievements.length} unlocked</div>
              </div>
              {/* Badge grid — 2 per row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {allAchievements.map((a, i) => (
                  <div key={i} title={a.desc} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, background: a.unlocked ? `${a.color}08` : "rgba(255,255,255,0.02)", border: `1px solid ${a.unlocked ? `${a.color}25` : "rgba(255,255,255,0.04)"}`, opacity: a.unlocked ? 1 : 0.35, transition: "all 0.2s", cursor: "default" }}>
                    <span style={{ fontSize: 22, filter: a.unlocked ? "none" : "grayscale(1) brightness(0.5)" }}>{a.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: a.unlocked ? "#CBD5E1" : "#334155", textAlign: "center", lineHeight: 1.2 }}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign Out */}
            <button onClick={onLogout}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.04)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.12)"; }}
              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", color: "#F87171", fontWeight: 600, padding: "14px", borderRadius: 14, fontSize: 14, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Sign Out
            </button>

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default ProfilePage;
