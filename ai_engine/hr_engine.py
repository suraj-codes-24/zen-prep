from services.llm_utils import generate, LLMUnavailable

def evaluate_hr_answer(question_text: str, user_answer: str) -> dict:
    """
    Evaluate a behavioral/HR answer using Ollama.
    Returns scores + detailed interviewer-style feedback.
    """
    if not user_answer or not user_answer.strip():
        return _empty_response()

    prompt = f"""You are a senior HR interviewer at a top tech company evaluating a candidate for a software engineering role.

INTERVIEW QUESTION:
{question_text}

CANDIDATE'S ANSWER:
{user_answer}

EVALUATION TASK:
Score the answer on these 4 dimensions (each from 0 to 10):

1. clarity (0-10): Is the answer clear, focused, and easy to follow? Does it avoid vague or confusing language?
2. structure (0-10): Does it follow the STAR method (Situation → Task → Action → Result)? Is it well organized?
3. communication (0-10): Does the candidate communicate professionally and confidently? Is the language appropriate?
4. relevance (0-10): Does the answer directly address the question? Is it specific or too generic?

Then write feedback as a real interviewer would say it — 2 to 3 sentences. Be specific:
- Mention what they did well
- Point out what was missing or weak
- If structure is weak, tell them to use the STAR method with a brief explanation
- Do NOT be generic — reference the actual question topic

Reply ONLY with this exact JSON format, no extra text:
{{
  "clarity": <number 0-10>,
  "structure": <number 0-10>,
  "communication": <number 0-10>,
  "relevance": <number 0-10>,
  "feedback": "<2-3 sentences of specific interviewer feedback>"
}}"""

    try:
        raw = generate(prompt, model="llama3.1:8b", temperature=0.3, num_predict=350)
        return _parse_response(raw, user_answer, question_text)

    except LLMUnavailable:
        return {
            "clarity":       0.0,
            "structure":     0.0,
            "communication": 0.0,
            "relevance":     0.0,
            "hr_score":      0.0,
            "feedback":      "AI engine is currently unavailable."
        }
    except Exception:
        return _fallback_score(user_answer, question_text)


def _parse_response(raw: str, user_answer: str, question_text: str) -> dict:
    """Extract and validate JSON from Ollama response."""
    try:
        match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if not match:
            return _fallback_score(user_answer, question_text)

        data = json.loads(match.group())

        clarity       = float(data.get("clarity",       5))
        structure     = float(data.get("structure",     5))
        communication = float(data.get("communication", 5))
        relevance     = float(data.get("relevance",     5))
        feedback      = str(data.get("feedback", "")).strip()

        # Clamp values
        clarity       = max(0.0, min(10.0, clarity))
        structure     = max(0.0, min(10.0, structure))
        communication = max(0.0, min(10.0, communication))
        relevance     = max(0.0, min(10.0, relevance))

        # If Ollama gave empty feedback, generate one
        if not feedback or len(feedback) < 10:
            feedback = _generate_fallback_feedback(
                clarity, structure, communication, relevance, user_answer
            )

        # HR score formula: structure weighted highest
        hr_score = round(
            (clarity       * 0.25 +
             structure     * 0.30 +
             communication * 0.25 +
             relevance     * 0.20) * 10,
            2
        )

        return {
            "clarity":       round(clarity * 10, 2),
            "structure":     round(structure * 10, 2),
            "communication": round(communication * 10, 2),
            "relevance":     round(relevance * 10, 2),
            "hr_score":      hr_score,
            "feedback":      feedback
        }

    except Exception:
        return _fallback_score(user_answer, question_text)


def _generate_fallback_feedback(
    clarity: float,
    structure: float,
    communication: float,
    relevance: float,
    user_answer: str
) -> str:
    """Generate rule-based feedback when Ollama feedback is missing."""
    parts = []
    word_count = len(user_answer.split())

    if clarity >= 7:
        parts.append("Your answer is clear and easy to understand.")
    elif clarity >= 5:
        parts.append("Your answer is somewhat clear but could be more focused.")
    else:
        parts.append("Try to structure your thoughts more clearly before answering.")

    if structure < 6:
        parts.append(
            "Use the STAR method to organize your answer: describe the Situation, "
            "your Task, the Action you took, and the Result you achieved."
        )
    elif structure >= 8:
        parts.append("Good structure — your answer follows a logical flow.")

    if relevance < 5:
        parts.append("Make sure your answer directly addresses what was asked.")
    elif word_count < 20:
        parts.append("Elaborate more — interviewers expect specific examples and outcomes.")

    return " ".join(parts)


def _fallback_score(user_answer: str, question_text: str = "") -> dict:
    """Rule-based scoring when Ollama is unavailable."""
    word_count = len(user_answer.split()) if user_answer else 0
    text = user_answer.lower()

    # Check for STAR indicators
    has_situation = any(w in text for w in ["when", "once", "situation", "time", "project", "team"])
    has_action    = any(w in text for w in ["decided", "took", "implemented", "resolved", "handled", "did"])
    has_result    = any(w in text for w in ["result", "outcome", "achieved", "improved", "success", "learned"])

    star_score = (has_situation + has_action + has_result) / 3

    if word_count >= 60:
        base = 65.0
    elif word_count >= 30:
        base = 50.0
    elif word_count >= 15:
        base = 35.0
    else:
        base = 20.0

    score = round(base + star_score * 20, 2)

    feedback = _generate_fallback_feedback(
        score / 10, star_score * 10, score / 10, score / 10, user_answer
    )

    return {
        "clarity":       score,
        "structure":     round(star_score * 100, 2),
        "communication": score,
        "relevance":     score,
        "hr_score":      score,
        "feedback":      feedback
    }


def _empty_response() -> dict:
    return {
        "clarity":       0.0,
        "structure":     0.0,
        "communication": 0.0,
        "relevance":     0.0,
        "hr_score":      0.0,
        "feedback":      "No answer was provided."
    }
