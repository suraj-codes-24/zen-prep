"""
Tracks which questions have been asked in a session and retrieves
the last answer score for adaptive difficulty.
"""
from sqlalchemy.orm import Session
from models.answer import Answer


def get_used_question_ids(db: Session, session_id: int) -> list[int]:
    """Return IDs of questions already asked in this session."""
    rows = db.query(Answer.question_id).filter(
        Answer.session_id == session_id
    ).all()
    return [r[0] for r in rows]


def get_last_score(db: Session, session_id: int) -> float | None:
    """Return the total_score of the most recent answer in this session."""
    last = (
        db.query(Answer.total_score)
        .filter(Answer.session_id == session_id)
        .order_by(Answer.id.desc())
        .first()
    )
    return last[0] if last else None
