import { useState, useRef, useEffect } from "react";
import { API } from "./shared";

export default function VisionRecorder({ sessionId, questionId, onVisionResult, token }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Calm");

  const stopCamera = () => {
    const stream = streamRef.current || videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mountedRef.current) {
      setActive(false);
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();
      console.log("[VISION] Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 }
      });
      if (!mountedRef.current || !videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setError("");
        setActive(true);
        console.log("[VISION] Camera started successfully");
      }
    } catch (err) {
      console.error("[VISION] Camera denied:", err);
      setError("Camera access denied.");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  // Periodic frame capture
  useEffect(() => {
    if (!active || !questionId) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState < 2) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7); // Low quality to save bandwidth

      try {
        console.log("[VISION] Sending frame for analysis...");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API}/api/vision/analyze`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            image: dataUrl,
            session_id: sessionId,
            question_id: questionId
          })
        });
        console.log("[VISION] API response status:", res.status);
        const data = await res.json();
        console.log("[VISION] API response:", data);
        if (!res.ok) {
          throw new Error(data?.detail || data?.error?.message || "Vision analysis failed");
        }
        if (data.emotion) {
          setStatus(data.emotion);
          console.log("[VISION] Emotion detected:", data.emotion);
        }
        if (data.error) {
          console.error("[VISION] API error:", data.error);
        }
        if (onVisionResult) onVisionResult(data);
      } catch (err) {
        console.error("[VISION] Analyze error:", err);
        setError("Vision analysis failed");
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [active, sessionId, questionId, token, onVisionResult]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 220, background: "#000", borderRadius: 12, overflow: "hidden", border: "1px solid #1e2d4a" }}>
      {error ? (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff4d6d", fontSize: 12 }}>
          {error}
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted 
                 style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
          
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8 }}>
            <span style={{ 
              background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 4, 
              color: "#00ff88", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800"
            }}>
              ● LIVE
            </span>
            <span style={{ 
              background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 4, 
              color: "#00e5ff", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px"
            }}>
              {status}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
