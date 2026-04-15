import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from models.interview_session import InterviewSession
from models.answer import Answer
from models.question import Question
from services.session_feedback_service import generate_session_feedback
from services.report_service import generate_session_report, generate_comm_report, generate_gd_report
from models.communication import CommSession, CommAnswer
from services.gd_service import get_gd_results

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/session/{session_id}")
def download_session_report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and return a PDF report for a completed interview session."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Build answers list joined with question text
    raw_answers = db.query(Answer).filter(Answer.session_id == session_id).all()
    if not raw_answers:
        raise HTTPException(status_code=404, detail="No answers found for this session.")

    answers = []
    for a in raw_answers:
        q = db.query(Question).filter(Question.id == a.question_id).first()
        answers.append({
            "question_text": q.question_text if q else "Unknown question",
            "user_answer":   (a.user_answer or "")[:500],
            "nlp_score":     a.nlp_score   or 0,
            "voice_score":   a.voice_score or 0,
            "face_score":    a.face_score  or 0,
            "total_score":   a.total_score or 0,
            "feedback":      a.feedback    or "",
        })

    # AI coaching summary
    coaching_payload = [
        {"question": a["question_text"], "answer": a["user_answer"], "score": a["total_score"]}
        for a in answers
    ]
    coaching = generate_session_feedback(coaching_payload)

    # Subject name for the report header
    subject_name = "—"
    if session.subject_id:
        from models.subject import Subject
        subj = db.query(Subject).filter(Subject.id == session.subject_id).first()
        if subj:
            subject_name = subj.name

    session_dict = {
        "subject_name":       subject_name,
        "difficulty":         session.difficulty,
        "start_time":         session.start_time,
        "final_score":        session.final_score,
        "questions_answered": session.questions_answered,
    }

    pdf_bytes = generate_session_report(
        session=session_dict,
        answers=answers,
        coaching=coaching,
        candidate_name=current_user.name or "Candidate",
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="interview_report_{session_id}.pdf"'
        },
    )


@router.get("/comm/{session_id}")
def download_comm_report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and return a PDF report for a communication test session."""
    session = db.query(CommSession).filter(
        CommSession.id == session_id,
        CommSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Communication session not found.")

    answers = db.query(CommAnswer).filter(
        CommAnswer.session_id == session_id
    ).all()
    if not answers:
        raise HTTPException(status_code=404, detail="No answers found for this session.")

    # Build section details
    from services.communication_service import SECTION_CONFIG, SECTION_ORDER
    section_details = []
    for s in SECTION_ORDER:
        s_answers = [a for a in answers if a.section == s]
        if not s_answers:
            continue
        avg = round(sum(a.section_weighted_score or 0 for a in s_answers) / len(s_answers), 1)
        section_details.append({
            "section": s,
            "name": SECTION_CONFIG[s]["name"],
            "avg_score": avg,
            "answer_count": len(s_answers),
        })

    duration = None
    if session.start_time and session.end_time:
        duration = round((session.end_time - session.start_time).total_seconds() / 60, 1)

    session_dict = {
        "overall_score": session.overall_score or 0,
        "band": session.band or "N/A",
        "section_scores": session.section_scores or {},
        "start_time": session.start_time,
        "end_time": session.end_time,
        "questions_answered": session.questions_answered or 0,
        "duration_minutes": duration,
    }

    pdf_bytes = generate_comm_report(
        session=session_dict,
        section_details=section_details,
        candidate_name=current_user.name or "Candidate",
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="comm_report_{session_id}.pdf"'
        },
    )


@router.get("/gd/{session_id}")
def download_gd_report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and return a PDF report for a completed GD session."""
    try:
        results = get_gd_results(db, session_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="GD session not found.")

    pdf_bytes = generate_gd_report(results, candidate_name=current_user.name or "Candidate")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="gd_report_{session_id}.pdf"'
        },
    )
