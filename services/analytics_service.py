from sqlalchemy.orm import Session

from core.logger import logger
from models.answer import Answer
from models.coding import CodingSession, CodingSet
from models.communication import CommSession
from models.gd import GDScore, GDSession
from models.interview_session import InterviewSession
from models.question import Question
from models.subject import Subject
from models.topic import Topic
from services.gd_eval_service import get_performance_band


def get_user_analytics(db: Session, user_id: int) -> dict:
    """Full performance summary for the user."""

    all_interview_sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.start_time.desc())
        .all()
    )

    session_ids = [session.id for session in all_interview_sessions]
    all_answers = (
        db.query(Answer).filter(Answer.session_id.in_(session_ids)).all()
        if session_ids
        else []
    )

    answers_by_session = {}
    for answer in all_answers:
        answers_by_session.setdefault(answer.session_id, []).append(answer)

    # Ignore empty interview starts so they do not show up as real interviews.
    interview_sessions = [
        session
        for session in all_interview_sessions
        if (session.questions_answered or 0) > 0
        or bool(answers_by_session.get(session.id))
        or (session.final_score or 0) > 0
    ]
    tracked_session_ids = {session.id for session in interview_sessions}
    interview_answers = [
        answer for answer in all_answers if answer.session_id in tracked_session_ids
    ]

    question_ids = list({answer.question_id for answer in interview_answers})
    questions = (
        db.query(Question).filter(Question.id.in_(question_ids)).all()
        if question_ids
        else []
    )
    questions_map = {question.id: question for question in questions}

    subject_ids = list({question.subject_id for question in questions if question.subject_id})
    subjects = (
        db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
        if subject_ids
        else []
    )
    subjects_map = {subject.id: subject for subject in subjects}

    topic_ids = list({question.topic_id for question in questions if question.topic_id})
    topics = (
        db.query(Topic).filter(Topic.id.in_(topic_ids)).all()
        if topic_ids
        else []
    )
    topics_map = {topic.id: topic for topic in topics}

    total_answers = len(interview_answers)
    nlp_scores = [answer.nlp_score or 0.0 for answer in interview_answers]
    total_scores = [answer.total_score or 0.0 for answer in interview_answers]
    avg_nlp = round(sum(nlp_scores) / total_answers, 1) if total_answers else 0
    avg_total = round(sum(total_scores) / total_answers, 1) if total_answers else 0
    best_score = round(max(total_scores), 1) if total_scores else 0

    completed_sessions = sum(
        1 for session in interview_sessions if session.status == "completed"
    )
    completion_rate = (
        round((completed_sessions / len(interview_sessions)) * 100)
        if interview_sessions
        else 0
    )

    subject_scores = {}
    subject_counts = {}
    topic_scores = {}
    topic_counts = {}

    for answer in interview_answers:
        question = questions_map.get(answer.question_id)
        if not question:
            continue

        score = answer.total_score or 0.0

        subject = subjects_map.get(question.subject_id)
        if subject:
            name = subject.name
            subject_scores[name] = subject_scores.get(name, 0.0) + score
            subject_counts[name] = subject_counts.get(name, 0) + 1

        topic = topics_map.get(question.topic_id)
        if topic:
            name = topic.name
            topic_scores[name] = topic_scores.get(name, 0.0) + score
            topic_counts[name] = topic_counts.get(name, 0) + 1

    subject_averages = {
        name: round(subject_scores[name] / subject_counts[name], 1)
        for name in subject_scores
    }
    topic_averages = {
        name: round(topic_scores[name] / topic_counts[name], 1)
        for name in topic_scores
    }

    strongest_topic = (
        max(topic_averages, key=topic_averages.get) if topic_averages else "N/A"
    )
    weakest_topic = (
        min(topic_averages, key=topic_averages.get) if topic_averages else "N/A"
    )

    if avg_total >= 75:
        performance = "Excellent"
    elif avg_total >= 55:
        performance = "Good"
    elif avg_total >= 35:
        performance = "Average"
    else:
        performance = "Needs Improvement"

    recent_sessions = []
    for session in interview_sessions[:5]:
        session_answers = answers_by_session.get(session.id, [])
        answer_count = len(session_answers)
        avg_score = (
            round(
                sum(answer.total_score or 0 for answer in session_answers) / answer_count,
                1,
            )
            if session_answers
            else None
        )

        subject = subjects_map.get(session.subject_id)
        recent_sessions.append(
            {
                "session_id": session.id,
                "date": session.start_time.strftime("%b %d, %Y")
                if session.start_time
                else "-",
                "subject": subject.name if subject else "-",
                "difficulty": session.difficulty,
                "total_answered": session.questions_answered or answer_count,
                "avg_score": avg_score
                if avg_score is not None
                else (session.final_score or 0),
                "status": session.status or "active",
            }
        )

    comm_sessions = (
        db.query(CommSession)
        .filter(CommSession.user_id == user_id)
        .order_by(CommSession.start_time.desc())
        .all()
    )

    logger.info(
        "Communication sessions for user %s: %s sessions",
        user_id,
        len(comm_sessions),
    )
    for session in comm_sessions:
        logger.info(
            "  Session %s: status=%s, overall_score=%s, section_scores=%s",
            session.id,
            session.status,
            session.overall_score,
            session.section_scores,
        )

    comm_stats = {
        "tests_taken": len(comm_sessions),
        "best_score": 0,
        "latest_score": 0,
        "latest_band": "N/A",
        "section_averages": {},
    }
    if comm_sessions:
        completed_comm = [
            session for session in comm_sessions if session.status == "completed"
        ]
        logger.info("Completed communication sessions: %s", len(completed_comm))
        if completed_comm:
            comm_stats["best_score"] = round(
                max(session.overall_score or 0 for session in completed_comm), 1
            )
            comm_stats["latest_score"] = round(
                completed_comm[0].overall_score or 0, 1
            )
            comm_stats["latest_band"] = completed_comm[0].band or "N/A"
            if completed_comm[0].section_scores:
                comm_stats["section_averages"] = completed_comm[0].section_scores
                logger.info(
                    "Section averages: %s", comm_stats["section_averages"]
                )
            else:
                logger.warning("Latest completed session has no section_scores")

    coding_sessions = (
        db.query(CodingSession)
        .filter(CodingSession.user_id == user_id)
        .order_by(CodingSession.start_time.desc())
        .all()
    )

    coding_stats = {
        "total_sessions": len(coding_sessions),
        "completed_sessions": 0,
        "avg_score": 0,
        "best_score": 0,
        "company_breakdown": {},
        "recent_sessions": [],
    }
    if coding_sessions:
        coding_set_ids = list(
            {session.coding_set_id for session in coding_sessions if session.coding_set_id}
        )
        coding_sets = (
            db.query(CodingSet).filter(CodingSet.id.in_(coding_set_ids)).all()
            if coding_set_ids
            else []
        )
        coding_set_map = {coding_set.id: coding_set for coding_set in coding_sets}

        completed_coding = [
            session for session in coding_sessions if session.status == "completed"
        ]
        coding_stats["completed_sessions"] = len(completed_coding)
        scored_coding = [
            session for session in completed_coding if session.score is not None
        ]
        if scored_coding:
            coding_stats["avg_score"] = round(
                sum(session.score for session in scored_coding) / len(scored_coding), 1
            )
            coding_stats["best_score"] = round(
                max(session.score for session in scored_coding), 1
            )

        company_scores = {}
        company_counts = {}
        for session in scored_coding:
            coding_set = coding_set_map.get(session.coding_set_id)
            if not coding_set:
                continue
            company_scores[coding_set.company] = (
                company_scores.get(coding_set.company, 0) + session.score
            )
            company_counts[coding_set.company] = (
                company_counts.get(coding_set.company, 0) + 1
            )
        coding_stats["company_breakdown"] = {
            company: round(company_scores[company] / company_counts[company], 1)
            for company in company_scores
        }

        for session in coding_sessions[:5]:
            coding_set = coding_set_map.get(session.coding_set_id)
            coding_stats["recent_sessions"].append(
                {
                    "session_id": session.id,
                    "date": session.start_time.strftime("%b %d, %Y")
                    if session.start_time
                    else "-",
                    "company": coding_set.company if coding_set else "-",
                    "level": coding_set.level_number if coding_set else 0,
                    "topic": coding_set.topic if coding_set else "-",
                    "score": round(session.score, 1)
                    if session.score is not None
                    else None,
                    "status": session.status or "active",
                }
            )

    gd_sessions = (
        db.query(GDSession)
        .filter(GDSession.user_id == user_id, GDSession.status == "completed")
        .order_by(GDSession.started_at.desc())
        .all()
    )

    gd_stats = {
        "total_sessions": len(gd_sessions),
        "avg_score": 0.0,
        "best_score": 0.0,
        "latest_score": 0.0,
        "latest_band": "N/A",
        "dimension_averages": {
            "participation": 0.0,
            "leadership": 0.0,
            "listening": 0.0,
            "idea_quality": 0.0,
            "teamwork": 0.0,
        },
        "recent_sessions": [],
    }

    if gd_sessions:
        scored_gd = [
            session for session in gd_sessions if session.overall_score is not None
        ]
        if scored_gd:
            gd_stats["avg_score"] = round(
                sum(session.overall_score for session in scored_gd) / len(scored_gd), 1
            )
            gd_stats["best_score"] = round(
                max(session.overall_score for session in scored_gd), 1
            )
            gd_stats["latest_score"] = round(scored_gd[0].overall_score, 1)
            gd_stats["latest_band"] = get_performance_band(
                scored_gd[0].overall_score
            )

        gd_session_ids = [session.id for session in gd_sessions]
        gd_score_rows = (
            db.query(GDScore).filter(GDScore.session_id.in_(gd_session_ids)).all()
        )
        if gd_score_rows:
            for dimension in [
                "participation",
                "leadership",
                "listening",
                "idea_quality",
                "teamwork",
            ]:
                values = [
                    getattr(row, dimension)
                    for row in gd_score_rows
                    if getattr(row, dimension) is not None
                ]
                if values:
                    gd_stats["dimension_averages"][dimension] = round(
                        sum(values) / len(values), 1
                    )

        for session in gd_sessions[:5]:
            gd_stats["recent_sessions"].append(
                {
                    "session_id": session.id,
                    "date": session.started_at.strftime("%b %d, %Y"),
                    "topic": session.topic.title if session.topic else "-",
                    "category": session.topic.category if session.topic else "-",
                    "bot_count": session.bot_count,
                    "overall_score": round(session.overall_score, 1)
                    if session.overall_score is not None
                    else None,
                    "band": get_performance_band(session.overall_score or 0),
                }
            )

    return {
        "total_sessions": len(interview_sessions),
        "completed_sessions": completed_sessions,
        "completion_rate": completion_rate,
        "total_answers": total_answers,
        "avg_nlp_score": avg_nlp,
        "avg_total_score": avg_total,
        "best_score": best_score,
        "strongest_topic": strongest_topic,
        "weakest_topic": weakest_topic,
        "subject_breakdown": subject_averages,
        "topic_breakdown": topic_averages,
        "recent_sessions": recent_sessions,
        "performance": performance,
        "communication": comm_stats,
        "coding": coding_stats,
        "gd": gd_stats,
    }
