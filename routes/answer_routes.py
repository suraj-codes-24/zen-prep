from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from schemas.answer_schema import SubmitAnswerRequest, SubmitAnswerResponse
from services.evaluation_service import submit_and_score_answer

router = APIRouter(prefix="/interview", tags=["Answer & Scoring"])


@router.post("/answer", response_model=SubmitAnswerResponse)
def submit_answer(
    body: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an answer for a question.
    NLP engine scores it and saves result to DB.
    """

    if not body.user_answer or not body.user_answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    result = submit_and_score_answer(
        db=db,
        session_id=body.session_id,
        question_id=body.question_id,
        user_answer=body.user_answer,
        user_id=current_user.id,
        voice_score=body.voice_score,
        face_score=body.face_score
    )

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result
