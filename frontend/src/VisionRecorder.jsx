import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function VisionRecorder({ sessionId, questionId, onVisionResult, token }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Calm");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setActive(true);
      }
    } catch (err) {
      console.error("[VISION] Camera denied:", err);
      setError("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Periodic frame capture
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7); // Low quality to save bandwidth

      try {
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
        const data = await res.json();
        if (data.emotion) setStatus(data.emotion);
        if (onVisionResult) onVisionResult(data);
      } catch (err) {
        console.error("[VISION] Analyze error:", err);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [active, sessionId, questionId]);

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
