from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from ai_engine.voice_engine import analyze_voice
from core.dependencies import get_current_user
from models.user import User
from core.logger import logger
import tempfile
import os

router = APIRouter()

@router.post("/voice/analyze")
async def analyze_voice_answer(audio: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    tmp_path = None
    try:
        contents = await audio.read()
        logger.info("Voice upload: %d bytes | type: %s", len(contents), audio.content_type)

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file received")

        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Audio file too large. Max 50 MB.")

        _allowed_audio_exts = {".wav", ".mp3", ".webm", ".ogg", ".m4a", ".flac"}
        suffix = ".wav"
        if audio.filename and "." in audio.filename:
            ext = "." + audio.filename.rsplit(".", 1)[-1].lower()
            if ext in _allowed_audio_exts:
                suffix = ext

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        result = analyze_voice(tmp_path)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Voice analysis failed: %s", e)
        raise HTTPException(status_code=500, detail="Voice analysis failed. Please try again.")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)