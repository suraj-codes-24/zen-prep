from sqlalchemy.orm import Session

from models.answer import Answer
from models.interview_session import InterviewSession
from models.question import Question
from models.subject import Subject
from models.topic import Topic
from models.communication import CommSession
from models.coding import CodingSession, CodingSet
from models.gd import GDSession, GDScore
from services.gd_eval_service import get_performance_band


def get_user_analytics(db: Session, user_id: int) -> dict:
    """Full performance summary for the user."""

    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == user_id
    ).order_by(InterviewSession.start_time.desc()).all()

    if not sessions:
        return {
            "total_sessions": 0,
            "completed_sessions": 0,
            "completion_rate": 0,
            "total_answers": 0,
            "avg_nlp_score": 0,
            "avg_total_score": 0,
            "best_score": 0,
            "strongest_topic": "N/A",
            "weakest_topic": "N/A",
            "subject_breakdown": {},
            "topic_breakdown": {},
            "recent_sessions": [],
            "performance": "No data yet",
        }

    session_ids = [s.id for s in sessions]

    answers = db.query(Answer).filter(
        Answer.session_id.in_(session_ids)
    ).all()

    if not answers:
        return {
            "total_sessions": len(sessions),
            "completed_sessions": 0,
            "completion_rate": 0,
            "total_answers": 0,
            "avg_nlp_score": 0,
            "avg_total_score": 0,
            "best_score": 0,
            "strongest_topic": "N/A",
            "weakest_topic": "N/A",
            "subject_breakdown": {},
            "topic_breakdown": {},
            "recent_sessions": [],
            "performance": "No data yet",
        }

    # ── Batch-load questions, subjects, topics to avoid N+1 ──────────────
    question_ids = list({a.question_id for a in answers})
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
    questions_map = {q.id: q for q in questions}

    subject_ids = list({q.subject_id for q in questions if q.subject_id})
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
    subjects_map = {s.id: s for s in subjects}

    topic_ids = list({q.topic_id for q in questions if q.topic_id})
    topics = db.query(Topic).filter(Topic.id.in_(topic_ids)).all()
    topics_map = {t.id: t for t in topics}

    # ── Overall stats ─────────────────────────────────────────────────────
    total_answers = len(answers)
    nlp_scores    = [a.nlp_score or 0.0 for a in answers]
    total_scores  = [a.total_score or 0.0 for a in answers]
    avg_nlp       = round(sum(nlp_scores) / total_answers, 1)
    avg_total     = round(sum(total_scores) / total_answers, 1)
    best_score    = round(max(total_scores), 1)

    # ── Completion tracking ──────────────────────────────────────────────
    completed_sessions = sum(1 for s in sessions if s.status == "completed")
    completion_rate = round((completed_sessions / len(sessions)) * 100) if sessions else 0

    # ── Subject & topic breakdown (by total_score) ────────────────────────
    subject_scores = {}
    subject_counts = {}
    topic_scores   = {}
    topic_counts   = {}

    for answer in answers:
        question = questions_map.get(answer.question_id)
        if not question:
            continue

        score = answer.total_score or 0.0

        subject = subjects_map.get(question.subject_id)
        if subject:
            sname = subject.name
            subject_scores[sname] = subject_scores.get(sname, 0.0) + score
            subject_counts[sname] = subject_counts.get(sname, 0) + 1

        topic = topics_map.get(question.topic_id)
        if topic:
            tname = topic.name
            topic_scores[tname] = topic_scores.get(tname, 0.0) + score
            topic_counts[tname] = topic_counts.get(tname, 0) + 1

    subject_averages = {
        s: round(subject_scores[s] / subject_counts[s], 1) for s in subject_scores
    }
    topic_averages = {
        t: round(topic_scores[t] / topic_counts[t], 1) for t in topic_scores
    }

    strongest_topic = max(topic_averages, key=topic_averages.get) if topic_averages else "N/A"
    weakest_topic   = min(topic_averages, key=topic_averages.get) if topic_averages else "N/A"

    # ── Performance label ─────────────────────────────────────────────────
    if avg_total >= 75:
        performance = "Excellent"
    elif avg_total >= 55:
        performance = "Good"
    elif avg_total >= 35:
        performance = "Average"
    else:
        performance = "Needs Improvement"

    # ── Recent sessions (last 5) ──────────────────────────────────────────
    recent_sessions = []
    for session in sessions[:5]:
        sess_answers = [a for a in answers if a.session_id == session.id]
        ans_count = len(sess_answers)
        if sess_answers:
            avg_s = round(sum(a.total_score or 0 for a in sess_answers) / ans_count, 1)
        else:
            avg_s = None

        subject = subjects_map.get(session.subject_id)
        recent_sessions.append({
            "session_id":         session.id,
            "date":               session.start_time.strftime("%b %d, %Y") if session.start_time else "—",
            "subject":            subject.name if subject else "—",
            "difficulty":         session.difficulty,
            "total_answered":     session.questions_answered or ans_count,
            "avg_score":          avg_s if avg_s is not None else (session.final_score or 0),
            "status":             session.status or "active",
        })

    # ── Communication test stats ─────────────────────────────────────────
    comm_sessions = db.query(CommSession).filter(
        CommSession.user_id == user_id
    ).order_by(CommSession.start_time.desc()).all()

    logger.info(f"Communication sessions for user {user_id}: {len(comm_sessions)} sessions")
    for s in comm_sessions:
        logger.info(f"  Session {s.id}: status={s.status}, overall_score={s.overall_score}, section_scores={s.section_scores}")

    comm_stats = {
        "tests_taken": len(comm_sessions),
        "best_score": 0,
        "latest_score": 0,
        "latest_band": "N/A",
        "section_averages": {},
    }
    if comm_sessions:
        completed_comm = [s for s in comm_sessions if s.status == "completed"]
        logger.info(f"Completed communication sessions: {len(completed_comm)}")
        if completed_comm:
            comm_stats["best_score"] = round(max(s.overall_score or 0 for s in completed_comm), 1)
            comm_stats["latest_score"] = round(completed_comm[0].overall_score or 0, 1)
            comm_stats["latest_band"] = completed_comm[0].band or "N/A"
            if completed_comm[0].section_scores:
                comm_stats["section_averages"] = completed_comm[0].section_scores
                logger.info(f"Section averages: {comm_stats['section_averages']}")
            else:
                logger.warning(f"Latest completed session has no section_scores")

    # ── Coding stats ──────────────────────────────────────────────────────
    coding_sessions = db.query(CodingSession).filter(
        CodingSession.user_id == user_id
    ).order_by(CodingSession.start_time.desc()).all()

    coding_stats = {
        "total_sessions": len(coding_sessions),
        "completed_sessions": 0,
        "avg_score": 0,
        "best_score": 0,
        "company_breakdown": {},
        "recent_sessions": [],
    }
    if coding_sessions:
        # Batch-load coding sets to avoid N+1
        cs_ids = list({s.coding_set_id for s in coding_sessions if s.coding_set_id})
        coding_sets = db.query(CodingSet).filter(CodingSet.id.in_(cs_ids)).all() if cs_ids else []
        cs_map = {cs.id: cs for cs in coding_sets}

        completed_coding = [s for s in coding_sessions if s.status == "completed"]
        coding_stats["completed_sessions"] = len(completed_coding)
        scored = [s for s in completed_coding if s.score is not None]
        if scored:
            coding_stats["avg_score"] = round(sum(s.score for s in scored) / len(scored), 1)
            coding_stats["best_score"] = round(max(s.score for s in scored), 1)

        # Company breakdown
        company_scores = {}
        company_counts = {}
        for s in scored:
            cs = cs_map.get(s.coding_set_id)
            if cs:
                company_scores[cs.company] = company_scores.get(cs.company, 0) + s.score
                company_counts[cs.company] = company_counts.get(cs.company, 0) + 1
        coding_stats["company_breakdown"] = {
            c: round(company_scores[c] / company_counts[c], 1) for c in company_scores
        }

        # Recent coding sessions (last 5)
        for s in coding_sessions[:5]:
            cs = cs_map.get(s.coding_set_id)
            coding_stats["recent_sessions"].append({
                "session_id": s.id,
                "date": s.start_time.strftime("%b %d, %Y") if s.start_time else "—",
                "company": cs.company if cs else "—",
                "level": cs.level_number if cs else 0,
                "topic": cs.topic if cs else "—",
                "score": round(s.score, 1) if s.score is not None else None,
                "status": s.status or "active",
            })

    # ── GD stats ──────────────────────────────────────────────────────────────
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
            "leadership":    0.0,
            "listening":     0.0,
            "idea_quality":  0.0,
            "teamwork":      0.0,
        },
        "recent_sessions": [],
    }

    if gd_sessions:
        scored_gd = [s for s in gd_sessions if s.overall_score is not None]
        if scored_gd:
            gd_stats["avg_score"]    = round(sum(s.overall_score for s in scored_gd) / len(scored_gd), 1)
            gd_stats["best_score"]   = round(max(s.overall_score for s in scored_gd), 1)
            gd_stats["latest_score"] = round(scored_gd[0].overall_score, 1)
            gd_stats["latest_band"]  = get_performance_band(scored_gd[0].overall_score)

        # Dimension averages across all completed sessions with scores
        gd_session_ids = [s.id for s in gd_sessions]
        gd_score_rows  = db.query(GDScore).filter(GDScore.session_id.in_(gd_session_ids)).all()
        if gd_score_rows:
            dims = ["participation", "leadership", "listening", "idea_quality", "teamwork"]
            for dim in dims:
                vals = [getattr(r, dim) for r in gd_score_rows if getattr(r, dim) is not None]
                if vals:
                    gd_stats["dimension_averages"][dim] = round(sum(vals) / len(vals), 1)

        # Recent GD sessions (last 5)
        for s in gd_sessions[:5]:
            gd_stats["recent_sessions"].append({
                "session_id":    s.id,
                "date":          s.started_at.strftime("%b %d, %Y"),
                "topic":         s.topic.title if s.topic else "—",
                "category":      s.topic.category if s.topic else "—",
                "bot_count":     s.bot_count,
                "overall_score": round(s.overall_score, 1) if s.overall_score is not None else None,
                "band":          get_performance_band(s.overall_score or 0),
            })

    return {
        "total_sessions":      len(sessions),
        "completed_sessions":  completed_sessions,
        "completion_rate":     completion_rate,
        "total_answers":       total_answers,
        "avg_nlp_score":       avg_nlp,
        "avg_total_score":     avg_total,
        "best_score":          best_score,
        "strongest_topic":     strongest_topic,
        "weakest_topic":       weakest_topic,
        "subject_breakdown":   subject_averages,
        "topic_breakdown":     topic_averages,
        "recent_sessions":     recent_sessions,
        "performance":         performance,
        "communication":       comm_stats,
        "coding":              coding_stats,
        "gd":                  gd_stats,
    }
