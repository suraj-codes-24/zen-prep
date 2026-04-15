import { useState, useEffect, useRef } from "react";
import { API, THEME } from "../shared";
import { SidebarLayout } from "./Sidebar";

const VOICE_AVATARS = {
  nova:   "https://i.pravatar.cc/150?img=5",
  alloy:  "https://i.pravatar.cc/150?img=45",
  claire: "https://i.pravatar.cc/150?img=47",
  fable:  "https://i.pravatar.cc/150?img=28",
  libby:  "https://i.pravatar.cc/150?img=26",
  sage:   "https://i.pravatar.cc/150?img=44",
  echo:   "https://i.pravatar.cc/150?img=33",
  cole:   "https://i.pravatar.cc/150?img=52",
  ryan:   "https://i.pravatar.cc/150?img=57",
  liam:   "https://i.pravatar.cc/150?img=12",
};

function SettingsPage({ user, token, onNav, onLogout }) {
  // Load saved values from localStorage on mount
  const [cameras,   setCameras]   = useState([]);
  const [mics,      setMics]      = useState([]);
  const [camera,    setCamera]    = useState(() => localStorage.getItem("selected_camera")    || "");
  const [mic,       setMic]       = useState(() => localStorage.getItem("selected_microphone") || "");
  const [whisper,   setWhisper]   = useState(() => localStorage.getItem("whisper_model")      || "base");
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem("default_difficulty") || "intermediate");
  const [voiceOn,   setVoiceOn]   = useState(() => localStorage.getItem("enable_voice_analysis")  !== "false");
  const [cameraOn,  setCameraOn]  = useState(() => localStorage.getItem("enable_camera_analysis") !== "false");
  const [saved,     setSaved]     = useState(false);

  // TTS voice selection
  const [ttsVoices,    setTtsVoices]    = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem("tts_voice") || "nova");
  const [demoPlaying,  setDemoPlaying]  = useState(null); // voice id currently playing
  const demoAudioRef = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices) return;
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setCameras(devices.filter(d => d.kind === "videoinput"));
      setMics(devices.filter(d => d.kind === "audioinput"));
    }).catch(() => {});
  }, []);

  // Fetch available TTS voices
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/comm/voices`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setTtsVoices)
      .catch(() => {});
  }, [token]);

  function stopDemo() {
    if (demoAudioRef.current) { demoAudioRef.current.pause(); demoAudioRef.current = null; }
    setDemoPlaying(null);
  }

  const demoLines = {
    nova:   "Hey there! Ready to ace your next interview? Let's get started.",
    alloy:  "Good morning. I'll be your interviewer today. Shall we begin?",
    claire: "Hi! I'm really looking forward to learning more about you today.",
    fable:  "Brilliant! Let's dive right into the questions, shall we?",
    libby:  "Lovely to meet you! Let's have a good chat about your experience.",
    sage:   "G'day! Take a breath, relax, and let's see what you can do.",
    echo:   "Alright, let's do this. Tell me about your biggest achievement.",
    cole:   "Let's get straight to it. Walk me through your background.",
    ryan:   "Welcome aboard. I'm looking forward to hearing your answers.",
    liam:   "No worries, take your time. Let's kick things off, shall we?",
  };

  async function playDemo(voiceId) {
    stopDemo();
    setDemoPlaying(voiceId);
    try {
      const demoText = demoLines[voiceId] || "Welcome to your interview. Let's see what you've got!";
      const res = await fetch(`${API}/comm/tts?text=${encodeURIComponent(demoText)}&voice=${voiceId}&token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      demoAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setDemoPlaying(null); demoAudioRef.current = null; };
      audio.onerror = () => { URL.revokeObjectURL(url); setDemoPlaying(null); demoAudioRef.current = null; };
      audio.play();
    } catch {
      setDemoPlaying(null);
    }
  }

  function saveSettings() {
    localStorage.setItem("selected_camera",        camera);
    localStorage.setItem("selected_microphone",    mic);
    localStorage.setItem("whisper_model",          whisper);
    localStorage.setItem("default_difficulty",     difficulty);
    localStorage.setItem("enable_voice_analysis",  String(voiceOn));
    localStorage.setItem("enable_camera_analysis", String(cameraOn));
    localStorage.setItem("tts_voice",              selectedVoice);
    stopDemo();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputStyle = { width: "100%", background: "#1A2038", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 8, padding: "10px 14px", color: "#F1F5F9", fontSize: 14, cursor: "pointer", transition: "border-color 0.2s" };
  const labelStyle = { fontSize: 13, color: "#7C8BA8", marginBottom: 6, display: "block" };

  function Toggle({ on, onToggle }) {
    return (
      <div onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 99, background: on ? "linear-gradient(135deg, #C9A84C, #A68B3C)" : "#2D3748", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s", boxShadow: on ? "0 0 10px rgba(201,168,76,0.25)" : "none" }}>
        <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </div>
    );
  }

  const cardS = { background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(201,168,76,0.06)", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" };

  return (
    <SidebarLayout active="settings" user={user} onNav={onNav} onLogout={onLogout} showUser>
      <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, background: "linear-gradient(135deg, #F1F5F9 30%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Settings</h1>
            <p style={{ color: "#7C8BA8", fontSize: 13 }}>Configure hardware, AI preferences, and privacy controls.</p>
          </div>
          <button onClick={saveSettings}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 28px rgba(99,102,241,0.5)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.3)"}
            style={{ background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 600, padding: "10px 28px", borderRadius: 10, fontSize: 13, boxShadow: "0 4px 16px rgba(99,102,241,0.3)", transition: "all 0.2s", border: "none", cursor: "pointer" }}>
            Save Settings
          </button>
        </div>

        {saved && (
          <div style={{ marginBottom: 20, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 16px", color: "#22C55E", fontSize: 13, animation: "fadeIn 0.3s ease" }}>
            Settings saved successfully.
          </div>
        )}

        {/* 2-column grid: Hardware + Privacy left, AI right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Hardware */}
          <div style={cardS}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎥</div>
              <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>Hardware</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Camera Device</label>
                <select value={camera} onChange={e => setCamera(e.target.value)} style={inputStyle}>
                  <option value="">Default Camera</option>
                  {cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 8)}`}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Microphone</label>
                <select value={mic} onChange={e => setMic(e.target.value)} style={inputStyle}>
                  <option value="">Default Microphone</option>
                  {mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 8)}`}</option>)}
                </select>
              </div>
            </div>
            {cameras.length === 0 && mics.length === 0 && (
              <p style={{ marginTop: 12, color: "#64748B", fontSize: 12, padding: "8px 12px", background: "rgba(59,130,246,0.04)", borderRadius: 8 }}>
                Allow camera and microphone permissions to detect devices.
              </p>
            )}
          </div>

          {/* AI Preferences */}
          <div style={cardS}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🤖</div>
              <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>AI Engine</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Whisper Model</label>
                <select value={whisper} onChange={e => setWhisper(e.target.value)} style={inputStyle}>
                  <option value="tiny">Tiny — Fastest, lower accuracy</option>
                  <option value="base">Base — Recommended</option>
                  <option value="small">Small — Most accurate, slower</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Default Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={inputStyle}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 8, fontSize: 11, color: "#7C8BA8", lineHeight: 1.5 }}>
              Whisper model affects transcription speed and accuracy. Base is recommended for RTX 4050.
            </div>
          </div>
        </div>

        {/* TTS Voice Selection — full width */}
        {ttsVoices.length > 0 && (
          <div style={{ ...cardS, marginBottom: 20 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎙</div>
              <div>
                <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>AI Voice</h3>
                <p style={{ color: "#64748B", fontSize: 11, margin: 0 }}>Choose the voice for communication test questions. Click play to preview.</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
              {ttsVoices.map(v => {
                const isSelected = selectedVoice === v.id;
                const isPlaying = demoPlaying === v.id;
                const flagMap = { US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", AU: "\u{1F1E6}\u{1F1FA}", IN: "\u{1F1EE}\u{1F1F3}", JP: "\u{1F1EF}\u{1F1F5}", KR: "\u{1F1F0}\u{1F1F7}", FR: "\u{1F1EB}\u{1F1F7}", MX: "\u{1F1F2}\u{1F1FD}", DE: "\u{1F1E9}\u{1F1EA}" };
                const flag = flagMap[v.accent] || "";
                return (
                  <div key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    style={{
                      background: isSelected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                      border: isSelected ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: isSelected ? "0 0 16px rgba(99,102,241,0.25)" : "none",
                      borderRadius: 12, padding: "14px 12px", cursor: "pointer", transition: "all 0.2s", position: "relative",
                      textAlign: "center",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    {isSelected && <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: THEME.indigo, boxShadow: "0 0 6px rgba(99,102,241,0.6)" }} />}
                    <img
                      src={VOICE_AVATARS[v.id]}
                      alt={v.label}
                      style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", marginBottom: 8, border: isSelected ? `2px solid ${THEME.indigo}` : "2px solid rgba(255,255,255,0.08)", boxShadow: isSelected ? "0 0 10px rgba(99,102,241,0.4)" : "none" }}
                    />
                    <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{v.label}</div>
                    <div style={{ color: "#64748B", fontSize: 10, marginBottom: 2 }}>{flag} {v.accent} · {v.gender}</div>
                    <div style={{ color: "#7C8BA8", fontSize: 10, marginBottom: 8, minHeight: 28 }}>{v.desc}</div>
                    <button
                      onClick={e => { e.stopPropagation(); isPlaying ? stopDemo() : playDemo(v.id); }}
                      style={{
                        background: isPlaying ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.1)",
                        border: isPlaying ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(99,102,241,0.25)",
                        borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer",
                        color: isPlaying ? "#EF4444" : "#A5B4FC", fontWeight: 500, transition: "all 0.2s",
                      }}
                    >
                      {isPlaying ? "\u25A0 Stop" : "\u25B6 Play"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy Controls — full width */}
        <div style={cardS}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🛡</div>
            <h3 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15, margin: 0 }}>Privacy Controls</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {[
              { label: "Voice Analysis", sub: "Record and analyse speech during interviews", on: voiceOn, toggle: () => setVoiceOn(v => !v) },
              { label: "Camera Analysis", sub: "Track eye contact and facial expressions", on: cameraOn, toggle: () => setCameraOn(v => !v) },
            ].map((item, i) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderRight: i === 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div>
                  <div style={{ color: "#F1F5F9", fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ color: "#64748B", fontSize: 11 }}>{item.sub}</div>
                </div>
                <Toggle on={item.on} onToggle={item.toggle} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}


export default SettingsPage;
