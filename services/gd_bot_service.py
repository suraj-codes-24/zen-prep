"""
GD Bot Service — bot personalities and Ollama response generation.
Model: llama3.1:8b (fast conversational model for real-time GD flow).

Upgrades:
  - Difficulty-aware prompts (easy: open, hard: evidence-demanding)
  - Zoe challenges weak/short user arguments
  - Sam directs follow-up questions at user 40% of the time
  - Ethan synthesizes in late phase
  - Phase-aware closing behaviour
"""
import random
from services.ollama_utils import generate

GD_MODEL = "llama3.1:8b"

BOT_PERSONALITIES = {
    "Alex": {
        "role":  "Initiator",
        "color": "#6366F1",
        "style": (
            "You are Alex, an enthusiastic discussion leader. "
            "You open topics clearly, frame the key questions, and set the direction for the group. "
            "You speak confidently and help structure the conversation."
        ),
        "fallback": "I think we need to consider multiple angles here. Let me frame the key dimensions of this topic for us.",
    },
    "Zoe": {
        "role":  "Challenger",
        "color": "#EC4899",
        "style": (
            "You are Zoe, a sharp critical thinker. "
            "You question assumptions, challenge weak arguments, and play devil's advocate. "
            "You are direct, incisive, and occasionally provocative but always respectful."
        ),
        "fallback": "I'd actually challenge that view. We're making an assumption here that isn't well-supported by the evidence.",
        "challenge_opener": [
            "That's an interesting claim, but where's the evidence?",
            "I'd push back on that — what's the basis for that assumption?",
            "Let's be careful here. That argument has a significant gap:",
            "I think we're glossing over a critical counterpoint:",
        ],
    },
    "Ethan": {
        "role":  "Synthesizer",
        "color": "#22C55E",
        "style": (
            "You are Ethan, a collaborative consensus-builder. "
            "You build on what others have said, find common ground between opposing views, and synthesize diverse perspectives. "
            "You often use phrases like 'building on that' or 'to add to what was said'."
        ),
        "fallback": "Building on the previous points, I think there's a middle ground here that addresses both concerns raised.",
        "closing_opener": [
            "As we approach the end of our discussion, let me try to synthesize what we've covered:",
            "Bringing the key threads together — we've established that",
            "To consolidate our discussion, the core areas of agreement seem to be:",
        ],
    },
    "Kate": {
        "role":  "Expert",
        "color": "#F59E0B",
        "style": (
            "You are Kate, a data-driven analyst. "
            "You cite specific facts, statistics, real-world case studies, and evidence-based arguments. "
            "You prefer structured, logical reasoning backed by observable outcomes."
        ),
        "fallback": "Looking at the data, studies show this has significant measurable impacts we should factor into our analysis.",
    },
    "Sam": {
        "role":  "Questioner",
        "color": "#06B6D4",
        "style": (
            "You are Sam, a curious interrogator. "
            "You ask probing questions that deepen the discussion, clarify ambiguity, and explore second-order implications. "
            "You often end your turns with a question directed to the group."
        ),
        "fallback": "That's an interesting perspective. But what are the real-world implications if we take that approach to its logical conclusion?",
        "user_directed_questions": [
            "I'd like to hear your take on this — do you think",
            "Actually, what's your view on whether",
            "Let me turn this to you — how would you address",
        ],
    },
}

BOT_COLORS = {name: data["color"] for name, data in BOT_PERSONALITIES.items()}

DIFFICULTY_CONTEXT = {
    "easy":   "This is a general discussion. Encourage broad participation. Basic opinions and common knowledge are welcome.",
    "medium": "This is a structured discussion. Expect reasoned arguments and some supporting examples.",
    "hard":   "This is an advanced discussion. Push for evidence-based arguments, specific data, and nuanced analysis. Challenge vague claims.",
}


def get_bots_for_count(count: int) -> list:
    all_bots = ["Alex", "Zoe", "Ethan", "Kate", "Sam"]
    return all_bots[:max(3, min(5, count))]


def get_phase(elapsed_secs: int, total_secs: int) -> str:
    ratio = elapsed_secs / total_secs if total_secs > 0 else 0
    if ratio < 0.3:
        return "early"
    if ratio < 0.75:
        return "mid"
    return "late"


def get_bot_response(
    bot_name:       str,
    topic:          str,
    transcript:     list,
    phase:          str,
    difficulty:     str = "medium",
    last_user_text: str = "",
) -> str:
    """
    Generate a context-aware bot response.

    transcript:     list of dicts {speaker, text}
    difficulty:     easy | medium | hard
    last_user_text: the user's most recent turn (used for challenge/follow-up logic)
    """
    personality = BOT_PERSONALITIES.get(bot_name, BOT_PERSONALITIES["Alex"])
    difficulty  = difficulty if difficulty in DIFFICULTY_CONTEXT else "medium"

    recent       = transcript[-5:] if len(transcript) >= 5 else transcript
    context_lines= [f"{t['speaker']}: {t['text']}" for t in recent]
    context      = "\n".join(context_lines) if context_lines else "The discussion is just beginning."

    # ── Phase instruction ─────────────────────────────────────────────────────
    if phase in ("opening", "early"):
        phase_note = (
            "This is the opening round. Briefly state your initial position on the topic in 1-2 sentences. "
            "Raise one key question or angle for the group to explore."
        )
    elif phase == "summary":
        phase_note = (
            "The discussion is wrapping up. Summarize the most important arguments made so far "
            "and state your final position concisely."
        )
    elif phase in ("closing", "late"):
        phase_note = (
            "Give a brief, compelling closing statement. Synthesize the main points of agreement and disagreement, "
            "and offer a balanced concluding thought."
        )
    else:  # discussion / mid
        phase_note = "The discussion is in full swing. Engage actively and build on what's been said."

    # ── Bot-specific behaviour overrides ─────────────────────────────────────
    behaviour_hint = ""

    # Any bot: if the user just passed their turn silently, acknowledge it naturally
    if last_user_text == "[user did not speak]":
        behaviour_hint = (
            "The person who was supposed to speak just stayed silent and passed their turn. "
            "Acknowledge it briefly and naturally — invite them to share their thoughts later — "
            "then continue the discussion yourself."
        )

    # Zoe: challenge weak/short user arguments
    if bot_name == "Zoe" and last_user_text:
        word_count = len(last_user_text.split())
        if word_count < 15 or _is_vague(last_user_text):
            opener = random.choice(personality.get("challenge_opener", [""]))
            behaviour_hint = (
                f'The previous participant made a brief or vague point: "{last_user_text[:120]}". '
                f'Challenge it directly and demand specifics. You may start with: "{opener}"'
            )

    # Sam: direct a question at the user 40% of the time
    if bot_name == "Sam" and random.random() < 0.4 and not behaviour_hint:
        q_opener = random.choice(personality.get("user_directed_questions", [""]))
        behaviour_hint = (
            f'Direct your follow-up question specifically at the previous speaker. '
            f'You may start with: "{q_opener}"'
        )

    # Ethan: synthesize in late/summary/closing phase
    if bot_name == "Ethan" and phase in ("late", "summary", "closing"):
        closing = random.choice(personality.get("closing_opener", [""]))
        behaviour_hint = (
            f'Summarize the key points from the discussion and propose a balanced conclusion. '
            f'You may start with: "{closing}"'
        )

    # Kate: harder topics require data/evidence push
    if bot_name == "Kate" and difficulty == "hard":
        behaviour_hint = (
            "Reference specific statistics, case studies, or research findings to ground your argument. "
            "Do not make claims without evidence."
        )

    prompt = (
        f'You are in a live group discussion on: "{topic}"\n\n'
        f"{personality['style']}\n\n"
        f"Difficulty level: {DIFFICULTY_CONTEXT[difficulty]}\n\n"
        f"{phase_note}\n\n"
        f"Recent conversation:\n{context}\n\n"
        + (f"Special instruction: {behaviour_hint}\n\n" if behaviour_hint else "")
        + "Give your response in 2-3 natural sentences. "
        "Be conversational and stay in character. "
        "Do NOT start with your name. No bullet points. Just speak."
    )

    response = generate(prompt, temperature=0.75, max_tokens=120, model=GD_MODEL)
    if response:
        return response.strip()
    return personality["fallback"]


# ── Helpers ───────────────────────────────────────────────────────────────────

VAGUE_PHRASES = {
    "i think", "i feel", "maybe", "perhaps", "it could be",
    "i guess", "kind of", "sort of", "not sure", "i don't know",
}

def _is_vague(text: str) -> bool:
    text_lower = text.lower()
    matches = sum(1 for p in VAGUE_PHRASES if p in text_lower)
    return matches >= 2
