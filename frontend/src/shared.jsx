import { useState, useEffect } from "react";
// Shared constants, styles, and small helper components
const API = import.meta.env.VITE_API_URL || "https://huggingface.co/spaces/suraj7667/zen-prep-api";

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: radial-gradient(ellipse at 20% 0%, #0F1A35 0%, #0B0F1E 60%); background-attachment: fixed; color: #F1F5F9; font-family: 'Inter', sans-serif; min-height: 100vh; }
  button { font-family: 'Inter', sans-serif; cursor: pointer; border: none; outline: none; }
  input, select, textarea { font-family: 'Inter', sans-serif; outline: none; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0B0F1E; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInScale { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
  @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(201,168,76,0.15); } 50% { box-shadow: 0 0 40px rgba(201,168,76,0.3); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ringPulse { 0%,100% { transform: scale(1); opacity:0.6; } 50% { transform: scale(1.08); opacity:0.3; } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes splashFade { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
  @keyframes loadBar { 0% { width: 0%; } 20% { width: 25%; } 50% { width: 55%; } 75% { width: 80%; } 100% { width: 100%; } }
  @keyframes floatUp { 0% { bottom: -10px; opacity: 0; } 20% { opacity: 0.4; } 80% { opacity: 0.15; } 100% { bottom: 110%; opacity: 0; } }
  @keyframes orbFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.1); } 66% { transform: translate(-20px,15px) scale(0.95); } }
  @keyframes orbFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-25px,20px) scale(1.05); } 66% { transform: translate(15px,-25px) scale(0.9); } }
  @keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes borderGlow { 0%,100% { border-color: rgba(201,168,76,0.2); } 50% { border-color: rgba(201,168,76,0.5); } }
  @keyframes typewriter { from { width: 0; } to { width: 100%; } }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  @keyframes slideInFromBottom { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes glowPulse { 0%,100% { box-shadow: 0 0 16px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 32px rgba(99,102,241,0.55); } }
  @keyframes glowPulseGreen { 0%,100% { box-shadow: 0 0 16px rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 32px rgba(34,197,94,0.55); } }
  @keyframes glowPulseAmber { 0%,100% { box-shadow: 0 0 16px rgba(245,158,11,0.3); } 50% { box-shadow: 0 0 32px rgba(245,158,11,0.55); } }
  @keyframes glowPulseCyan { 0%,100% { box-shadow: 0 0 16px rgba(6,182,212,0.3); } 50% { box-shadow: 0 0 32px rgba(6,182,212,0.55); } }
  .fade-in { animation: fadeIn 0.4s ease both; }
  .fade-in-up { animation: fadeInUp 0.5s ease both; }
  .fade-in-scale { animation: fadeInScale 0.4s ease both; }
  .slide-left { animation: slideInLeft 0.4s ease both; }
  .slide-right { animation: slideInRight 0.4s ease both; }
  .glow-card { animation: glow 3s ease-in-out infinite; }
  .float-anim { animation: float 3s ease-in-out infinite; }
  .spin { animation: spin 0.8s linear infinite; display:inline-block; }
  .scroll-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(201,168,76,0.12); }
  .gradient-text { background: linear-gradient(135deg, #6366F1, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .gradient-text-gold { background: linear-gradient(135deg, #C9A84C, #E2C97E); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; }
  .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
  .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.25) !important; }
  .glow-btn-indigo { transition: box-shadow 0.25s ease, transform 0.2s ease; }
  .glow-btn-indigo:hover { box-shadow: 0 0 24px rgba(99,102,241,0.5); transform: translateY(-1px); }
  .glow-btn-green { transition: box-shadow 0.25s ease, transform 0.2s ease; }
  .glow-btn-green:hover { box-shadow: 0 0 24px rgba(34,197,94,0.5); transform: translateY(-1px); }
  .glow-btn-amber { transition: box-shadow 0.25s ease, transform 0.2s ease; }
  .glow-btn-amber:hover { box-shadow: 0 0 24px rgba(245,158,11,0.5); transform: translateY(-1px); }
  .glow-btn-cyan { transition: box-shadow 0.25s ease, transform 0.2s ease; }
  .glow-btn-cyan:hover { box-shadow: 0 0 24px rgba(6,182,212,0.5); transform: translateY(-1px); }
  .glow-btn-purple { transition: box-shadow 0.25s ease, transform 0.2s ease; }
  .glow-btn-purple:hover { box-shadow: 0 0 24px rgba(168,85,247,0.5); transform: translateY(-1px); }
`;

function Spinner() {
  return <span className="spin" style={{ fontSize: 16 }}>⟳</span>;
}

function ExamGuidanceModal({ type, onAccept, onCancel }) {
  const [accepted, setAccepted] = useState(false);
  const [checkedAll, setCheckedAll] = useState({});

  const isInterview = type === "interview";
  const accent = isInterview ? "#C9A84C" : "#90cdff";
  const title = isInterview ? "Interview Guidelines" : "Communication Test Guidelines";
  const subtitle = isInterview ? "Please read the following instructions carefully before starting your mock interview." : "Please read the following instructions carefully before starting your communication test.";

  const rules = isInterview ? [
    { id: "env", icon: "🔇", title: "Quiet Environment", desc: "Ensure you are in a quiet room with minimal background noise. The AI analyzes your voice quality in real-time." },
    { id: "cam", icon: "📷", title: "Camera & Microphone", desc: "Allow browser access to your camera and microphone when prompted. Both are required for multimodal analysis." },
    { id: "speak", icon: "🗣", title: "Speak Clearly", desc: "Face the camera and speak clearly at a natural pace. Avoid reading from notes — the AI evaluates confidence and spontaneity." },
    { id: "time", icon: "⏱", title: "Answer Timing", desc: "You'll have preparation time before each question. Use it to organize your thoughts, then deliver a structured response." },
    { id: "honest", icon: "🎯", title: "Original Responses", desc: "Provide your own answers without external help. The AI scoring is calibrated for authentic, unrehearsed responses." },
    { id: "stable", icon: "🌐", title: "Stable Connection", desc: "Ensure a stable internet connection. Do not refresh or navigate away during the interview — progress may be lost." },
  ] : [
    { id: "env", icon: "🔇", title: "Quiet Environment", desc: "Find a quiet room. Background noise affects voice analysis accuracy across all 9 scoring dimensions." },
    { id: "mic", icon: "🎙", title: "Microphone Access", desc: "Allow microphone access when prompted. All 8 sections require audio recording for AI evaluation." },
    { id: "listen", icon: "👂", title: "Listen Carefully", desc: "The AI will read questions aloud. Listen carefully before the recording starts — some sections require you to repeat or retell what you heard." },
    { id: "pace", icon: "🗣", title: "Natural Speech", desc: "Speak at a natural pace with clear pronunciation. The AI evaluates pace, intonation, rhythm, stress patterns, and fluency." },
    { id: "silence", icon: "⏸", title: "Silence Detection", desc: "If you remain silent for too long, the system will auto-submit your answer. Start speaking promptly when recording begins." },
    { id: "flow", icon: "🔄", title: "Continuous Flow", desc: "The test flows through 8 sections automatically. Do not refresh or close the browser — you can end early if needed." },
  ];

  const terms = isInterview ? [
    "I understand this is an AI-evaluated mock interview and scores are for practice purposes.",
    "I will not use external resources or AI tools to answer questions during the session.",
    "I consent to audio and video capture for real-time multimodal analysis.",
  ] : [
    "I understand this is an AI-evaluated communication assessment and scores are for practice purposes.",
    "I will speak my own responses without reading from a script or using external help.",
    "I consent to audio recording for voice analysis and scoring.",
  ];

  const allChecked = terms.every((_, i) => checkedAll[i]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", animation: "fadeIn 0.3s ease" }}>
      <div style={{ background: isInterview ? "#0F1629" : "#181c22", border: `1px solid ${accent}20`, borderRadius: 20, width: 640, maxHeight: "85vh", overflow: "auto", position: "relative", animation: "fadeInUp 0.4s ease", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 40px ${accent}08` }}>
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, borderRadius: "20px 20px 0 0" }} />

        {/* Header */}
        <div style={{ padding: "28px 32px 20px", textAlign: "center", borderBottom: `1px solid ${accent}15` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{isInterview ? "📋" : "🎧"}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, background: `linear-gradient(135deg, #F1F5F9 30%, ${accent} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{title}</h2>
          <p style={{ color: "#7C8BA8", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{subtitle}</p>
        </div>

        {/* Rules */}
        <div style={{ padding: "20px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {rules.map((r, i) => (
              <div key={r.id} style={{ background: `${accent}06`, border: `1px solid ${accent}12`, borderRadius: 12, padding: "14px 16px", animation: `fadeInUp 0.3s ease ${0.1 + i * 0.05}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{r.icon}</span>
                  <span style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 13 }}>{r.title}</span>
                </div>
                <p style={{ color: "#7C8BA8", fontSize: 11, lineHeight: 1.5, margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div style={{ padding: "0 32px 20px" }}>
          <div style={{ background: `${accent}04`, border: `1px solid ${accent}10`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>✋</span> Terms & Acknowledgement
            </div>
            {terms.map((t, i) => (
              <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < terms.length - 1 ? 10 : 0, cursor: "pointer" }}
                onClick={() => setCheckedAll(prev => ({ ...prev, [i]: !prev[i] }))}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checkedAll[i] ? accent : "#4A5568"}`, background: checkedAll[i] ? `${accent}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.2s" }}>
                  {checkedAll[i] && <span style={{ color: accent, fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.5 }}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 32px 28px", display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${accent}20`, background: "transparent", color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = `${accent}08`}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            ← Go Back
          </button>
          <button onClick={onAccept} disabled={!allChecked}
            style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: allChecked ? `linear-gradient(135deg, ${accent}, ${accent}CC)` : `${accent}15`, color: allChecked ? (isInterview ? "#000" : "#00344f") : "#4A5568", fontSize: 13, fontWeight: 700, cursor: allChecked ? "pointer" : "default", transition: "all 0.3s", boxShadow: allChecked ? `0 4px 20px ${accent}30` : "none" }}
            onMouseEnter={e => { if (allChecked) e.currentTarget.style.boxShadow = `0 6px 28px ${accent}40`; }}
            onMouseLeave={e => { if (allChecked) e.currentTarget.style.boxShadow = `0 4px 20px ${accent}30`; }}>
            {allChecked ? "I Accept — Begin →" : "Accept all terms to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ZenPrepLogo({ size = 40 }) {
  const id = `zp_${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_gold`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#C9A84C"/><stop offset="100%" stopColor="#E2C97E"/></linearGradient>
        <linearGradient id={`${id}_bg`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0F1724"/><stop offset="100%" stopColor="#141C2E"/></linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="50" cy="50" r="46" fill={`url(#${id}_bg)`} stroke={`url(#${id}_gold)`} strokeWidth="1.2"/>
      {/* Outer crosshair ring */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#C9A84C" strokeWidth="0.6" opacity="0.3"/>
      {/* Crosshair ticks */}
      <line x1="50" y1="4" x2="50" y2="12" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4"/>
      <line x1="50" y1="88" x2="50" y2="96" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4"/>
      <line x1="4" y1="50" x2="12" y2="50" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4"/>
      <line x1="88" y1="50" x2="96" y2="50" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4"/>
      {/* Diagonal ticks */}
      <line x1="14" y1="14" x2="19" y2="19" stroke="#C9A84C" strokeWidth="0.6" opacity="0.25"/>
      <line x1="81" y1="14" x2="86" y2="19" stroke="#C9A84C" strokeWidth="0.6" opacity="0.25"/>
      <line x1="14" y1="81" x2="19" y2="86" stroke="#C9A84C" strokeWidth="0.6" opacity="0.25"/>
      <line x1="81" y1="81" x2="86" y2="86" stroke="#C9A84C" strokeWidth="0.6" opacity="0.25"/>
      {/* Inner ring */}
      <circle cx="50" cy="50" r="34" fill="none" stroke="#C9A84C" strokeWidth="0.4" opacity="0.2"/>
      {/* "Z" letter - silver/white */}
      <text x="30" y="62" fontFamily="Georgia, serif" fontSize="38" fontWeight="700" fill="#CBD5E1" letterSpacing="-1">Z</text>
      {/* Center dot */}
      <circle cx="50" cy="52" r="2" fill="#C9A84C"/>
      {/* "P" letter - gold */}
      <text x="54" y="62" fontFamily="Georgia, serif" fontSize="38" fontWeight="700" fill={`url(#${id}_gold)`} letterSpacing="-1">P</text>
    </svg>
  );
}

function SplashScreen({ onDone }) {
  const [msg, setMsg] = useState("Initializing AI engine...");
  const msgs = ["Initializing AI engine...", "Loading question banks...", "Preparing interview room...", "Calibrating voice analysis...", "Almost ready..."];
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; if (i < msgs.length) setMsg(msgs[i]); }, 550); return () => clearInterval(t); }, []);
  const particles = [15, 30, 50, 70, 85, 42, 60, 22];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0B0F1E", display: "flex", alignItems: "center", justifyContent: "center", animation: "splashFade 2.8s ease forwards" }}>
      {/* Grid bg */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Glow */}
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "ringPulse 4s ease-in-out infinite" }} />
      {/* Particles */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        {particles.map((l, i) => (
          <div key={i} style={{ position: "absolute", width: 3, height: 3, background: "#C9A84C", borderRadius: "50%", left: `${l}%`, bottom: -10, opacity: 0, animation: `floatUp 6s ease-in ${i * 0.45}s infinite` }} />
        ))}
      </div>
      {/* Main content */}
      <div className="fade-in-up" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        {/* Logo with spinning rings */}
        <div style={{ position: "relative", width: 100, height: 100 }}>
          <div style={{ position: "absolute", inset: -12, border: "2px solid transparent", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 2s linear infinite" }} />
          <div style={{ position: "absolute", inset: -20, border: "1px solid transparent", borderBottomColor: "#E2C97E", borderRadius: "50%", animation: "spin 3s linear infinite reverse", opacity: 0.5 }} />
          <ZenPrepLogo size={100} />
        </div>
        {/* Brand */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #F1F5F9 40%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ZenPrep</div>
          <div style={{ fontSize: 14, fontWeight: 400, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase" }}>Focus Flows Here</div>
          <div style={{ width: 260, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #C9A84C, #E2C97E)", borderRadius: 4, animation: "loadBar 2.5s ease-in-out forwards" }} />
          </div>
          <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, minHeight: 18, transition: "opacity 0.3s" }}>{msg}</div>
        </div>
        {/* Feature pills */}
        <div className="fade-in-up" style={{ display: "flex", gap: 12, animationDelay: "0.5s" }}>
          {[{ label: "Technical", color: "#C9A84C" }, { label: "Behavioral", color: "#22C55E" }, { label: "Coding", color: "#F59E0B" }].map((p, i) => (
            <div key={p.label} style={{ padding: "6px 14px", background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, fontSize: 11, fontWeight: 500, color: "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }} />
              {p.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ value, color = "#C9A84C", height = 6 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

function buildWav(float32Array, sampleRate) {
  const n = float32Array.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const wr = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  wr(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); wr(8, "WAVE"); wr(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); wr(36, "data"); v.setUint32(40, n * 2, true);
  let maxA = 0;
  for (let i = 0; i < n; i++) { const a = Math.abs(float32Array[i]); if (a > maxA) maxA = a; }
  const gain = maxA > 0.001 ? 0.9 / maxA : 1.0;
  let off = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i] * gain));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2;
  }
  return new Blob([buf], { type: "audio/wav" });
}

function CircularScore({ score, size = 160, strokeWidth = 10 }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, score) / 100) * circ;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1E293B" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#C9A84C" strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx - 8} textAnchor="middle" fill="#fff" fontSize={size * 0.22} fontWeight="700" fontFamily="Inter">{score}</text>
      <text x={cx} y={cx + 14} textAnchor="middle" fill="#94A3B8" fontSize={size * 0.09} fontFamily="Inter" letterSpacing="2">SCORE</text>
    </svg>
  );
}


const THEME = {
  // Module accents
  indigo:  "#6366F1",
  green:   "#22C55E",
  amber:   "#F59E0B",
  cyan:    "#06B6D4",
  purple:  "#A855F7",
  gold:    "#C9A84C",
  // Card tints
  indigoTint:  "rgba(99,102,241,0.05)",
  greenTint:   "rgba(34,197,94,0.05)",
  amberTint:   "rgba(245,158,11,0.05)",
  cyanTint:    "rgba(6,182,212,0.05)",
  purpleTint:  "rgba(168,85,247,0.05)",
  // Glow shadows
  glowIndigo:  "0 0 20px rgba(99,102,241,0.35)",
  glowGreen:   "0 0 20px rgba(34,197,94,0.35)",
  glowAmber:   "0 0 20px rgba(245,158,11,0.35)",
  glowCyan:    "0 0 20px rgba(6,182,212,0.35)",
  glowPurple:  "0 0 20px rgba(168,85,247,0.35)",
  glowGold:    "0 0 20px rgba(201,168,76,0.35)",
  // Gradient text
  gradientText: "linear-gradient(135deg, #6366F1, #06B6D4)",
  gradientGold: "linear-gradient(135deg, #C9A84C, #E2C97E)",
  // Base
  bg:      "#0B0F1E",
  card:    "#0F1629",
  border:  "rgba(255,255,255,0.07)",
};

export { API, globalCss, THEME, Spinner, ExamGuidanceModal, ZenPrepLogo, SplashScreen, Bar, buildWav, CircularScore };
