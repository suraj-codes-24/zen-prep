"""
Communication test service — scoring, session orchestration, results.
Reuses voice_engine (fluency) and nlp_engine (semantic similarity).
"""
import difflib
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from models.communication import CommQuestion, CommSession, CommAnswer
from ai_engine.voice_engine import analyze_voice
from ai_engine.nlp_engine import calculate_semantic_similarity


# ── Section config ────────────────────────────────────────────────────────────

SECTION_CONFIG = {
    "A": {"name": "Read Sentences",          "count": 8,  "time_limit": 15},
    "B": {"name": "Repeat Sentences",         "count": 16, "time_limit": 15},
    "C": {"name": "Short Answer",             "count": 24, "time_limit": 10},
    "D": {"name": "Arrange Sentences",        "count": 10, "time_limit": 20},
    "E": {"name": "Story Retelling",          "count": 3,  "time_limit": 90},
    "F": {"name": "Open Questions",           "count": 2,  "time_limit": 45},
    "G": {"name": "Describe Image",           "count": 3,  "time_limit": 45},
    "H": {"name": "Listening Comprehension",  "count": 4,  "time_limit": 15},
}

SECTION_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"]

# Weights for final score (proportional to question count + importance)
SECTION_WEIGHTS = {
    "A": 0.08, "B": 0.16, "C": 0.20, "D": 0.12,
    "E": 0.15, "F": 0.10, "G": 0.09, "H": 0.10,
}

BAND_THRESHOLDS = [
    (90, "Fluent"),
    (75, "Advanced"),
    (60, "Proficient"),
    (45, "Developing"),
    (0,  "Beginner"),
]


def get_band(score: float) -> str:
    for threshold, label in BAND_THRESHOLDS:
        if score >= threshold:
            return label
    return "Beginner"


# ── Session management ────────────────────────────────────────────────────────

def start_comm_session(db: Session, user_id: int, section_counts: dict = None) -> dict:
    """Create a new communication test session with randomized questions."""
    question_ids = {}
    total = 0

    for section in SECTION_ORDER:
        cfg = SECTION_CONFIG[section]
        max_count = cfg["count"]

        # Use custom count if provided, clamp to [1, max_count]
        if section_counts and section in section_counts:
            count = max(1, min(int(section_counts[section]), max_count))
        else:
            count = max_count

        questions = db.query(CommQuestion.id).filter(
            CommQuestion.section == section
        ).order_by(func.random()).limit(count).all()

        ids = [q.id for q in questions]
        question_ids[section] = ids
        total += len(ids)

    session = CommSession(
        user_id=user_id,
        status="active",
        total_questions=total,
        questions_answered=0,
        current_section="A",
        current_index=0,
        question_ids=question_ids,
        section_scores={},
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    sections_info = []
    for s in SECTION_ORDER:
        cfg = SECTION_CONFIG[s]
        sections_info.append({
            "section": s,
            "name": cfg["name"],
            "count": len(question_ids.get(s, [])),
            "time_limit": cfg["time_limit"],
        })

    return {
        "session_id": session.id,
        "total_questions": total,
        "sections": sections_info,
    }


def get_next_question(db: Session, session_id: int, user_id: int) -> dict:
    """Return the next unanswered question for the session."""
    session = _get_session(db, session_id, user_id)

    if session.status == "completed":
        return {"done": True, "session_id": session_id}

    section = session.current_section
    index = session.current_index
    q_ids = session.question_ids or {}

    section_ids = q_ids.get(section, [])

    # If we've exhausted this section, move to the next
    while index >= len(section_ids):
        next_idx = SECTION_ORDER.index(section) + 1
        if next_idx >= len(SECTION_ORDER):
            return {"done": True, "session_id": session_id}
        section = SECTION_ORDER[next_idx]
        section_ids = q_ids.get(section, [])
        index = 0
        session.current_section = section
        session.current_index = 0
        db.commit()

    question_id = section_ids[index]
    question = db.query(CommQuestion).filter(CommQuestion.id == question_id).first()
    if not question:
        raise HTTPException(404, "Question not found")

    # Calculate progress
    answered = session.questions_answered
    total = session.total_questions
    section_total = len(section_ids)
    section_current = index + 1

    return {
        "question_id": question.id,
        "section": question.section,
        "section_name": question.section_name,
        "prompt_text": question.prompt_text,
        "ideal_answer": question.ideal_answer or "",
        "image_url": question.image_url,
        "audio_text": question.audio_text,
        "time_limit": question.time_limit,
        "progress": {
            "current": answered + 1,
            "total": total,
            "section_current": section_current,
            "section_total": section_total,
            "section": section,
            "section_name": SECTION_CONFIG[section]["name"],
        },
        "done": False,
    }


# ── Scoring functions ─────────────────────────────────────────────────────────

def calculate_fluency(voice_details: dict) -> float:
    """Enhanced comm-specific fluency using all 9 voice dimensions."""
    pace          = voice_details.get("pace", {}).get("score", 50)
    filler        = voice_details.get("filler_words", {}).get("score", 50)
    confidence    = voice_details.get("confidence", {}).get("confidence_score", 50)
    silence       = voice_details.get("silence", {}).get("score", 50)
    energy        = voice_details.get("energy", {}).get("score", 50)
    pronunciation = voice_details.get("pronunciation", {}).get("score", 70)
    intonation    = voice_details.get("intonation", {}).get("score", 60)
    modulation    = voice_details.get("modulation", {}).get("score", 60)
    rhythm        = voice_details.get("rhythm", {}).get("score", 60)
    stress        = voice_details.get("stress", {}).get("score", 65)

    return round(
        0.15 * pace          +
        0.15 * filler        +
        0.15 * pronunciation +
        0.12 * intonation    +
        0.10 * modulation    +
        0.10 * rhythm        +
        0.10 * stress        +
        0.08 * confidence    +
        0.05 * silence       +
        0.00 * energy,
        1
    )


def calculate_word_match(transcript: str, ideal: str) -> float:
    """Word-level match using difflib (sections B, D)."""
    if not transcript.strip() or not ideal.strip():
        return 0.0
    t_words = transcript.lower().split()
    i_words = ideal.lower().split()
    ratio = difflib.SequenceMatcher(None, t_words, i_words).ratio()
    return round(ratio * 100, 1)


def calculate_keyword_match(transcript: str, keywords_csv: str) -> float:
    """Keyword overlap for sections C, H. Keywords stored as comma-separated."""
    if not transcript.strip() or not keywords_csv.strip():
        return 0.0
    keywords = [kw.strip().lower() for kw in keywords_csv.split(",") if kw.strip()]
    transcript_lower = transcript.lower()
    found = sum(1 for kw in keywords if kw in transcript_lower)
    return round((found / max(len(keywords), 1)) * 100, 1)


def calculate_depth_simple(transcript: str) -> float:
    """Simple depth scoring for open-ended sections (F, G)."""
    if not transcript.strip():
        return 0.0
    words = transcript.split()
    word_count = len(words)
    sentences = max(1, transcript.count(".") + transcript.count("!") + transcript.count("?"))

    score = 0.0
    # Length component (up to 40 points)
    if word_count >= 50:
        score += 40
    elif word_count >= 30:
        score += 30
    elif word_count >= 15:
        score += 20
    elif word_count >= 5:
        score += 10

    # Sentence variety (up to 30 points)
    if sentences >= 4:
        score += 30
    elif sentences >= 2:
        score += 20
    elif sentences >= 1:
        score += 10

    # Detail indicators (up to 30 points)
    detail_markers = ["because", "for example", "such as", "which", "however",
                      "although", "therefore", "first", "second", "finally",
                      "in addition", "moreover", "specifically", "particularly"]
    found_markers = sum(1 for m in detail_markers if m in transcript.lower())
    score += min(30, found_markers * 10)

    return min(100.0, round(score, 1))


def score_section(section: str, fluency: float, pace: float = 0,
                  word_match: float = 0, keyword_match: float = 0,
                  sentence_match: float = 0, semantic: float = 0,
                  depth: float = 0, confidence: float = 0) -> float:
    """Apply per-section scoring formula."""
    if section == "A":
        return round(0.40 * word_match + 0.30 * pace + 0.30 * fluency, 1)
    if section == "B":
        return round(0.70 * word_match + 0.30 * fluency, 1)
    if section == "C":
        return round(0.80 * keyword_match + 0.20 * fluency, 1)
    if section == "D":
        return round(0.75 * sentence_match + 0.25 * fluency, 1)
    if section == "E":
        return round(0.60 * semantic + 0.40 * fluency, 1)
    if section == "F":
        return round(0.40 * fluency + 0.30 * depth + 0.30 * confidence, 1)
    if section == "G":
        return round(0.50 * depth + 0.30 * fluency + 0.20 * confidence, 1)
    if section == "H":
        return round(0.80 * keyword_match + 0.20 * fluency, 1)
    return fluency


def generate_feedback(section: str, score: float, transcript: str) -> str:
    """Generate brief feedback for a communication answer."""
    if not transcript or not transcript.strip():
        return "No speech detected. Try speaking clearly into the microphone."

    if score >= 85:
        quality = "Excellent"
    elif score >= 70:
        quality = "Good"
    elif score >= 50:
        quality = "Fair"
    else:
        quality = "Needs improvement"

    section_tips = {
        "A": "Focus on clear pronunciation and natural reading pace.",
        "B": "Try to match the original sentence as closely as possible.",
        "C": "Give a direct, concise answer to the question.",
        "D": "Speak the words in the correct grammatical order.",
        "E": "Include the main events and key details of the story.",
        "F": "Elaborate with examples and structure your response clearly.",
        "G": "Describe specific details, colors, actions, and spatial relationships.",
        "H": "Listen carefully and focus on the key information in the passage.",
    }

    tip = section_tips.get(section, "")
    return f"{quality} response. {tip}"


# ── Answer submission ─────────────────────────────────────────────────────────

def submit_comm_answer(db: Session, session_id: int, user_id: int,
                       question_id: int, audio_path: str,
                       time_taken: float = 0) -> dict:
    """Full pipeline: voice analysis -> content scoring -> save answer."""
    session = _get_session(db, session_id, user_id)
    if session.status != "active":
        raise HTTPException(400, "Session is not active")

    question = db.query(CommQuestion).filter(CommQuestion.id == question_id).first()
    if not question:
        raise HTTPException(404, "Question not found")

    # 1. Voice analysis
    voice_result = analyze_voice(audio_path)
    transcript = voice_result.get("transcript", "")
    details = voice_result.get("details", {})

    # 2. Extract voice sub-scores
    pace_sc = details.get("pace", {}).get("score", 50)
    filler_sc = details.get("filler_words", {}).get("score", 50)
    confidence_sc = details.get("confidence", {}).get("confidence_score", 50)
    silence_sc = details.get("silence", {}).get("score", 50)
    energy_sc = details.get("energy", {}).get("score", 50)
    pronunciation_sc = details.get("pronunciation", {}).get("score", 70)
    intonation_sc = details.get("intonation", {}).get("score", 60)
    modulation_sc = details.get("modulation", {}).get("score", 60)
    rhythm_sc = details.get("rhythm", {}).get("score", 60)
    stress_sc = details.get("stress", {}).get("score", 65)
    fluency = calculate_fluency(details)

    # 3. Section-specific content scoring
    word_match = 0.0
    keyword_match = 0.0
    sentence_match = 0.0
    semantic = 0.0
    depth = 0.0
    section = question.section
    ideal = question.ideal_answer or ""

    if section == "A":
        # Compare transcript to the sentence user was asked to read
        word_match = calculate_word_match(transcript, question.prompt_text or "")
    elif section == "B":
        word_match = calculate_word_match(transcript, ideal)
    elif section == "C":
        keyword_match = calculate_keyword_match(transcript, ideal)
    elif section == "D":
        sentence_match = calculate_word_match(transcript, ideal)
    elif section == "E":
        sim = calculate_semantic_similarity(transcript, ideal)
        semantic = round(sim * 100, 1)
    elif section == "F":
        depth = calculate_depth_simple(transcript)
    elif section == "G":
        depth = calculate_depth_simple(transcript)
        # Also check for image-related keywords
        if ideal:
            kw_bonus = calculate_keyword_match(transcript, ideal)
            depth = round(0.70 * depth + 0.30 * kw_bonus, 1)
    elif section == "H":
        keyword_match = calculate_keyword_match(transcript, ideal)

    # 4. Apply section formula
    total_score = score_section(
        section, fluency, pace=pace_sc,
        word_match=word_match, keyword_match=keyword_match,
        sentence_match=sentence_match, semantic=semantic,
        depth=depth, confidence=confidence_sc,
    )

    # 5. Generate feedback
    feedback = generate_feedback(section, total_score, transcript)

    # 6. Save answer
    answer = CommAnswer(
        session_id=session_id,
        question_id=question_id,
        section=section,
        user_transcript=transcript,
        pace_score=pace_sc,
        filler_score=filler_sc,
        confidence_score=confidence_sc,
        silence_score=silence_sc,
        energy_score=energy_sc,
        fluency_score=fluency,
        pronunciation_score=pronunciation_sc,
        intonation_score=intonation_sc,
        modulation_score=modulation_sc,
        rhythm_score=rhythm_sc,
        stress_score=stress_sc,
        word_match_score=word_match,
        keyword_match_score=keyword_match,
        sentence_match_score=sentence_match,
        semantic_score=semantic,
        depth_score=depth,
        section_weighted_score=total_score,
        feedback=feedback,
        time_taken=time_taken,
    )
    db.add(answer)

    # 7. Advance session
    session.questions_answered = (session.questions_answered or 0) + 1
    session.current_index = (session.current_index or 0) + 1

    # Check if current section is exhausted
    q_ids = session.question_ids or {}
    section_ids = q_ids.get(session.current_section, [])
    session_complete = False

    if session.current_index >= len(section_ids):
        # Move to next section
        cur_idx = SECTION_ORDER.index(session.current_section)
        if cur_idx + 1 >= len(SECTION_ORDER):
            session_complete = True
        else:
            session.current_section = SECTION_ORDER[cur_idx + 1]
            session.current_index = 0

    db.commit()

    # 8. Finalize if all done
    if session_complete:
        result = finalize_session(db, session)
        return {
            "score": total_score,
            "transcript": transcript,
            "feedback": feedback,
            "fluency": fluency,
            "pace_score": round(pace_sc, 1),
            "filler_score": round(filler_sc, 1),
            "confidence_score": round(confidence_sc, 1),
            "pronunciation_score": round(pronunciation_sc, 1),
            "intonation_score": round(intonation_sc, 1),
            "modulation_score": round(modulation_sc, 1),
            "rhythm_score": round(rhythm_sc, 1),
            "stress_score": round(stress_sc, 1),
            "word_match_score": round(word_match, 1),
            "keyword_match_score": round(keyword_match, 1),
            "semantic_score": round(semantic, 1),
            "session_complete": True,
            "results": result,
        }

    return {
        "score": total_score,
        "transcript": transcript,
        "feedback": feedback,
        "fluency": fluency,
        "pace_score": round(pace_sc, 1),
        "filler_score": round(filler_sc, 1),
        "confidence_score": round(confidence_sc, 1),
        "pronunciation_score": round(pronunciation_sc, 1),
        "intonation_score": round(intonation_sc, 1),
        "modulation_score": round(modulation_sc, 1),
        "rhythm_score": round(rhythm_sc, 1),
        "stress_score": round(stress_sc, 1),
        "word_match_score": round(word_match, 1),
        "keyword_match_score": round(keyword_match, 1),
        "semantic_score": round(semantic, 1),
        "session_complete": False,
        "progress": {
            "answered": session.questions_answered,
            "total": session.total_questions,
        },
    }


# ── Session finalization ──────────────────────────────────────────────────────

def finalize_session(db: Session, session) -> dict:
    """Compute section averages, overall score, band."""
    answers = db.query(CommAnswer).filter(
        CommAnswer.session_id == session.id
    ).all()

    section_totals = {}
    section_counts = {}
    for ans in answers:
        s = ans.section
        section_totals[s] = section_totals.get(s, 0) + (ans.section_weighted_score or 0)
        section_counts[s] = section_counts.get(s, 0) + 1

    section_scores = {}
    for s in SECTION_ORDER:
        if section_counts.get(s, 0) > 0:
            section_scores[s] = round(section_totals[s] / section_counts[s], 1)
        else:
            section_scores[s] = 0.0

    # Weighted overall
    overall = 0.0
    total_weight = 0.0
    for s in SECTION_ORDER:
        if s in section_scores and section_scores[s] > 0:
            overall += section_scores[s] * SECTION_WEIGHTS.get(s, 0)
            total_weight += SECTION_WEIGHTS.get(s, 0)

    if total_weight > 0:
        overall = round(overall / total_weight, 1)

    band = get_band(overall)

    session.section_scores = section_scores
    session.overall_score = overall
    session.band = band
    session.status = "completed"
    session.end_time = datetime.utcnow()
    db.commit()

    return {
        "session_id": session.id,
        "overall_score": overall,
        "band": band,
        "section_scores": section_scores,
    }


def finish_comm_session(db: Session, session_id: int, user_id: int) -> dict:
    """Manually finalize a session (e.g. user clicks 'End Test')."""
    session = _get_session(db, session_id, user_id)
    if session.status == "completed":
        return get_comm_results(db, session_id, user_id)
    return finalize_session(db, session)


# ── Results ───────────────────────────────────────────────────────────────────

def get_comm_results(db: Session, session_id: int, user_id: int) -> dict:
    """Full results for a completed session."""
    session = _get_session(db, session_id, user_id)

    answers = db.query(CommAnswer).filter(
        CommAnswer.session_id == session_id
    ).all()

    # Pre-fetch question texts for all answered questions
    q_ids = [a.question_id for a in answers]
    questions_map = {}
    if q_ids:
        qs = db.query(CommQuestion).filter(CommQuestion.id.in_(q_ids)).all()
        questions_map = {q.id: q for q in qs}

    section_details = []
    for s in SECTION_ORDER:
        s_answers = [a for a in answers if a.section == s]
        if not s_answers:
            continue
        avg_score = round(sum(a.section_weighted_score or 0 for a in s_answers) / len(s_answers), 1)
        section_details.append({
            "section": s,
            "name": SECTION_CONFIG[s]["name"],
            "avg_score": avg_score,
            "answer_count": len(s_answers),
            "answers": [
                {
                    "question_id": a.question_id,
                    "question_text": questions_map.get(a.question_id, None) and questions_map[a.question_id].prompt_text,
                    "audio_text": questions_map.get(a.question_id, None) and questions_map[a.question_id].audio_text,
                    "ideal_answer": questions_map.get(a.question_id, None) and questions_map[a.question_id].ideal_answer,
                    "transcript": a.user_transcript,
                    "score": a.section_weighted_score,
                    "feedback": a.feedback,
                    "fluency": a.fluency_score,
                    "pace": a.pace_score,
                    "pronunciation": a.pronunciation_score,
                    "intonation": a.intonation_score,
                    "modulation": a.modulation_score,
                    "rhythm": a.rhythm_score,
                    "stress": a.stress_score,
                    "word_match": a.word_match_score,
                    "keyword_match": a.keyword_match_score,
                    "semantic": a.semantic_score,
                }
                for a in s_answers
            ],
        })

    # Voice breakdown aggregation (all 11 dimensions)
    voice_cols = [
        ("pace",          "pace_score"),
        ("filler",        "filler_score"),
        ("confidence",    "confidence_score"),
        ("silence",       "silence_score"),
        ("energy",        "energy_score"),
        ("fluency",       "fluency_score"),
        ("pronunciation", "pronunciation_score"),
        ("intonation",    "intonation_score"),
        ("modulation",    "modulation_score"),
        ("rhythm",        "rhythm_score"),
        ("stress",        "stress_score"),
    ]
    voice_breakdown = {}
    for key, col in voice_cols:
        values = [getattr(a, col) for a in answers if getattr(a, col) is not None]
        voice_breakdown[key] = round(sum(values) / len(values), 1) if values else 0

    # Strengths / weaknesses
    scored_sections = [(d["section"], d["avg_score"]) for d in section_details if d["avg_score"] > 0]
    scored_sections.sort(key=lambda x: x[1], reverse=True)
    strengths = [f"{SECTION_CONFIG[s]['name']} ({sc}%)" for s, sc in scored_sections[:3]]
    weaknesses = [f"{SECTION_CONFIG[s]['name']} ({sc}%)" for s, sc in scored_sections[-2:]] if len(scored_sections) >= 3 else []

    duration = None
    if session.start_time and session.end_time:
        duration = round((session.end_time - session.start_time).total_seconds() / 60, 1)

    return {
        "session_id": session.id,
        "overall_score": session.overall_score or 0,
        "band": session.band or "N/A",
        "section_scores": session.section_scores or {},
        "section_details": section_details,
        "voice_breakdown": voice_breakdown,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "questions_answered": session.questions_answered or 0,
        "total_questions": session.total_questions or 70,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "end_time": session.end_time.isoformat() if session.end_time else None,
        "duration_minutes": duration,
        "status": session.status,
    }


def get_active_comm_session(db: Session, user_id: int) -> dict | None:
    """Return the user's active (in-progress) comm session, if any."""
    session = db.query(CommSession).filter(
        CommSession.user_id == user_id,
        CommSession.status == "active",
    ).order_by(CommSession.start_time.desc()).first()

    if not session:
        return None

    q_ids = session.question_ids or {}
    total = session.total_questions or 0
    answered = session.questions_answered or 0

    return {
        "session_id": session.id,
        "current_section": session.current_section,
        "current_index": session.current_index,
        "questions_answered": answered,
        "total_questions": total,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "sections_remaining": [
            s for s in SECTION_ORDER
            if SECTION_ORDER.index(s) >= SECTION_ORDER.index(session.current_section)
        ],
    }


def get_comm_history(db: Session, user_id: int) -> list:
    """Last 5 communication test sessions for a user, with section scores and voice breakdown."""
    sessions = db.query(CommSession).filter(
        CommSession.user_id == user_id
    ).order_by(CommSession.start_time.desc()).limit(5).all()

    if not sessions:
        return []

    session_ids = [s.id for s in sessions]
    all_answers = db.query(CommAnswer).filter(
        CommAnswer.session_id.in_(session_ids)
    ).all()

    # Group answers by session
    answers_by_session = {}
    for a in all_answers:
        answers_by_session.setdefault(a.session_id, []).append(a)

    voice_cols = [
        ("pace", "pace_score"), ("filler", "filler_score"),
        ("confidence", "confidence_score"), ("silence", "silence_score"),
        ("energy", "energy_score"), ("fluency", "fluency_score"),
        ("pronunciation", "pronunciation_score"), ("intonation", "intonation_score"),
        ("modulation", "modulation_score"), ("rhythm", "rhythm_score"),
        ("stress", "stress_score"),
    ]

    result = []
    for s in sessions:
        ans_list = answers_by_session.get(s.id, [])
        voice_breakdown = {}
        for key, col in voice_cols:
            values = [getattr(a, col) for a in ans_list if getattr(a, col) is not None]
            voice_breakdown[key] = round(sum(values) / len(values), 1) if values else 0

        result.append({
            "id": s.id,
            "session_id": s.id,
            "date": s.start_time.strftime("%b %d, %Y") if s.start_time else "-",
            "overall_score": round(s.overall_score, 1) if s.overall_score else 0,
            "band": s.band or "N/A",
            "status": s.status or "active",
            "questions_answered": s.questions_answered or 0,
            "section_scores": s.section_scores or {},
            "voice_breakdown": voice_breakdown,
        })

    return result


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_session(db: Session, session_id: int, user_id: int) -> CommSession:
    session = db.query(CommSession).filter(
        CommSession.id == session_id,
        CommSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(404, "Communication session not found")
    return session
