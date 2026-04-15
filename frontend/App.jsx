import { useState, useEffect } from "react";
import VoiceRecorder from "./VoiceRecorder";

const API = "http://127.0.0.1:8000";

const T = {
  bg:      "#07090f",
  card:    "#0c0f1a",
  border:  "#1a2035",
  accent:  "#7c6aff",
  accentB: "#5b4de0",
  green:   "#22d98a",
  red:     "#ff4f6e",
  yellow:  "#f5c542",
  text:    "#dde3f0",
  muted:   "#3d4f72",
  font:    "'Space Mono', 'Courier New', monospace",
  display: "'Outfit', sans-serif",
};

const css = [
  "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');",
  "* { box-sizing: border-box; margin: 0; padding: 0; }",
  "body { background: #07090f; color: #dde3f0; font-family: 'Space Mono', 'Courier New', monospace; min-height: 100vh; }",
  ".grid-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: linear-gradient(rgba(124,106,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,255,0.04) 1px, transparent 1px); background-size: 48px 48px; }",
  ".glow-purple { position: fixed; pointer-events: none; z-index: 0; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(124,106,255,0.07) 0%, transparent 70%); top: -200px; left: -100px; }",
  ".glow-blue { position: fixed; pointer-events: none; z-index: 0; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(34,217,138,0.05) 0%, transparent 70%); bottom: -100px; right: -100px; }",
  ".card { background: #0c0f1a; border: 1px solid #1a2035; border-radius: 16px; position: relative; z-index: 1; }",
  ".card-glow { box-shadow: 0 0 40px rgba(124,106,255,0.08); }",
  ".btn { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: none; border-radius: 10px; cursor: pointer; transition: all 0.18s; padding: 12px 24px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }",
  ".btn-primary { background: linear-gradient(135deg, #7c6aff, #5b4de0); color: #fff; }",
  ".btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(124,106,255,0.35); }",
  ".btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }",
  ".btn-ghost { background: transparent; color: #3d4f72; border: 1px solid #1a2035; }",
  ".btn-ghost:hover { border-color: rgba(124,106,255,0.3); color: #dde3f0; }",
  ".btn-green { background: linear-gradient(135deg, #22d98a, #18a86b); color: #07090f; }",
  ".btn-green:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(34,217,138,0.3); }",
  ".input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid #1a2035; border-radius: 10px; padding: 12px 16px; font-family: 'Space Mono', monospace; font-size: 13px; color: #dde3f0; outline: none; transition: all 0.18s; }",
  ".input:focus { border-color: rgba(124,106,255,0.5); background: rgba(124,106,255,0.04); }",
  ".input::placeholder { color: #3d4f72; }",
  "textarea.input { resize: vertical; min-height: 140px; line-height: 1.7; }",
  "select.input option { background: #0c0f1a; }",
  ".label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #3d4f72; margin-bottom: 8px; }",
  ".nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(7,9,15,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid #1a2035; padding: 0 32px; height: 58px; display: flex; align-items: center; justify-content: space-between; }",
  ".tag { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }",
  ".tag-technical { background: rgba(124,106,255,0.15); color: #7c6aff; }",
  ".tag-hr { background: rgba(245,197,66,0.15); color: #f5c542; }",
  ".tag-beginner { background: rgba(34,217,138,0.15); color: #22d98a; }",
  ".tag-intermediate { background: rgba(245,197,66,0.15); color: #f5c542; }",
  ".tag-advanced { background: rgba(255,79,110,0.15); color: #ff4f6e; }",
  ".bar-bg { height: 5px; background: #1a2035; border-radius: 99px; overflow: hidden; }",
  ".bar-fill { height: 100%; border-radius: 99px; transition: width 0.9s cubic-bezier(.22,1,.36,1); }",
  ".fade-in { animation: fadeUp 0.35s ease forwards; }",
  "@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }",
  ".dot-loader { display: flex; gap: 5px; align-items: center; }",
  ".dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: blink 1.2s ease-in-out infinite; }",
  ".dot:nth-child(2) { animation-delay: 0.2s; }",
  ".dot:nth-child(3) { animation-delay: 0.4s; }",
  "@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }",
  ".err { background: rgba(255,79,110,0.1); border: 1px solid rgba(255,79,110,0.25); border-radius: 10px; padding: 12px 16px; color: #ff4f6e; font-size: 12px; }",
  ".subj-card { background: #0c0f1a; border: 1px solid #1a2035; border-radius: 14px; padding: 20px 16px; cursor: pointer; transition: all 0.18s; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; position: relative; }",
  ".subj-card:hover { border-color: rgba(124,106,255,0.35); transform: translateY(-2px); }",
  ".subj-card.selected { border-color: #7c6aff; background: rgba(124,106,255,0.07); box-shadow: 0 0 24px rgba(124,106,255,0.15); }",
  ".type-tab { padding: 9px 22px; border-radius: 10px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid #1a2035; background: transparent; color: #3d4f72; cursor: pointer; transition: all 0.18s; }",
  ".type-tab.active { background: rgba(124,106,255,0.12); color: #7c6aff; border-color: rgba(124,106,255,0.35); }",
].join("\n");

const authH = (token) => ({ Authorization: "Bearer " + token, "Content-Type": "application/json" });
const scoreColor = (s) => s >= 70 ? T.green : s >= 45 ? T.yellow : T.red;

function Loader() {
  return (
    <div className="dot-loader">
      <div className="dot" />
      <div className="dot" />
      <div className="dot" />
    </div>
  );
}

function ScoreBar({ value, color }) {
  const col = scoreColor(value);
  return (
    <div className="bar-bg">
      <div className="bar-fill" style={{ width: value + "%", background: color || col }} />
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode]    = useState("login");
  const [email, setEmail]  = useState("suraj@test.com");
  const [pass, setPass]    = useState("test123");
  const [name, setName]    = useState("");
  const [err, setErr]      = useState("");
  const [loading, setLoad] = useState(false);

  async function submit() {
    setErr(""); setLoad(true);
    try {
      if (mode === "register") {
        const r = await fetch(API + "/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password: pass }),
        });
        const d = await r.json();
        if (!r.ok) { setErr(d.detail || "Registration failed"); setLoad(false); return; }
        setMode("login"); setLoad(false); return;
      }
      const r = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || "Login failed"); setLoad(false); return; }
      localStorage.setItem("sim_token", d.access_token);
      onLogin(d.access_token, { email, name: d.user?.name || email.split("@")[0] });
    } catch (e) {
      setErr("Cannot connect — is the server running?");
    }
    setLoad(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="grid-bg" />
      <div className="glow-purple" />
      <div className="glow-blue" />
      <div className="card card-glow fade-in" style={{ width: "100%", maxWidth: 420, padding: "44px 36px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10, color: T.accent }}>◈</div>
          <h1 style={{ fontFamily: T.display, fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Interview Simulator
          </h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>AI-powered placement prep</p>
        </div>

        <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{
              flex: 1, padding: "8px", fontFamily: T.font, fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase", border: "none",
              borderRadius: 7, cursor: "pointer", transition: "all 0.18s",
              background: mode === m ? T.accent : "transparent",
              color: mode === m ? "#fff" : T.muted,
            }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Suraj Kumar" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn btn-primary" onClick={submit} disabled={loading}
            style={{ width: "100%", padding: 14, marginTop: 4 }}>
            {loading ? <Loader /> : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({ token, user, onStart, onLogout, onAnalytics }) {
  const [subjects, setSubjects] = useState([]);
  const [tab, setTab]           = useState("technical");
  const [selected, setSelected] = useState(null);
  const [difficulty, setDiff]   = useState("beginner");
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [err, setErr]           = useState("");

  const ICONS = {
    "DSA": "🌳", "OOPS": "🔷", "System Design": "🏗️",
    "DBMS": "🗄️", "OS & Networking": "💻", "Machine Learning": "🤖", "Behavioral": "🤝",
  };

  useEffect(() => {
    fetch(API + "/interview/subjects", { headers: authH(token) })
      .then(r => r.json())
      .then(d => { setSubjects(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = subjects.filter(s => (s.type || "technical") === tab);

  async function start() {
    if (!selected) return;
    setErr(""); setStarting(true);
    try {
      const r = await fetch(API + "/interview/start", {
        method: "POST", headers: authH(token),
        body: JSON.stringify({ subject_id: selected.id, difficulty, interview_type: selected.type || "technical" }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || "Failed to start"); setStarting(false); return; }
      onStart(d.session_id, selected, difficulty);
    } catch (e) {
      setErr("Server error");
    }
    setStarting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingTop: 58 }}>
      <div className="grid-bg" />
      <div className="glow-purple" />

      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: T.accent, fontSize: 18 }}>◈</span>
          <span style={{ fontFamily: T.display, fontSize: 17, fontWeight: 700, color: "#fff" }}>Interview Simulator</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: T.muted }}>{user?.name || user?.email}</span>
          <button className="btn btn-ghost" onClick={onAnalytics} style={{ padding: "6px 14px" }}>Analytics</button>
          <button className="btn btn-ghost" onClick={onLogout}
            style={{ padding: "6px 14px", color: T.red, borderColor: "rgba(255,79,110,0.3)" }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div className="fade-in" style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, color: T.accent, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
            Ready to practice
          </p>
          <h1 style={{ fontFamily: T.display, fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Choose Your Interview
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          <button className={"type-tab" + (tab === "technical" ? " active" : "")}
            onClick={() => { setTab("technical"); setSelected(null); }}>
            Technical
          </button>
          <button className={"type-tab" + (tab === "hr" ? " active" : "")}
            onClick={() => { setTab("hr"); setSelected(null); }}>
            HR / Behavioral
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Loader /></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 100 }}>
            {filtered.map(s => (
              <div key={s.id}
                className={"subj-card" + (selected?.id === s.id ? " selected" : "")}
                onClick={() => setSelected(s)}>
                <span style={{ fontSize: 30 }}>{ICONS[s.name] || "📘"}</span>
                <span style={{ fontFamily: T.display, fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</span>
                <span style={{ fontSize: 10, color: T.muted }}>{s.question_count} questions</span>
                {selected?.id === s.id && (
                  <span style={{ position: "absolute", top: 10, right: 12, color: T.accent, fontWeight: 700, fontSize: 13 }}>✓</span>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p style={{ color: T.muted, fontSize: 13 }}>No subjects found.</p>}
          </div>
        )}
      </div>

      {selected && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(7,9,15,0.95)", backdropFilter: "blur(16px)",
          borderTop: "1px solid #1a2035", padding: "18px 32px", zIndex: 50,
        }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: 11, color: T.muted }}>Subject: </span>
              <span style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>{selected.name}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flex: 1 }}>
              {["beginner", "intermediate", "advanced"].map(d => (
                <button key={d} onClick={() => setDiff(d)} style={{
                  fontFamily: T.font, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                  border: "1px solid " + (difficulty === d ? T.accent : T.border),
                  background: difficulty === d ? "rgba(124,106,255,0.15)" : "transparent",
                  color: difficulty === d ? T.accent : T.muted, transition: "all 0.18s",
                }}>{d}</button>
              ))}
            </div>
            {err && <span style={{ fontSize: 12, color: T.red }}>{err}</span>}
            <button className="btn btn-primary" onClick={start} disabled={starting} style={{ padding: "12px 32px" }}>
              {starting ? <Loader /> : "Start Interview"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Interview Page ───────────────────────────────────────────────────────────
function InterviewPage({ token, sessionId, subject, difficulty, onDone, onBack }) {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer]     = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSub]    = useState(false);
  const [err, setErr]           = useState("");
  const [qNum, setQNum]         = useState(1);

  useEffect(() => { fetchQ(); }, []);

  async function fetchQ() {
    setLoading(true); setResult(null); setAnswer(""); setErr("");
    try {
      const r = await fetch(
        API + "/interview/question?subject_id=" + subject.id + "&difficulty=" + difficulty,
        { headers: authH(token) }
      );
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || "Could not load question"); setLoading(false); return; }
      setQuestion(d);
    } catch (e) {
      setErr("Server error");
    }
    setLoading(false);
  }

  async function submit() {
    if (!answer.trim()) { setErr("Please write an answer first."); return; }
    setErr(""); setSub(true);
    try {
      const r = await fetch(API + "/interview/answer", {
        method: "POST", headers: authH(token),
        body: JSON.stringify({ session_id: sessionId, question_id: question.question_id, user_answer: answer }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || "Submission failed"); setSub(false); return; }
      setResult(d);
    } catch (e) {
      setErr("Server error");
    }
    setSub(false);
  }

  function next() { setQNum(n => n + 1); fetchQ(); }

  const sc = scoreColor(result?.nlp_score || 0);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingTop: 58 }}>
      <div className="grid-bg" />
      <div className="glow-purple" />

      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: "6px 14px", fontSize: 11 }}>Back</button>
          <span style={{ fontSize: 12, color: T.muted }}>Question {qNum}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={"tag tag-" + (subject.type || "technical")}>{subject.name}</span>
          <span className={"tag tag-" + difficulty}>{difficulty}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div className="card fade-in" style={{ padding: 32, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Q{qNum} · {question?.topic_name || subject.name}
            </span>
            {question && <span className={"tag tag-" + question.difficulty}>{question.difficulty}</span>}
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Loader /></div>
          ) : question ? (
            <p style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600, color: "#fff", lineHeight: 1.55 }}>
              {question.question_text}
            </p>
          ) : (
            <div className="err">Could not load question.</div>
          )}
        </div>

        {question && !result && (
          <div className="card fade-in" style={{ padding: 28, marginBottom: 20 }}>
            <label className="label">Your Answer</label>
            <textarea className="input" value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="Write a thorough answer — explain the concept, give examples, mention complexity where relevant..."
              style={{ minHeight: 160 }} />
            
            <div style={{ marginTop: 12 }}>
              <VoiceRecorder onVoiceResult={(data) => console.log("Voice result:", data)} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 16 }}>

              {err ? <div className="err">{err}</div> : <span />}
              <span style={{ fontSize: 11, color: T.muted }}>
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={submit} disabled={submitting || !answer.trim()}
                style={{ flex: 1, padding: 13 }}>
                {submitting ? <Loader /> : "Submit Answer"}
              </button>
              <button className="btn btn-ghost" onClick={onBack} style={{ padding: "13px 18px" }}>End</button>
            </div>
          </div>
        )}

        {result && (
          <div className="card fade-in" style={{ padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 700, color: "#fff" }}>Score Breakdown</h2>
              <span style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, color: sc }}>{result.nlp_score}%</span>
            </div>
            {[
              { label: "Semantic Understanding", value: result.semantic_score, color: T.accent },
              { label: "Keyword Coverage",        value: result.keyword_score,  color: T.yellow },
              { label: "Answer Structure",         value: result.structure_score, color: T.green },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: T.text }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}%</span>
                </div>
                <ScoreBar value={s.value} color={s.color} />
              </div>
            ))}
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "14px 16px", margin: "20px 0", borderLeft: "3px solid " + sc }}>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>💡 {result.feedback}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-green" onClick={next} style={{ flex: 1, padding: 13 }}>Next Question</button>
              <button className="btn btn-ghost" onClick={() => onDone(result)} style={{ padding: "13px 18px" }}>Summary</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function AnalyticsPage({ token, onBack }) {
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    fetch(API + "/analytics/me", { headers: authH(token) })
      .then(r => r.json())
      .then(d => { setData(d); setLoad(false); })
      .catch(() => setLoad(false));
  }, []);

  const score = data?.avg_nlp_score;
  const sc    = scoreColor(score || 0);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingTop: 58 }}>
      <div className="grid-bg" />
      <div className="glow-purple" />

      <nav className="nav">
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: "6px 14px", fontSize: 11 }}>Back</button>
        <span style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700, color: "#fff" }}>Analytics</span>
        <div />
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Loader /></div>
        ) : !data ? (
          <div className="err">Could not load analytics.</div>
        ) : (
          <>
            <div className="card card-glow fade-in" style={{ padding: 40, textAlign: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: T.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
                Overall Performance
              </p>
              <div style={{ fontFamily: T.display, fontSize: 76, fontWeight: 800, color: sc, lineHeight: 1 }}>
                {score != null ? score + "%" : "—"}
              </div>
              <p style={{ fontFamily: T.display, fontSize: 16, color: T.text, marginTop: 10 }}>
                {data.performance || "Keep practicing!"}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 28 }}>
                {[
                  { label: "Sessions", value: data.total_sessions, color: T.accent },
                  { label: "Answers",  value: data.total_answers,  color: T.yellow },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: T.display, fontSize: 32, fontWeight: 800, color: s.color }}>{s.value ?? "—"}</div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {data.topic_breakdown && Object.keys(data.topic_breakdown).length > 0 && (
              <div className="card fade-in" style={{ padding: 28, marginBottom: 20 }}>
                <h2 style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 22 }}>
                  Topic Breakdown
                </h2>
                {Object.entries(data.topic_breakdown).sort(([, a], [, b]) => b - a).map(([topic, s]) => (
                  <div key={topic} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: T.text }}>{topic.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(s) }}>{s}%</span>
                    </div>
                    <ScoreBar value={s} />
                  </div>
                ))}
              </div>
            )}

            {(data.weakest_topic || data.strongest_topic) && (
              <div className="card fade-in" style={{ padding: 22, borderLeft: "3px solid " + T.accent }}>
                <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>
                  Focus on{" "}
                  <span style={{ color: T.red, fontWeight: 700 }}>{data.weakest_topic?.replace(/_/g, " ")}</span>.
                  {" "}Strongest:{" "}
                  <span style={{ color: T.green, fontWeight: 700 }}>{data.strongest_topic?.replace(/_/g, " ")}</span> 💪
                </p>
              </div>
            )}

            <button className="btn btn-primary" onClick={onBack} style={{ width: "100%", marginTop: 20, padding: 14 }}>
              Practice Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]       = useState("login");
  const [token, setToken]     = useState(() => localStorage.getItem("sim_token") || "");
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => { if (token) setPage("dashboard"); }, []);

  function handleLogin(t, u) { setToken(t); setUser(u); setPage("dashboard"); }

  function handleLogout() {
    localStorage.removeItem("sim_token");
    setToken(""); setUser(null); setPage("login");
  }

  function handleStart(sessionId, subject, difficulty) {
    setSession({ sessionId, subject, difficulty });
    setPage("interview");
  }

  return (
    <>
      <style>{css}</style>
      {page === "login" && <LoginPage onLogin={handleLogin} />}
      {page === "dashboard" && (
        <DashboardPage token={token} user={user}
          onStart={handleStart} onLogout={handleLogout}
          onAnalytics={() => setPage("analytics")} />
      )}
      {page === "interview" && session && (
        <InterviewPage token={token} sessionId={session.sessionId}
          subject={session.subject} difficulty={session.difficulty}
          onDone={() => setPage("analytics")} onBack={() => setPage("dashboard")} />
      )}
      {page === "analytics" && <AnalyticsPage token={token} onBack={() => setPage("dashboard")} />}
    </>
  );
}
