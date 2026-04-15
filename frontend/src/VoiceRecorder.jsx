import { useState, useRef } from "react";

// ─────────────────────────────────────────────
// Write proper WAV header + PCM samples
// ─────────────────────────────────────────────
function buildWav(float32Array, sampleRate) {
  const numSamples = float32Array.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const write = (off, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);       // chunk size
  view.setUint16(20, 1, true);        // PCM
  view.setUint16(22, 1, true);        // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);        // block align
  view.setUint16(34, 16, true);       // bit depth
  write(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Normalize amplitude
  let maxAmp = 0;
  for (let i = 0; i < float32Array.length; i++) {
    const abs = Math.abs(float32Array[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  const gain = maxAmp > 0.001 ? (0.9 / maxAmp) : 1.0;
  console.log(`[VOICE] Max amplitude: ${maxAmp.toFixed(6)}, gain: ${gain.toFixed(2)}x`);

  // Write PCM
  let offset = 44;
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i] * gain));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function VoiceRecorder({ onVoiceResult }) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const samplesRef = useRef([]);
  const sampleRateRef = useRef(44100);

  const startRecording = async () => {
    setResult(null);
    setError("");
    setStatus("");
    samplesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        }
      });

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      sampleRateRef.current = audioContext.sampleRate;

      const source = audioContext.createMediaStreamSource(stream);

      // ScriptProcessorNode captures raw PCM samples
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        samplesRef.current.push(new Float32Array(data));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Store stream reference to stop tracks later
      audioContextRef.current._stream = stream;

      setRecording(true);
      console.log("[VOICE] Recording started at", audioContext.sampleRate, "Hz");
    } catch (err) {
      console.error(err);
      setError("Microphone access denied. Please allow mic permissions.");
    }
  };

  const stopRecording = async () => {
    if (!audioContextRef.current) return;
    setRecording(false);
    setLoading(true);
    setStatus("Building WAV...");

    try {
      // Stop processor
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      // Stop mic stream
      if (audioContextRef.current._stream) {
        audioContextRef.current._stream.getTracks().forEach(t => t.stop());
      }
      await audioContextRef.current.close();
      audioContextRef.current = null;

      // Merge all sample chunks
      const chunks = samplesRef.current;
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`[VOICE] Total samples: ${totalLength} at ${sampleRateRef.current}Hz`);
      console.log(`[VOICE] Duration: ${(totalLength / sampleRateRef.current).toFixed(2)}s`);

      const wavBlob = buildWav(merged, sampleRateRef.current);
      console.log(`[VOICE] WAV size: ${wavBlob.size} bytes`);

      setStatus("Analyzing voice...");
      await sendAudio(wavBlob);
    } catch (err) {
      console.error("Build WAV error:", err);
      setError(`Failed to process audio: ${err.message}`);
      setLoading(false);
      setStatus("");
    }
  };

  const sendAudio = async (wavBlob) => {
    const formData = new FormData();
    formData.append("audio", wavBlob, "answer.wav");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE}/api/voice/analyze`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server ${res.status}: ${errText}`);
      }

      const data = await res.json();
      setResult(data);
      if (onVoiceResult) onVoiceResult(data);
    } catch (err) {
      console.error("Send error:", err);
      if (err.name === "AbortError") {
        setError("Request timed out. Try a shorter recording.");
      } else {
        setError(`Voice analysis failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return "✅";
    if (score >= 60) return "⚠️";
    return "❌";
  };

  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "12px",
      padding: "20px",
      marginTop: "20px"
    }}>
      <h3 style={{ color: "#94a3b8", marginBottom: "16px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
        🎙️ Voice Analysis
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        {!recording && !loading && (
          <button onClick={startRecording} style={{
            background: "#6366f1", color: "white", border: "none",
            borderRadius: "8px", padding: "10px 20px", cursor: "pointer",
            fontWeight: "600", fontSize: "14px"
          }}>
            🎙️ Start Recording
          </button>
        )}

        {recording && (
          <button onClick={stopRecording} style={{
            background: "#ef4444", color: "white", border: "none",
            borderRadius: "8px", padding: "10px 20px", cursor: "pointer",
            fontWeight: "600", fontSize: "14px"
          }}>
            ⏹️ Stop Recording
          </button>
        )}

        {recording && (
          <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: "500" }}>● Recording...</span>
        )}

        {loading && (
          <span style={{ color: "#6366f1", fontSize: "13px", fontWeight: "500" }}>
            ⏳ {status || "Processing..."}
          </span>
        )}
      </div>

      {error && (
        <div style={{
          color: "#ef4444", fontSize: "13px", marginBottom: "12px",
          background: "#1a1a2e", padding: "10px", borderRadius: "6px"
        }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{
            background: "#0f172a", borderRadius: "10px", padding: "16px",
            marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>VOICE SCORE</div>
              <div style={{ color: getScoreColor(result.overall_voice_score), fontSize: "32px", fontWeight: "700" }}>
                {result.overall_voice_score}%
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>DURATION</div>
              <div style={{ color: "#e2e8f0", fontSize: "18px", fontWeight: "600" }}>{result.duration_seconds}s</div>
            </div>
          </div>

          <div style={{
            background: "#0f172a", borderRadius: "8px", padding: "12px 16px",
            marginBottom: "16px", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.6"
          }}>
            💬 {result.feedback}
          </div>

          {result.transcript && (
            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "6px", textTransform: "uppercase" }}>Transcript</div>
              <div style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>"{result.transcript}"</div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "6px" }}>PACE</div>
              <div style={{ color: getScoreColor(result.details.pace.score), fontWeight: "700", fontSize: "18px" }}>
                {result.details.pace.wpm} WPM
              </div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                {getScoreEmoji(result.details.pace.score)} {result.details.pace.label}
              </div>
            </div>

            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "6px" }}>FILLER WORDS</div>
              <div style={{ color: getScoreColor(result.details.filler_words.score), fontWeight: "700", fontSize: "18px" }}>
                {result.details.filler_words.count} found
              </div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                {getScoreEmoji(result.details.filler_words.score)} {result.details.filler_words.count === 0 ? "clean speech" : `${result.details.filler_words.filler_ratio_percent}% of words`}
              </div>
            </div>

            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "6px" }}>CONFIDENCE</div>
              <div style={{ color: getScoreColor(result.details.confidence.confidence_score), fontWeight: "700", fontSize: "18px" }}>
                {result.details.confidence.confidence_score}%
              </div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                {getScoreEmoji(result.details.confidence.confidence_score)} pitch variation: {result.details.confidence.pitch_variation} Hz
              </div>
            </div>

            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "6px" }}>PAUSES</div>
              <div style={{ color: getScoreColor(result.details.silence.score), fontWeight: "700", fontSize: "18px" }}>
                {result.details.silence.silence_ratio}%
              </div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                {getScoreEmoji(result.details.silence.score)} {result.details.silence.label}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
