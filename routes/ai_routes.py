from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from services.followup_service import generate_followup
from services.session_feedback_service import generate_session_feedback
from typing import List

router = APIRouter(tags=["AI"])


class FollowupRequest(BaseModel):
    question_text: str
    user_answer: str
    session_id: int


class FollowupResponse(BaseModel):
    followup_question: str


@router.post("/followup", response_model=FollowupResponse)
def get_followup(
    data: FollowupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a follow-up question for a weak answer using Ollama."""
    question = generate_followup(
        question_text=data.question_text,
        user_answer=data.user_answer,
    )
    return {"followup_question": question}


class SessionAnswerItem(BaseModel):
    question: str
    answer: str
    score: float


class SessionFeedbackRequest(BaseModel):
    answers: List[SessionAnswerItem]


@router.post("/session-feedback")
def get_session_feedback(
    data: SessionFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI coaching summary for a completed interview session."""
    answers_dicts = [{"question": a.question, "answer": a.answer, "score": a.score} for a in data.answers]
    feedback = generate_session_feedback(answers_dicts)
    return feedback
