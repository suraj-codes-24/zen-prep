import { useState, useEffect, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { API, ExamGuidanceModal, buildWav, THEME } from "../shared";
import { SidebarLayout } from "./Sidebar";

const COMM_SECTIONS = [
  { id: "A", name: "Read Sentences",         icon: "📖", desc: "Read sentences aloud clearly", count: 8,  time: 15 },
  { id: "B", name: "Repeat Sentences",        icon: "🔁", desc: "Listen and repeat what you hear", count: 16, time: 15 },
  { id: "C", name: "Short Answer",            icon: "💬", desc: "Answer simple questions in 1-3 words", count: 24, time: 10 },
  { id: "D", name: "Arrange Sentences",       icon: "🧩", desc: "Speak the jumbled words in correct order", count: 10, time: 20 },
  { id: "E", name: "Story Retelling",         icon: "📝", desc: "Read a story, then retell it", count: 3,  time: 90 },
  { id: "F", name: "Open Questions",          icon: "🗣️", desc: "Speak freely on a given topic", count: 2,  time: 45 },
  { id: "G", name: "Describe Image",          icon: "🖼️", desc: "Describe what you see in an image", count: 3,  time: 45 },
  { id: "H", name: "Listening Comprehension",  icon: "🎧", desc: "Listen to a passage, answer a question", count: 4,  time: 15 },
];

const BAND_COLORS = {
  Fluent: "#6bdc96", Advanced: "#6bdc96", Proficient: "#90cdff",
  Developing: "#ECC94B", Beginner: "#ffb4ab", "N/A": "#8a929a",
};

const SECTION_META = {
  A: { name: "Read Sentences",          icon: "📖", max: 8,  prepTime: 3,  recTime: 15, hasTTS: false, silenceSubmitSec: 3 },
  B: { name: "Repeat Sentences",        icon: "🔁", max: 16, prepTime: 0,  recTime: 12, hasTTS: true,  silenceSubmitSec: 3 },
  C: { name: "Short Answer",            icon: "💬", max: 24, prepTime: 3,  recTime: 10, hasTTS: false, silenceSubmitSec: 3 },
  D: { name: "Arrange Sentences",       icon: "🔀", max: 10, prepTime: 10, recTime: 20, hasTTS: false, silenceSubmitSec: 3 },
  E: { name: "Story Retelling",         icon: "📚", max: 3,  prepTime: 3,  recTime: 60, hasTTS: false, silenceSubmitSec: 6 },
  F: { name: "Open Questions",          icon: "🎯", max: 2,  prepTime: 5,  recTime: 40, hasTTS: false, silenceSubmitSec: 10 },
  G: { name: "Describe Image",          icon: "🖼️",  max: 3,  prepTime: 5,  recTime: 45, hasTTS: false, silenceSubmitSec: 10 },
  H: { name: "Listening Comprehension", icon: "👂", max: 4,  prepTime: 0,  recTime: 15, hasTTS: true,  silenceSubmitSec: 10 },
};

const SECTION_ORDER_COMM = ["A","B","C","D","E","F","G","H"];

const SILENCE_THRESHOLD = 0.01;
const SILENCE_WARNING_SEC = 2;
// SILENCE_SUBMIT_SEC is now per-section from SECTION_META[section].silenceSubmitSec
const SECTION_REPORT_SEC = 30;

const AVG_SECS = { A:18, B:17, C:13, D:25, E:95, F:50, G:55, H:25 };

const QUICK_COUNTS = { A:4, B:8, C:12, D:5, E:1, F:1, G:1, H:2 };
const STANDARD_COUNTS = { A:8, B:16, C:24, D:10, E:3, F:2, G:3, H:4 };

const NEXT_SECTION_TIPS = {
  A: "Read at a steady pace. Don't rush. Pause naturally at commas.",
  B: "You'll hear a sentence - repeat it back exactly. Focus on accuracy.",
  C: "Answer in 1-3 words only. Be direct and concise.",
  D: "Speak the words in correct grammatical order. Subject, Verb, Object.",
  E: "Retell the story in your own words. Cover beginning, middle, and end.",
  F: "Structure your answer: intro, 2-3 points, conclusion.",
  G: "Describe everything you see: people, objects, setting, actions.",
  H: "Listen for names, numbers, and key facts. Answer directly.",
};

const estimateMins = (counts) =>
  Math.round(Object.entries(counts).reduce((sum, [s, n]) => sum + (AVG_SECS[s] || 20) * n, 0) / 60);

// Stitch design tokens
const ST = {
  bg: "#10141a", surfLow: "#181c22", surf: "#1c2026", surfHigh: "#262a31",
  surfHighest: "#31353c", surfLowest: "#0a0e14",
  primary: "#90cdff", primaryCont: "#63b3ed", onPrimary: "#00344f",
  tertiary: "#6bdc96", tertiaryCont: "#4ec07d",
  secondary: "#d2bbff", secondaryCont: "#57319e",
  error: "#ffb4ab", errorCont: "#93000a",
  onSurf: "#dfe2eb", onSurfVar: "#bfc7d1", outline: "#8a929a", outlineVar: "#40484f",
};

function CommunicationTestPage({ token, user, onNav, onLogout }) {
  const [phase, setPhase] = useState("intro"); // intro | test | section_report | results
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuidance, setShowGuidance] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  // Active session resume
  const [activeSession, setActiveSession] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/comm/active`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.active) setActiveSession(data);
        }
      } catch {}
      setCheckingActive(false);
    })();
  }, []);

  // Mode selection
  const [mode, setMode] = useState("standard"); // quick | standard | custom
  const [customCounts, setCustomCounts] = useState({ ...QUICK_COUNTS });

  // Test phase states
  const [testPhase, setTestPhase] = useState("prep"); // prep | recording | processing
  const [prepTimer, setPrepTimer] = useState(0);
  const [recTimer, setRecTimer] = useState(0);
  const [silenceSecs, setSilenceSecs] = useState(0);
  const [showSilenceWarning, setShowSilenceWarning] = useState(false);

  // Recording refs
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const samplesRef = useRef([]);
  const srRef = useRef(44100);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const silenceIntervalRef = useRef(null);
  const waveformRef = useRef(new Array(20).fill(5));
  const prepTimeoutsRef = useRef([]);
  const ttsCancelledRef = useRef(false);
  const sessionEndedRef = useRef(false);

  // Section report
  const [sectionAnswers, setSectionAnswers] = useState([]);
  const [reportTimer, setReportTimer] = useState(0);
  const [nextQuestionCache, setNextQuestionCache] = useState(null);
  const [completedSection, setCompletedSection] = useState(null);

  // TTS state
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsState, setTTSState] = useState('idle');
  // 'idle' | 'playing_first' | 'pause_after_first' | 'playing_second' | 'pause_after_second'
  const [ttsWordIndex, setTTSWordIndex] = useState(0);
  const ttsAudioRef  = useRef(null);
  const ttsTimerRef  = useRef(null);
  const ttsCallIdRef = useRef(0); // incremented on every stopTTSAudio to invalidate in-flight calls

  // Waveform animation
  const [waveformBars, setWaveformBars] = useState(new Array(20).fill(5));
  const animFrameRef = useRef(null);

  // Computed counts
  const selectedCounts = mode === "quick" ? QUICK_COUNTS : mode === "standard" ? STANDARD_COUNTS : customCounts;
  const totalQuestions = Object.values(selectedCounts).reduce((a, b) => a + b, 0);
  const estMins = estimateMins(selectedCounts);

  // ── TTS (ZenAI Voice via /comm/tts) ─────────────────────────────────────
  function clearPrepTimeouts() {
    prepTimeoutsRef.current.forEach(id => clearTimeout(id));
    prepTimeoutsRef.current = [];
  }

  function stopTTSAudio() {
    ttsCallIdRef.current++;          // invalidates any in-flight playAIVoice fetch
    ttsCancelledRef.current = true;
    if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    clearPrepTimeouts();
  }

  async function playAIVoice(text, onEnd) {
    stopTTSAudio();
    const myId = ttsCallIdRef.current; // capture — stale if another call starts later
    ttsCancelledRef.current = false;
    setTtsPlaying(true);
    setTTSWordIndex(0);
    try {
      const savedVoice = localStorage.getItem("tts_voice") || "nova";
      const url = `${API}/comm/tts?text=${encodeURIComponent(text)}&voice=${savedVoice}`;
      const audio = new Audio();
      // Set auth header via fetch, convert to blob URL for streaming
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok || myId !== ttsCallIdRef.current) { setTtsPlaying(false); return; }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (myId !== ttsCallIdRef.current) { URL.revokeObjectURL(blobUrl); setTtsPlaying(false); return; }
      audio.src = blobUrl;
      audio.preload = "auto";
      ttsAudioRef.current = audio;

      // Estimate word timing for highlight animation
      const words = text.split(' ');
      let charPositions = [];
      let pos = 0;
      for (const w of words) { charPositions.push(pos); pos += w.length + 1; }

      audio.onloadedmetadata = () => {
        const dur = audio.duration || 3;
        const msPerWord = (dur * 1000) / words.length;
        let wordIdx = 0;
        ttsTimerRef.current = setInterval(() => {
          wordIdx++;
          if (wordIdx < words.length) {
            setTTSWordIndex(charPositions[wordIdx]);
          } else {
            clearInterval(ttsTimerRef.current);
            ttsTimerRef.current = null;
          }
        }, msPerWord);
      };

      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        if (myId !== ttsCallIdRef.current) return; // stale — a newer call took over
        stopTTSAudio();
        setTtsPlaying(false);
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        if (myId !== ttsCallIdRef.current) return;
        stopTTSAudio();
        setTtsPlaying(false);
        if (onEnd) onEnd();
      };
      audio.play();
    } catch (e) {
      console.error('AI voice error:', e);
      if (myId !== ttsCallIdRef.current) return;
      setTtsPlaying(false);
      if (onEnd) onEnd();
    }
  }

  // ── Prep phase timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (testPhase !== "prep" || !question) return;
    const meta = SECTION_META[question.section];
    if (!meta || meta.hasTTS) return;
    if (ttsState !== 'idle') return; // wait for AI to finish speaking
    if (prepTimer <= 0) { startRecording(); return; }
    const t = setTimeout(() => setPrepTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [prepTimer, testPhase, question, ttsState]);

  // ── Recording timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (testPhase !== "recording") return;
    if (recTimer <= 0) { stopAndSubmit(); return; }
    const t = setTimeout(() => setRecTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [recTimer, testPhase]);

  // ── Silence detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (testPhase !== "recording" || !analyserRef.current) return;
    let silenceCount = 0;
    const submitThreshold = SECTION_META[question?.section]?.silenceSubmitSec ?? 6;
    const warningThreshold = submitThreshold - 1;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    silenceIntervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(dataArray);
      const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + (v - 128) ** 2, 0) / dataArray.length) / 128;
      if (rms < SILENCE_THRESHOLD) {
        silenceCount += 0.5;
        setSilenceSecs(silenceCount);
        if (silenceCount >= submitThreshold) {
          clearInterval(silenceIntervalRef.current);
          stopAndSubmit();
        } else if (silenceCount >= warningThreshold) {
          setShowSilenceWarning(true);
        }
      } else {
        silenceCount = 0;
        setSilenceSecs(0);
        setShowSilenceWarning(false);
      }
    }, 500);
    return () => { if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current); };
  }, [testPhase]);

  // ── Waveform animation ───────────────────────────────────────────────────
  useEffect(() => {
    if (testPhase !== "recording" || !analyserRef.current) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
    function draw() {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(freqData);
      const step = Math.floor(freqData.length / 20);
      const bars = [];
      for (let i = 0; i < 20; i++) {
        const val = freqData[i * step] || 0;
        bars.push(Math.max(4, (val / 255) * 80));
      }
      setWaveformBars(bars);
      animFrameRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [testPhase]);

  // ── Section report timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "section_report") return;
    if (reportTimer <= 0) { advanceFromSectionReport(); return; }
    const t = setTimeout(() => setReportTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [reportTimer, phase]);

  // ── Recording ────────────────────────────────────────────────────────────
  async function startRecording() {
    samplesRef.current = [];
    setSilenceSecs(0);
    setShowSilenceWarning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 44100 }
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      srRef.current = ctx.sampleRate;
      const src = ctx.createMediaStreamSource(stream);

      // Analyser for silence detection + waveform
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      // ScriptProcessor for raw audio capture
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = proc;
      proc.onaudioprocess = (e) => samplesRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      src.connect(proc);
      proc.connect(ctx.destination);

      const meta = SECTION_META[question.section];
      setRecTimer(meta ? meta.recTime : (question.time_limit || 15));
      setTestPhase("recording");
    } catch {
      setError("Microphone access denied.");
    }
  }

  function stopAndSubmit() {
    if (sessionEndedRef.current) return;
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTestPhase("processing");
    // Stop recording hardware
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    analyserRef.current = null;
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    handleSubmitAnswer(ctx);
  }

  async function handleSubmitAnswer(ctx) {
    try {
      if (ctx) await ctx.close();
      const chunks = samplesRef.current;
      const total = chunks.reduce((a, c) => a + c.length, 0);
      if (total < 1000) {
        await loadNextQuestionFlow();
        return;
      }
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of chunks) { merged.set(c, off); off += c.length; }
      const wav = buildWav(merged, srRef.current);
      const fd = new FormData();
      fd.append("audio", wav, "answer.wav");
      fd.append("question_id", String(question.question_id));
      const meta = SECTION_META[question.section];
      const timeLimit = meta ? meta.recTime : (question.time_limit || 15);
      fd.append("time_taken", String(Math.max(0, timeLimit - recTimer)));

      const res = await fetch(`${API}/comm/answer/${session.session_id}`, {
        method: "POST", body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSectionAnswers(prev => [...prev, {
          question_text: question.prompt_text,
          audio_text: question.audio_text,
          ideal_answer: question.ideal_answer,
          section: question.section,
          score: data.score,
          transcript: data.transcript,
          feedback: data.feedback,
          fluency: data.fluency,
          pace: data.pace_score,
          pronunciation: data.pronunciation_score,
          intonation: data.intonation_score,
          modulation: data.modulation_score,
          rhythm: data.rhythm_score,
          stress: data.stress_score,
          accuracy: data.word_match_score || data.keyword_match_score || data.semantic_score || 0,
        }]);

        if (data.session_complete) {
          const currentSection = question.section;
          setCompletedSection(currentSection);
          setReportTimer(SECTION_REPORT_SEC);
          setNextQuestionCache(null);
          // Fetch results
          const rr = await fetch(`${API}/comm/results/${session.session_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (rr.ok) setResults(await rr.json());
          setPhase("section_report");
          return;
        }

        // Get next question to check section change
        const nRes = await fetch(`${API}/comm/question/${session.session_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!nRes.ok) throw new Error("Failed to load next question");
        const nextQ = await nRes.json();

        if (nextQ.done) {
          const rr = await fetch(`${API}/comm/results/${session.session_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (rr.ok) setResults(await rr.json());
          setCompletedSection(question.section);
          setReportTimer(SECTION_REPORT_SEC);
          setNextQuestionCache(null);
          setPhase("section_report");
          return;
        }

        const sectionChanged = nextQ.section !== question.section;
        if (sectionChanged) {
          setCompletedSection(question.section);
          setNextQuestionCache(nextQ);
          setReportTimer(SECTION_REPORT_SEC);
          setPhase("section_report");
        } else {
          setQuestion(nextQ);
          beginPrepPhase(nextQ);
        }
      } else {
        throw new Error("Submit failed");
      }
    } catch (e) {
      setError(`Voice error: ${e.message}`);
      setTestPhase("prep");
    }
  }

  async function loadNextQuestionFlow() {
    try {
      const res = await fetch(`${API}/comm/question/${session.session_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load question");
      const data = await res.json();
      if (data.done) {
        const rr = await fetch(`${API}/comm/results/${session.session_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rr.ok) setResults(await rr.json());
        setPhase("results");
        return;
      }
      setQuestion(data);
      beginPrepPhase(data);
    } catch (e) { setError(e.message); }
  }

  function beginPrepPhase(q) {
    clearPrepTimeouts();
    setTestPhase("prep");
    setSilenceSecs(0);
    setShowSilenceWarning(false);
    const meta = SECTION_META[q.section];
    if (!meta) { setPrepTimer(3); return; }

    if (meta.hasTTS && q.audio_text) {
      stopTTSAudio();

      if (q.section === 'B') {
        // Section B: play TWICE with 3s pauses between each play, then record
        setTTSState('playing_first');
        playAIVoice(q.audio_text, () => {
          setTTSState('pause_after_first');
          const t1 = setTimeout(() => {
            setTTSState('playing_second');
            playAIVoice(q.audio_text, () => {
              setTTSState('pause_after_second');
              const t2 = setTimeout(() => {
                setTTSState('idle');
                startRecording();
              }, 3000);
              prepTimeoutsRef.current.push(t2);
            });
          }, 3000);
          prepTimeoutsRef.current.push(t1);
        });
        return;
      }

      // Section H: play passage once, then show question + 1s pause + speak it, then record
      setTTSState('playing_first');
      playAIVoice(q.audio_text, () => {
        setTTSState('idle');
        const t1 = setTimeout(() => {
          setTTSState('waiting_to_speak'); // question appears on screen
          const t2 = setTimeout(() => {
            setTTSState('speaking_question'); // AI starts speaking with animation
            playAIVoice(q.prompt_text, () => {
              setTTSState('idle');
              const t3 = setTimeout(() => startRecording(), 2000);
              prepTimeoutsRef.current.push(t3);
            });
          }, 1000);
          prepTimeoutsRef.current.push(t2);
        }, 2000);
        prepTimeoutsRef.current.push(t1);
      });
      return;
    }

    // Sections C, E, F, G: question appears first, 1s later AI speaks it
    if (['C', 'E', 'F', 'G'].includes(q.section)) {
      stopTTSAudio();
      setTTSState('waiting_to_speak'); // question visible, no sound animation yet
      const t1 = setTimeout(() => {
        setTTSState('speaking_question'); // AI starts speaking with sound bars
        playAIVoice(q.prompt_text, () => {
          setTTSState('idle');
          setPrepTimer(meta.prepTime);
        });
      }, 1000);
      prepTimeoutsRef.current.push(t1);
      return;
    }

    setPrepTimer(meta.prepTime);
  }

  function advanceFromSectionReport() {
    setSectionAnswers([]);
    if (!nextQuestionCache) {
      // Session complete - go to results
      setPhase("results");
      return;
    }
    setQuestion(nextQuestionCache);
    setNextQuestionCache(null);
    setCompletedSection(null);
    setPhase("test");
    beginPrepPhase(nextQuestionCache);
  }

  // ── Session management ───────────────────────────────────────────────────
  async function resumeActiveSession() {
    if (!activeSession) return;
    sessionEndedRef.current = false;
    setLoading(true); setError("");
    try {
      const sid = activeSession.session_id;
      const qRes = await fetch(`${API}/comm/question/${sid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!qRes.ok) throw new Error("Failed to load question");
      const qData = await qRes.json();
      if (qData.done) {
        const rr = await fetch(`${API}/comm/results/${sid}`, { headers: { Authorization: `Bearer ${token}` } });
        if (rr.ok) setResults(await rr.json());
        setPhase("results"); setLoading(false); return;
      }
      setSession({ session_id: sid, total_questions: activeSession.total_questions });
      setQuestion(qData);
      setSectionAnswers([]);
      setPhase("test");
      beginPrepPhase(qData);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function startFreshTest() {
    // Finish old active session first, then start new
    if (activeSession) {
      try {
        await fetch(`${API}/comm/finish/${activeSession.session_id}`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
      setActiveSession(null);
    }
    startTest();
  }

  async function startTest() {
    sessionEndedRef.current = false;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/comm/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ section_counts: selectedCounts }),
      });
      if (!res.ok) throw new Error("Failed to start test");
      const data = await res.json();
      setSession(data);
      setActiveSession(null);
      // Load first question
      const qRes = await fetch(`${API}/comm/question/${data.session_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!qRes.ok) throw new Error("Failed to load first question");
      const qData = await qRes.json();
      if (qData.done) { setPhase("results"); setLoading(false); return; }
      setQuestion(qData);
      setSectionAnswers([]);
      setPhase("test");
      beginPrepPhase(qData);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function endTestEarly() {
    if (!session) return;
    sessionEndedRef.current = true;
    setTestPhase("processing");
    stopTTSAudio();
    setTTSState('idle');
    setTtsPlaying(false);
    if (silenceIntervalRef.current) { clearInterval(silenceIntervalRef.current); silenceIntervalRef.current = null; }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (audioCtxRef.current) { try { await audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    analyserRef.current = null;
    try {
      const res = await fetch(`${API}/comm/finish/${session.session_id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const rr = await fetch(`${API}/comm/results/${session.session_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rr.ok) setResults(await rr.json());
      }
    } catch {}
    setPhase("results");
  }

  // ── Stitch helpers ───────────────────────────────────────────────────────
  const glassCard = { background: "rgba(28,32,38,0.7)", backdropFilter: "blur(12px)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.12)", boxShadow: "inset 0 0 40px rgba(245,158,11,0.03)" };
  const stCard = { background: ST.surfLow, borderRadius: 8, border: `1px solid ${ST.outlineVar}1a` };
  const stBtn = { background: `linear-gradient(135deg, ${ST.primary}, ${ST.primaryCont})`, color: ST.onPrimary, border: "none", borderRadius: 8, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'Space Grotesk','Inter',sans-serif", boxShadow: `0 10px 30px rgba(144,205,255,0.2)`, transition: "all 0.2s" };
  const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: ST.onSurfVar };

  function scoreColor(sc) {
    if (sc >= 80) return ST.tertiary;
    if (sc >= 60) return "#ECC94B";
    return ST.error;
  }

  // ── INTRO PHASE ──────────────────────────────────────────────────────────
  function renderIntro() {
    const modeCards = [
      { key: "quick", label: "Quick", icon: "⚡", q: Object.values(QUICK_COUNTS).reduce((a,b) => a+b, 0), time: `~${estimateMins(QUICK_COUNTS)} min`, desc: "Fast assessment across all 8 sections" },
      { key: "standard", label: "Standard", icon: "📋", q: Object.values(STANDARD_COUNTS).reduce((a,b) => a+b, 0), time: `~${estimateMins(STANDARD_COUNTS)} min`, desc: "Comprehensive evaluation for accurate scoring" },
      { key: "custom", label: "Custom", icon: "🎚", q: "Variable", time: "Your choice", desc: "Configure questions per section manually" },
    ];
    return (
      <div style={{ padding: "28px 36px", maxWidth: 1200, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
        {/* Header banner */}
        <div style={{ background: ST.surfLow, border: `1px solid ${ST.outlineVar}1a`, borderRadius: 16, padding: "24px 32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${ST.primary}50, transparent)` }} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, background: `linear-gradient(135deg, ${ST.onSurf} 30%, ${ST.primary} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Communication Test</h1>
            <p style={{ color: ST.onSurfVar, fontSize: 13, margin: 0 }}>Versant-style spoken English assessment · AI voice prompts · 9-dimension voice analysis</p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {[{ v: "140", l: "Questions" }, { v: "8", l: "Sections" }, { v: "A1-C2", l: "Band" }].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ color: ST.primary, fontWeight: 700, fontSize: 18 }}>{s.v}</div>
                <div style={{ color: ST.onSurfVar, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active session resume banner */}
        {activeSession && !checkingActive && (
          <div style={{ background: `${ST.primary}0a`, border: `1px solid ${ST.primary}30`, borderRadius: 12, padding: "16px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeIn 0.4s ease" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: "#F59E0B", animation: "pulse 2s infinite" }} />
                <span style={{ color: ST.onSurf, fontWeight: 700, fontSize: 14 }}>Active Session Found</span>
              </div>
              <p style={{ color: ST.onSurfVar, fontSize: 12, margin: 0 }}>
                Section {activeSession.current_section} · {activeSession.questions_answered}/{activeSession.total_questions} answered · started {activeSession.start_time ? new Date(activeSession.start_time).toLocaleString() : "recently"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={resumeActiveSession} disabled={loading}
                style={{ background: `linear-gradient(135deg, ${ST.primary}, ${ST.primaryCont})`, color: ST.onPrimary, border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                {loading ? "Loading..." : "Resume"}
              </button>
              <button onClick={startFreshTest} disabled={loading}
                style={{ background: "rgba(255,255,255,0.05)", color: ST.onSurfVar, border: `1px solid ${ST.outlineVar}30`, borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                Start Fresh
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          {/* Left column */}
          <div>
            {/* Mode selection */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ color: ST.onSurf, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Select Test Mode</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {modeCards.map((m, i) => {
                  const sel = mode === m.key;
                  return (
                    <button key={m.key} onClick={() => setMode(m.key)}
                      style={{
                        padding: "20px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                        background: sel ? `${ST.primary}12` : ST.surfLow,
                        border: sel ? `2px solid ${ST.primary}` : `1px solid ${ST.outlineVar}1a`,
                        transition: "all 0.25s", animation: `fadeInUp 0.35s ease ${i * 0.06}s both`,
                        position: "relative", overflow: "hidden",
                      }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = `${ST.primary}40`; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = `${ST.outlineVar}1a`; }}>
                      {sel && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${ST.primary}, ${ST.primary}40)` }} />}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{m.icon}</span>
                        <span style={{ ...labelStyle, color: sel ? ST.primary : ST.onSurfVar, fontSize: 11 }}>{m.label}</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: ST.onSurf, fontFamily: "'Space Grotesk','Inter',sans-serif", marginBottom: 4 }}>
                        {typeof m.q === "number" ? `${m.q}Q` : m.q}
                      </div>
                      <div style={{ fontSize: 12, color: sel ? ST.primaryCont : ST.onSurfVar, fontWeight: sel ? 600 : 400, marginBottom: 6 }}>{m.time}</div>
                      <div style={{ fontSize: 11, color: ST.onSurfVar, lineHeight: 1.4, opacity: 0.7 }}>{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8 Sections overview */}
            <div>
              <h2 style={{ color: ST.onSurf, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>8 Test Sections</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {SECTION_ORDER_COMM.map((s, i) => {
                  const meta = SECTION_META[s];
                  const cnt = selectedCounts[s];
                  return (
                    <div key={s} style={{
                      background: ST.surfLow, border: `1px solid ${ST.outlineVar}1a`, borderRadius: 10,
                      padding: "12px 10px", textAlign: "center", animation: `fadeInUp 0.3s ease ${0.15 + i * 0.03}s both`,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{meta.icon}</div>
                      <div style={{ color: ST.onSurf, fontWeight: 600, fontSize: 11, marginBottom: 2 }}>Section {s}</div>
                      <div style={{ color: ST.onSurfVar, fontSize: 10, marginBottom: 4 }}>{meta.name}</div>
                      <div style={{ background: `${ST.primary}15`, borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
                        <span style={{ color: ST.primary, fontSize: 10, fontWeight: 600 }}>{cnt}Q</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ position: "sticky", top: 24, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Config panel */}
            <div style={{ background: ST.surfLow, borderRadius: 12, overflow: "hidden", border: `1px solid ${ST.outlineVar}1a`, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${ST.outlineVar}1a`, background: `${ST.primary}06` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ ...labelStyle, color: ST.primary, margin: 0 }}>
                    {mode === "custom" ? "Custom Profile" : "Test Summary"}
                  </h3>
                  <span style={{ fontSize: 11, color: ST.onSurfVar, background: ST.surf, padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>
                    {totalQuestions}Q · {estMins} min
                  </span>
                </div>
              </div>

              <div style={{ padding: "16px 20px" }}>
                {mode === "custom" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {SECTION_ORDER_COMM.map(s => {
                      const meta = SECTION_META[s];
                      return (
                        <div key={s}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, ...labelStyle, fontSize: 10, letterSpacing: 1 }}>
                            <span>{meta.icon} {s}: {meta.name}</span>
                            <span style={{ color: ST.primary, fontWeight: 700 }}>{customCounts[s]}/{meta.max}</span>
                          </div>
                          <input type="range" min="1" max={meta.max} step="1" value={customCounts[s]}
                            onChange={(e) => setCustomCounts(prev => ({ ...prev, [s]: parseInt(e.target.value) }))}
                            style={{ width: "100%", height: 4, accentColor: ST.primary, cursor: "pointer" }} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SECTION_ORDER_COMM.map(s => {
                      const meta = SECTION_META[s];
                      const cnt = selectedCounts[s];
                      return (
                        <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12 }}>{meta.icon}</span>
                            <span style={{ ...labelStyle, fontSize: 10 }}>{meta.name}</span>
                          </div>
                          <div style={{ background: `${ST.primary}12`, borderRadius: 4, padding: "2px 8px" }}>
                            <span style={{ color: ST.primary, fontSize: 10, fontWeight: 600 }}>{cnt}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ borderTop: `1px solid ${ST.outlineVar}1a`, marginTop: 16, paddingTop: 12 }}>
                  <button onClick={() => setShowGuidance(true)} disabled={loading}
                    style={{ ...stBtn, width: "100%", padding: "14px", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                    {loading ? "Starting..." : "Start Test"}
                    {!loading && <span style={{ fontSize: 14 }}>→</span>}
                  </button>
                  {error && <p style={{ color: ST.error, fontSize: 12, marginTop: 8, textAlign: "center" }}>{error}</p>}
                </div>
              </div>
            </div>

            {/* Microphone status */}
            <div style={{ background: ST.surfLow, borderRadius: 10, padding: "14px 16px", border: `1px solid ${ST.outlineVar}1a`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: `radial-gradient(circle at 30% 50%, ${ST.primary}33, transparent 70%)` }} />
              <div style={{ display: "flex", gap: 3, alignItems: "end", zIndex: 1 }}>
                <span style={{ width: 3, height: 14, background: `${ST.tertiary}99`, borderRadius: 99 }} />
                <span style={{ width: 3, height: 20, background: ST.tertiary, borderRadius: 99 }} />
                <span style={{ width: 3, height: 10, background: `${ST.tertiary}66`, borderRadius: 99 }} />
              </div>
              <span style={{ ...labelStyle, zIndex: 1, fontSize: 10 }}>Microphone Ready</span>
            </div>

            {/* Quick tips */}
            <div style={{ background: ST.surfLow, borderRadius: 10, padding: "14px 16px", border: `1px solid ${ST.outlineVar}1a` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { icon: "🎧", text: "AI reads prompts aloud — listen carefully" },
                  { icon: "🎤", text: "Speak naturally at a steady pace" },
                  { icon: "⏱", text: "Auto-submits after silence detected" },
                ].map(t => (
                  <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11 }}>{t.icon}</span>
                    <span style={{ color: ST.onSurfVar, fontSize: 11, opacity: 0.7 }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TEST PHASE ───────────────────────────────────────────────────────────
  function renderTest() {
    if (!question) return <div style={{ padding: 40, textAlign: "center", color: ST.onSurfVar }}>Loading question...</div>;

    const prog = question.progress || {};
    const meta = SECTION_META[question.section] || {};
    const pct = prog.total ? Math.round(((prog.current || 0) / prog.total) * 100) : 0;

    // TTS word highlight helper
    function renderHighlightedText(text, charIndex) {
      const words = text.split(' ');
      let pos = 0;
      return words.map((word, i) => {
        const wordStart = pos;
        pos += word.length + 1;
        const isActive = charIndex >= wordStart && charIndex < pos;
        const isPast = charIndex >= pos;
        return (
          <span key={i} style={{
            color: isActive ? '#90cdff' : isPast ? '#6b7280' : '#e2e8f0',
            fontWeight: isActive ? 700 : 400,
            fontSize: isActive ? 30 : 26,
            transition: 'all 0.1s ease',
            marginRight: 8,
            textShadow: isActive ? '0 0 20px rgba(144,205,255,0.8)' : 'none',
          }}>
            {word}
          </span>
        );
      });
    }

    // Section content rendering
    function renderSectionContent() {
      const section = question.section;

      if (section === "A") {
        return (
          <div key={question.question_id} style={{ textAlign: 'center', padding: '20px 40px', animation: 'sectionAFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
            <p style={{ fontSize: 28, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.7, maxWidth: 680, margin: '0 auto', letterSpacing: 0.3 }}>
              {question.prompt_text}
            </p>
            <p style={{ color: '#4a5568', fontSize: 13, marginTop: 16, letterSpacing: 1, textTransform: 'uppercase', animation: 'sectionAFadeIn 1.1s cubic-bezier(0.22,1,0.36,1) both', animationDelay: '0.3s' }}>
              Read aloud clearly and naturally
            </p>
          </div>
        );
      }
      if (section === "B") {
        return (
          <div style={{ textAlign: 'center', padding: '20px 40px' }}>
            {(ttsState === 'playing_first' || ttsState === 'playing_second') && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, height: 52, alignItems: 'center' }}>
                  {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((bar, i) => (
                    <div key={i} style={{
                      width: 4, borderRadius: 4, background: `rgba(144,205,255,${0.5 + (i % 3) * 0.2})`,
                      animation: `soundBar${bar} ${0.9 + (i % 3) * 0.15}s cubic-bezier(0.4,0,0.2,1) infinite`,
                      animationDelay: `${i * 0.07}s`,
                      boxShadow: '0 0 6px rgba(144,205,255,0.3)',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎧</div>
                <p style={{ color: '#90cdff', fontSize: 20, fontWeight: 600 }}>
                  {ttsState === 'playing_first' ? 'Listen carefully...' : 'Listen again...'}
                </p>
                <p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
                  {ttsState === 'playing_first' ? 'First play — focus on the sentence' : 'Second play — pay attention to every word'}
                </p>
              </>
            )}
            {(ttsState === 'pause_after_first' || ttsState === 'pause_after_second') && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
                <p style={{ color: '#90cdff' }}>
                  {ttsState === 'pause_after_first' ? 'Get ready for the repeat...' : 'Get ready to speak...'}
                </p>
              </div>
            )}
            {ttsState === 'idle' && testPhase === 'recording' && (
              <p style={{ color: '#6bdc96', fontSize: 20, textAlign: 'center' }}>
                Now repeat what you heard
              </p>
            )}
            {ttsState === 'idle' && testPhase === 'processing' && (
              <p style={{ color: ST.onSurfVar, fontSize: 16 }}>Processing your response...</p>
            )}
          </div>
        );
      }
      if (section === "C") {
        const isSpeaking = ttsState === 'speaking_question';
        const isWaiting = ttsState === 'waiting_to_speak';
        return (
          <div key={question.question_id} style={{ textAlign: "center", padding: "32px 0", animation: 'sectionAFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
            {isSpeaking && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, height: 48, alignItems: 'center' }}>
                {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((bar, i) => (
                  <div key={i} style={{ width: 4, borderRadius: 4, background: `rgba(144,205,255,${0.5 + (i % 3) * 0.2})`, animation: `soundBar${bar} ${0.9 + (i % 3) * 0.15}s cubic-bezier(0.4,0,0.2,1) infinite`, animationDelay: `${i * 0.07}s`, boxShadow: '0 0 6px rgba(144,205,255,0.3)' }} />
                ))}
              </div>
            )}
            <p style={{ fontSize: 24, color: ST.onSurf, marginBottom: 8 }}>{question.prompt_text}</p>
            <span style={{ color: (isSpeaking || isWaiting) ? '#90cdff' : ST.tertiary, fontSize: 13 }}>
              {isSpeaking ? 'AI is speaking...' : isWaiting ? 'Get ready to listen...' : 'Answer in 1-3 words'}
            </span>
          </div>
        );
      }
      if (section === "D") {
        const text = question.prompt_text || "";
        const parts = text.includes(":") ? text.split(":").pop().trim() : text;
        const words = parts.split(/[\s,]+/).filter(Boolean);
        return (
          <div style={{ padding: "32px 0" }}>
            {text.includes(":") && <p style={{ color: ST.onSurfVar, fontSize: 14, textAlign: "center", marginBottom: 16 }}>{text.split(":")[0]}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {words.map((word, i) => (
                <span key={i} style={{ background: ST.surfHigh, color: ST.onSurf, padding: "8px 18px", borderRadius: 20, fontSize: 18, fontWeight: 500 }}>{word}</span>
              ))}
            </div>
            <p style={{ color: ST.onSurfVar, textAlign: "center", marginTop: 16, fontSize: 13 }}>Speak the words in the correct order</p>
          </div>
        );
      }
      if (section === "E") {
        const isSpeaking = ttsState === 'speaking_question';
        const isWaiting = ttsState === 'waiting_to_speak';
        if (isSpeaking || isWaiting) {
          return (
            <div key={question.question_id} style={{ animation: 'sectionAFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
              {isSpeaking && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, height: 48, alignItems: 'center' }}>
                  {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((bar, i) => (
                    <div key={i} style={{ width: 4, borderRadius: 4, background: `rgba(144,205,255,${0.5 + (i % 3) * 0.2})`, animation: `soundBar${bar} ${0.9 + (i % 3) * 0.15}s cubic-bezier(0.4,0,0.2,1) infinite`, animationDelay: `${i * 0.07}s`, boxShadow: '0 0 6px rgba(144,205,255,0.3)' }} />
                  ))}
                </div>
              )}
              <div style={{ maxWidth: 650, margin: "0 auto", background: ST.surfLow, borderRadius: 12, padding: 24 }}>
                <p style={{ color: ST.onSurfVar, lineHeight: 1.8, fontSize: 16 }}>{question.prompt_text}</p>
                <p style={{ color: '#90cdff', textAlign: "center", marginTop: 16, fontWeight: 600 }}>
                  {isSpeaking ? 'AI is reading the story aloud...' : 'Read the story...'}
                </p>
              </div>
            </div>
          );
        }
        if (testPhase === "prep" && prepTimer > 0) {
          return (
            <div style={{ maxWidth: 650, margin: "0 auto", background: ST.surfLow, borderRadius: 12, padding: 24 }}>
              <p style={{ color: ST.onSurfVar, lineHeight: 1.8, fontSize: 16 }}>{question.prompt_text}</p>
              <p style={{ color: "#ECC94B", textAlign: "center", marginTop: 16, fontWeight: 600 }}>
                Prep time: {prepTimer}s remaining - read carefully
              </p>
            </div>
          );
        }
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: ST.onSurfVar, fontSize: 18 }}>Retell the story in your own words</p>
          </div>
        );
      }
      if (section === "F") {
        const isSpeaking = ttsState === 'speaking_question';
        const isWaiting = ttsState === 'waiting_to_speak';
        return (
          <div key={question.question_id} style={{ textAlign: "center", maxWidth: 600, margin: "0 auto", padding: "32px 0", animation: 'sectionAFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
            {isSpeaking && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, height: 48, alignItems: 'center' }}>
                {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((bar, i) => (
                  <div key={i} style={{ width: 4, borderRadius: 4, background: `rgba(144,205,255,${0.5 + (i % 3) * 0.2})`, animation: `soundBar${bar} ${0.9 + (i % 3) * 0.15}s cubic-bezier(0.4,0,0.2,1) infinite`, animationDelay: `${i * 0.07}s`, boxShadow: '0 0 6px rgba(144,205,255,0.3)' }} />
                ))}
              </div>
            )}
            <p style={{ fontSize: 22, color: ST.onSurf, lineHeight: 1.6 }}>{question.prompt_text}</p>
            <p style={{ color: (isSpeaking || isWaiting) ? '#90cdff' : ST.onSurfVar, marginTop: 12, fontSize: 13 }}>
              {isSpeaking ? 'AI is speaking...' : isWaiting ? 'Get ready to listen...' : 'Speak clearly and in detail'}
            </p>
          </div>
        );
      }
      if (section === "G") {
        const isSpeaking = ttsState === 'speaking_question';
        const isWaiting = ttsState === 'waiting_to_speak';
        return (
          <div key={question.question_id} style={{ textAlign: "center", padding: "24px 0", animation: 'sectionAFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
            {isSpeaking && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, height: 48, alignItems: 'center' }}>
                {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((bar, i) => (
                  <div key={i} style={{ width: 4, borderRadius: 4, background: `rgba(144,205,255,${0.5 + (i % 3) * 0.2})`, animation: `soundBar${bar} ${0.9 + (i % 3) * 0.15}s cubic-bezier(0.4,0,0.2,1) infinite`, animationDelay: `${i * 0.07}s`, boxShadow: '0 0 6px rgba(144,205,255,0.3)' }} />
                ))}
              </div>
            )}
            {question.image_url && (
              <img src={question.image_url} alt="Describe this"
                style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 12, objectFit: "cover", marginBottom: 12 }}
                onError={(e) => { e.target.style.display = "none"; }} />
            )}
            <p style={{ color: (isSpeaking || isWaiting) ? '#90cdff' : ST.onSurfVar, fontSize: 13 }}>
              {isSpeaking ? 'AI is speaking...' : isWaiting ? 'Look at the image...' : 'Describe what you see in detail'}
            </p>
          </div>
        );
      }
      if (section === "H") {
        if (ttsState === 'playing_first' && question.audio_text) {
          return (
            <div key={question.question_id} style={{ animation: 'sectionAFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, height: 48, alignItems: 'center' }}>
                {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((bar, i) => (
                  <div key={i} style={{ width: 4, borderRadius: 4, background: `rgba(144,205,255,${0.5 + (i % 3) * 0.2})`, animation: `soundBar${bar} ${0.9 + (i % 3) * 0.15}s cubic-bezier(0.4,0,0.2,1) infinite`, animationDelay: `${i * 0.07}s`, boxShadow: '0 0 6px rgba(144,205,255,0.3)' }} />
                ))}
              </div>
              <div style={{ maxWidth: 680, margin: '0 auto', background: ST.surfLow, borderRadius: 12, padding: 24 }}>
                <p style={{ color: ST.onSurfVar, lineHeight: 1.9, fontSize: 16 }}>{question.audio_text}</p>
                <p style={{ color: '#90cdff', textAlign: 'center', marginTop: 16, fontWeight: 600 }}>Listening to the passage...</p>
              </div>
            </div>
          );
        }
        if (ttsState === 'speaking_question' || ttsState === 'waiting_to_speak') {
          const isSpeaking = ttsState === 'speaking_question';
          return (
            <div style={{ textAlign: 'center', padding: '20px 40px', animation: 'sectionAFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
              {isSpeaking && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, height: 48, alignItems: 'center' }}>
                  {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((bar, i) => (
                    <div key={i} style={{ width: 4, borderRadius: 4, background: `rgba(144,205,255,${0.5 + (i % 3) * 0.2})`, animation: `soundBar${bar} ${0.9 + (i % 3) * 0.15}s cubic-bezier(0.4,0,0.2,1) infinite`, animationDelay: `${i * 0.07}s`, boxShadow: '0 0 6px rgba(144,205,255,0.3)' }} />
                  ))}
                </div>
              )}
              <p style={{ fontSize: 22, color: ST.onSurf, lineHeight: 1.6 }}>{question.prompt_text}</p>
              <p style={{ color: '#90cdff', marginTop: 12, fontSize: 13 }}>
                {isSpeaking ? 'AI is speaking...' : 'Read the question...'}
              </p>
            </div>
          );
        }
        if (ttsPlaying || testPhase === "prep") {
          return (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48 }}>👂</div>
              <p style={{ color: ST.primaryCont, marginTop: 8 }}>Get ready...</p>
            </div>
          );
        }
        return (
          <p style={{ fontSize: 22, color: ST.onSurf, textAlign: "center", padding: "32px 0" }}>{question.prompt_text}</p>
        );
      }
      return <p style={{ color: ST.onSurf, padding: "32px 0", textAlign: "center" }}>{question.prompt_text}</p>;
    }

    return (
      <div style={{ padding: "24px 48px", maxWidth: 1100, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
        <style>{`
          @keyframes soundBar1 { 0%{height:6px} 25%{height:28px} 50%{height:38px} 75%{height:18px} 100%{height:6px} }
          @keyframes soundBar2 { 0%{height:10px} 20%{height:36px} 45%{height:44px} 70%{height:22px} 100%{height:10px} }
          @keyframes soundBar3 { 0%{height:14px} 30%{height:42px} 55%{height:34px} 80%{height:48px} 100%{height:14px} }
          @keyframes soundBar4 { 0%{height:8px} 35%{height:32px} 60%{height:40px} 85%{height:16px} 100%{height:8px} }
          @keyframes soundBar5 { 0%{height:12px} 22%{height:24px} 48%{height:36px} 72%{height:20px} 100%{height:12px} }
          @keyframes soundBar6 { 0%{height:6px} 28%{height:30px} 52%{height:42px} 78%{height:14px} 100%{height:6px} }
          @keyframes soundBar7 { 0%{height:10px} 32%{height:38px} 58%{height:26px} 82%{height:44px} 100%{height:10px} }
          @keyframes sectionAFadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        {/* Header bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: ST.primary, fontFamily: "'Space Grotesk','Inter',sans-serif", marginBottom: 2 }}>
              Section {question.section}
            </h2>
            <p style={{ ...labelStyle, letterSpacing: 3 }}>{question.section_name}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>
                Question {prog.section_current || 0} of {prog.section_total || 0}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 160, height: 4, background: ST.surfHighest, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#F59E0B", width: `${pct}%`, boxShadow: "0 0 8px rgba(245,158,11,0.4)", transition: "width 0.3s" }} />
                </div>
                <span style={{ color: ST.primary, fontSize: 11, fontWeight: 600 }}>{pct}%</span>
              </div>
            </div>
            <button onClick={endTestEarly} style={{ background: `${ST.error}1a`, color: ST.error, border: `1px solid ${ST.error}33`, borderRadius: 6, padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>
              End Test
            </button>
          </div>
        </div>

        {/* Central content */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 0 24px" }}>
          {renderSectionContent()}
        </div>

        {/* Interaction hub */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, maxWidth: 1000, margin: "0 auto" }}>
          {/* Recording card */}
          <div style={{ ...glassCard, padding: 28 }}>
            {testPhase === "prep" && !meta.hasTTS && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ color: ST.primary, fontSize: 20 }}>⏱</span>
                  <span style={{ ...labelStyle, fontWeight: 700 }}>Preparation</span>
                </div>
                <p style={{ color: ST.onSurfVar, fontSize: 14, marginBottom: 16 }}>
                  {question.section === "E" ? "Read the passage carefully before retelling" : "Get ready to record your answer"}
                </p>
                <div style={{ width: "100%", height: 6, background: ST.surfHighest, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99, transition: "width 0.5s",
                    background: `linear-gradient(90deg, ${ST.primaryCont}, ${ST.secondary})`,
                    width: meta.prepTime > 0 ? `${(prepTimer / meta.prepTime) * 100}%` : "100%",
                  }} />
                </div>
                <div style={{ textAlign: "center", marginTop: 10, color: ST.primary, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 20 }}>
                  {prepTimer}s
                </div>
              </div>
            )}

            {testPhase === "prep" && meta.hasTTS && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔊</div>
                <p style={{ color: ST.primaryCont, fontSize: 14 }}>Playing audio... Recording starts automatically</p>
              </div>
            )}

            {testPhase === "recording" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${ST.error}1a`, padding: "4px 12px", borderRadius: 99, border: `1px solid ${ST.error}33` }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: ST.error, animation: "pulse 1s infinite" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: ST.error, textTransform: "uppercase", letterSpacing: 2 }}>REC</span>
                    </div>
                    <span style={{ color: ST.onSurfVar, fontSize: 13 }}>Recording voice...</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", color: ST.onSurf }}>
                    0:<span style={{ color: ST.primary }}>{String(recTimer).padStart(2, "0")}</span>
                  </div>
                </div>

                {/* Waveform */}
                <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 16px", background: `${ST.surfLowest}88`, borderRadius: 8, marginBottom: 16 }}>
                  {waveformBars.map((h, i) => (
                    <div key={i} style={{
                      width: 5, height: h, borderRadius: 99, transition: "height 0.15s ease",
                      background: h > 20 ? ST.tertiary : `${ST.tertiary}66`,
                      boxShadow: h > 40 ? `0 0 12px ${ST.tertiary}66` : "none",
                    }} />
                  ))}
                </div>

                {/* Timer bar */}
                <div style={{ width: "100%", height: 4, background: ST.surfHighest, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: ST.tertiary, borderRadius: 99, transition: "width 1s linear",
                    width: meta.recTime > 0 ? `${(recTimer / meta.recTime) * 100}%` : "0%",
                  }} />
                </div>
              </div>
            )}

            {testPhase === "processing" && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ position: "relative", width: 48, height: 48, margin: "0 auto 16px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 99, border: `3px solid ${ST.surfHighest}` }} />
                  <div style={{ width: 48, height: 48, borderRadius: 99, border: `3px solid transparent`, borderTopColor: ST.primary, position: "absolute", top: 0, animation: "spin 1s linear infinite" }} />
                </div>
                <p style={{ color: ST.primary, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", fontSize: 16, marginBottom: 4 }}>Analyzing your response...</p>
                <p style={{ ...labelStyle }}>Generating performance metrics</p>
              </div>
            )}
          </div>

          {/* Side cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status card */}
            <div style={{ background: ST.surf, padding: 20, borderRadius: 8, border: `1px solid ${ST.outlineVar}1a` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: ST.primary, fontSize: 16 }}>⏱</span>
                <span style={{ ...labelStyle, fontWeight: 700 }}>Status</span>
              </div>
              <p style={{ color: ST.onSurfVar, fontSize: 13 }}>
                {testPhase === "prep" ? "Preparing..." : testPhase === "recording" ? "Recording in progress" : "Processing audio..."}
              </p>
            </div>

            {/* Silence warning */}
            {showSilenceWarning && testPhase === "recording" && (
              <div style={{ background: ST.surf, padding: 20, borderRadius: 8, border: `1px solid ${ST.error}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: ST.error, fontSize: 16 }}>⚠</span>
                  <span style={{ ...labelStyle, color: ST.error, fontWeight: 700 }}>Still speaking?</span>
                </div>
                <p style={{ color: ST.onSurf, fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
                  Auto-submit in <span style={{ color: ST.error, fontWeight: 700 }}>{Math.max(0, Math.ceil((SECTION_META[question?.section]?.silenceSubmitSec ?? 6) - silenceSecs))}s...</span>
                </p>
                <div style={{ width: "100%", height: 4, background: ST.surfHighest, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    background: `linear-gradient(90deg, ${ST.tertiary}, ${ST.error})`,
                    width: `${Math.max(0, (1 - (silenceSecs - ((SECTION_META[question?.section]?.silenceSubmitSec ?? 6) - 1)) / 1) * 100)}%`,
                  }} />
                </div>
              </div>
            )}

            {/* Mic status */}
            <div style={{ background: ST.surf, padding: 14, borderRadius: 8, border: `1px solid ${ST.outlineVar}1a` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: testPhase === "recording" ? ST.tertiary : ST.outlineVar, animation: testPhase === "recording" ? "pulse 1s infinite" : "none" }} />
                <span style={{ fontSize: 12, color: ST.onSurf }}>
                  {testPhase === "recording" ? "Microphone active" : "Ready for input"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && <p style={{ color: ST.error, fontSize: 13, textAlign: "center", marginTop: 14 }}>{error}</p>}
      </div>
    );
  }

  // ── SECTION REPORT PHASE ─────────────────────────────────────────────────
  function renderSectionReport() {
    const sec = completedSection || "A";
    const meta = SECTION_META[sec] || {};
    const avgScore = sectionAnswers.length > 0
      ? Math.round(sectionAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / sectionAnswers.length)
      : 0;
    const nextSec = SECTION_ORDER_COMM[SECTION_ORDER_COMM.indexOf(sec) + 1];
    const nextMeta = nextSec ? SECTION_META[nextSec] : null;
    const isLast = !nextQuestionCache;

    return (
      <div style={{ padding: "24px 48px", maxWidth: 1000, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ color: ST.tertiary, fontSize: 18 }}>✓</span>
            <span style={{ color: ST.tertiary, fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 500 }}>Section {sec} Complete</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", color: ST.onSurf }}>
            {meta.name} Report
          </h1>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, marginBottom: 24 }}>
          {/* Score + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...stCard, padding: 28, borderLeft: `4px solid ${ST.primary}`, position: "relative", overflow: "hidden" }}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>Overall Score</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 52, fontWeight: 700, color: ST.primary, fontFamily: "'Space Grotesk','Inter',sans-serif" }}>{avgScore}</span>
                <span style={{ color: `${ST.primary}99`, fontSize: 20, fontFamily: "'Space Grotesk','Inter',sans-serif" }}>%</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ ...stCard, background: ST.surf, padding: 16, flex: 1 }}>
                <p style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>Answered</p>
                <p style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", color: ST.onSurf }}>{sectionAnswers.length}</p>
              </div>
              <div style={{ ...stCard, background: ST.surf, padding: 16, flex: 1 }}>
                <p style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>Avg Score</p>
                <p style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", color: ST.onSurf }}>{avgScore}%</p>
              </div>
            </div>
          </div>

          {/* Voice snapshot bars */}
          <div style={{ ...stCard, background: ST.surfLow, padding: 28 }}>
            <h3 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: ST.onSurf, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: ST.primary }}>♫</span> Voice Snapshot
            </h3>
            {[
              { label: "Pace", key: "pace" },
              { label: "Pronunciation", key: "pronunciation" },
              { label: "Fluency", key: "fluency" },
              { label: "Intonation", key: "intonation" },
              { label: "Rhythm", key: "rhythm" },
              { label: "Stress", key: "stress" },
              { label: "Modulation", key: "modulation" },
            ].map((dim) => {
              const vals = sectionAnswers.map(a => a[dim.key]).filter(v => v != null && v > 0);
              const clamped = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
              return (
                <div key={dim.key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 6 }}>
                    <span style={{ color: ST.onSurf, fontWeight: 500, fontSize: 13 }}>{dim.label}</span>
                    <span style={{ color: ST.primary, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif" }}>{clamped}</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: ST.surfHighest, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${ST.primary}, ${ST.primaryCont})`, width: `${clamped}%`, boxShadow: `0 0 8px rgba(144,205,255,0.4)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Q&A breakdown */}
        {sectionAnswers.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ color: '#90cdff', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontWeight: 600 }}>
              Questions & Answers
            </h4>
            {sectionAnswers.map((ans, i) => {
              const scoreColor2 = (ans.score ?? 0) >= 80 ? '#6bdc96' : (ans.score ?? 0) >= 60 ? '#fbbf24' : '#f87171';
              const questionDisplay = ans.section === 'B' ? ans.audio_text : ans.question_text;
              const isOpenEnded = ['F', 'G'].includes(ans.section);
              const isKeywordBased = ['C', 'H'].includes(ans.section);
              const expectedRaw = ans.section === 'A' ? (ans.question_text || '') : (ans.ideal_answer || '');
              const expectedKeywords = isKeywordBased ? expectedRaw.split(',').map(k => k.trim()).filter(Boolean) : [];

              const dimensions = [
                { label: 'Fluency',       val: ans.fluency,       show: true },
                { label: 'Pace',          val: ans.pace,          show: true },
                { label: 'Pronunciation', val: ans.pronunciation, show: true },
                { label: 'Intonation',    val: ans.intonation,    show: true },
                { label: 'Modulation',    val: ans.modulation,    show: true },
                { label: 'Rhythm',        val: ans.rhythm,        show: true },
                { label: 'Stress',        val: ans.stress,        show: true },
                { label: ans.section === 'A' ? 'Reading Accuracy' : ans.section === 'B' || ans.section === 'D' ? 'Word Match' : ans.section === 'E' ? 'Semantic Match' : 'Keyword Match', val: ans.accuracy, show: !isOpenEnded && ans.accuracy > 0 },
              ].filter(d => d.show && d.val != null);

              return (
                <div key={i} style={{ background: '#1c2026', border: '1px solid #262a31', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
                  {/* Header: Q number + score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ background: '#262a31', color: '#90cdff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Q{i + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: scoreColor2, fontWeight: 700, fontSize: 18, textShadow: `0 0 10px ${scoreColor2}40` }}>{Math.round(ans.score ?? 0)}</span>
                      <span style={{ color: '#4a5568', fontSize: 13 }}>/100</span>
                    </div>
                  </div>

                  {/* Question text */}
                  <p style={{ color: '#a0aec0', fontSize: 14, lineHeight: 1.5, marginBottom: 12, fontStyle: 'italic' }}>"{questionDisplay}"</p>

                  {/* Expected vs Actual comparison */}
                  {!isOpenEnded && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      <div style={{ background: '#0d1117', border: '1px solid #1a2a1a', borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ color: '#6bdc96', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>Expected</p>
                        {isKeywordBased ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {expectedKeywords.slice(0, 6).map((kw, ki) => (
                              <span key={ki} style={{ background: '#1a2a1a', color: '#6bdc96', fontSize: 12, padding: '2px 8px', borderRadius: 12, border: '1px solid #2a4a2a' }}>{kw}</span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#6bdc96', fontSize: 13, lineHeight: 1.5, margin: 0, maxHeight: 80, overflowY: 'auto', scrollbarWidth: 'thin' }}>{expectedRaw || '\u2014'}</p>
                        )}
                      </div>
                      <div style={{ background: '#0d1117', border: `1px solid ${ans.transcript ? '#1a2040' : '#2a1a1a'}`, borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ color: ans.transcript ? '#90cdff' : '#f87171', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>You said</p>
                        <p style={{ color: ans.transcript ? '#90cdff' : '#4a5568', fontSize: 13, lineHeight: 1.5, margin: 0, fontStyle: ans.transcript ? 'normal' : 'italic', maxHeight: 80, overflowY: 'auto', scrollbarWidth: 'thin' }}>{ans.transcript || 'No speech detected'}</p>
                      </div>
                    </div>
                  )}

                  {/* Open-ended: just show transcript */}
                  {isOpenEnded && ans.transcript && (
                    <div style={{ background: '#0d1117', border: '1px solid #1a2040', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                      <p style={{ color: '#90cdff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>You said</p>
                      <p style={{ color: '#a0aec0', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{ans.transcript}</p>
                    </div>
                  )}

                  {/* 8 Dimension Score Bars */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                    {dimensions.map(({ label, val }) => {
                      const v = Math.round(val ?? 0);
                      const c = v >= 80 ? '#6bdc96' : v >= 60 ? '#fbbf24' : '#f87171';
                      return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#6b7280', fontSize: 11, width: 88, flexShrink: 0 }}>{label}</span>
                          <div style={{ flex: 1, height: 4, background: '#31353c', borderRadius: 2 }}>
                            <div style={{ width: `${v}%`, height: 4, background: c, borderRadius: 2, boxShadow: `0 0 6px ${c}60` }} />
                          </div>
                          <span style={{ color: c, fontSize: 11, fontWeight: 700, width: 28, textAlign: 'right', flexShrink: 0 }}>{v}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback */}
                  {ans.feedback && (
                    <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, lineHeight: 1.5, borderTop: '1px solid #262a31', paddingTop: 8 }}>{ans.feedback}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Next section preview */}
        {nextMeta && (
          <div style={{ background: `linear-gradient(135deg, ${ST.surf}, ${ST.bg})`, border: `1px solid ${ST.primary}1a`, padding: 28, borderRadius: 12, display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: `${ST.primary}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {nextMeta.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: ST.primaryCont, fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
                Up Next: {nextMeta.name}
              </p>
              <p style={{ color: ST.onSurfVar, fontSize: 13 }}>{NEXT_SECTION_TIPS[nextSec] || ""}</p>
            </div>
          </div>
        )}

        {/* Footer bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ ...labelStyle, whiteSpace: "nowrap" }}>
              {isLast ? "Proceeding to results" : `Auto-next in ${reportTimer}s`}
            </span>
            <div style={{ width: 160, height: 6, background: ST.surfHighest, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", background: ST.primaryCont, borderRadius: 99, width: `${(reportTimer / SECTION_REPORT_SEC) * 100}%`, boxShadow: `0 0 10px rgba(99,179,237,0.3)`, transition: "width 1s linear" }} />
            </div>
          </div>
          <button onClick={advanceFromSectionReport}
            style={{ ...stBtn, padding: "12px 28px", display: "flex", alignItems: "center", gap: 6 }}>
            {isLast ? "View Results" : "Skip"} <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTS PHASE ────────────────────────────────────────────────────────
  function renderResults() {
    if (!results) return <div style={{ padding: 40, textAlign: "center", color: ST.onSurfVar }}>Loading results...</div>;

    const sectionData = COMM_SECTIONS.map(s => ({
      section: s.name,
      score: (results.section_scores || {})[s.id] || 0,
      fullMark: 100,
    }));

    return (
      <div style={{ padding: "32px 48px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Hero header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", color: ST.onSurf, marginBottom: 6 }}>Performance Summary</h1>
          <p style={{ color: ST.onSurfVar, maxWidth: 700, lineHeight: 1.6 }}>
            Your assessment is complete. Based on our AI-driven voice analysis, you have achieved a {(results.band || "").toLowerCase()} competency band score.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 24 }}>
          {/* Radar chart card */}
          <div style={{ ...stCard, background: ST.surfLow, padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 24 }}>
              <div>
                <p style={{ ...labelStyle, color: ST.primary, marginBottom: 4 }}>Overall Band</p>
                <div style={{ fontSize: 52, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',sans-serif", color: ST.onSurf }}>
                  {Math.round(results.overall_score || 0)}
                </div>
              </div>
              <span style={{ color: ST.tertiary, fontWeight: 500 }}>{results.band}</span>
            </div>
            <div style={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <RadarChart width={420} height={260} data={sectionData} outerRadius="75%">
                <PolarGrid stroke={ST.outlineVar} />
                <PolarAngleAxis dataKey="section" tick={{ fill: ST.onSurfVar, fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke={ST.primary} fill={ST.primary} fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
              </RadarChart>
            </div>
          </div>

          {/* Section scores — clickable to expand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {['A','B','C','D','E','F','G','H'].map(s => {
              const meta = SECTION_META[s];
              const score = results?.section_scores?.[s];
              const attempted = score != null && score > 0;
              const sc2 = !attempted ? '#4a5568' : score >= 80 ? '#6bdc96' : score >= 60 ? '#fbbf24' : '#f87171';
              const isExpanded = expandedSection === s;
              return (
                <div key={s} style={{
                  background: attempted ? '#1c2026' : '#161b22',
                  border: `1px solid ${isExpanded ? ST.primary + '44' : attempted ? '#262a31' : '#1c2026'}`,
                  borderRadius: 8, opacity: attempted ? 1 : 0.5,
                  cursor: attempted ? 'pointer' : 'default',
                  transition: 'border-color 0.2s',
                }} onClick={() => attempted && setExpandedSection(isExpanded ? null : s)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                    <span style={{ fontSize: 18, width: 24 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: attempted ? '#e2e8f0' : '#4a5568', fontSize: 14, fontWeight: 500 }}>
                        {s}. {meta.name}
                      </p>
                    </div>
                    {attempted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 4, background: '#31353c', borderRadius: 2 }}>
                          <div style={{ width: `${score}%`, height: 4, background: sc2, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: sc2, fontWeight: 700, fontSize: 15, width: 36 }}>
                          {Math.round(score)}
                        </span>
                        <span style={{ color: '#4a5568', fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                      </div>
                    ) : (
                      <span style={{
                        background: '#1c2026', color: '#4a5568', fontSize: 11,
                        padding: '3px 10px', borderRadius: 20, border: '1px solid #262a31',
                        textTransform: 'uppercase', letterSpacing: 1,
                      }}>
                        Not attempted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {results.duration_minutes && (
              <div style={{ ...stCard, background: ST.surfHigh, padding: '10px 14px', display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${ST.outlineVar}33`, marginTop: 4 }}>
                <span style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 600, color: ST.onSurf, fontSize: 13 }}>Duration</span>
                <span style={{ color: ST.onSurfVar, fontSize: 13 }}>{results.duration_minutes} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded section detail */}
        {expandedSection && results.section_details && (() => {
          const detail = results.section_details.find(d => d.section === expandedSection);
          if (!detail || !detail.answers || detail.answers.length === 0) return null;
          const secMeta = SECTION_META[expandedSection] || {};
          const isOpenEnded = ['F', 'G'].includes(expandedSection);
          const isKeywordBased = ['C', 'H'].includes(expandedSection);
          return (
            <div style={{ background: '#161b22', border: `1px solid ${ST.primary}22`, borderRadius: 12, padding: 24, marginBottom: 24, animation: 'sectionAFadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{secMeta.icon}</span>
                  <h3 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: ST.onSurf }}>
                    Section {expandedSection}: {detail.name}
                  </h3>
                  <span style={{ background: '#262a31', color: ST.primary, fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>
                    {detail.answer_count} answers · avg {Math.round(detail.avg_score)}%
                  </span>
                </div>
                <button onClick={() => setExpandedSection(null)} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
              </div>
              {detail.answers.map((ans, i) => {
                const scoreColor2 = (ans.score ?? 0) >= 80 ? '#6bdc96' : (ans.score ?? 0) >= 60 ? '#fbbf24' : '#f87171';
                const questionDisplay = expandedSection === 'B' ? (ans.audio_text || ans.question_text) : ans.question_text;
                const expectedRaw = expandedSection === 'A' ? (ans.question_text || '') : (ans.ideal_answer || '');
                const expectedKeywords = isKeywordBased ? expectedRaw.split(',').map(k => k.trim()).filter(Boolean) : [];
                const accuracy = ans.word_match || ans.keyword_match || ans.semantic || 0;
                const accLabel = expandedSection === 'A' ? 'Reading Accuracy' : expandedSection === 'B' || expandedSection === 'D' ? 'Word Match' : expandedSection === 'E' ? 'Semantic Match' : 'Keyword Match';
                const dimensions = [
                  { label: 'Fluency',       val: ans.fluency },
                  { label: 'Pace',          val: ans.pace },
                  { label: 'Pronunciation', val: ans.pronunciation },
                  { label: 'Intonation',    val: ans.intonation },
                  { label: 'Modulation',    val: ans.modulation },
                  { label: 'Rhythm',        val: ans.rhythm },
                  { label: 'Stress',        val: ans.stress },
                  { label: accLabel,         val: accuracy, show: !isOpenEnded && accuracy > 0 },
                ].filter(d => (d.show !== false) && d.val != null);
                return (
                  <div key={i} style={{ background: '#1c2026', border: '1px solid #262a31', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ background: '#262a31', color: '#90cdff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Q{i + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: scoreColor2, fontWeight: 700, fontSize: 18, textShadow: `0 0 10px ${scoreColor2}40` }}>{Math.round(ans.score ?? 0)}</span>
                        <span style={{ color: '#4a5568', fontSize: 13 }}>/100</span>
                      </div>
                    </div>
                    <p style={{ color: '#a0aec0', fontSize: 14, lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>"{questionDisplay}"</p>
                    {!isOpenEnded && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <div style={{ background: '#0d1117', border: '1px solid #1a2a1a', borderRadius: 8, padding: '8px 10px' }}>
                          <p style={{ color: '#6bdc96', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 5 }}>Expected</p>
                          {isKeywordBased ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {expectedKeywords.slice(0, 6).map((kw, ki) => (
                                <span key={ki} style={{ background: '#1a2a1a', color: '#6bdc96', fontSize: 11, padding: '2px 7px', borderRadius: 12, border: '1px solid #2a4a2a' }}>{kw}</span>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#6bdc96', fontSize: 12, lineHeight: 1.4, margin: 0, maxHeight: 60, overflowY: 'auto', scrollbarWidth: 'thin' }}>{expectedRaw || '\u2014'}</p>
                          )}
                        </div>
                        <div style={{ background: '#0d1117', border: `1px solid ${ans.transcript ? '#1a2040' : '#2a1a1a'}`, borderRadius: 8, padding: '8px 10px' }}>
                          <p style={{ color: ans.transcript ? '#90cdff' : '#f87171', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 5 }}>You said</p>
                          <p style={{ color: ans.transcript ? '#90cdff' : '#4a5568', fontSize: 12, lineHeight: 1.4, margin: 0, fontStyle: ans.transcript ? 'normal' : 'italic', maxHeight: 60, overflowY: 'auto', scrollbarWidth: 'thin' }}>{ans.transcript || 'No speech detected'}</p>
                        </div>
                      </div>
                    )}
                    {isOpenEnded && ans.transcript && (
                      <div style={{ background: '#0d1117', border: '1px solid #1a2040', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
                        <p style={{ color: '#90cdff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 5 }}>You said</p>
                        <p style={{ color: '#a0aec0', fontSize: 12, lineHeight: 1.4, margin: 0 }}>{ans.transcript}</p>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 14px' }}>
                      {dimensions.map(({ label, val }) => {
                        const v = Math.round(val ?? 0);
                        const c = v >= 80 ? '#6bdc96' : v >= 60 ? '#fbbf24' : '#f87171';
                        return (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#6b7280', fontSize: 10, width: 80, flexShrink: 0 }}>{label}</span>
                            <div style={{ flex: 1, height: 3, background: '#31353c', borderRadius: 2 }}>
                              <div style={{ width: `${v}%`, height: 3, background: c, borderRadius: 2 }} />
                            </div>
                            <span style={{ color: c, fontSize: 10, fontWeight: 700, width: 24, textAlign: 'right', flexShrink: 0 }}>{v}</span>
                          </div>
                        );
                      })}
                    </div>
                    {ans.feedback && (
                      <p style={{ color: '#6b7280', fontSize: 11, marginTop: 8, lineHeight: 1.4, borderTop: '1px solid #262a31', paddingTop: 6 }}>{ans.feedback}</p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Voice Quality Analysis */}
        {results.voice_breakdown && (
          <div style={{ background: "#1A1F36", borderRadius: 8, padding: 28, border: `1px solid rgba(255,255,255,0.05)`, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <span style={{ color: ST.tertiary, fontSize: 18 }}>♫</span>
              <h3 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: 18, color: ST.onSurf }}>Voice Quality Analysis</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 48px" }}>
              {[
                { label: "Pronunciation", key: "pronunciation" },
                { label: "Stress",        key: "stress" },
                { label: "Intonation",    key: "intonation" },
                { label: "Pace",          key: "pace" },
                { label: "Modulation",    key: "modulation" },
                { label: "Fluency",       key: "fluency" },
                { label: "Rhythm",        key: "rhythm" },
              ].map(({ label, key }) => {
                const score = results.voice_breakdown[key] ?? 0;
                const color = score >= 80 ? ST.tertiary : score >= 60 ? "#88f9b0" : ST.error;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, ...labelStyle, fontSize: 11 }}>
                      <span>{label}</span>
                      <span style={{ color }}>{Math.round(score)}%</span>
                    </div>
                    <div style={{ height: 6, width: "100%", background: ST.surfLowest, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 99, width: `${score}%`, background: color,
                        boxShadow: score >= 80 ? `0 0 8px ${color}66` : "none",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strengths / Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {results.strengths && results.strengths.length > 0 && (
            <div style={{ ...stCard, background: ST.surf, padding: 28, border: `1px solid ${ST.tertiary}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ color: ST.tertiary }}>★</span>
                <h3 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: ST.onSurf }}>Key Strengths</h3>
              </div>
              {results.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: ST.tertiary, fontSize: 12, marginTop: 2 }}>✓</span>
                  <p style={{ color: ST.onSurfVar, fontSize: 13, lineHeight: 1.6 }}>{s}</p>
                </div>
              ))}
            </div>
          )}
          {results.weaknesses && results.weaknesses.length > 0 && (
            <div style={{ ...stCard, background: ST.surf, padding: 28, border: `1px solid ${ST.error}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ color: ST.error }}>→</span>
                <h3 style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", fontWeight: 700, fontSize: 16, color: ST.onSurf }}>Refinement Areas</h3>
              </div>
              {results.weaknesses.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: ST.error, fontSize: 12, marginTop: 2 }}>→</span>
                  <p style={{ color: ST.onSurfVar, fontSize: 13, lineHeight: 1.6 }}>{w}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, paddingTop: 16 }}>
          <button onClick={() => {
            if (!session) return;
            const a = document.createElement('a');
            a.href = `${API}/reports/comm/${session.session_id}`;
            a.setAttribute('download', `comm_report_${session.session_id}.pdf`);
            fetch(a.href, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.blob())
              .then(blob => { const url = URL.createObjectURL(blob); a.href = url; a.click(); URL.revokeObjectURL(url); })
              .catch(() => {});
          }} style={{ ...stBtn, padding: "16px 36px", background: `linear-gradient(135deg, #10B981, #059669)`, boxShadow: '0 10px 30px rgba(16,185,129,0.2)' }}>
            Export PDF
          </button>
          <button onClick={() => { setPhase("intro"); setSession(null); setQuestion(null); setResults(null); setSectionAnswers([]); setTestPhase("prep"); setExpandedSection(null); }}
            style={{ ...stBtn, padding: "16px 48px" }}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    {phase === "intro" ? (
      <SidebarLayout active="communication" user={user} onNav={onNav} onLogout={onLogout}>
        {renderIntro()}
      </SidebarLayout>
    ) : (
      <div style={{ minHeight: "100vh", background: "#0B0F1E" }}>
        {phase === "test" && renderTest()}
        {phase === "section_report" && renderSectionReport()}
        {phase === "results" && renderResults()}
      </div>
    )}
    {showGuidance && (
      <ExamGuidanceModal
        type="communication"
        onAccept={() => { setShowGuidance(false); startTest(); }}
        onCancel={() => setShowGuidance(false)}
      />
    )}
    </>
  );
}

export default CommunicationTestPage;
