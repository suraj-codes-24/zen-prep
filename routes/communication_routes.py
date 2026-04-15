from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, Request
from fastapi.responses import Response, StreamingResponse
from core.security import decode_token
from pydantic import BaseModel
from typing import Optional, Dict
from sqlalchemy.orm import Session
from database import get_db
from core.dependencies import get_current_user
from core.logger import logger
from models.user import User
from services.communication_service import (
    start_comm_session,
    get_next_question,
    submit_comm_answer,
    finish_comm_session,
    get_comm_results,
    get_comm_history,
    get_active_comm_session,
    SECTION_CONFIG,
    SECTION_ORDER,
)
import tempfile
import os


class StartCommRequest(BaseModel):
    section_counts: Optional[Dict[str, int]] = None

router = APIRouter(prefix="/comm", tags=["Communication"])


@router.get("/sections")
def list_sections(current_user: User = Depends(get_current_user)):
    """Return section metadata for the intro screen."""
    sections = []
    for s in SECTION_ORDER:
        cfg = SECTION_CONFIG[s]
        sections.append({
            "section": s,
            "name": cfg["name"],
            "count": cfg["count"],
            "time_limit": cfg["time_limit"],
        })
    return {"sections": sections, "total_questions": 70}


@router.post("/start")
def start_session(
    body: StartCommRequest = StartCommRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new communication test session with optional custom section counts."""
    return start_comm_session(db, current_user.id, body.section_counts)


@router.get("/question/{session_id}")
def next_question(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the next question for the session."""
    return get_next_question(db, session_id, current_user.id)


@router.post("/answer/{session_id}")
async def submit_answer(
    session_id: int,
    audio: UploadFile = File(...),
    question_id: int = Form(...),
    time_taken: float = Form(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit audio answer for scoring."""
    tmp_path = None
    try:
        contents = await audio.read()
        if len(contents) == 0:
            raise HTTPException(400, "Empty audio file")
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(413, "Audio file too large. Max 50 MB.")

        _allowed_audio_exts = {".wav", ".mp3", ".webm", ".ogg", ".m4a", ".flac"}
        suffix = ".wav"
        if audio.filename and "." in audio.filename:
            ext = "." + audio.filename.rsplit(".", 1)[-1].lower()
            if ext in _allowed_audio_exts:
                suffix = ext

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        return submit_comm_answer(
            db, session_id, current_user.id, question_id, tmp_path, time_taken
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Comm answer submission failed: %s", e)
        raise HTTPException(500, "Answer submission failed. Please try again.")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/finish/{session_id}")
def finish_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually finalize a communication test session."""
    return finish_comm_session(db, session_id, current_user.id)


@router.get("/results/{session_id}")
def results(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full results for a communication session."""
    return get_comm_results(db, session_id, current_user.id)


@router.get("/active")
def active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if user has an active (in-progress) communication session."""
    result = get_active_comm_session(db, current_user.id)
    if not result:
        return {"active": False}
    return {"active": True, **result}


@router.get("/history")
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's communication test history."""
    return get_comm_history(db, current_user.id)


TTS_VOICES = {
    # ── English Female — US ──────────────────────────────────────────────
    "nova":    {"edge_id": "en-US-JennyNeural",       "label": "Nova",    "gender": "Female", "accent": "US",  "desc": "Warm and friendly",      "rate": "+0%",  "pitch": "+0Hz"},
    "alloy":   {"edge_id": "en-US-AriaNeural",        "label": "Alloy",   "gender": "Female", "accent": "US",  "desc": "Clear and professional", "rate": "+0%",  "pitch": "+0Hz"},
    "claire":  {"edge_id": "en-US-MichelleNeural",    "label": "Claire",  "gender": "Female", "accent": "US",  "desc": "Bright and expressive",  "rate": "+0%",  "pitch": "+0Hz"},
    # ── English Female — UK ──────────────────────────────────────────────
    "fable":   {"edge_id": "en-GB-SoniaNeural",       "label": "Fable",   "gender": "Female", "accent": "UK",  "desc": "British and elegant",    "rate": "+0%",  "pitch": "+0Hz"},
    "libby":   {"edge_id": "en-GB-LibbyNeural",       "label": "Libby",   "gender": "Female", "accent": "UK",  "desc": "Friendly British",       "rate": "+0%",  "pitch": "+0Hz"},
    # ── English Female — AU ──────────────────────────────────────────────
    "sage":    {"edge_id": "en-AU-NatashaNeural",     "label": "Sage",    "gender": "Female", "accent": "AU",  "desc": "Australian and calm",    "rate": "+0%",  "pitch": "+0Hz"},
    # ── English Male — US ────────────────────────────────────────────────
    "echo":    {"edge_id": "en-US-GuyNeural",         "label": "Echo",    "gender": "Male",   "accent": "US",  "desc": "Deep and confident",     "rate": "+0%",  "pitch": "+0Hz"},
    "cole":    {"edge_id": "en-US-ChristopherNeural",  "label": "Cole",    "gender": "Male",   "accent": "US",  "desc": "Authoritative and sharp", "rate": "+0%", "pitch": "+0Hz"},
    # ── English Male — UK ────────────────────────────────────────────────
    "ryan":    {"edge_id": "en-GB-RyanNeural",        "label": "Ryan",    "gender": "Male",   "accent": "UK",  "desc": "British and composed",   "rate": "+0%",  "pitch": "+0Hz"},
    # ── English Male — AU ────────────────────────────────────────────────
    "liam":    {"edge_id": "en-AU-WilliamNeural",     "label": "Liam",    "gender": "Male",   "accent": "AU",  "desc": "Relaxed Australian",     "rate": "+0%",  "pitch": "+0Hz"},
}


@router.get("/voices")
def list_voices(current_user: User = Depends(get_current_user)):
    """List available TTS voices with metadata."""
    return [
        {"id": k, "label": v["label"], "gender": v["gender"], "accent": v["accent"], "desc": v["desc"]}
        for k, v in TTS_VOICES.items()
    ]


@router.get("/tts")
async def text_to_speech(
    request: Request,
    text: str = Query(..., max_length=1000),
    voice: str = Query("nova"),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Generate AI voice audio using Microsoft Edge TTS (neural voices).
    Accepts auth via Authorization header OR ?token= query param for streaming playback.
    """
    import edge_tts

    # Resolve token from query param or Authorization header
    raw_token = token
    if not raw_token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            raw_token = auth_header[7:]
    if not raw_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(raw_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    voice_info = TTS_VOICES.get(voice, TTS_VOICES["nova"])
    edge_voice = voice_info["edge_id"]
    voice_rate = voice_info.get("rate", "+0%")
    voice_pitch = voice_info.get("pitch", "+0Hz")

    # Auto-translate if voice has a "translate" flag (e.g. Aoi → Japanese)
    tts_text = text
    translate_lang = voice_info.get("translate")
    if translate_lang:
        from services.ollama_utils import generate
        lang_name = {"ja": "Japanese", "ko": "Korean", "fr": "French", "es": "Spanish", "de": "German", "hi": "Hindi"}.get(translate_lang, translate_lang)
        translated = generate(
            f"Translate the following English text to natural {lang_name}. "
            f"Return ONLY the {lang_name} translation, nothing else.\n\n{text}",
            temperature=0.1, max_tokens=500,
        )
        if translated:
            tts_text = translated

    # Prepend a comma pause to prevent edge-tts from clipping the first syllable
    tts_text = ", " + tts_text

    communicate = edge_tts.Communicate(tts_text, edge_voice, rate=voice_rate, pitch=voice_pitch)
    audio_bytes = b""
    try:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]
    except Exception:
        # Fallback to reliable default voice
        communicate = edge_tts.Communicate(tts_text, "en-US-GuyNeural", rate="+0%", pitch="+0Hz")
        audio_bytes = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]

    return Response(content=audio_bytes, media_type="audio/mpeg")
