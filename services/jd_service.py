import difflib
from services.ollama_utils import generate, extract_json_object, extract_json_array

# Map of JD keywords → topic names used in our DB analytics
SKILL_TOPIC_MAP = {
    "array": "Arrays", "arrays": "Arrays", "linked list": "Linked Lists",
    "linked lists": "Linked Lists", "tree": "Trees", "trees": "Trees",
    "graph": "Graphs", "graphs": "Graphs", "dynamic programming": "Dynamic Programming",
    "dp": "Dynamic Programming", "sorting": "Sorting", "binary search": "Binary Search",
    "heap": "Heaps", "stack": "Stacks", "queue": "Queues", "recursion": "Recursion",
    "backtracking": "Backtracking", "hashing": "Hashing", "trie": "Tries",
    "sql": "SQL", "database": "Database Design", "normalization": "Normalization",
    "indexing": "Indexing", "acid": "Transactions", "joins": "Joins",
    "process": "Processes", "thread": "Threads", "deadlock": "Deadlock",
    "scheduling": "CPU Scheduling", "memory": "Memory Management",
    "tcp": "Networking", "http": "Networking", "dns": "Networking", "networking": "Networking",
    "load balancer": "Load Balancing", "caching": "Caching", "cache": "Caching",
    "system design": "System Design", "microservices": "Microservices",
    "cap theorem": "CAP Theorem", "distributed": "Distributed Systems",
    "machine learning": "Machine Learning", "neural network": "Neural Networks",
    "deep learning": "Deep Learning", "nlp": "Natural Language Processing",
    "oop": "OOP", "object oriented": "OOP", "inheritance": "Inheritance",
    "polymorphism": "Polymorphism", "encapsulation": "Encapsulation",
}


def extract_skills(jd_text: str) -> list[str]:
    """
    Use Ollama to extract required skills from a job description.
    Falls back to keyword scan if Ollama is unavailable.
    """
    prompt = f"""Extract the technical skills from the following job description.

Return ONLY valid JSON, no explanation:
{{
  "skills": ["skill1", "skill2", "skill3"]
}}

Job Description:
{jd_text[:2000]}"""

    try:
        raw  = generate(prompt, temperature=0.2, max_tokens=300)
        data = extract_json_object(raw)
        if data:
            skills = data.get("skills", [])
            if skills:
                return [str(s).strip() for s in skills[:20]]
    except Exception:
        pass

    return _keyword_extract(jd_text)


def _keyword_extract(jd_text: str) -> list[str]:
    """Fallback: scan for known tech keywords in the JD text."""
    text = jd_text.lower()
    found = []
    seen = set()
    for kw in SKILL_TOPIC_MAP:
        if kw in text and kw not in seen:
            found.append(kw.title())
            seen.add(kw)
    return found or ["Data Structures", "Algorithms", "System Design"]


def create_prep_plan(missing_skills: list[str]) -> list[str]:
    """
    Use Ollama to generate a 7-day prep plan for the missing skills.
    Returns list of 7 daily tasks.
    """
    if not missing_skills:
        return [f"Day {i}: Review core CS fundamentals" for i in range(1, 8)]

    skills_str = ", ".join(missing_skills[:6])

    prompt = f"""Create a 7-day preparation plan for a software engineer to learn these skills: {skills_str}

Return ONLY a JSON array of exactly 7 short task strings (one per day, max 15 words each):
["Day 1 task", "Day 2 task", "Day 3 task", "Day 4 task", "Day 5 task", "Day 6 task", "Day 7 task"]"""

    try:
        raw   = generate(prompt, temperature=0.4, max_tokens=350)
        tasks = extract_json_array(raw)
        if tasks and len(tasks) >= 3:
            while len(tasks) < 7:
                tasks.append(f"Day {len(tasks) + 1}: Review and practice mock problems")
            return [str(t).strip() for t in tasks[:7]]
    except Exception:
        pass

    return _fallback_plan(missing_skills)


def _fallback_plan(missing_skills: list[str]) -> list[str]:
    plan = []
    skills_cycle = missing_skills * 7
    day_topics = skills_cycle[:7]
    labels = ["Study fundamentals of", "Practice problems on", "Deep dive into",
              "Build a small project using", "Review edge cases in",
              "Do mock interview questions on", "Final revision and practice of"]
    for i, (label, skill) in enumerate(zip(labels, day_topics)):
        plan.append(f"Day {i + 1}: {label} {skill}")
    return plan


def compare_with_analytics(
    required_skills: list[str],
    topic_breakdown: dict,
) -> dict:
    """
    Map required_skills → our topic names → look up user scores.
    Returns match_scores dict and missing_skills list.
    """
    match_scores = {}
    jd_text_lower = " ".join(required_skills).lower()

    # Map each required skill to a known topic using our keyword map
    matched_topics = set()
    for kw, topic in SKILL_TOPIC_MAP.items():
        if kw in jd_text_lower:
            matched_topics.add(topic)

    if not matched_topics:
        # Fall back: treat each skill string directly as a topic name
        matched_topics = {s.title() for s in required_skills}

    db_topic_keys = list(topic_breakdown.keys())

    for topic in matched_topics:
        score = None
        # 1. Direct substring match
        for db_topic, db_score in topic_breakdown.items():
            if topic.lower() in db_topic.lower() or db_topic.lower() in topic.lower():
                score = db_score
                break
        # 2. Fuzzy match via difflib if no direct match
        if score is None and db_topic_keys:
            close = difflib.get_close_matches(topic, db_topic_keys, n=1, cutoff=0.6)
            if close:
                score = topic_breakdown[close[0]]
        match_scores[topic] = score  # None = not yet practiced

    missing_skills = [t for t, s in match_scores.items() if s is None or s < 50]
    return {"match_scores": match_scores, "missing_skills": missing_skills}
