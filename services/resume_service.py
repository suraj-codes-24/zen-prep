import fitz  # PyMuPDF
from services.ollama_utils import generate, extract_json_object, OllamaUnavailable


def extract_text(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF file given its raw bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def analyse_resume(pdf_bytes: bytes, target_role=None) -> dict:
    """
    Full resume analysis pipeline:
    1. Extract text from PDF
    2. Ask Ollama for: skills, ats_score, suggestions, questions
    Optionally scores against a target_role for role-specific feedback.
    Returns structured dict.
    """
    resume_text = extract_text(pdf_bytes)

    if not resume_text or len(resume_text) < 50:
        return {
            "ats_score": 0,
            "skills": [],
            "suggestions": ["Could not extract text from the PDF. Please upload a text-based PDF."],
            "questions": [],
            "raw_text_preview": "",
            "target_role": target_role,
        }

    # Truncate to avoid overloading the context window
    truncated = resume_text[:3000]

    role_context = ""
    if target_role and target_role.strip():
        role_context = f"\nTarget Role: {target_role.strip()}\nScore the resume specifically for this role. Suggestions should focus on gaps for this role.\n"

    prompt = f"""You are an expert technical recruiter and ATS system.

Analyse the following resume and respond ONLY with valid JSON.
{role_context}
Resume:
{truncated}

Respond with this exact JSON format:
{{
  "ats_score": <integer 0-100 — overall ATS compatibility{' for the target role' if role_context else ''}>,
  "skills": [<list of up to 12 technical skills found>],
  "suggestions": [<list of 3-5 short improvement suggestions{' specific to the target role' if role_context else ''}>],
  "questions": [
    "<interview question based on resume project or skill 1>",
    "<interview question based on resume project or skill 2>",
    "<interview question based on resume project or skill 3>",
    "<interview question based on resume project or skill 4>",
    "<interview question based on resume project or skill 5>"
  ]
}}

Rules:
- Output ONLY the JSON object, no explanation
- questions must reference specific projects or skills from the resume
- suggestions must be actionable and specific"""

    try:
        raw  = generate(prompt, temperature=0.3, max_tokens=600)
        data = extract_json_object(raw)
        if data:
            return {
                "ats_score":        int(data.get("ats_score", 60)),
                "skills":           data.get("skills",       [])[:12],
                "suggestions":      data.get("suggestions",  [])[:5],
                "questions":        data.get("questions",    [])[:5],
                "raw_text_preview": resume_text[:300],
                "target_role":      target_role,
            }
        return _fallback(resume_text)

    except OllamaUnavailable:
        return {
            "ats_score": 0, "skills": [], "questions": [],
            "suggestions": ["Ollama is not running. Start it with: ollama serve"],
            "raw_text_preview": resume_text[:300],
        }
    except Exception:
        return _fallback(resume_text)


def _fallback(resume_text: str) -> dict:
    """Rule-based extraction when Ollama is unavailable."""
    TECH_KEYWORDS = [
        "python", "javascript", "react", "fastapi", "django", "flask",
        "postgresql", "mysql", "mongodb", "docker", "git", "linux",
        "machine learning", "tensorflow", "pytorch", "java", "c++",
        "typescript", "node.js", "aws", "redis", "kubernetes",
    ]
    text_lower = resume_text.lower()
    skills = [k for k in TECH_KEYWORDS if k in text_lower]

    word_count = len(resume_text.split())
    ats_score = min(90, 40 + len(skills) * 4 + (20 if word_count > 200 else 0))

    return {
        "ats_score": ats_score,
        "skills": skills[:12],
        "suggestions": [
            "Add measurable outcomes to your project descriptions.",
            "Include a GitHub link for your projects.",
            "Quantify achievements (e.g. '30% performance improvement').",
        ],
        "questions": [
            "Can you walk me through one of your key projects?",
            "What technologies are you most comfortable with?",
            "Describe a challenging problem you solved recently.",
        ],
        "raw_text_preview": resume_text[:300],
    }
