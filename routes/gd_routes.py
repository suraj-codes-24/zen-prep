from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from core.dependencies import get_current_user
from core.logger import logger
from models.user import User
from services.gd_service import (
    start_gd_session,
    process_user_turn,
    process_bot_turn,
    finish_gd_session,
    get_gd_results,
    get_gd_history,
    get_gd_topics,
)
from services.gd_voice_service import score_gd_voice
from groq import Groq
import tempfile
import os

_gd_stt_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class StartGDRequest(BaseModel):
    topic_id:      int
    bot_count:     int = 3
    duration_mins: int = 10

router = APIRouter(prefix="/gd", tags=["Group Discussion"])

@router.get("/topics")
def list_topics(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return {"topics": get_gd_topics(db)}

@router.post("/start")
def start_session(
    body:         StartGDRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    try:
        return start_gd_session(db, current_user.id, body.topic_id, body.bot_count, body.duration_mins)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.post("/user-turn/{session_id}")
async def user_turn(
    session_id:  int,
    audio:       UploadFile = File(...),
    duration_sec: float     = Form(3.0),
    raised_hand:  bool      = Form(True),
    db:          Session    = Depends(get_db),
    current_user: User      = Depends(get_current_user),
):
    tmp_path = None
    try:
        contents = await audio.read()
        if len(contents) == 0:
            raise HTTPException(400, "Empty audio")

        _allowed_audio_exts = {".wav", ".mp3", ".webm", ".ogg", ".m4a", ".flac"}
        suffix = ".wav"
        if audio.filename and "." in audio.filename:
            ext = "." + audio.filename.rsplit(".", 1)[-1].lower()
            if ext in _allowed_audio_exts:
                suffix = ext

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Transcribe with Groq Cloud STT
        with open(tmp_path, "rb") as f:
            stt_resp = _gd_stt_client.audio.transcriptions.create(
                file=(os.path.basename(tmp_path), f, "audio/wav"),
                model="whisper-large-v3-turbo", 
                language="en",
            )
        transcript = stt_resp.text.strip()

        if not transcript:
            transcript = "[inaudible]"

        # Lightweight GD voice scoring (4 features) - segments set to None for Groq
        voice_data = score_gd_voice(transcript, duration_sec, whisper_segments=None)

        return process_user_turn(
            db, session_id, current_user.id,
            transcript, duration_sec, raised_hand,
            voice_data=voice_data,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error("GD user-turn failed: %s", e)
        raise HTTPException(500, "Turn processing failed. Please try again.")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/bot-turn/{session_id}")
def bot_turn(
    session_id:   int,
    bot_name:     str     = Form(...),
    gd_phase:     str     = Form("discussion"),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    try:
        return process_bot_turn(db, session_id, current_user.id, bot_name, gd_phase)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error("GD bot-turn failed: %s", e)
        raise HTTPException(500, "Bot turn failed.")


@router.post("/finish/{session_id}")
def finish_session(
    session_id:  int,
    db:          Session = Depends(get_db),
    current_user: User   = Depends(get_current_user),
):
    try:
        return finish_gd_session(db, session_id, current_user.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error("GD finish failed: %s", e)
        raise HTTPException(500, "Session completion failed.")


@router.get("/results/{session_id}")
def results(
    session_id:  int,
    db:          Session = Depends(get_db),
    current_user: User   = Depends(get_current_user),
):
    try:
        return get_gd_results(db, session_id, current_user.id)
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/history")
def history(
    db:          Session = Depends(get_db),
    current_user: User   = Depends(get_current_user),
):
    return {"history": get_gd_history(db, current_user.id)}
