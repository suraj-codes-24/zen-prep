from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from ai_engine.vision_engine import analyze_frame as analyze_vision_frame
from core.dependencies import get_current_user
from core.logger import logger
from models.user import User

router = APIRouter(prefix="/api/vision", tags=["Vision"])

class VisionFrameRequest(BaseModel):
    image: str = Field(..., max_length=2_000_000)  # ~1.5 MB base64 limit
    session_id: int
    question_id: int

@router.post("/analyze")
async def analyze_frame_endpoint(
    request: VisionFrameRequest,
    current_user: User = Depends(get_current_user),
):
    """Analyze a single frame for facial metrics."""
    try:
        results = analyze_vision_frame(request.image)
        return results
    except Exception as e:
        logger.error("Vision analysis failed: %s", e)
        raise HTTPException(status_code=500, detail="Vision analysis failed. Please try again.")
