from services.ollama_utils import generate, extract_json_object, OllamaUnavailable


def generate_session_feedback(answers: list[dict]) -> dict:
    if not answers:
        return {"strengths": [], "weaknesses": ["No answers to analyse."], "advice": []}

    lines = []
    for i, a in enumerate(answers[:8], 1):
        q     = str(a.get("question", "")).strip()[:100]
        ans   = str(a.get("answer",   "")).strip()[:120]
        score = a.get("score", 0)
        lines.append(f"Q{i} (score {score}): {q}\nA: {ans}")
    digest = "\n\n".join(lines)

    prompt = f"""You are an expert interview coach.

Review these candidate answers and their scores:

{digest}

Return ONLY valid JSON:
{{
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "advice": ["<actionable advice 1>", "<actionable advice 2>", "<actionable advice 3>"]
}}

Rules: each item one concise sentence, limit to 3 per list, output ONLY JSON."""

    try:
        raw  = generate(prompt, temperature=0.3, max_tokens=400)
        data = extract_json_object(raw)
        if data:
            return {
                "strengths":  data.get("strengths",  [])[:3],
                "weaknesses": data.get("weaknesses", [])[:3],
                "advice":     data.get("advice",     [])[:3],
            }
    except OllamaUnavailable:
        return {
            "strengths":  ["Could not connect to Ollama — start it with: ollama serve"],
            "weaknesses": [],
            "advice":     [],
        }
    except Exception:
        pass

    return _rule_based_feedback(answers)


def _rule_based_feedback(answers: list[dict]) -> dict:
    scores = [a.get("score", 0) for a in answers]
    avg    = sum(scores) / len(scores) if scores else 0
    high   = [a for a in answers if a.get("score", 0) >= 70]
    low    = [a for a in answers if a.get("score", 0) < 50]

    strengths = []
    if high:
        strengths.append(f"Strong performance on {len(high)} question(s) — scored above 70.")
    if avg >= 60:
        strengths.append(f"Overall average of {round(avg, 1)} shows solid understanding.")
    if not strengths:
        strengths.append("Attempted all questions — consistent effort shown.")

    weaknesses = []
    if low:
        weaknesses.append(f"{len(low)} answer(s) scored below 50 — these need focused review.")
    if avg < 60:
        weaknesses.append("Average score below 60 — key concepts need strengthening.")
    if len(answers) < 3:
        weaknesses.append("Very few answers recorded — practice more questions per session.")

    advice = [
        "Review the feedback on your lowest-scoring answers first.",
        "Practice explaining concepts out loud to improve voice confidence.",
        "Re-attempt this topic after reviewing the relevant material.",
    ]
    return {"strengths": strengths[:3], "weaknesses": weaknesses[:3], "advice": advice[:3]}
