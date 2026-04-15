from sqlalchemy.orm import Session

from models.answer import Answer
from models.question import Question
from models.interview_session import InterviewSession
from ai_engine.nlp_engine import evaluate_answer
from ai_engine.hr_engine import evaluate_hr_answer
from core.logger import logger


def submit_and_score_answer(
    db: Session,
    session_id: int,
    question_id: int,
    user_answer: str,
    user_id: int,
    voice_score: float = 0.0,
    face_score: float = 0.0
) -> dict:

    # --- Validate session ---
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id
    ).first()
    if not session:
        return {"error": "Session not found or does not belong to you."}

    # --- Validate question ---
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        return {"error": "Question not found."}

    # --- Prevent duplicate answers ---
    existing = db.query(Answer).filter(
        Answer.session_id == session_id,
        Answer.question_id == question_id,
    ).first()
    if existing:
        return {"error": "This question has already been answered in this session."}

    # --- Validate question belongs to session's subject ---
    if question.subject_id and session.subject_id:
        if question.subject_id != session.subject_id:
            return {"error": "Question does not belong to this session's subject."}

    # --- Route to correct engine ---
    if question.type == "hr":
        try:
            result = evaluate_hr_answer(question.question_text, user_answer)
            nlp_score = result["hr_score"]
        except Exception as e:
            logger.error("HR engine failed for question %d: %s", question_id, e)
            nlp_score = 50.0
            result = {"hr_score": 50, "feedback": "AI engine unavailable — default score applied."}

        # HR: 50% LLM + 30% Voice + 20% Face
        total_score = (nlp_score * 0.5) + (voice_score * 0.3) + (face_score * 0.2)

        semantic_score  = result.get("clarity", 0.0)
        keyword_score   = result.get("structure", 0.0)
        depth_score     = 0.0
        structure_score = result.get("communication", 0.0)
        feedback        = result.get("feedback", "")
        engine_used     = "hr"

    else:
        try:
            result = evaluate_answer(user_answer, question.ideal_answer, question.question_text)
            nlp_score = result["overall_score"]
        except Exception as e:
            logger.error("NLP engine failed for question %d: %s", question_id, e)
            nlp_score = 50.0
            result = {"overall_score": 50, "feedback": "NLP engine error — default score applied."}

        # Technical: 70% NLP + 20% Voice + 10% Face
        total_score = (nlp_score * 0.7) + (voice_score * 0.2) + (face_score * 0.1)

        semantic_score  = result.get("semantic_score", 0.0)
        keyword_score   = result.get("keyword_score", 0.0)
        depth_score     = result.get("depth_score", 0.0)
        structure_score = result.get("structure_score", 0.0)
        feedback        = result.get("feedback", "")
        engine_used     = "nlp"

    total_score = round(total_score, 1)

    # --- Save answer with full breakdown ---
    answer = Answer(
        session_id      = session_id,
        question_id     = question_id,
        user_answer     = user_answer,
        semantic_score  = round(float(semantic_score), 2),
        keyword_score   = round(float(keyword_score), 2),
        depth_score     = round(float(depth_score), 2),
        structure_score = round(float(structure_score), 2),
        nlp_score       = round(float(nlp_score), 2),
        voice_score     = round(float(voice_score), 2),
        face_score      = round(float(face_score), 2),
        total_score     = total_score,
        feedback        = feedback,
    )
    db.add(answer)

    # --- Update session stats ---
    session.questions_answered = (session.questions_answered or 0) + 1

    db.commit()
    db.refresh(answer)

    return {
        "answer_id":      answer.id,
        "session_id":     session_id,
        "question_id":    question_id,
        "user_answer":    user_answer,
        "semantic_score": answer.semantic_score,
        "keyword_score":  answer.keyword_score,
        "depth_score":    answer.depth_score,
        "structure_score":answer.structure_score,
        "nlp_score":      answer.nlp_score,
        "voice_score":    answer.voice_score,
        "face_score":     answer.face_score,
        "total_score":    answer.total_score,
        "feedback":       answer.feedback,
        "engine":         engine_used,
    }
