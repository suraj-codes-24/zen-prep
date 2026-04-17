from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from models.interview_session import InterviewSession
from models.answer import Answer
from models.question import Question
from schemas.interview_schema import (
    SubjectResponse,
    StartInterviewRequest,
    StartInterviewResponse,
    QuestionResponse,
    QuestionListItem,
)
from services.interview_service import (
    get_subjects,
    get_topics,
    get_subtopics,
    get_questions_list,
    create_session,
    get_random_question,
    seed_questions,
)

router = APIRouter(prefix="/interview", tags=["Interview"])


# ── Hierarchy endpoints ──────────────────────────────────────────────────────

@router.get("/subjects", response_model=List[SubjectResponse])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all subjects with topic and question counts."""
    return get_subjects(db)


@router.get("/topics")
def list_topics(
    subject_id: int = Query(..., description="Subject ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all topics for a subject."""
    return get_topics(db, subject_id)


@router.get("/subtopics")
def list_subtopics(
    topic_id: int = Query(..., description="Topic ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all subtopics for a topic."""
    return get_subtopics(db, topic_id)


@router.get("/questions")
def list_questions(
    subject_id: Optional[int] = Query(None),
    topic_id: Optional[int] = Query(None),
    subtopic_id: Optional[int] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get filtered question list."""
    return get_questions_list(db, subject_id, topic_id, subtopic_id, difficulty)


# ── Interview flow ───────────────────────────────────────────────────────────

@router.post("/start", response_model=StartInterviewResponse)
def start_interview(
    body: StartInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new interview session."""
    from models.subject import Subject

    subject = db.query(Subject).filter(Subject.id == body.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    session = create_session(
        db=db,
        user_id=current_user.id,
        interview_type=body.interview_type,
        subject_id=body.subject_id,
        difficulty=body.difficulty,
        topic_id=body.topic_id,
        subtopic_id=body.subtopic_id,
    )

    topic_name = None
    if session.topic_id:
        from models.topic import Topic
        topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
        topic_name = topic.name if topic else None

    return StartInterviewResponse(
        session_id=session.id,
        interview_type=session.interview_type,
        subject_name=subject.name,
        topic_name=topic_name,
        difficulty=session.difficulty,
        start_time=session.start_time,
        message=f"Interview started! Subject: {subject.name} | Difficulty: {session.difficulty}",
    )


@router.get("/question", response_model=QuestionResponse)
def get_question(
    subject_id: int = Query(...),
    difficulty: str = Query(...),
    topic_id: Optional[int] = Query(None),
    subtopic_id: Optional[int] = Query(None),
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a random question — adaptive difficulty, no repeats."""
    question = get_random_question(
        db=db,
        subject_id=subject_id,
        difficulty=difficulty,
        topic_id=topic_id,
        subtopic_id=subtopic_id,
        session_id=session_id,
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="No more questions available for this session.",
        )

    return QuestionResponse(
        question_id=question.id,
        title=question.title,
        question_text=question.question_text,
        type=question.type,
        subject_name=question.subject.name,
        topic_name=question.topic.name,
        subtopic_name=question.subtopic.name,
        difficulty=question.difficulty,
    )


@router.post("/skip")
def skip_question(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Skip a question. Max 2 skips per session."""
    MAX_SKIPS = 2
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if (session.skips_used or 0) >= MAX_SKIPS:
        raise HTTPException(status_code=400, detail="No skips remaining.")
    session.skips_used = (session.skips_used or 0) + 1
    db.commit()
    return {"skips_used": session.skips_used, "skips_remaining": MAX_SKIPS - session.skips_used}


class FinishSessionRequest(BaseModel):
    session_id: int


@router.post("/finish")
def finish_interview(
    body: FinishSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an interview session as completed — sets end_time, final_score, status."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == body.session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Calculate final score from answers
    answers = db.query(Answer).filter(Answer.session_id == session.id).all()
    if answers:
        scores = [a.total_score or 0 for a in answers]
        session.final_score = round(sum(scores) / len(scores), 1)
        session.status = "completed"
    else:
        session.final_score = None
        session.status = "abandoned"
    session.end_time = datetime.utcnow()
    session.questions_answered = len(answers)
    db.commit()

    return {
        "session_id": session.id,
        "status": session.status,
        "questions_answered": session.questions_answered,
        "final_score": session.final_score,
        "end_time": session.end_time.isoformat() if session.end_time else None,
    }


@router.post("/seed-questions")
def seed_db_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Seed the full Subject → Topic → Subtopic → Question hierarchy. Admin only."""
    import os
    admin_emails = {e.strip() for e in os.getenv("ADMIN_EMAILS", "suraj@test.com").split(",")}
    if current_user.email not in admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required.")
    result = seed_questions(db)
    return result


# ── Replay endpoints ─────────────────────────────────────────────────────────

@router.get("/active")
def active_interview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if user has an active (in-progress) interview session."""
    from models.subject import Subject

    session = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "active",
    ).order_by(InterviewSession.start_time.desc()).first()

    if not session:
        return {"active": False}

    subject = db.query(Subject).filter(Subject.id == session.subject_id).first()
    answers = db.query(Answer).filter(Answer.session_id == session.id).all()

    return {
        "active": True,
        "session_id": session.id,
        "subject_id": session.subject_id,
        "subject_name": subject.name if subject else "Unknown",
        "topic_id": session.topic_id,
        "subtopic_id": session.subtopic_id,
        "difficulty": session.difficulty,
        "interview_type": session.interview_type,
        "questions_answered": len(answers),
        "start_time": session.start_time.isoformat() if session.start_time else None,
    }


@router.get("/sessions")
def list_sessions(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List interview sessions for the logged-in user, newest first (max 200)."""
    from models.subject import Subject

    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.start_time.desc())
        .limit(limit)
        .all()
    )

    if not sessions:
        return []

    # Batch-load subjects and answers to avoid N+1
    subject_ids = list({s.subject_id for s in sessions if s.subject_id})
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all() if subject_ids else []
    subj_map = {s.id: s for s in subjects}

    session_ids = [s.id for s in sessions]
    all_answers = db.query(Answer).filter(Answer.session_id.in_(session_ids)).all()
    answers_by_session = {}
    for a in all_answers:
        answers_by_session.setdefault(a.session_id, []).append(a)

    result = []
    for s in sessions:
        score = s.final_score
        ans_count = s.questions_answered or 0
        if score is None:
            sess_answers = answers_by_session.get(s.id, [])
            ans_count = len(sess_answers)
            if sess_answers:
                score = round(sum(a.total_score or 0 for a in sess_answers) / len(sess_answers), 1)
        subject = subj_map.get(s.subject_id)
        result.append({
            "session_id":          s.id,
            "subject_id":          s.subject_id,
            "subject_name":        subject.name if subject else "Unknown",
            "difficulty":          s.difficulty,
            "total_questions":     s.total_questions or 0,
            "questions_answered":  ans_count,
            "start_time":          s.start_time.isoformat() if s.start_time else None,
            "end_time":            s.end_time.isoformat() if s.end_time else None,
            "final_score":         score,
            "status":              s.status or "active",
        })
    return result


@router.get("/sessions/{session_id}/answers")
def get_session_answers(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all answers for a session, joined with question text."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    answers = (
        db.query(Answer)
        .filter(Answer.session_id == session_id)
        .all()
    )

    # Batch-load questions to avoid N+1
    q_ids = list({a.question_id for a in answers})
    questions = db.query(Question).filter(Question.id.in_(q_ids)).all() if q_ids else []
    q_map = {q.id: q for q in questions}

    result = []
    for a in answers:
        question = q_map.get(a.question_id)
        result.append({
            "answer_id":     a.id,
            "question_text": question.question_text if question else "Unknown question",
            "user_answer":   (a.user_answer or "")[:500],
            "nlp_score":     a.nlp_score,
            "voice_score":   a.voice_score,
            "face_score":    a.face_score,
            "total_score":   a.total_score,
            "feedback":      a.feedback,
        })
    return result
