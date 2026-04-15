import { useState, useEffect, useRef } from "react";
import { API, Bar, Spinner, buildWav, THEME } from "../shared";
import VisionRecorder from "../VisionRecorder";

function InterviewRoomPage({ token, user, sessionData, onResult, onBack }) {
  const [question, setQuestion]     = useState(null);
  const [answer, setAnswer]         = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [questionNum, setQuestionNum] = useState(1);
  const [elapsed, setElapsed]       = useState(0);

  // ── Voice recording ─────────────────────────────────────────────────
  const [recording, setRecording]     = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const audioCtxRef  = useRef(null);
  const processorRef = useRef(null);
  const samplesRef   = useRef([]);
  const srRef        = useRef(44100);

  // ── Vision ───────────────────────────────────────────────────────────
  const [visionDataPoints, setVisionDataPoints] = useState([]);
  const [latestVision, setLatestVision]         = useState(null);

  // ── Follow-up ────────────────────────────────────────────────────────
  const MAX_FOLLOWUPS = 2;
  const [followup, setFollowup]             = useState(null);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupSubmitting, setFollowupSubmitting] = useState(false);
  const [followupResult, setFollowupResult] = useState(null);
  const [followupCount, setFollowupCount]   = useState(0);

  // ── Transcript ──────────────────────────────────────────────────────
  const [transcript, setTranscript] = useState([]);

  // ── Skip limit ─────────────────────────────────────────────────────
  const MAX_SKIPS = 2;
  const [skipsUsed, setSkipsUsed] = useState(0);

  // ── TTS for question readout ──────────────────────────────────────
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef  = useRef(null);
  const ttsCallIdRef = useRef(0);

  function stopTTS() {
    ttsCallIdRef.current++;
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    setTtsPlaying(false);
  }

  async function playQuestionVoice(text) {
    stopTTS();
    const myId = ttsCallIdRef.current;
    if (!text) return;
    setTtsPlaying(true);
    try {
      const savedVoice = localStorage.getItem("tts_voice") || "nova";
      const res = await fetch(`${API}/comm/tts?text=${encodeURIComponent(text)}&voice=${savedVoice}&token=${encodeURIComponent(token)}`);
      if (!res.ok || myId !== ttsCallIdRef.current) { setTtsPlaying(false); return; }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (myId !== ttsCallIdRef.current) { URL.revokeObjectURL(blobUrl); setTtsPlaying(false); return; }
      const audio = new Audio(blobUrl);
      ttsAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(blobUrl); if (myId === ttsCallIdRef.current) { setTtsPlaying(false); ttsAudioRef.current = null; } };
      audio.onerror = () => { URL.revokeObjectURL(blobUrl); if (myId === ttsCallIdRef.current) { setTtsPlaying(false); ttsAudioRef.current = null; } };
      audio.play();
    } catch {
      if (myId === ttsCallIdRef.current) setTtsPlaying(false);
    }
  }

  const { sessionId, subjectId, topicId, subtopicId, difficulty, subjectName } = sessionData;

  async function finishSession() {
    try {
      await fetch(`${API}/interview/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch { /* best-effort */ }
  }

  useEffect(() => { fetchQuestion(); return () => stopTTS(); }, []);
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function fmtTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  async function fetchQuestion() {
    setLoading(true); setResult(null); setAnswer(""); setError("");
    setVoiceResult(null); setVisionDataPoints([]);
    setFollowup(null); setFollowupAnswer(""); setFollowupResult(null); setFollowupCount(0);
    try {
      let q = `subject_id=${subjectId}&difficulty=${difficulty}&session_id=${sessionId}`;
      if (topicId)    q += `&topic_id=${topicId}`;
      if (subtopicId) q += `&subtopic_id=${subtopicId}`;
      const r = await fetch(`${API}/interview/question?${q}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) { setError(d.detail || "Failed to fetch question"); setLoading(false); return; }
      setQuestion(d);
      if (d.question_text) playQuestionVoice(d.question_text);
    } catch { setError("Server error"); }
    setLoading(false);
  }

  async function submitAnswer() {
    stopTTS();
    const finalAnswer = answer.trim() || voiceResult?.transcript || "";
    if (!finalAnswer) { setError("Record or type your answer first."); return; }
    setError(""); setSubmitting(true);
    let avgFaceScore = 70;
    if (visionDataPoints.length > 0) {
      const valid = visionDataPoints.filter(p => p.face_detected && !isNaN(p.eye_contact) && !isNaN(p.head_stability));
      if (valid.length > 0) {
        const sum = valid.reduce((acc, p) => acc + (p.eye_contact * 0.5 + p.head_stability * 0.5), 0);
        avgFaceScore = sum / valid.length;
      }
    }
    try {
      const r = await fetch(`${API}/interview/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          session_id: sessionId, question_id: question.question_id,
          user_answer: finalAnswer,
          voice_score: voiceResult ? voiceResult.overall_voice_score : 0,
          face_score: avgFaceScore,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.detail || d?.error?.message || "Submission failed"); setSubmitting(false); return; }
      setResult(d);
      setTranscript(prev => [...prev, { q: question.question_text, a: finalAnswer, score: d.total_score, feedback: d.feedback }]);
      // Trigger follow-up for weak answers
      if (d.total_score < 70 && followupCount < MAX_FOLLOWUPS) {
        fetchFollowup(question.question_text, finalAnswer);
      }
    } catch { setError("Server error"); }
    setSubmitting(false);
  }

  async function fetchFollowup(questionText, userAnswer) {
    setFollowupLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(`${API}/ai/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question_text: questionText, user_answer: userAnswer, session_id: sessionId }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const d = await r.json();
      if (r.ok) { setFollowup({ question: d.followup_question }); setFollowupCount(c => c + 1); }
    } catch (e) {
      clearTimeout(timer);
      if (e.name === "AbortError") setError("Follow-up request timed out. Please try again.");
      /* else silent — follow-up is optional */
    }
    setFollowupLoading(false);
  }

  async function submitFollowupAnswer() {
    if (!followupAnswer.trim()) return;
    setFollowupSubmitting(true);
    try {
      const r = await fetch(`${API}/interview/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          session_id: sessionId, question_id: question.question_id,
          user_answer: followupAnswer, voice_score: 0, face_score: 0,
        }),
      });
      const d = await r.json();
      if (r.ok) setFollowupResult(d);
    } catch { /* silent */ }
    setFollowupSubmitting(false);
  }

  function handleVisionResult(data) {
    setLatestVision(data);
    setVisionDataPoints(prev => [...prev, data]);
  }

  async function startRecording() {
    setVoiceResult(null); samplesRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 44100 }
      });
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      srRef.current = ctx.sampleRate;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = proc;
      proc.onaudioprocess = (e) => samplesRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      src.connect(proc); proc.connect(ctx.destination);
      ctx._stream = stream;
      setRecording(true);
    } catch { setError("Microphone access denied."); }
  }

  async function stopRecording() {
    if (!audioCtxRef.current) return;
    setRecording(false); setVoiceLoading(true);
    try {
      if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
      if (audioCtxRef.current._stream) audioCtxRef.current._stream.getTracks().forEach(t => t.stop());
      await audioCtxRef.current.close(); audioCtxRef.current = null;
      const chunks = samplesRef.current;
      const total  = chunks.reduce((a, c) => a + c.length, 0);
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of chunks) { merged.set(c, off); off += c.length; }
      const wav = buildWav(merged, srRef.current);
      const fd  = new FormData(); fd.append("audio", wav, "answer.wav");
      const res = await fetch(`${API}/api/voice/analyze`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setVoiceResult(data);
        if (data.transcript) setAnswer(data.transcript);
      }
    } catch (e) { setError(`Voice error: ${e.message}`); }
    setVoiceLoading(false);
  }

  // Derived display values
  const pace       = voiceResult?.details?.pace;
  const confidence = voiceResult?.details?.confidence;
  const fillers    = voiceResult?.details?.filler_words;
  const liveText   = voiceResult?.transcript || answer;
  const rawEye     = latestVision?.eye_contact;
  const rawHead    = latestVision?.head_stability;
  const eyeVal     = (rawEye != null && !isNaN(rawEye)) ? Math.round(rawEye) : null;
  const headVal    = (rawHead != null && !isNaN(rawHead)) ? Math.round(rawHead) : null;
  const emotion    = latestVision?.emotion || "—";
  const headLabel  = headVal === null ? "—" : headVal >= 75 ? "Stable" : headVal >= 50 ? "Fair" : "Unstable";

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", background: "#0B0F1E" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ flex: "0 0 56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "linear-gradient(90deg, #0F1629, #111A30, #0F1629)", borderBottom: "1px solid rgba(201,168,76,0.08)", position: "relative" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #C9A84C, #E2C97E)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px rgba(201,168,76,0.3)" }}>💬</div>
          <div>
            <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>Interview Room</div>
            <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 500 }}>SESSION: {(subjectName || "INTERVIEW").toUpperCase()}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
            ⚙️ Settings
          </button>
          <button onClick={async () => { await finishSession(); onBack(); }} style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))", border: "1px solid rgba(239,68,68,0.35)", color: "#F87171", padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
            📞 End Interview
          </button>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 0 }}>

      {/* Left: Main interview area */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 14, padding: "16px 28px", overflowY: "auto" }}>

        {/* ── Row 1: AI Interviewer + Camera (two columns) ──────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, minHeight: 280 }}>

          {/* Left — AI Interviewer Panel */}
          <div style={{ background: "linear-gradient(180deg, #0F1629 0%, #111B35 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            {/* Subtle glow effect */}
            <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div style={{ fontSize: 11, color: "#E2C97E", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ width: 8, height: 8, background: "#22C55E", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }} />
              AI INTERVIEWER
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, flexShrink: 0 }}>
              <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "1.5px dashed rgba(201,168,76,0.3)", animation: "ringPulse 3s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "1.5px dashed rgba(201,168,76,0.15)", animation: "ringPulse 3s ease-in-out infinite 0.8s" }} />
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(201,168,76,0.25), rgba(129,140,248,0.15))", border: "2px solid rgba(201,168,76,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 0 30px rgba(201,168,76,0.15)" }}>💬</div>
              </div>
            </div>
            
            <div style={{ flex: 1, overflow: "hidden" }}>
              {loading ? (
                <div style={{ textAlign: "center", paddingTop: 12 }}><Spinner /></div>
              ) : question ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: THEME.indigo, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Current Question</div>
                    <button onClick={() => ttsPlaying ? stopTTS() : playQuestionVoice(question.question_text)}
                      style={{ background: ttsPlaying ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${ttsPlaying ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: ttsPlaying ? "#C9A84C" : "#94A3B8", fontSize: 11, transition: "all 0.2s" }}
                      title={ttsPlaying ? "Stop" : "Listen to question"}>
                      {ttsPlaying ? "■ Stop" : "🔊 Listen"}
                    </button>
                  </div>
                  <p style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 15, lineHeight: 1.65, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                    "{question.question_text}"
                  </p>
                </>
              ) : (
                <div style={{ color: "#EF4444", fontSize: 13 }}>{error || "No more questions available."}</div>
              )}
            </div>
          </div>

          {/* Right — Live Camera + Vision Metrics */}
          <div style={{ background: "#000", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Camera overlay label */}
            <div style={{ position: "absolute", top: 12, left: 14, zIndex: 5, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 6, color: "#94A3B8", fontSize: 11, fontWeight: 500, letterSpacing: "0.03em" }}>Camera Feed</span>
              <span style={{ background: "rgba(239,68,68,0.85)", padding: "4px 10px", borderRadius: 6, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", animation: "pulse 2s infinite" }}>● LIVE</span>
            </div>
            {/* Framerate counter */}
            <div style={{ position: "absolute", top: 12, right: 14, zIndex: 5, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 6, color: "#64748B", fontSize: 10, letterSpacing: "0.05em" }}>
              Q {questionNum} · {fmtTime(elapsed)}
            </div>
            
            <div style={{ flex: 1, minHeight: 0 }}>
              <VisionRecorder sessionId={sessionId} questionId={question?.question_id ?? 0} onVisionResult={handleVisionResult} token={token} />
            </div>
            
            {/* Vision Metrics Bar */}
            <div style={{ flex: "0 0 48px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "rgba(15,22,41,0.92)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { label: "Eye Contact",    value: eyeVal !== null ? `${eyeVal}%` : "—",  color: "#22C55E" },
                { label: "Head Stability", value: headLabel,                               color: "#E2C97E" },
                { label: "Emotion",        value: emotion,                                 color: "#F59E0B" },
              ].map((m, i) => (
                <div key={m.label} style={{ textAlign: "center", padding: "8px 6px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ color: "#64748B", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ color: m.color, fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Live Transcript ─────────────────────────────────── */}
        <div style={{ background: "linear-gradient(180deg, #0F1629 0%, #111B35 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 22px", minHeight: 90 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#F1F5F9", fontSize: 14 }}>
              <span style={{ fontSize: 16 }}>👤</span> Live Transcript
            </div>
            <span style={{ fontSize: 12, color: recording ? "#22C55E" : voiceLoading ? "#F59E0B" : voiceResult ? "#64748B" : "#475569", display: "flex", alignItems: "center", gap: 5, fontWeight: 500, fontStyle: "italic", animation: recording ? "pulse 1.5s infinite" : "none" }}>
              {recording ? "● Recording..." : voiceLoading ? "⏳ Analyzing..." : voiceResult ? "Analysis complete" : "Capturing audio..."}
            </span>
          </div>
          <p style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            {liveText ? `"${liveText}"` : "Press the 🎙 mic button below to start recording your answer..."}
          </p>
        </div>

        {/* ── Row 3: Voice Metrics OR Score Result ────────────────── */}
        {!result ? (
          <div style={{ background: "linear-gradient(180deg, #0F1629 0%, #111B35 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#F1F5F9", fontSize: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>📊</span> Voice Metrics
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              {[
                { label: "Pace",         value: pace ? `${pace.wpm} WPM` : "—",  bar: pace ? Math.min(100, (pace.wpm / 200) * 100) : 0, color: "#C9A84C", desc: pace?.label || "Steady and clear delivery speed." },
                { label: "Confidence",   value: confidence ? (confidence.confidence_score >= 70 ? "High" : confidence.confidence_score >= 45 ? "Medium" : "Low") : "—", bar: confidence?.confidence_score || 0, color: "#22C55E", desc: "Low pitch variability and firm tone." },
                { label: "Filler Words", value: fillers ? `${fillers.count} Detected` : "—", bar: fillers ? Math.min(100, fillers.count * 15) : 0, color: "#F59E0B", desc: fillers?.count > 0 ? `Occasional "um" or "like" used.` : "Clean speech detected." },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                    <span style={{ color: m.color, fontSize: 13, fontWeight: 700 }}>{m.value}</span>
                  </div>
                  <Bar value={m.bar} color={m.color} height={6} />
                  <p style={{ color: "#64748B", fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-in" style={{ background: "linear-gradient(180deg, #0F1629 0%, #111B35 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 22px", display: "flex", gap: 20 }}>
            <div style={{ flex: "0 0 80px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4, fontWeight: 600, letterSpacing: "0.08em" }}>TOTAL</div>
              <div style={{ fontSize: 42, fontWeight: 800, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>{Math.round(result.total_score)}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>/ 100</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
              {[
                { label: "NLP Score",   value: result.nlp_score,   color: "#C9A84C" },
                { label: "Voice",       value: result.voice_score, color: "#F59E0B" },
                { label: "Eye Contact", value: result.face_score,  color: "#22C55E" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12 }}>
                    <span style={{ color: "#94A3B8" }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 600 }}>{Math.round(s.value)}%</span>
                  </div>
                  <Bar value={s.value} color={s.color} height={5} />
                </div>
              ))}
            </div>
            <div style={{ flex: 1.4, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
              <div style={{ background: "rgba(201,168,76,0.08)", borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid #C9A84C" }}>
                <p style={{ color: "#C7D2FE", fontSize: 12, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", margin: 0 }}>
                  💡 {result.feedback}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setQuestionNum(n => n + 1); fetchQuestion(); }} style={{ flex: 1, background: `linear-gradient(135deg, ${THEME.indigo}, #818CF8)`, color: "#fff", fontWeight: 600, padding: "10px", borderRadius: 10, fontSize: 13, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
                  → Next Question
                </button>
                <button onClick={async () => { await finishSession(); onResult(result); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
                  Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Transcript Panel */}
      {transcript.length > 0 && (
        <div style={{ flex: "0 0 280px", background: "#0F1629", borderLeft: "1px solid rgba(255,255,255,0.07)", padding: "16px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#E2C97E", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Session Transcript</div>
          {transcript.map((t, i) => (
            <div key={i} className="fade-in" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700, marginBottom: 4 }}>Q{i + 1}</div>
              <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.q}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.a}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: t.score >= 70 ? "#22C55E" : t.score >= 45 ? "#F59E0B" : "#EF4444" }}>{Math.round(t.score)}</span>
                <span style={{ fontSize: 10, color: "#475569" }}>/ 100</span>
              </div>
              {t.feedback && <div style={{ fontSize: 10, color: "#64748B", marginTop: 4, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.feedback}</div>}
            </div>
          ))}
        </div>
      )}

      </div>{/* end main content flex row */}

      {/* ── Follow-up Question Panel ──────────────────────────────────── */}
      {followupLoading && (
        <div className="fade-in" style={{ margin: "0 28px 8px", background: "#0F1629", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="spin" style={{ fontSize: 14, color: "#C9A84C" }}>⟳</span>
          <span style={{ color: "#94A3B8", fontSize: 13 }}>Generating follow-up question...</span>
        </div>
      )}
      {followup && !followupLoading && (
        <div className="fade-in" style={{ margin: "0 28px 8px", background: "#0F1629", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔎</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Follow-up Question</div>
              <div style={{ color: "#F1F5F9", fontSize: 14, lineHeight: 1.5 }}>{followup.question}</div>
            </div>
          </div>
          {!followupResult ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={followupAnswer} onChange={e => setFollowupAnswer(e.target.value)} placeholder="Type your answer..."
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", color: "#F1F5F9", fontSize: 13, outline: "none" }} />
              <button onClick={submitFollowupAnswer} disabled={followupSubmitting || !followupAnswer.trim()}
                style={{ background: "#F59E0B", color: "#000", fontWeight: 700, fontSize: 13, padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", opacity: followupSubmitting ? 0.6 : 1 }}>
                {followupSubmitting ? "..." : "Submit"}
              </button>
            </div>
          ) : (
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#22C55E", fontWeight: 700, fontSize: 14 }}>{Math.round(followupResult.total_score)}</span>
              <span style={{ color: "#94A3B8", fontSize: 12 }}>/ 100 on follow-up · {followupResult.feedback?.slice(0, 80)}...</span>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Action Bar ────────────────────────────────────────── */}
      <div style={{ flex: "0 0 60px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "linear-gradient(90deg, #0F1629, #111A30, #0F1629)", borderTop: "1px solid rgba(201,168,76,0.08)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />
        {/* Left: Avatars + Timer */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #E2C97E)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, border: "2px solid #0F1629", zIndex: 2 }}>
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(201,168,76,0.2)", border: "2px solid #0F1629", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginLeft: -8, zIndex: 1 }}>🤖</div>
          </div>
          <span style={{ color: "#64748B", fontSize: 13, fontWeight: 500 }}>Interview in progress: <span style={{ color: "#CBD5E1", fontWeight: 600 }}>{fmtTime(elapsed)}</span> / 30:00</span>
        </div>

        {/* Right: Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {error && <span style={{ color: "#F87171", fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{error}</span>}
          
          {/* Mic button */}
          {question && !result && (
            <button onClick={recording ? stopRecording : startRecording} disabled={voiceLoading}
              title={recording ? "Stop Recording" : "Start Recording"}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: recording ? "rgba(239,68,68,0.2)" : "rgba(201,168,76,0.15)",
                border: `2px solid ${recording ? "rgba(239,68,68,0.5)" : "rgba(201,168,76,0.4)"}`,
                color: recording ? "#F87171" : "#E2C97E",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                animation: recording ? "pulse 1.2s infinite" : "none",
                cursor: voiceLoading ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}
            >
              {voiceLoading ? <Spinner /> : "🎙"}
            </button>
          )}
          {question && !result && (
            <button
              onClick={async () => {
                try {
                  const r = await fetch(`${API}/interview/skip?session_id=${sessionId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                  const d = await r.json();
                  if (!r.ok) { setError(d.detail || d?.error?.message || "Cannot skip"); return; }
                  setSkipsUsed(d.skips_used);
                } catch { setError("Skip failed"); return; }
                setQuestionNum(n => n + 1); fetchQuestion();
              }}
              disabled={skipsUsed >= MAX_SKIPS}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: skipsUsed >= MAX_SKIPS ? "#475569" : "#CBD5E1", padding: "0 24px", height: 40, borderRadius: 10, fontSize: 14, fontWeight: 500, transition: "all 0.2s", opacity: skipsUsed >= MAX_SKIPS ? 0.5 : 1, cursor: skipsUsed >= MAX_SKIPS ? "not-allowed" : "pointer" }}
            >
              Skip ({MAX_SKIPS - skipsUsed} left)
            </button>
          )}
          {question && !result && (
            <button
              onClick={submitAnswer}
              disabled={submitting}
              style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", color: "#fff", fontWeight: 700, padding: "0 28px", height: 40, borderRadius: 10, fontSize: 14, opacity: submitting ? 0.7 : 1, boxShadow: "0 4px 14px rgba(34,197,94,0.3)", transition: "all 0.2s", letterSpacing: "0.02em" }}
            >
              {submitting ? <Spinner /> : "Submit Answer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default InterviewRoomPage;
