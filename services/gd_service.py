"""
GD Session Service — orchestrates session lifecycle, turn management, AI coaching.
"""
import json
from datetime import datetime
from sqlalchemy.orm import Session

from models.gd import GDSession, GDTopic, GDTurn, GDScore
from services.gd_bot_service import get_bots_for_count, get_bot_response, get_phase, BOT_PERSONALITIES
from services.gd_eval_service import (
    compute_scores,
    get_performance_band,
    extract_content_keywords,
    extract_arguments,
    score_relevance,
    analyze_sentiment,
    compute_participation_intelligence,
)
from services.ollama_utils import generate, extract_json_object


def start_gd_session(db: Session, user_id: int, topic_id: int, bot_count: int, duration_mins: int) -> dict:
    topic = db.query(GDTopic).filter(GDTopic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")

    bot_count     = max(3, min(5, bot_count))
    duration_mins = max(5, min(10, duration_mins))

    session = GDSession(
        user_id=user_id,
        topic_id=topic_id,
        bot_count=bot_count,
        duration_mins=duration_mins,
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    bots = get_bots_for_count(bot_count)
    bot_info = [
        {"name": n, "role": BOT_PERSONALITIES[n]["role"], "color": BOT_PERSONALITIES[n]["color"]}
        for n in bots
    ]

    # Alex (Initiator) always opens; pass difficulty for context-aware prompt
    opener = get_bot_response("Alex", topic.title, [], "early", difficulty=topic.difficulty)
    db.add(GDTurn(session_id=session.id, speaker="Alex", text=opener, duration_sec=5.0, raised_hand=False))
    db.commit()

    return {
        "session_id":    session.id,
        "topic":         {
            "id": topic.id, "title": topic.title,
            "category": topic.category, "description": topic.description,
            "difficulty": topic.difficulty,
        },
        "bots":          bot_info,
        "duration_mins": duration_mins,
        "opening_bot":   "Alex",
        "opening_text":  opener,
    }


def process_user_turn(
    db: Session, session_id: int, user_id: int,
    transcript: str, duration_sec: float, raised_hand: bool,
    voice_data: dict = None,
) -> dict:
    session = db.query(GDSession).filter(
        GDSession.id == session_id, GDSession.user_id == user_id
    ).first()
    if not session or session.status != "active":
        raise ValueError("Session not found or not active")

    # Build user turn with optional voice scores
    effective_text = transcript.strip() if transcript and transcript.strip() else "[user did not speak]"
    user_turn = GDTurn(
        session_id=session_id, speaker="user",
        text=effective_text, duration_sec=duration_sec, raised_hand=raised_hand,
    )
    if voice_data:
        user_turn.voice_pace         = voice_data.get("pace")
        user_turn.voice_filler_count = voice_data.get("filler_count")
        user_turn.voice_pause_avg    = voice_data.get("pause_avg")
        user_turn.voice_clarity      = voice_data.get("clarity")
        user_turn.voice_score        = voice_data.get("voice_score")
    db.add(user_turn)
    db.commit()

    all_turns = (
        db.query(GDTurn)
        .filter(GDTurn.session_id == session_id)
        .order_by(GDTurn.timestamp)
        .all()
    )

    return {
        "user_transcript": transcript,
        "turn_count":      len(all_turns) + 1,
        "voice_score":     voice_data.get("voice_score") if voice_data else None,
    }


def process_bot_turn(db: Session, session_id: int, user_id: int, bot_name: str, gd_phase: str = "discussion") -> dict:
    session = db.query(GDSession).filter(
        GDSession.id == session_id, GDSession.user_id == user_id
    ).first()
    if not session or session.status != "active":
        raise ValueError("Session not found or not active")

    all_turns = (
        db.query(GDTurn)
        .filter(GDTurn.session_id == session_id)
        .order_by(GDTurn.timestamp)
        .all()
    )
    turns_data = [
        {"speaker": t.speaker, "text": t.text, "duration_sec": t.duration_sec or 3.0, "raised_hand": t.raised_hand}
        for t in all_turns
    ]

    # Use frontend-provided phase when available; fall back to elapsed-time calc
    if gd_phase in ("opening", "discussion", "summary", "closing"):
        phase = gd_phase
    else:
        elapsed = (datetime.utcnow() - session.started_at).total_seconds()
        phase   = get_phase(int(elapsed), session.duration_mins * 60)
    last_user_text = next((t.text for t in reversed(all_turns) if t.speaker == "user"), "")

    bot_text = get_bot_response(
        bot_name, session.topic.title, turns_data, phase,
        difficulty=session.topic.difficulty, last_user_text=last_user_text,
    )

    db.add(GDTurn(
        session_id=session_id, speaker=bot_name,
        text=bot_text, duration_sec=4.0, raised_hand=False,
    ))
    db.commit()

    return {
        "bot_name":  bot_name,
        "bot_text":  bot_text,
        "bot_color": BOT_PERSONALITIES[bot_name]["color"],
    }


def finish_gd_session(db: Session, session_id: int, user_id: int) -> dict:
    session = db.query(GDSession).filter(
        GDSession.id == session_id, GDSession.user_id == user_id
    ).first()
    if not session:
        raise ValueError("Session not found")

    session.status   = "completed"
    session.ended_at = datetime.utcnow()

    all_turns = (
        db.query(GDTurn)
        .filter(GDTurn.session_id == session_id)
        .order_by(GDTurn.timestamp)
        .all()
    )
    turns_data = [
        {"speaker": t.speaker, "text": t.text, "duration_sec": t.duration_sec or 3.0, "raised_hand": t.raised_hand}
        for t in all_turns
    ]

    scores          = compute_scores(turns_data, difficulty=session.topic.difficulty)
    coaching        = _generate_coaching(turns_data, session.topic.title, scores)
    participation_i = compute_participation_intelligence(turns_data)

    # Content analysis
    user_text   = " ".join(t["text"] for t in turns_data if t["speaker"] == "user" and t["text"] != "[user did not speak]")
    keywords    = extract_content_keywords(turns_data)
    arguments   = extract_arguments(user_text, session.topic.title)
    relevance   = score_relevance(user_text, session.topic.title, session.topic.description or "")
    sentiment   = analyze_sentiment(user_text)

    # Voice aggregate from stored turns
    user_turns_db = [t for t in all_turns if t.speaker == "user" and t.voice_score is not None]
    avg_voice = None
    if user_turns_db:
        avg_voice = round(sum(t.voice_score for t in user_turns_db) / len(user_turns_db), 1)

    existing  = db.query(GDScore).filter(GDScore.session_id == session_id).first()
    score_obj = existing or GDScore(session_id=session_id)
    if not existing:
        db.add(score_obj)

    score_obj.participation    = scores["participation"]
    score_obj.leadership       = scores["leadership"]
    score_obj.listening        = scores["listening"]
    score_obj.idea_quality     = scores["idea_quality"]
    score_obj.teamwork         = scores["teamwork"]
    score_obj.arguments_count  = scores["arguments_count"]
    score_obj.interjections    = scores["interjections"]
    score_obj.questions_asked  = scores["questions_asked"]
    score_obj.ai_strengths     = coaching.get("strengths", "")
    score_obj.ai_growth        = coaching.get("growth", "")
    score_obj.ai_action_items  = coaching.get("action_items", "")
    score_obj.avg_voice_score  = avg_voice
    score_obj.content_keywords = json.dumps(keywords)
    score_obj.content_arguments= json.dumps(arguments)
    score_obj.relevance_score  = relevance
    score_obj.sentiment_tone   = sentiment.get("tone")
    score_obj.sentiment_polarity = sentiment.get("sentiment")
    score_obj.confidence_level = sentiment.get("confidence_level")
    score_obj.dominance_ratio  = participation_i.get("dominance_ratio")
    score_obj.interruption_rate= participation_i.get("interruption_rate")
    score_obj.engagement_style = participation_i.get("engagement_style")

    session.overall_score = scores["overall_score"]
    db.commit()

    return {
        "session_id":    session_id,
        "overall_score": scores["overall_score"],
        "band":          get_performance_band(scores["overall_score"]),
        "scores":        scores,
        "coaching":      coaching,
        "content_analysis": {
            "keywords":      keywords,
            "arguments":     arguments,
            "relevance_score": relevance,
        },
        "sentiment":           sentiment,
        "participation_intelligence": participation_i,
        "avg_voice_score":     avg_voice,
        "topic": {"title": session.topic.title, "category": session.topic.category},
    }


def get_gd_results(db: Session, session_id: int, user_id: int) -> dict:
    session = db.query(GDSession).filter(
        GDSession.id == session_id, GDSession.user_id == user_id
    ).first()
    if not session:
        raise ValueError("Session not found")

    score_obj = db.query(GDScore).filter(GDScore.session_id == session_id).first()
    turns     = db.query(GDTurn).filter(GDTurn.session_id == session_id).order_by(GDTurn.timestamp).all()

    scores_dict = {}
    coaching    = {}
    content_analysis   = {}
    sentiment          = {}
    participation_intel= {}

    if score_obj:
        scores_dict = {
            "participation":   score_obj.participation,
            "leadership":      score_obj.leadership,
            "listening":       score_obj.listening,
            "idea_quality":    score_obj.idea_quality,
            "teamwork":        score_obj.teamwork,
            "arguments_count": score_obj.arguments_count,
            "interjections":   score_obj.interjections,
            "questions_asked": score_obj.questions_asked,
        }
        coaching = {
            "strengths":    score_obj.ai_strengths or "",
            "growth":       score_obj.ai_growth or "",
            "action_items": score_obj.ai_action_items or "",
        }
        content_analysis = {
            "keywords":       json.loads(score_obj.content_keywords or "[]"),
            "arguments":      json.loads(score_obj.content_arguments or "[]"),
            "relevance_score": score_obj.relevance_score or 0,
        }
        sentiment = {
            "tone":             score_obj.sentiment_tone or "neutral",
            "sentiment":        score_obj.sentiment_polarity or "neutral",
            "confidence_level": score_obj.confidence_level or "medium",
        }
        participation_intel = {
            "dominance_ratio":   score_obj.dominance_ratio or 0,
            "interruption_rate": score_obj.interruption_rate or 0,
            "engagement_style":  score_obj.engagement_style or "Balanced",
        }

    return {
        "session_id":    session_id,
        "topic":         {"title": session.topic.title, "category": session.topic.category},
        "bot_count":     session.bot_count,
        "duration_mins": session.duration_mins,
        "overall_score": session.overall_score or 0,
        "band":          get_performance_band(session.overall_score or 0),
        "scores":        scores_dict,
        "coaching":      coaching,
        "content_analysis":           content_analysis,
        "sentiment":                  sentiment,
        "participation_intelligence": participation_intel,
        "avg_voice_score":            score_obj.avg_voice_score if score_obj else None,
        "transcript": [
            {
                "speaker":     t.speaker,
                "text":        t.text,
                "timestamp":   t.timestamp.isoformat(),
                "raised_hand": t.raised_hand,
                "voice_score": t.voice_score,
            }
            for t in turns
        ],
        "started_at": session.started_at.isoformat(),
        "ended_at":   session.ended_at.isoformat() if session.ended_at else None,
    }


def get_gd_history(db: Session, user_id: int) -> list:
    sessions = (
        db.query(GDSession)
        .filter(GDSession.user_id == user_id, GDSession.status == "completed")
        .order_by(GDSession.started_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "session_id":    s.id,
            "topic":         s.topic.title if s.topic else "Unknown",
            "category":      s.topic.category if s.topic else "",
            "bot_count":     s.bot_count,
            "overall_score": s.overall_score or 0,
            "band":          get_performance_band(s.overall_score or 0),
            "date":          s.started_at.isoformat(),
        }
        for s in sessions
    ]


def get_gd_topics(db: Session) -> list:
    topics = db.query(GDTopic).order_by(GDTopic.category, GDTopic.id).all()
    return [
        {"id": t.id, "title": t.title, "category": t.category,
         "difficulty": t.difficulty, "description": t.description}
        for t in topics
    ]


# ── Private ──────────────────────────────────────────────────────────────────

def _generate_coaching(turns_data: list, topic: str, scores: dict) -> dict:
    user_text = " ".join(t["text"] for t in turns_data if t["speaker"] == "user" and t["text"] != "[user did not speak]")[:500]
    prompt = (
        f'A student participated in a group discussion on: "{topic}"\n'
        f'Scores: Participation={scores["participation"]:.0f}%, '
        f'Leadership={scores["leadership"]:.0f}%, '
        f'Listening={scores["listening"]:.0f}%, '
        f'Idea Quality={scores["idea_quality"]:.0f}%, '
        f'Teamwork={scores["teamwork"]:.0f}%\n'
        f'Their contributions: "{user_text}"\n\n'
        'Provide coaching in this exact JSON:\n'
        '{"strengths": "2-3 specific strengths observed", '
        '"growth": "2 concrete areas for improvement", '
        '"action_items": "1. first action 2. second action 3. third action"}'
    )
    raw    = generate(prompt, temperature=0.4, max_tokens=250)
    parsed = extract_json_object(raw) if raw else None
    if parsed:
        return {
            "strengths":    parsed.get("strengths", "Showed active participation in the discussion."),
            "growth":       parsed.get("growth",    "Work on building more structured arguments."),
            "action_items": parsed.get("action_items", "1. Practice timed speaking. 2. Study current affairs. 3. Work on active listening."),
        }
    return {
        "strengths":    "Showed active participation in the discussion.",
        "growth":       "Work on building more structured arguments.",
        "action_items": "1. Practice timed speaking. 2. Study current affairs. 3. Work on active listening.",
    }
