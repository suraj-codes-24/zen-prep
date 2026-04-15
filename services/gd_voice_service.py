"""
GD Voice Service — lightweight 4-feature voice scoring for group discussion turns.
Reuses sub-functions from voice_engine without running the full 9-feature pipeline.

Features scored:
  pace       (30%) — words per minute
  filler     (25%) — uh/um/like count relative to word count
  pause_avg  (25%) — average pause duration in seconds
  clarity    (20%) — Whisper word-level confidence average
"""
import re

FILLER_WORDS = {
    "uh", "um", "umm", "uhh", "like", "basically", "literally", "actually",
    "you know", "i mean", "kind of", "sort of", "right", "okay so",
}

IDEAL_WPM_LOW  = 110
IDEAL_WPM_HIGH = 160


def score_gd_voice(transcript: str, duration_sec: float, whisper_segments: list = None) -> dict:
    """
    Score a single GD user turn on 4 voice dimensions.

    Args:
        transcript:       Whisper transcript string
        duration_sec:     Audio duration in seconds
        whisper_segments: Optional list of Whisper segment dicts with 'avg_logprob'

    Returns: {
        pace, filler_count, pause_avg, clarity,
        voice_score,
        details: {pace_label, filler_label, clarity_label}
    }
    """
    if not transcript or duration_sec <= 0:
        return _empty_voice()

    words = transcript.strip().split()
    word_count = len(words)

    # ── Pace (WPM) ────────────────────────────────────────────────────────────
    wpm = (word_count / duration_sec) * 60 if duration_sec > 0 else 0

    if wpm < 80:
        pace_score = max(0, wpm / 80 * 60)
        pace_label = "Too slow"
    elif wpm > 200:
        pace_score = max(0, 100 - (wpm - 200) * 0.5)
        pace_label = "Too fast"
    elif IDEAL_WPM_LOW <= wpm <= IDEAL_WPM_HIGH:
        pace_score = 100.0
        pace_label = "Ideal"
    else:
        # Linear ramp between 80-110 and 160-200
        if wpm < IDEAL_WPM_LOW:
            pace_score = 60 + (wpm - 80) / (IDEAL_WPM_LOW - 80) * 40
        else:
            pace_score = 100 - (wpm - IDEAL_WPM_HIGH) / (200 - IDEAL_WPM_HIGH) * 40
        pace_label = "Acceptable"

    # ── Filler words ──────────────────────────────────────────────────────────
    text_lower = transcript.lower()
    filler_count = 0
    for fw in FILLER_WORDS:
        filler_count += len(re.findall(r'\b' + re.escape(fw) + r'\b', text_lower))

    filler_ratio = filler_count / max(1, word_count)
    if filler_ratio < 0.03:
        filler_score = 100.0
        filler_label = "Excellent"
    elif filler_ratio < 0.07:
        filler_score = 75.0
        filler_label = "Good"
    elif filler_ratio < 0.12:
        filler_score = 50.0
        filler_label = "Moderate"
    else:
        filler_score = max(0, 25 - (filler_ratio - 0.12) * 200)
        filler_label = "High"

    # ── Average pause duration (heuristic from duration vs word count) ────────
    # Rough estimate: (total_duration - speaking_time) / expected_pause_count
    # Assumes avg word takes ~0.35s to say
    speaking_time   = word_count * 0.35
    pause_total     = max(0, duration_sec - speaking_time)
    sentence_count  = max(1, transcript.count(".") + transcript.count("?") + transcript.count("!"))
    pause_avg       = pause_total / max(1, sentence_count)

    if pause_avg < 0.5:
        pause_score = 100.0
    elif pause_avg < 1.5:
        pause_score = 100 - (pause_avg - 0.5) * 30
    else:
        pause_score = max(0, 70 - (pause_avg - 1.5) * 30)

    # ── Clarity (Whisper confidence) ──────────────────────────────────────────
    clarity = 75.0  # default if no segments
    if whisper_segments:
        log_probs = [
            seg.get("avg_logprob", -0.3)
            for seg in whisper_segments
            if seg.get("avg_logprob") is not None
        ]
        if log_probs:
            avg_lp = sum(log_probs) / len(log_probs)
            # avg_logprob typically ranges -0.0 (perfect) to -2.0+ (inaudible)
            clarity = min(100.0, max(0.0, (avg_lp + 0.5) / 0.5 * 100))
    clarity_label = "Clear" if clarity >= 75 else ("Moderate" if clarity >= 50 else "Unclear")

    # ── Weighted composite ────────────────────────────────────────────────────
    voice_score = round(
        0.30 * pace_score +
        0.25 * filler_score +
        0.25 * pause_score +
        0.20 * clarity,
        1
    )

    return {
        "pace":          round(wpm, 1),
        "filler_count":  filler_count,
        "pause_avg":     round(pause_avg, 2),
        "clarity":       round(clarity, 1),
        "voice_score":   voice_score,
        "details": {
            "pace_label":    pace_label,
            "filler_label":  filler_label,
            "clarity_label": clarity_label,
        },
    }


def _empty_voice() -> dict:
    return {
        "pace": 0, "filler_count": 0, "pause_avg": 0,
        "clarity": 0, "voice_score": None,
        "details": {"pace_label": "N/A", "filler_label": "N/A", "clarity_label": "N/A"},
    }
