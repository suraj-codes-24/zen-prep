import { useState, useEffect, useRef } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { API, Spinner, THEME } from "../shared";
import { SidebarLayout } from "./Sidebar";

// ── Constants ─────────────────────────────────────────────────────────────────

const BOT_COLORS = {
  Alex: "#6366F1", Zoe: "#EC4899", Ethan: "#22C55E",
  Kate: "#F59E0B", Sam: "#06B6D4",
};
const BOT_ROLES = {
  Alex: "Initiator", Zoe: "Challenger", Ethan: "Synthesizer",
  Kate: "Expert", Sam: "Questioner",
};
const BOT_VOICE = {
  Alex:  "echo",   // M/US — deep & confident
  Zoe:   "alloy",  // F/US — clear & professional
  Ethan: "ryan",   // M/UK — British & composed
  Kate:  "fable",  // F/UK — British & elegant
  Sam:   "nova",   // F/US — warm & friendly
};
const CATEGORY_COLORS = {
  Technology: "#6366F1", Business: "#F59E0B", Society: "#22C55E", Policy: "#EC4899",
};
const PHASE_META = {
  opening:    { label: "Opening",    color: "#06B6D4", bg: "rgba(6,182,212,0.12)"  },
  discussion: { label: "Discussion", color: "#22C55E", bg: "rgba(34,197,94,0.12)"  },
  summary:    { label: "Summary",    color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  closing:    { label: "Closing",    color: "#A78BFA", bg: "rgba(167,139,250,0.12)"},
};
const DIFFICULTY_COLORS = { easy: "#22C55E", medium: "#F59E0B", hard: "#EF4444" };
const BAND_COLORS = {
  Exceptional: "#22C55E", Proficient: "#6bdc96", Developing: "#F59E0B",
  Beginner: "#F97316", "Needs Practice": "#EF4444",
};
const GD_TIPS = [
  { title: "Identify Key Arguments", desc: "Focus on 2-3 strong points and define your stance with supporting evidence or data." },
  { title: "Anticipate Counter-Arguments", desc: "Think about how opponents might challenge your position and prepare concise rebuttals." },
  { title: "Structure Your Entry", desc: "Open with a data-driven hook or provocative question to command attention immediately." },
];
const BOT_DESC = {
  Alex:  "Strategic thinker who builds structured frameworks",
  Zoe:   "Bold challenger who tests weak arguments",
  Ethan: "Calm synthesizer who bridges opposing views",
  Kate:  "Domain expert who brings data and depth",
  Sam:   "Curious questioner who probes assumptions",
};
const BOT_AVATARS = {
  Alex:  "https://i.pravatar.cc/150?img=33",  // M
  Zoe:   "https://i.pravatar.cc/150?img=47",  // F
  Ethan: "https://i.pravatar.cc/150?img=57",  // M
  Kate:  "https://i.pravatar.cc/150?img=44",  // F
  Sam:   "https://i.pravatar.cc/150?img=20",  // F
};

// ── Keyframe CSS ──────────────────────────────────────────────────────────────

const gdCss = `
@keyframes gdPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
  50%      { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
}
@keyframes gdPulseUser {
  0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
  50%      { box-shadow: 0 0 0 14px rgba(34,197,94,0); }
}
@keyframes gdPulseBot {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}
@keyframes gdFadeIn {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes gdSpin {
  from { stroke-dashoffset: 283; }
}
@keyframes gdBlink {
  0%,100% { opacity:1; } 50% { opacity:0.3; }
}
@keyframes gdOrb {
  0%,100% { transform:translateY(0) scale(1); }
  50%      { transform:translateY(-20px) scale(1.05); }
}
@keyframes gdSlideIn {
  from { opacity:0; transform:translateX(12px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes gdWaveform {
  0%, 100% { height: 4px; }
  50%      { height: 24px; }
}
@keyframes gdSpinSlow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes gdTimerGlow {
  0%, 100% { text-shadow: 0 0 40px rgba(99,102,241,0.3); }
  50%      { text-shadow: 0 0 80px rgba(99,102,241,0.6); }
}
.gd-no-scrollbar::-webkit-scrollbar { display: none; }
.gd-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ── Main Component ────────────────────────────────────────────────────────────

export default function GDPage({ token, user, onNav, onLogout }) {
  const [view,          setView]          = useState("setup");
  const [topics,        setTopics]        = useState([]);
  const [topicLoading,  setTopicLoading]  = useState(true);
  const [catFilter,     setCatFilter]     = useState("All");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [botCount,      setBotCount]      = useState(4);
  const [durationMins,  setDurationMins]  = useState(10);
  const [starting,      setStarting]      = useState(false);

  // Prep state
  const [prepCountdown, setPrepCountdown] = useState(60);
  const [sessionData,   setSessionData]   = useState(null);

  // Room state
  const [transcript,    setTranscript]    = useState([]);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [roomPhase,     setRoomPhase]     = useState("bot_speaking");
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [isRecording,   setIsRecording]   = useState(false);
  const [raisedHand,    setRaisedHand]    = useState(false);
  const [processing,    setProcessing]    = useState(false);
  const [ttsPlaying,       setTtsPlaying]       = useState(false);
  const [statusMsg,        setStatusMsg]        = useState("");
  const [userStream,       setUserStream]       = useState(null);
  const [pauseCountdown,   setPauseCountdown]   = useState(0);
  const [forcedTurn,       setForcedTurn]       = useState(false);
  const [userTurnCountdown, setUserTurnCountdown] = useState(0);
  const [hintMode,         setHintMode]         = useState("hints"); // "hints" | "paragraph"
  const [gdPhase,          setGdPhase]          = useState("opening"); // opening|discussion|summary|closing

  // Results state
  const [results,        setResults]        = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [coachingTab,    setCoachingTab]    = useState("strengths");

  // Refs
  const ttsRef          = useRef(null);
  const ttsCancelRef    = useRef(false);
  const ttsCallIdRef    = useRef(0); // incremented on every stopTTS to invalidate in-flight calls
  const recorderRef     = useRef(null);
  const chunksRef       = useRef([]);
  const transcriptRef   = useRef(null);
  const userVideoRef    = useRef(null);
  const timerRef        = useRef(null);
  const botsSpokeRef    = useRef(new Set());
  const userSpokeRef    = useRef(false);
  const forcedDoneRef   = useRef(false);
  const raisedHandRef   = useRef(false);
  const pauseRef         = useRef(null);
  const userTurnTimerRef = useRef(null);
  const silenceTimerRef  = useRef(null);
  const silenceAudioRef    = useRef(null); // { audioCtx, analyser, animId }
  const recordStartRef     = useRef(null); // Date.now() when recording started
  const gdPhaseRef         = useRef("opening"); // mirror of gdPhase for use in closures
  const totalTimeRef       = useRef(0);         // total session seconds
  const openingQueueRef    = useRef([]);         // bots waiting to give opening stance
  const openingDoneRef     = useRef(false);      // true once opening round is complete
  const closingTriggeredRef = useRef(false);     // prevents double closing
  const userSummaryDoneRef  = useRef(false);     // user gave their summary turn
  const turnDurationRef     = useRef(40);        // forced-turn max seconds

  const sidebarProps = { user, onNav, onLogout };

  // ── Load topics ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/gd/topics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setTopics(d.topics || []); setTopicLoading(false); })
      .catch(() => setTopicLoading(false));
  }, [token]);

  // ── Camera for room ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "room") return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => {
        setUserStream(s);
        if (userVideoRef.current) userVideoRef.current.srcObject = s;
      })
      .catch(() => {});
    return () => {
      if (userStream) userStream.getTracks().forEach(t => t.stop());
    };
  }, [view]);

  useEffect(() => {
    if (userVideoRef.current && userStream) userVideoRef.current.srcObject = userStream;
  }, [userStream]);

  // ── Prep countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "prep") return;
    if (prepCountdown <= 0) { enterRoom(); return; }
    const t = setTimeout(() => setPrepCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [view, prepCountdown]);

  // ── Room timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "room" || roomPhase === "ended") return;
    if (timeLeft <= 0) {
      // Only force-end if closing sequence hasn't already been triggered
      if (!closingTriggeredRef.current) handleEnd();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [view, timeLeft, roomPhase]);

  // ── Transcript scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  // ── Pause countdown (7 → 0, then decide next speaker) ───────────────────────
  useEffect(() => {
    if (roomPhase !== "pause") return;
    if (pauseCountdown <= 0) {
      if (raisedHandRef.current) {
        openMicForUser(false);
      } else if (gdPhaseRef.current === "summary" && !userSummaryDoneRef.current) {
        // In summary phase — guarantee user gets a summary turn regardless of round state
        openMicForUser(true);
      } else {
        const next = pickNextBot();
        if (next === null) {
          openMicForUser(true);
        } else {
          fetchBotTurn(next);
        }
      }
      return;
    }
    pauseRef.current = setTimeout(() => setPauseCountdown(c => c - 1), 1000);
    return () => clearTimeout(pauseRef.current);
  }, [roomPhase, pauseCountdown]);

  // ── Forced-turn countdown (40 → 0, auto-stop recording) ─────────────────────
  useEffect(() => {
    if (roomPhase !== "forced_turn" || !isRecording) return;
    if (userTurnCountdown <= 0) { stopRecording(); return; }
    const t = setTimeout(() => setUserTurnCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [roomPhase, isRecording, userTurnCountdown]);

  // ── Phase transitions (time-based) ──────────────────────────────────────────
  useEffect(() => {
    if (view !== "room" || roomPhase === "ended" || !openingDoneRef.current) return;
    const total = totalTimeRef.current;
    if (total === 0) return;
    const ratio = timeLeft / total;
    if (ratio <= 0.20 && ratio > 0.08 && gdPhaseRef.current === "discussion") {
      gdPhaseRef.current = "summary";
      setGdPhase("summary");
    } else if (ratio <= 0.08 && !closingTriggeredRef.current && gdPhaseRef.current !== "closing") {
      closingTriggeredRef.current = true;
      gdPhaseRef.current = "closing";
      setGdPhase("closing");
      triggerClosing();
    }
  }, [timeLeft, view, roomPhase]);

  // ── TTS ─────────────────────────────────────────────────────────────────────
  function stopTTS() {
    ttsCallIdRef.current++;          // invalidates any in-flight playTTS fetch
    ttsCancelRef.current = true;
    if (ttsRef.current) { ttsRef.current.pause(); ttsRef.current = null; }
    setTtsPlaying(false);
    setActiveSpeaker(null);
  }

  async function playTTS(botName, text, onDone) {
    stopTTS();
    const myId = ttsCallIdRef.current; // capture — stale if another call starts later
    ttsCancelRef.current = false;
    setActiveSpeaker(botName);
    setTtsPlaying(true);
    setStatusMsg(`${botName} is speaking...`);
    try {
      const voice = BOT_VOICE[botName] || "alloy";
      const res = await fetch(
        `${API}/comm/tts?text=${encodeURIComponent(text)}&voice=${voice}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok || myId !== ttsCallIdRef.current) return; // stale or failed
      const blob = await res.blob();
      if (myId !== ttsCallIdRef.current) return; // stale — another call started
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setTtsPlaying(false);
        setActiveSpeaker(null);
        setStatusMsg("");
        if (myId === ttsCallIdRef.current) onDone?.(); // only fire if still current
      };
      audio.play().catch(() => {
        if (myId === ttsCallIdRef.current) { setTtsPlaying(false); setActiveSpeaker(null); onDone?.(); }
      });
    } catch {
      if (myId === ttsCallIdRef.current) { setTtsPlaying(false); setActiveSpeaker(null); setStatusMsg(""); onDone?.(); }
    }
  }

  // ── Start session ────────────────────────────────────────────────────────────
  async function handleStart() {
    if (!selectedTopic || starting) return;
    setStarting(true);
    try {
      console.log("[GD] Starting session with topic:", selectedTopic.id, "bots:", botCount);
      const res = await fetch(`${API}/gd/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic_id: selectedTopic.id, bot_count: botCount, duration_mins: durationMins }),
      });
      const data = await res.json();
      console.log("[GD] Session data received:", data);
      console.log("[GD] Bots in session data:", data.bots);
      setSessionData(data);
      setPrepCountdown(60);
      setView("prep");
    } catch (e) {
      console.error("[GD] Start session error:", e);
    } finally {
      setStarting(false);
    }
  }

  // ── Phase helper ──────────────────────────────────────────────────────────────
  function changePhase(phase) {
    gdPhaseRef.current = phase;
    setGdPhase(phase);
  }

  // ── Enter room ───────────────────────────────────────────────────────────────
  function enterRoom() {
    if (!sessionData) return;
    const total = sessionData.duration_mins * 60;
    totalTimeRef.current       = total;
    openingDoneRef.current     = false;
    closingTriggeredRef.current = false;
    userSummaryDoneRef.current  = false;
    turnDurationRef.current     = 40;
    botsSpokeRef.current  = new Set([sessionData.opening_bot]);
    userSpokeRef.current  = false;
    forcedDoneRef.current = false;
    raisedHandRef.current = false;
    setRaisedHand(false);
    setForcedTurn(false);
    changePhase("opening");
    setTimeLeft(total);
    // Queue all other bots for their opening stances (played sequentially)
    const allBotNames = (sessionData.bots || []).map(b => b.name);
    openingQueueRef.current = allBotNames.filter(n => n !== sessionData.opening_bot);
    setTranscript([{
      speaker: sessionData.opening_bot,
      text:    sessionData.opening_text,
      color:   BOT_COLORS[sessionData.opening_bot],
    }]);
    setView("room");
    setRoomPhase("bot_speaking");
    // After opener, run the opening round for remaining bots before opening the floor
    playTTS(sessionData.opening_bot, sessionData.opening_text, () => processOpeningQueue());
  }

  // ── Opening round: each bot states their position, then open discussion ───────
  function processOpeningQueue() {
    if (openingQueueRef.current.length === 0) {
      openingDoneRef.current = true;
      changePhase("discussion");
      startPause();
      return;
    }
    const nextBot = openingQueueRef.current.shift();
    fetchBotTurn(nextBot, "opening");
  }

  // ── Round logic ───────────────────────────────────────────────────────────────
  function pickNextBot() {
    const allBotNames = (sessionData?.bots || []).map(b => b.name);
    const unseen = allBotNames.filter(n => !botsSpokeRef.current.has(n));
    if (unseen.length > 0) {
      return unseen[Math.floor(Math.random() * unseen.length)];
    }
    // All bots spoke — check if user needs a forced turn
    if (!userSpokeRef.current && !forcedDoneRef.current) {
      return null; // signals forced user turn
    }
    // User already spoke (or forced done) — reset round
    botsSpokeRef.current  = new Set();
    userSpokeRef.current  = false;
    forcedDoneRef.current = false;
    return allBotNames[Math.floor(Math.random() * allBotNames.length)];
  }

  function startPause() {
    clearTimeout(pauseRef.current);
    raisedHandRef.current = false;
    setRaisedHand(false);
    setActiveSpeaker(null);
    setPauseCountdown(5);
    setRoomPhase("pause");
    setStatusMsg("5 seconds — raise hand to speak next");
  }

  async function fetchBotTurn(botName, phaseOverride) {
    const phase = phaseOverride || gdPhaseRef.current;
    setRoomPhase("bot_speaking");
    setStatusMsg(`${botName} is thinking...`);
    try {
      const form = new FormData();
      form.append("bot_name", botName);
      form.append("gd_phase", phase);
      const res  = await fetch(`${API}/gd/bot-turn/${sessionData.session_id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const data = await res.json();
      setTranscript(prev => [...prev, { speaker: data.bot_name, text: data.bot_text, color: data.bot_color }]);
      botsSpokeRef.current = new Set([...botsSpokeRef.current, botName]);
      if (!openingDoneRef.current) {
        // Still in opening round — continue queue
        playTTS(data.bot_name, data.bot_text, () => processOpeningQueue());
      } else if (phase === "closing") {
        // Closing statement done → end session
        playTTS(data.bot_name, data.bot_text, () => handleEnd());
      } else {
        playTTS(data.bot_name, data.bot_text, () => startPause());
      }
    } catch {
      setStatusMsg("Bot response failed — continuing...");
      if (!openingDoneRef.current) {
        processOpeningQueue();
      } else {
        startPause();
      }
    }
  }

  // ── Trigger closing sequence (one bot wraps up, then session ends) ────────────
  function triggerClosing() {
    clearTimeout(pauseRef.current);
    clearTimeout(userTurnTimerRef.current);
    stopSilenceDetection();
    stopTTS();
    setRoomPhase("bot_speaking");
    setStatusMsg("Closing the discussion...");
    // Ethan is the synthesizer — prefer him for closing, fall back to first bot
    const allBotNames = (sessionData?.bots || []).map(b => b.name);
    const closingBot = allBotNames.includes("Ethan") ? "Ethan" : allBotNames[0] || "Alex";
    fetchBotTurn(closingBot, "closing");
  }

  function openMicForUser(isForced) {
    setForcedTurn(isForced);
    if (isForced) {
      const isSummary = gdPhaseRef.current === "summary";
      const dur = isSummary ? 60 : 40;
      turnDurationRef.current = dur;
      setUserTurnCountdown(dur);
      setStatusMsg(isSummary
        ? "Summarize your key arguments — 60 seconds!"
        : "Your turn — you must speak now!"
      );
    } else {
      setStatusMsg("Your turn — speak now");
    }
    startRecording(isForced);
  }

  // ── Silence detection (forced turns only) ────────────────────────────────────
  function startSilenceDetection(stream) {
    const SILENCE_THRESHOLD = 10;   // RMS below this = silent
    const SILENCE_LIMIT_MS  = 5000; // 5 consecutive silent seconds → auto-stop

    const audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    const analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    const source    = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.fftSize);
    let silenceStart = null;

    function check() {
      analyser.getByteTimeDomainData(buffer);
      // RMS amplitude
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length) * 100;

      if (rms < SILENCE_THRESHOLD) {
        if (silenceStart === null) silenceStart = Date.now();
        else if (Date.now() - silenceStart >= SILENCE_LIMIT_MS) {
          stopSilenceDetection();
          recorderRef.current?.stop();
          return;
        }
      } else {
        silenceStart = null;
      }
      silenceAudioRef.current.animId = requestAnimationFrame(check);
    }

    silenceAudioRef.current = { audioCtx, analyser, animId: requestAnimationFrame(check) };
  }

  function stopSilenceDetection() {
    if (!silenceAudioRef.current) return;
    const { audioCtx, animId } = silenceAudioRef.current;
    cancelAnimationFrame(animId);
    audioCtx.close();
    silenceAudioRef.current = null;
  }

  // ── Recording ────────────────────────────────────────────────────────────────
  async function startRecording(isForced) {
    if (isRecording || processing) return;
    stopTTS();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      recordStartRef.current = Date.now();

      // Pick supported mimeType — webm preferred, fallback to ogg then default
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      }

      const mrOptions = mimeType ? { mimeType } : {};
      const mr = new MediaRecorder(stream, mrOptions);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        stopSilenceDetection();
        clearTimeout(userTurnTimerRef.current);
        setIsRecording(false);
        const actualDuration = (Date.now() - recordStartRef.current) / 1000;
        const blobType = mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        await submitTurn(blob, !isForced, isForced, actualDuration);
      };
      recorderRef.current = mr;
      mr.start(250); // collect chunks every 250ms for reliable data
      setIsRecording(true);
      setActiveSpeaker("user");
      setRoomPhase(isForced ? "forced_turn" : "user_turn");
      setStatusMsg(isForced ? "Recording... you have 40 seconds" : "Recording... click Stop when done");
      if (isForced) {
        const maxMs = (turnDurationRef.current || 40) * 1000;
        userTurnTimerRef.current = setTimeout(() => recorderRef.current?.stop(), maxMs);
        startSilenceDetection(stream);
      }
    } catch (err) {
      const msg = err?.name === "NotAllowedError" ? "Microphone access denied" : "Microphone error — check browser permissions";
      setStatusMsg(msg);
      startPause();
    }
  }

  function stopRecording() {
    stopSilenceDetection();
    clearTimeout(userTurnTimerRef.current);
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    setIsRecording(false);
    setActiveSpeaker(null);
    setRoomPhase("processing");
    setStatusMsg("Processing your response...");
  }

  async function submitTurn(blob, wasRaisedHand, wasForced, durationSec = 15) {
    setProcessing(true);
    try {
      // Derive filename extension from blob type
      const ext = blob.type.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("audio", blob, `turn.${ext}`);
      form.append("duration_sec", String(Math.max(1, Math.round(durationSec))));
      form.append("raised_hand", wasRaisedHand ? "true" : "false");
      const res  = await fetch(`${API}/gd/user-turn/${sessionData.session_id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const data = await res.json();
      setTranscript(prev => [
        ...prev,
        { speaker: "You", text: data.user_transcript || "(your response)", color: "#22C55E", isUser: true },
      ]);
      userSpokeRef.current = true;
      if (wasForced) forcedDoneRef.current = true;
      setForcedTurn(false);
      // After user's summary turn, move straight to closing
      if (gdPhaseRef.current === "summary" && !userSummaryDoneRef.current) {
        userSummaryDoneRef.current = true;
        if (!closingTriggeredRef.current) {
          closingTriggeredRef.current = true;
          changePhase("closing");
          triggerClosing();
          return;
        }
      }
      startPause();
    } catch {
      if (wasForced) forcedDoneRef.current = true;
      setForcedTurn(false);
      startPause();
    } finally {
      setProcessing(false);
    }
  }

  // ── End session ───────────────────────────────────────────────────────────────
  async function handleEnd() {
    if (roomPhase === "ended") return;
    setRoomPhase("ended");
    stopTTS();
    clearTimeout(pauseRef.current);
    clearTimeout(userTurnTimerRef.current);
    stopSilenceDetection();
    if (isRecording) { recorderRef.current?.stop(); setIsRecording(false); }
    if (userStream)  { userStream.getTracks().forEach(t => t.stop()); setUserStream(null); }
    clearTimeout(timerRef.current);
    setResultsLoading(true);
    setView("results");
    try {
      const res  = await fetch(`${API}/gd/finish/${sessionData.session_id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data);
    } catch { /* show empty results */ }
    setResultsLoading(false);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
  const timerColor = timeLeft < 60 ? "#EF4444" : timeLeft < 120 ? "#F59E0B" : "#F1F5F9";

  const bots = sessionData?.bots || [];
  const categories = ["All", ...new Set(topics.map(t => t.category))];
  const filtered   = catFilter === "All" ? topics : topics.filter(t => t.category === catFilter);
  const TOPICS_PER_PAGE = 6;
  const [topicPage, setTopicPage] = useState(0);
  const totalPages = Math.ceil(filtered.length / TOPICS_PER_PAGE);
  const pagedTopics = filtered.slice(topicPage * TOPICS_PER_PAGE, (topicPage + 1) * TOPICS_PER_PAGE);
  const userTurns    = transcript.filter(t => t.isUser).length;
  const totalTurns   = transcript.length;
  const shareOfVoice = totalTurns > 0 ? Math.round((userTurns / totalTurns) * 100) : 0;

  // ────────────────────────────────────────────────────────────────────────────
  // ── VIEW: SETUP ─────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (view === "setup") return (
    <SidebarLayout active="gd" {...sidebarProps}>
      <style>{gdCss}</style>
      <div style={{ padding: "32px 40px", minHeight: "100vh", background: "#0B0F1E" }}>

        {/* Editorial Header */}
        <section style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>
            Select Your Strategic <span style={{ color: "#6366F1", fontStyle: "italic" }}>Arena.</span>
          </h1>
          <p style={{ fontSize: 15, color: "#94A3B8", maxWidth: 560, lineHeight: 1.7, marginTop: 12, opacity: 0.8 }}>
            Engage in high-fidelity simulations with AI counterparts designed to challenge your logic and communication.
          </p>
        </section>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#64748B", marginRight: 8, fontWeight: 600 }}>CATEGORIES</span>
          {categories.map(c => (
            <button key={c} onClick={() => { setCatFilter(c); setTopicPage(0); }} style={{
              padding: "8px 20px", borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: "none",
              background: catFilter === c ? (CATEGORY_COLORS[c] || "#6366F1") : "rgba(255,255,255,0.04)",
              color: catFilter === c ? "#fff" : "#94A3B8",
              transition: "all 0.2s",
            }}>{c}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>

          {/* Left: Topic Grid */}
          <div>
            {topicLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                {pagedTopics.map(topic => {
                  const isSelected = selectedTopic?.id === topic.id;
                  return (
                    <button key={topic.id} onClick={() => setSelectedTopic(topic)} style={{
                      background: isSelected ? "rgba(6,182,212,0.1)" : "rgba(6,182,212,0.03)",
                      border: isSelected ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(6,182,212,0.08)",
                      borderRadius: 16, padding: 24, textAlign: "left", cursor: "pointer",
                      transition: "all 0.3s", animation: "gdFadeIn 0.3s ease",
                      boxShadow: isSelected ? "0 0 0 1px #06B6D4, 0 0 24px rgba(6,182,212,0.2)" : "none",
                      display: "flex", flexDirection: "column", minHeight: 160,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6366F1", fontWeight: 700 }}>
                          {topic.category}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: DIFFICULTY_COLORS[topic.difficulty] || "#F59E0B",
                        }}>{topic.difficulty}</span>
                      </div>
                      <h3 style={{ color: "#F1F5F9", fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, margin: 0 }}>
                        {topic.title}
                      </h3>
                      <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.6, marginTop: 8, flex: 1 }}>
                        {topic.description?.slice(0, 100)}...
                      </p>
                      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ color: "#6366F1", fontSize: 18, opacity: isSelected ? 1 : 0.3, transition: "opacity 0.2s" }}>→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 28 }}>
                <button onClick={() => setTopicPage(p => p - 1)} disabled={topicPage === 0} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: topicPage === 0 ? "rgba(255,255,255,0.02)" : "rgba(99,102,241,0.1)", color: topicPage === 0 ? "#334155" : "#A5B4FC", fontSize: 16, cursor: topicPage === 0 ? "not-allowed" : "pointer", transition: "all 0.2s" }}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setTopicPage(i)} style={{ width: 36, height: 36, borderRadius: 8, border: topicPage === i ? "1px solid rgba(6,182,212,0.5)" : "1px solid rgba(255,255,255,0.06)", background: topicPage === i ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.02)", color: topicPage === i ? "#22D3EE" : "#64748B", fontSize: 13, fontWeight: topicPage === i ? 700 : 400, cursor: "pointer", transition: "all 0.2s" }}>{i + 1}</button>
                ))}
                <button onClick={() => setTopicPage(p => p + 1)} disabled={topicPage === totalPages - 1} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: topicPage === totalPages - 1 ? "rgba(255,255,255,0.02)" : "rgba(99,102,241,0.1)", color: topicPage === totalPages - 1 ? "#334155" : "#A5B4FC", fontSize: 16, cursor: topicPage === totalPages - 1 ? "not-allowed" : "pointer", transition: "all 0.2s" }}>›</button>
                <span style={{ fontSize: 11, color: "#475569", marginLeft: 4 }}>{filtered.length} topics</span>
              </div>
            )}
          </div>

          {/* Right: Config Panel */}
          <div style={{ position: "sticky", top: 32 }}>
            <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 20, padding: 28 }}>

              {/* Selected topic preview */}
              <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 12, padding: 16, marginBottom: 24, minHeight: 56 }}>
                {selectedTopic ? (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", letterSpacing: "0.15em", marginBottom: 6 }}>SELECTED TOPIC</div>
                    <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{selectedTopic.title}</div>
                  </>
                ) : (
                  <div style={{ color: "#475569", fontSize: 12 }}>Select a topic from the grid</div>
                )}
              </div>

              {/* Bot count */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: "#94A3B8", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 10 }}>NUMBER OF BOTS</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[3, 4, 5].map(n => (
                    <button key={n} onClick={() => setBotCount(n)} style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                      border: "none",
                      background: botCount === n ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                      color: botCount === n ? "#6366F1" : "#64748B", transition: "all 0.15s",
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ color: "#94A3B8", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 10 }}>
                  DURATION: <span style={{ color: "#F1F5F9" }}>{durationMins} MIN</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[5, 7, 10].map(m => (
                    <button key={m} onClick={() => setDurationMins(m)} style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                      border: "none",
                      background: durationMins === m ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                      color: durationMins === m ? "#6366F1" : "#64748B", transition: "all 0.15s",
                    }}>{m}m</button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <button onClick={handleStart} disabled={!selectedTopic || starting} style={{
                width: "100%", padding: "16px 0", borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: selectedTopic ? "linear-gradient(135deg,#6366F1,#4F46E5)" : "rgba(255,255,255,0.04)",
                color: selectedTopic ? "#fff" : "#475569",
                border: "none", cursor: selectedTopic ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                boxShadow: selectedTopic ? "0 0 28px rgba(99,102,241,0.4)" : "none",
              }}>
                {starting ? "Starting..." : "Start Prep Time →"}
              </button>
            </div>
          </div>
        </div>

        {/* Meet Your Counterparts */}
        <section style={{ marginTop: 48 }}>
          <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 20, padding: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Meet Your Counterparts</h2>
                <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 6, opacity: 0.7 }}>A diverse array of AI personas with distinct argumentative styles.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", animation: "gdBlink 1.5s ease-in-out infinite", display: "inline-block" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", letterSpacing: "0.2em", textTransform: "uppercase" }}>Live Moderator Active</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
              {["Alex", "Zoe", "Ethan", "Kate", "Sam"].map(name => (
                <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: 16, borderRadius: 16, transition: "background 0.2s", cursor: "default" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", marginBottom: 12,
                    border: `2px solid ${BOT_COLORS[name]}`, padding: 2, flexShrink: 0,
                    boxShadow: `0 0 14px ${BOT_COLORS[name]}55`,
                  }}>
                    <img src={BOT_AVATARS[name]} alt={name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{name}</span>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94A3B8", marginTop: 4 }}>{BOT_ROLES[name]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SidebarLayout>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // ── VIEW: PREP ───────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (view === "prep") {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0F1E", display: "flex", alignItems: "center", justifyContent: "center", padding: 48, position: "relative", overflow: "hidden" }}>
        <style>{gdCss}</style>

        {/* Decorative blur orbs */}
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(99,102,241,0.06)", filter: "blur(120px)", top: "25%", right: -150, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(99,102,241,0.04)", filter: "blur(150px)", bottom: -100, left: -150, pointerEvents: "none" }} />

        {/* Main 7:5 grid */}
        <div style={{ width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "7fr 5fr", gap: 48, alignItems: "center", position: "relative", zIndex: 1 }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#94A3B8", opacity: 0.7, fontWeight: 600 }}>CURRENT SIMULATION PHASE</span>
            <h1 style={{ fontSize: 48, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0 }}>
              Pre-Session <span style={{ color: "#6366F1", fontStyle: "italic" }}>Ideation</span>
            </h1>

            {/* Topic card */}
            <div style={{ background: "#0F1629", padding: 32, borderRadius: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.05), transparent)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: 10, letterSpacing: "0.15em", color: "#64748B", fontWeight: 600 }}>SELECTED DISCUSSION TOPIC</span>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9", lineHeight: 1.4, margin: "12px 0 16px" }}>
                  {sessionData?.topic?.title}
                </h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", padding: "4px 12px", borderRadius: 9999, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>
                    {sessionData?.topic?.category?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Giant timer */}
            <div>
              <div style={{ fontSize: 128, fontWeight: 900, color: "#6366F1", lineHeight: 1, animation: "gdTimerGlow 3s ease-in-out infinite" }}>
                {prepCountdown}<span style={{ fontSize: 48, fontWeight: 300, opacity: 0.5, marginLeft: 8 }}>s</span>
              </div>
              <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 16 }}>
                <div style={{ height: "100%", background: "#6366F1", width: `${(prepCountdown / 60) * 100}%`, borderRadius: 2, boxShadow: "0 0 10px rgba(99,102,241,0.5)", transition: "width 1s linear" }} />
              </div>
              <p style={{ color: "#94A3B8", fontStyle: "italic", fontSize: 14, marginTop: 16 }}>
                Synthesize your initial thoughts before the floor opens...
              </p>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Brainstorming Sanctuary */}
            <div style={{ background: "#0F1629", borderRadius: 16, padding: 32 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 28 }}>
                <span style={{ fontSize: 24 }}>💡</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Brainstorming Sanctuary</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {GD_TIPS.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", margin: "0 0 4px" }}>{tip.title}</h4>
                      <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={enterRoom} style={{
                  width: "100%", padding: 16, borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff",
                  border: "none", cursor: "pointer", boxShadow: "0 0 28px rgba(99,102,241,0.4)",
                }}>Ready Early? →</button>
                <button onClick={enterRoom} style={{
                  width: "100%", padding: 16, borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: "rgba(99,102,241,0.12)", color: "#6366F1",
                  border: "none", cursor: "pointer",
                }}>Enter GD Room</button>
              </div>
            </div>

            {/* Participant status */}
            <div style={{ background: "#0F1629", borderRadius: 16, padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧠</div>
              <div>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748B", margin: 0, fontWeight: 600 }}>PARTICIPANT STATUS</p>
                <p style={{ fontSize: 13, color: "#F1F5F9", margin: "4px 0 0" }}>{bots.length} AI candidates ready in the lobby</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── VIEW: ROOM ───────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (view === "room") {
    const isMicActive = isRecording || activeSpeaker === "user";

    return (
      <div style={{ height: "100vh", background: "#080C1A", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <style>{gdCss}</style>

        {/* Header bar */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(15,22,41,0.95)", backdropFilter: "blur(12px)" }}>
          <div>
            <h2 style={{ color: "#F1F5F9", fontSize: 18, fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 400 }}>
              {sessionData?.topic?.title}
            </h2>
            <span style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
              TOPIC: {sessionData?.topic?.category}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Phase badge */}
            {(() => {
              const pm = PHASE_META[gdPhase] || PHASE_META.discussion;
              return (
                <div style={{ background: pm.bg, borderRadius: 9999, padding: "6px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pm.color, letterSpacing: "0.15em", textTransform: "uppercase" }}>{pm.label}</span>
                </div>
              );
            })()}
            {/* Live badge */}
            <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 9999, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", animation: "gdBlink 1.2s infinite", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9", letterSpacing: "0.15em", textTransform: "uppercase" }}>Live Session</span>
            </div>
            {/* Timer badge */}
            <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 9999, padding: "6px 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: timerColor, fontVariantNumeric: "tabular-nums" }}>{fmtTime(timeLeft)}</span>
            </div>
            <button onClick={handleEnd} style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(239,68,68,0.12)", color: "#EF4444", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
              End GD
            </button>
          </div>
        </div>

        {/* Main 3-panel layout */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          {/* LEFT: Rolling Transcript */}
          <div style={{ width: 280, padding: "24px 16px", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            {/* Fade masks */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "linear-gradient(#080C1A, transparent)", zIndex: 2, pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, #080C1A)", zIndex: 2, pointerEvents: "none" }} />

            <div ref={transcriptRef} className="gd-no-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              {transcript.map((turn, i) => {
                const isLast = i === transcript.length - 1;
                return (
                  <div key={i} style={{
                    opacity: isLast ? 1 : 0.4,
                    borderLeft: isLast ? `2px solid ${turn.color}` : "none",
                    paddingLeft: isLast ? 12 : 0,
                    background: isLast ? "rgba(255,255,255,0.03)" : "transparent",
                    borderRadius: isLast ? "0 8px 8px 0" : 0,
                    padding: isLast ? 12 : 0,
                    transition: "opacity 0.3s",
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: turn.color, textTransform: "uppercase" }}>
                      {turn.speaker}{isLast && " \u2022 Speaking"}
                    </span>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: "#F1F5F9", marginTop: 4, margin: "4px 0 0" }}>{turn.text}</p>
                  </div>
                );
              })}
              {processing && <div style={{ color: "#475569", fontSize: 11, fontStyle: "italic", textAlign: "center", padding: 8 }}>Processing...</div>}
            </div>
          </div>

          {/* CENTER: Circular Round Table */}
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Outer glow */}
            <div style={{ position: "absolute", width: 600, height: 600, background: "rgba(99,102,241,0.04)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

            {/* Central speaker spotlight */}
            <div style={{ position: "relative", zIndex: 10, width: 384, height: 384, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {/* Dashed spinning ring */}
              <div style={{ position: "absolute", inset: 0, border: "2px dashed rgba(99,102,241,0.1)", borderRadius: "50%", animation: "gdSpinSlow 60s linear infinite" }} />

              {/* Speaker display */}
              {activeSpeaker && activeSpeaker !== "user" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 96, height: 96, borderRadius: "50%", border: `3px solid ${BOT_COLORS[activeSpeaker] || "#6366F1"}`, padding: 3, flexShrink: 0 }}>
                    <img src={BOT_AVATARS[activeSpeaker]} alt={activeSpeaker} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center", height: 32, padding: "0 12px", background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 9999 }}>
                    {[0.1, 0.3, 0.2, 0.4, 0.15].map((d, j) => (
                      <div key={j} style={{ width: 3, background: BOT_COLORS[activeSpeaker] || "#6366F1", borderRadius: 9999, animation: "gdWaveform 1.2s ease-in-out infinite", animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: BOT_COLORS[activeSpeaker] || "#6366F1", margin: 0 }}>{activeSpeaker} is Speaking</h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>{BOT_ROLES[activeSpeaker]}</p>
                </div>
              ) : activeSpeaker === "user" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 96, height: 96, borderRadius: "50%", border: `3px solid ${forcedTurn ? "#EF4444" : "#22C55E"}`, background: forcedTurn ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>👤</div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center", height: 32, padding: "0 12px", background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 9999 }}>
                    {[0.1, 0.3, 0.2, 0.4, 0.15].map((d, j) => (
                      <div key={j} style={{ width: 3, background: forcedTurn ? "#EF4444" : "#22C55E", borderRadius: 9999, animation: "gdWaveform 1.2s ease-in-out infinite", animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: forcedTurn ? "#EF4444" : "#22C55E", margin: 0 }}>
                    {forcedTurn ? `Forced Turn — ${userTurnCountdown}s` : "You are Speaking"}
                  </h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
                    {forcedTurn ? "MUST SPEAK NOW" : "RECORDING IN PROGRESS"}
                  </p>
                </div>
              ) : roomPhase === "pause" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: raisedHand ? "#22C55E" : "#6366F1", animation: "gdTimerGlow 1s ease-in-out infinite" }}>
                    {pauseCountdown}
                  </div>
                  <p style={{ fontSize: 13, color: raisedHand ? "#22C55E" : "#94A3B8", margin: 0, textAlign: "center", fontWeight: raisedHand ? 700 : 400 }}>
                    {raisedHand ? "Your turn next!" : "Raise hand to speak next"}
                  </p>
                  <div style={{ width: 160, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", borderRadius: 2, transition: "width 1s linear", background: raisedHand ? "#22C55E" : "#6366F1", width: `${(pauseCountdown / 5) * 100}%` }} />
                  </div>
                </div>
              ) : roomPhase === "processing" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.7 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>⏳</div>
                  <p style={{ fontSize: 14, color: "#6366F1", margin: 0 }}>Processing your turn...</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.5 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎙</div>
                  <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>Waiting for speaker...</p>
                </div>
              )}
            </div>

            {/* HUMAN (You) card — top center */}
            <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
              <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", border: "2px solid #6366F1", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 0 30px rgba(99,102,241,0.2)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#0F1629" }}>
                  {userStream ? (
                    <video ref={userVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
                  )}
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#6366F1", letterSpacing: "0.2em", textTransform: "uppercase" }}>Human (You)</span>
              </div>
            </div>

            {/* Bot cards — circular positions */}
            {bots.map((bot, i) => {
              const totalPositions = bots.length + 1;
              const angleDeg = ((i + 1) * 360) / totalPositions;
              const angleRad = (angleDeg * Math.PI) / 180;
              const topPct = 50 - 42 * Math.cos(angleRad);
              const leftPct = 50 + 42 * Math.sin(angleRad);
              const isSpeaking = activeSpeaker === bot.name;
              return (
                <div key={bot.name} style={{ position: "absolute", top: `${topPct}%`, left: `${leftPct}%`, transform: "translate(-50%,-50%)", zIndex: 20 }}>
                  <div style={{
                    background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 16, padding: 10,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    border: isSpeaking ? `2px solid ${bot.color}` : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSpeaking ? `0 0 20px ${bot.color}44` : "none",
                    opacity: isSpeaking ? 1 : 0.7, transition: "all 0.3s",
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${bot.color}`, padding: 2, flexShrink: 0, boxShadow: isSpeaking ? `0 0 16px ${bot.color}99` : "none", animation: isSpeaking ? "gdPulse 1.5s ease-in-out infinite" : "none" }}>
                      <img src={BOT_AVATARS[bot.name]} alt={bot.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }} />
                    </div>
                    <div style={{ padding: "2px 8px", background: "rgba(99,102,241,0.1)", borderRadius: 9999, fontSize: 8, fontWeight: 700, color: "#6366F1" }}>AI</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isSpeaking ? bot.color : "#94A3B8" }}>{bot.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Metrics Sidebar */}
          <div style={{ width: 300, padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>

            {/* HINT CARD — only during forced turn */}
            {forcedTurn && (() => {
              const topic = sessionData?.topic;
              const lastBot = [...transcript].reverse().find(t => t.speaker !== "You");
              const hints = [
                `State your position on "${topic?.title}" — agree, disagree, or introduce a new angle.`,
                lastBot ? `Build on or challenge ${lastBot.speaker}'s last point.` : "Open with a clear stance and justify it briefly.",
                "Back your argument with a real-world example or a stat you know.",
                "Wrap up with a question to keep the discussion moving.",
              ];
              return (
                <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, padding: 16, animation: "gdPulse 2s infinite" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>⚡</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#EF4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Your Turn — Speak Now</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#EF4444" }}>{userTurnCountdown}s</span>
                  </div>

                  {/* Tab toggle */}
                  <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 3, marginBottom: 12 }}>
                    {["hints", "paragraph"].map(mode => (
                      <button key={mode} onClick={() => setHintMode(mode)} style={{
                        flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: hintMode === mode ? "rgba(239,68,68,0.2)" : "transparent",
                        color: hintMode === mode ? "#EF4444" : "#64748B",
                        border: hintMode === mode ? "1px solid rgba(239,68,68,0.3)" : "1px solid transparent",
                        cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.15s",
                      }}>
                        {mode === "hints" ? "💡 Hints" : "📄 Topic"}
                      </button>
                    ))}
                  </div>

                  {hintMode === "hints" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {hints.map((h, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#EF4444", marginTop: 2, flexShrink: 0 }}>{i + 1}.</span>
                          <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.55, margin: 0 }}>{h}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>
                      {topic?.description || "No description available for this topic."}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Share of Voice */}
            <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h4 style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>Share of Voice</h4>
                <span>🎤</span>
              </div>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: "#F1F5F9" }}>{shareOfVoice}%</span>
                <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>YOU vs GROUP</p>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ height: "100%", background: "#6366F1", width: `${Math.min(shareOfVoice, 100)}%`, borderRadius: 3, transition: "width 0.5s" }} />
              </div>
              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
                {shareOfVoice < 20 ? "Your participation is low. Look for an opening to contribute." : shareOfVoice > 40 ? "Good participation! Give others a chance too." : "Balanced participation. Keep it up!"}
              </p>
            </div>

            {/* Pro-tip — hidden during forced turn to give hint card full attention */}
            {!forcedTurn && (
              <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                  <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
                    <span style={{ fontWeight: 700, color: "#6366F1" }}>Pro-tip: </span>
                    Listen for transition moments. When a speaker concludes, jump in with a bridging statement that connects their point to yours.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase announcement banners */}
        {gdPhase === "opening" && (
          <div style={{ flexShrink: 0, background: "linear-gradient(90deg, rgba(6,182,212,0.85), rgba(8,145,178,0.85))", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backdropFilter: "blur(12px)" }}>
            <span style={{ fontSize: 15 }}>🎙️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Opening round — each participant states their initial position</span>
          </div>
        )}
        {gdPhase === "summary" && (
          <div style={{ flexShrink: 0, background: "linear-gradient(90deg, rgba(245,158,11,0.88), rgba(217,119,6,0.88))", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backdropFilter: "blur(12px)" }}>
            <span style={{ fontSize: 15 }}>⏳</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Discussion wrapping up — present your strongest point and summarize your position</span>
          </div>
        )}
        {gdPhase === "closing" && (
          <div style={{ flexShrink: 0, background: "linear-gradient(90deg, rgba(167,139,250,0.88), rgba(124,58,237,0.88))", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backdropFilter: "blur(12px)" }}>
            <span style={{ fontSize: 15 }}>✨</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Closing statements — the discussion is coming to an end</span>
          </div>
        )}

        {/* Forced turn alert bar */}
        {roomPhase === "forced_turn" && (
          <div style={{ flexShrink: 0, background: "linear-gradient(90deg, rgba(239,68,68,0.92), rgba(220,38,38,0.92))", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, backdropFilter: "blur(12px)" }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {gdPhase === "summary"
                ? `Summarize your key arguments — ${userTurnCountdown}s remaining`
                : `Your turn to speak! — ${userTurnCountdown}s remaining — speak now or receive a lower score`}
            </span>
          </div>
        )}

        {/* Bottom Control Dock */}
        <div style={{ flexShrink: 0, padding: "16px 24px", display: "flex", justifyContent: "center", position: "relative", zIndex: 40 }}>
          <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(20px)", borderRadius: 9999, padding: "12px 32px", display: "flex", alignItems: "center", gap: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>

            {/* Raise Hand — toggle flag during 5-sec pause only */}
            <button
              onClick={() => {
                if (roomPhase !== "pause") return;
                const next = !raisedHand;
                raisedHandRef.current = next;
                setRaisedHand(next);
              }}
              disabled={roomPhase !== "pause"}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: raisedHand ? "rgba(34,197,94,0.15)" : "transparent",
                border: raisedHand ? "1px solid rgba(34,197,94,0.5)" : "1px solid transparent",
                borderRadius: 12, padding: "6px 14px",
                cursor: roomPhase === "pause" ? "pointer" : "default",
                color: raisedHand ? "#22C55E" : "#94A3B8",
                opacity: roomPhase === "pause" ? 1 : 0.3,
                transition: "all 0.2s",
              }}>
              <span style={{ fontSize: 20 }}>🖐</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>
                {raisedHand ? "QUEUED" : "Raise Hand"}
              </span>
            </button>

            {/* Center Mic / Stop Button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {isRecording ? (
                <button onClick={stopRecording} style={{ width: 64, height: 64, borderRadius: "50%", background: forcedTurn ? "#EF4444" : "#22C55E", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: `0 0 40px ${forcedTurn ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`, animation: "gdPulse 1s infinite", fontSize: 24, color: "#fff" }}>
                  ■
                </button>
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3, fontSize: 24 }}>
                  🎤
                </div>
              )}
              <span style={{ fontSize: 10, fontWeight: 800, color: isRecording ? (forcedTurn ? "#EF4444" : "#22C55E") : "#6366F1", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                {isRecording ? "STOP" : "MIC"}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.1)" }} />

            {/* Leave Session */}
            <button onClick={handleEnd} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", opacity: 0.8 }}>
              <span style={{ fontSize: 20 }}>📞</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>Leave</span>
            </button>
          </div>

          {/* Status below dock */}
          <div style={{ position: "absolute", bottom: 2, textAlign: "center", width: "100%", pointerEvents: "none" }}>
            <span style={{ fontSize: 11, color: "#64748B" }}>
              {processing ? "Processing your response..." : ttsPlaying ? `${activeSpeaker} is speaking...` : statusMsg}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── VIEW: RESULTS ────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (view === "results") {
    if (resultsLoading) return (
      <div style={{ minHeight: "100vh", background: "#0B0F1E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <style>{gdCss}</style>
        <Spinner />
        <div style={{ color: "#64748B", fontSize: 13 }}>Analyzing your performance...</div>
      </div>
    );

    const scores = results?.scores || {};
    const radarData = [
      { dim: "Participation", val: scores.participation || 0 },
      { dim: "Leadership",    val: scores.leadership    || 0 },
      { dim: "Listening",     val: scores.listening     || 0 },
      { dim: "Idea Quality",  val: scores.idea_quality  || 0 },
      { dim: "Teamwork",      val: scores.teamwork      || 0 },
    ];
    const band      = results?.band || "N/A";
    const overall   = results?.overall_score || 0;
    const coaching  = results?.coaching || {};
    const bandColor = BAND_COLORS[band] || "#94A3B8";
    const coachingText = coachingTab === "strengths" ? (coaching.strengths || "") : (coaching.growth || "");
    const coachingItems = coachingText.split(/(?<=[.!])\s+/).filter(s => s.trim().length > 10);
    const contentAnalysis   = results?.content_analysis || {};
    const contentKeywords   = contentAnalysis.keywords || [];
    const contentArguments  = contentAnalysis.arguments || [];
    const relevanceScore    = contentAnalysis.relevance_score || 0;
    const sentiment         = results?.sentiment || {};
    const pIntel            = results?.participation_intelligence || {};
    const avgVoiceScore     = results?.avg_voice_score;

    return (
      <SidebarLayout active="gd" {...sidebarProps}>
        <style>{gdCss}</style>
        <div style={{ padding: "32px 40px", minHeight: "100vh", background: "#0B0F1E" }}>

          {/* Editorial Score Header */}
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
            <div>
              <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#94A3B8", opacity: 0.7, fontWeight: 600 }}>SESSION PERFORMANCE</span>
              <h1 style={{ fontSize: 42, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.03em", margin: "8px 0 0" }}>
                Overall Score: <span style={{ color: bandColor }}>{Math.round(overall)}/100</span>
              </h1>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                <span style={{ background: `${bandColor}15`, color: bandColor, padding: "6px 16px", borderRadius: 9999, fontWeight: 700, fontSize: 13 }}>
                  Band: {band}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
              <button onClick={() => { setView("setup"); setResults(null); setSessionData(null); setTranscript([]); setCoachingTab("strengths"); }} style={{
                background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff", padding: "14px 28px", borderRadius: 12,
                fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(99,102,241,0.3)",
              }}>
                Try Another Topic →
              </button>
              {sessionData?.session_id && (
                <a href={`${API}/reports/gd/${sessionData.session_id}`}
                   target="_blank" rel="noreferrer"
                   style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", color: "#94A3B8", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                  ↓ Download PDF Report
                </a>
              )}
            </div>
          </header>

          {/* Main Grid: 7:5 */}
          <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 24, marginBottom: 24 }}>

            {/* LEFT: Dimensional Mastery */}
            <div style={{ background: "#0F1629", borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F1F5F9", margin: "0 0 24px" }}>Dimensional Mastery</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="val" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip formatter={v => [`${v}%`]} contentStyle={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16 }}>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 4px" }}>Turns Taken</p>
                  <p style={{ fontSize: 28, fontWeight: 900, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: 0 }}>{String(userTurns || 0).padStart(2, "0")}</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16 }}>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 4px" }}>Arguments Made</p>
                  <p style={{ fontSize: 28, fontWeight: 900, background: THEME.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: 0 }}>{String(scores.arguments_count || 0).padStart(2, "0")}</p>
                </div>
              </div>
            </div>

            {/* RIGHT: AI Coaching with Tabs */}
            <div style={{ background: "#0F1629", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, background: "rgba(99,102,241,0.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧠</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>AI Coaching</h3>
              </div>

              {/* Tab toggle */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, marginBottom: 20 }}>
                {["strengths", "weaknesses"].map(tab => (
                  <button key={tab} onClick={() => setCoachingTab(tab)} style={{
                    flex: 1, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                    background: coachingTab === tab ? "#6366F1" : "transparent",
                    color: coachingTab === tab ? "#fff" : "#94A3B8", transition: "all 0.2s",
                  }}>{tab === "strengths" ? "Strengths" : "Weaknesses"}</button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 320, display: "flex", flexDirection: "column", gap: 12 }}>
                {coachingItems.length > 0 ? coachingItems.map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
                    <span style={{ color: coachingTab === "strengths" ? "#22C55E" : "#F59E0B", fontSize: 16, flexShrink: 0 }}>
                      {coachingTab === "strengths" ? "✓" : "△"}
                    </span>
                    <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>{item.trim()}</p>
                  </div>
                )) : (
                  <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 24 }}>No coaching data available</div>
                )}
                {coachingTab === "strengths" && coaching.action_items && (
                  <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 12, padding: 16, marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", marginBottom: 8 }}>→ ACTION ITEMS</div>
                    <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>{coaching.action_items}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bento Row: Content Distribution + Sentiment */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Content Distribution */}
            <div style={{ background: "#0F1629", borderRadius: 20, padding: 32, position: "relative", overflow: "hidden" }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", margin: "0 0 20px" }}>Content Distribution</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {(contentKeywords.length > 0 ? contentKeywords.slice(0, 10) : (sessionData?.topic?.title || "").split(/\s+/).filter(w => w.length > 3).slice(0, 8).map(w => ({ word: w }))).map((kw, i) => (
                  <span key={i} style={{
                    background: i % 3 === 0 ? "rgba(99,102,241,0.15)" : "rgba(148,163,184,0.1)",
                    color: i % 3 === 0 ? "#6366F1" : "#94A3B8",
                    padding: `${8 + (i % 3) * 4}px ${16 + (i % 2) * 8}px`, borderRadius: 9999,
                    fontSize: 11 + (i % 3) * 3, fontWeight: i % 3 === 0 ? 700 : 500,
                  }}>{kw.word}</span>
                ))}
              </div>
              {contentArguments.length > 0 && (
                <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                  <p style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Main Arguments Made</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {contentArguments.slice(0, 5).map((arg, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>{i + 1}.</span>
                        <p style={{ margin: 0, fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>{arg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ position: "absolute", bottom: -40, right: -40, width: 160, height: 160, background: "rgba(99,102,241,0.05)", filter: "blur(60px)", borderRadius: "50%", pointerEvents: "none" }} />
            </div>

            {/* Sentiment Tone */}
            <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 8px" }}>Sentiment Tone</p>
              <h5 style={{ fontSize: 22, fontWeight: 900, color: "#6366F1", margin: "0 0 8px", textTransform: "capitalize" }}>
                {sentiment.tone || band}
              </h5>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 12px" }}>
                {sentiment.sentiment ? `${sentiment.sentiment} · ${sentiment.confidence_level} confidence` : ""}
              </p>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ height: "100%", background: "#6366F1", width: `${overall}%`, borderRadius: 3 }} />
              </div>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "8px 0 0" }}>Overall score: {Math.round(overall)}%</p>
              {avgVoiceScore != null && (
                <div style={{ marginTop: 12, padding: "6px 12px", background: "rgba(99,102,241,0.12)", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#6366F1" }}>🎤</span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>Voice: <b style={{ color: "#F1F5F9" }}>{Math.round(avgVoiceScore)}/100</b></span>
                </div>
              )}
            </div>
          </div>

          {/* Moment-by-Moment Analysis */}
          <div style={{ background: "#070B18", borderRadius: 24, padding: 4 }}>
            <div style={{ background: "#0F1629", borderRadius: 22, padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>Moment-by-Moment Analysis</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex" }}>
                    {bots.slice(0, 3).map((b, i) => (
                      <div key={b.name} style={{ width: 32, height: 32, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", border: "2px solid #0F1629", marginLeft: i > 0 ? -8 : 0 }}>
                        {b.name[0]}
                      </div>
                    ))}
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#94A3B8", border: "2px solid #0F1629", marginLeft: -8 }}>
                      +{bots.length}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>{transcript.length} Exchanges</span>
                </div>
              </div>

              <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {transcript.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", opacity: t.isUser ? 1 : 0.6 }}>
                    <div style={{ width: 48, flexShrink: 0, fontSize: 11, color: "#475569", fontFamily: "monospace", paddingTop: 2 }}>
                      {t.timestamp ? new Date(t.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : `${String(Math.floor(i * 0.5)).padStart(2,"0")}:${String((i*30)%60).padStart(2,"0")}`}
                    </div>
                    <div style={{ flex: 1, padding: 16, borderRadius: 12, background: t.isUser ? "rgba(99,102,241,0.06)" : "transparent", borderLeft: t.isUser ? "3px solid #6366F1" : "none" }}>
                      {t.isUser && <span style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: 8 }}>Key Intervention</span>}
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                          {(t.speaker || "?")[0]}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.speaker}</span>
                      </div>
                      <p style={{ fontSize: 13, color: t.isUser ? "#F1F5F9" : "#94A3B8", lineHeight: 1.6, margin: 0, fontStyle: t.isUser ? "italic" : "normal" }}>
                        {t.isUser ? `"${t.text}"` : t.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return null;
}
