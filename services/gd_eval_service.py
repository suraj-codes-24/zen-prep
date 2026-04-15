"""
GD Evaluation Service — 5-dimension scoring, content analysis, sentiment, participation intelligence.
"""
import re
import json

from services.ollama_utils import generate, extract_json_object

COLLABORATIVE_PHRASES = [
    "building on that", "to add to", "i agree", "as mentioned", "following up",
    "similar to what", "in line with", "you're right", "that's a good point",
    "expanding on", "i'd like to add", "to build on", "going back to what",
]

QUESTION_PATTERN = re.compile(
    r'\b(what|why|how|when|where|who|which|could|would|should|is there|are there)\b.*\?',
    re.IGNORECASE,
)

STOP_WORDS = {
    "the", "a", "an", "is", "are", "it", "to", "of", "and", "in", "that", "we",
    "i", "on", "for", "this", "be", "with", "at", "by", "from", "or", "but",
    "not", "have", "do", "they", "you", "he", "she", "we", "our", "your", "its",
    "so", "if", "as", "also", "my", "was", "were", "been", "has", "had", "will",
    "can", "may", "just", "very", "more", "than", "about", "up", "out", "one",
    "which", "there", "their", "what", "all", "would", "could", "should", "said",
    "when", "who", "how", "now", "into", "than", "then", "some", "other",
}


# ─────────────────────────────────────────────────────────────────────────────
# 5-Dimension Scoring
# ─────────────────────────────────────────────────────────────────────────────

def compute_scores(turns: list, difficulty: str = "medium") -> dict:
    """
    turns: list of dicts {speaker, text, duration_sec, raised_hand}
    Returns dict with all score fields.
    """
    if not turns:
        return _empty_scores()

    user_turns = [t for t in turns if t["speaker"] == "user"]
    total_turns = len(turns)

    if not user_turns:
        return _empty_scores()

    # ── Participation ─────────────────────────────────────────────────────────
    total_dur = sum(t.get("duration_sec") or 3.0 for t in turns) or 1.0
    user_dur  = sum(t.get("duration_sec") or 3.0 for t in user_turns)
    participation = min(100.0, (user_dur / total_dur) * 100)

    # ── Leadership (user initiates new sub-topics / speaks after bot) ────────
    initiated = 0
    for i, t in enumerate(turns):
        if t["speaker"] == "user":
            if i == 0 or turns[i - 1]["speaker"] != "user":
                initiated += 1
    leadership = min(100.0, (initiated / max(1, total_turns)) * 200)

    # ── Listening (user turns that reference prior bot content) ─────────────
    listen_hits = 0
    for i, t in enumerate(turns):
        if t["speaker"] != "user" or i == 0:
            continue
        prev_bot_words: set = set()
        for prev in turns[max(0, i - 3):i]:
            if prev["speaker"] != "user":
                prev_bot_words.update(w.lower() for w in prev["text"].split())
        prev_bot_words -= STOP_WORDS
        user_words = set(w.lower() for w in t["text"].split()) - STOP_WORDS
        if len(user_words & prev_bot_words) >= 2:
            listen_hits += 1
    listening = min(100.0, (listen_hits / len(user_turns)) * 100)

    # ── Idea Quality (text depth heuristic + difficulty multiplier) ──────────
    depth_scores = []
    depth_bonus = {"easy": 0.0, "medium": 0.05, "hard": 0.15}.get(difficulty, 0.05)
    for t in user_turns:
        text = t["text"].strip()
        words = text.split()
        word_count = len(words)
        variety = len(set(w.lower() for w in words)) / max(1, word_count)
        sentences = max(1, text.count(".") + text.count("!") + text.count("?"))
        avg_sentence_len = word_count / sentences
        score = min(100.0, (
            min(40.0, word_count * 1.2) +
            variety * 30 +
            min(30.0, avg_sentence_len * 1.5)
        ))
        # Hard topics: bonus if user uses evidence keywords
        if difficulty == "hard":
            evidence_words = {"data", "study", "research", "percent", "according", "evidence", "statistics", "survey"}
            if any(w.lower() in evidence_words for w in words):
                score = min(100.0, score * (1.0 + depth_bonus))
        depth_scores.append(score)
    idea_quality = sum(depth_scores) / len(depth_scores) if depth_scores else 0.0

    # ── Teamwork (collaborative phrases) ────────────────────────────────────
    collab_count = 0
    for t in user_turns:
        text_lower = t["text"].lower()
        for phrase in COLLABORATIVE_PHRASES:
            if phrase in text_lower:
                collab_count += 1
                break
    teamwork = min(100.0, (collab_count / len(user_turns)) * 100)
    teamwork = max(teamwork, min(40.0, participation * 0.4))

    # ── Stats ────────────────────────────────────────────────────────────────
    arguments_count = len(user_turns)
    interjections   = sum(1 for t in turns if t["speaker"] == "user" and not t.get("raised_hand", True))
    questions_asked = sum(1 for t in user_turns if QUESTION_PATTERN.search(t["text"]))

    overall = (participation + leadership + listening + idea_quality + teamwork) / 5

    return {
        "participation":   round(participation, 1),
        "leadership":      round(leadership, 1),
        "listening":       round(listening, 1),
        "idea_quality":    round(idea_quality, 1),
        "teamwork":        round(teamwork, 1),
        "overall_score":   round(overall, 1),
        "arguments_count": arguments_count,
        "interjections":   interjections,
        "questions_asked": questions_asked,
    }


def get_performance_band(score: float) -> str:
    if score >= 85: return "Exceptional"
    if score >= 70: return "Proficient"
    if score >= 55: return "Developing"
    if score >= 40: return "Beginner"
    return "Needs Practice"


# ─────────────────────────────────────────────────────────────────────────────
# Content Analysis — Keyword Extraction + Argument Mining
# ─────────────────────────────────────────────────────────────────────────────

def extract_content_keywords(turns: list, top_n: int = 12) -> list:
    """
    Extract top keywords from user turns using frequency scoring.
    Returns: [{"word": str, "count": int}]
    """
    user_text = " ".join(t["text"] for t in turns if t["speaker"] == "user")
    if not user_text.strip():
        return []

    words = re.findall(r'\b[a-zA-Z]{4,}\b', user_text.lower())
    freq: dict = {}
    for w in words:
        if w not in STOP_WORDS:
            freq[w] = freq.get(w, 0) + 1

    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [{"word": w, "count": c} for w, c in sorted_words[:top_n]]


def extract_arguments(user_text: str, topic: str) -> list:
    """
    Use Ollama to identify main arguments the user made.
    Returns: list of short argument strings
    """
    if not user_text.strip():
        return []

    prompt = (
        f'A student participated in a GD on: "{topic}"\n'
        f'Their contributions: "{user_text[:600]}"\n\n'
        'List the 3-5 main distinct arguments or points they made. '
        'Return a JSON array of short strings (max 12 words each). '
        'Example: ["AI improves efficiency in manufacturing", "Job displacement needs policy solutions"]'
    )
    raw    = generate(prompt, temperature=0.3, max_tokens=150)
    parsed = None
    if raw:
        parsed = extract_json_object(raw)
        if not parsed:
            # try array
            m = re.search(r'\[.*?\]', raw, re.DOTALL)
            if m:
                try:
                    parsed = json.loads(m.group())
                except Exception:
                    parsed = None
    if isinstance(parsed, list):
        return [str(a) for a in parsed[:5]]
    return []


def score_relevance(user_text: str, topic_title: str, topic_description: str = "") -> float:
    """
    Score how on-topic the user stayed (0-100).
    Uses keyword overlap between topic words and user text.
    """
    if not user_text.strip():
        return 0.0

    topic_source = (topic_title + " " + (topic_description or "")).lower()
    topic_words  = set(re.findall(r'\b[a-zA-Z]{4,}\b', topic_source)) - STOP_WORDS
    user_words   = set(re.findall(r'\b[a-zA-Z]{4,}\b', user_text.lower())) - STOP_WORDS

    if not topic_words:
        return 50.0

    overlap = len(topic_words & user_words)
    relevance = min(100.0, (overlap / len(topic_words)) * 150)
    return round(relevance, 1)


# ─────────────────────────────────────────────────────────────────────────────
# Sentiment Analysis
# ─────────────────────────────────────────────────────────────────────────────

def analyze_sentiment(user_text: str) -> dict:
    """
    Simple 3-class sentiment + tone + confidence via Ollama.
    Returns: {tone, sentiment, confidence_level}
    """
    if not user_text.strip():
        return {"tone": "neutral", "sentiment": "neutral", "confidence_level": "medium"}

    prompt = (
        f'Analyze this GD participant\'s speaking style. Text: "{user_text[:500]}"\n'
        'Return JSON only: {"tone": "assertive|neutral|hesitant", '
        '"sentiment": "positive|neutral|negative", '
        '"confidence_level": "high|medium|low"}'
    )
    raw    = generate(prompt, temperature=0.2, max_tokens=60)
    parsed = extract_json_object(raw) if raw else None
    if parsed and "tone" in parsed:
        return {
            "tone":             parsed.get("tone", "neutral"),
            "sentiment":        parsed.get("sentiment", "neutral"),
            "confidence_level": parsed.get("confidence_level", "medium"),
        }
    return {"tone": "neutral", "sentiment": "neutral", "confidence_level": "medium"}


# ─────────────────────────────────────────────────────────────────────────────
# Participation Intelligence
# ─────────────────────────────────────────────────────────────────────────────

def compute_participation_intelligence(turns: list) -> dict:
    """
    Deeper participation analysis beyond turn count.
    Returns: {dominance_ratio, interruption_rate, consistency, engagement_style, recommendation}
    """
    if not turns:
        return _empty_participation()

    user_turns  = [t for t in turns if t["speaker"] == "user"]
    total_turns = len(turns)

    if not user_turns:
        return _empty_participation()

    # Dominance ratio — % of total turns taken by user
    dominance_ratio = round((len(user_turns) / total_turns) * 100, 1)

    # Interruption rate — % of user turns that were force-speaks (not raised hand)
    forced = sum(1 for t in user_turns if not t.get("raised_hand", True))
    interruption_rate = round((forced / len(user_turns)) * 100, 1)

    # Turn length consistency — coefficient of variation of word counts
    word_counts = [len(t["text"].split()) for t in user_turns]
    if len(word_counts) > 1:
        avg = sum(word_counts) / len(word_counts)
        variance = sum((x - avg) ** 2 for x in word_counts) / len(word_counts)
        std_dev = variance ** 0.5
        cv = (std_dev / avg) if avg > 0 else 1.0
        consistency = round(max(0.0, min(100.0, (1.0 - cv) * 100)), 1)
    else:
        consistency = 50.0

    # Engagement style
    if dominance_ratio > 50:
        style = "Dominant"
        recommendation = "You spoke very frequently. Allow others more space to contribute."
    elif dominance_ratio < 15:
        style = "Observer"
        recommendation = "You were quite reserved. Look for openings to contribute your ideas more actively."
    elif interruption_rate > 50:
        style = "Assertive"
        recommendation = "You interrupted frequently. Try raising your hand to show collaborative intent."
    else:
        style = "Balanced"
        recommendation = "Good balance of participation. Keep contributing concise, well-structured points."

    return {
        "dominance_ratio":   dominance_ratio,
        "interruption_rate": interruption_rate,
        "consistency":       consistency,
        "engagement_style":  style,
        "recommendation":    recommendation,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _empty_scores() -> dict:
    return {
        "participation": 0, "leadership": 0, "listening": 0,
        "idea_quality": 0, "teamwork": 0, "overall_score": 0,
        "arguments_count": 0, "interjections": 0, "questions_asked": 0,
    }


def _empty_participation() -> dict:
    return {
        "dominance_ratio":   0.0,
        "interruption_rate": 0.0,
        "consistency":       0.0,
        "engagement_style":  "Observer",
        "recommendation":    "Participate more actively in the discussion.",
    }
