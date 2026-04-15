"""
Generate a PDF interview report using reportlab.
"""
import io
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
)

# ── Colour palette ────────────────────────────────────────────────────────────
INDIGO  = colors.HexColor("#6366F1")
GREEN   = colors.HexColor("#22C55E")
AMBER   = colors.HexColor("#F59E0B")
RED     = colors.HexColor("#EF4444")
DARK    = colors.HexColor("#0F172A")
GREY    = colors.HexColor("#64748B")
LIGHT   = colors.HexColor("#F1F5F9")


def _score_color(score: float):
    if score >= 70: return GREEN
    if score >= 45: return AMBER
    return RED


def generate_session_report(
    session: dict,
    answers: list[dict],
    coaching: dict,
    candidate_name: str = "Candidate",
) -> bytes:
    """
    Build a PDF report and return it as bytes.

    session  : dict with keys subject_name, difficulty, start_time, final_score
    answers  : list of answer dicts (question_text, user_answer, scores, feedback)
    coaching : dict with strengths, weaknesses, advice lists
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm,  bottomMargin=2*cm,
    )

    styles  = getSampleStyleSheet()
    story   = []

    # ── Helper styles ─────────────────────────────────────────────────────────
    h1 = ParagraphStyle("h1", fontSize=22, fontName="Helvetica-Bold",
                        textColor=INDIGO,  spaceAfter=4)
    h2 = ParagraphStyle("h2", fontSize=14, fontName="Helvetica-Bold",
                        textColor=DARK,    spaceAfter=6, spaceBefore=14)
    h3 = ParagraphStyle("h3", fontSize=11, fontName="Helvetica-Bold",
                        textColor=INDIGO,  spaceAfter=4, spaceBefore=8)
    body = ParagraphStyle("body", fontSize=10, fontName="Helvetica",
                          textColor=DARK,    spaceAfter=4, leading=15)
    small = ParagraphStyle("small", fontSize=9, fontName="Helvetica",
                           textColor=GREY,   spaceAfter=2, leading=13)
    label = ParagraphStyle("label", fontSize=8, fontName="Helvetica-Bold",
                           textColor=GREY,   spaceAfter=2, leading=10)
    def divider():
        return HRFlowable(width="100%", thickness=0.5,
                          color=colors.HexColor("#E2E8F0"), spaceAfter=10)

    # ── Title block ───────────────────────────────────────────────────────────
    story.append(Paragraph("AI Interview Report", h1))
    story.append(divider())

    # ── Metadata table ────────────────────────────────────────────────────────
    date_str = ""
    if session.get("start_time"):
        try:
            dt = datetime.fromisoformat(str(session["start_time"]))
            date_str = dt.strftime("%d %b %Y, %H:%M")
        except Exception:
            date_str = str(session["start_time"])[:16]

    avg_score = session.get("final_score")
    if avg_score is None and answers:
        scores = [a.get("total_score") or 0 for a in answers]
        avg_score = round(sum(scores) / len(scores), 1)

    meta_data = [
        ["Candidate",    candidate_name,
         "Subject",      session.get("subject_name", session.get("subject_id", "—"))],
        ["Date",         date_str,
         "Difficulty",   str(session.get("difficulty", "—")).title()],
        ["Questions",    str(session.get("questions_answered", len(answers))),
         "Overall Score", f"{round(avg_score, 1) if avg_score else '—'} / 100"],
    ]
    meta_table = Table(meta_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTNAME",  (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",  (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTSIZE",  (0,0), (-1,-1), 9),
        ("TEXTCOLOR", (0,0), (0,-1), GREY),
        ("TEXTCOLOR", (2,0), (2,-1), GREY),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
        ("BOX",       (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID", (0,0), (-1,-1), 0.3, colors.HexColor("#E2E8F0")),
        ("PADDING",   (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 16))

    # ── Coaching summary ──────────────────────────────────────────────────────
    story.append(Paragraph("AI Coaching Summary", h2))
    story.append(divider())

    for section, color in [
        ("strengths",  GREEN),
        ("weaknesses", AMBER),
        ("advice",     INDIGO),
    ]:
        items = (coaching or {}).get(section, [])
        if not items:
            continue
        icon = {"strengths": "✓ Strengths", "weaknesses": "⚠ Weaknesses", "advice": "💡 Advice"}[section]
        story.append(Paragraph(icon, ParagraphStyle(
            f"sec_{section}", fontSize=10, fontName="Helvetica-Bold",
            textColor=color, spaceAfter=3, spaceBefore=8,
        )))
        for item in items:
            story.append(Paragraph(f"• {item}", body))

    story.append(Spacer(1, 16))

    # ── Q&A timeline ─────────────────────────────────────────────────────────
    story.append(Paragraph("Question & Answer Breakdown", h2))
    story.append(divider())

    for i, ans in enumerate(answers, 1):
        total  = ans.get("total_score")  or 0
        nlp    = ans.get("nlp_score")    or 0
        voice  = ans.get("voice_score")  or 0
        face   = ans.get("face_score")   or 0
        q_text = ans.get("question_text", "—")
        a_text = ans.get("user_answer",   "—")
        fb     = ans.get("feedback",      "")

        # Question header row
        header_data = [[
            Paragraph(f"Q{i}", ParagraphStyle("qnum", fontSize=10, fontName="Helvetica-Bold",
                                               textColor=INDIGO)),
            Paragraph(q_text, ParagraphStyle("qtxt", fontSize=10, fontName="Helvetica",
                                              textColor=DARK, leading=14)),
            Paragraph(f"Score: {round(total)}/100", ParagraphStyle(
                "qscore", fontSize=10, fontName="Helvetica-Bold",
                textColor=_score_color(total), alignment=2)),
        ]]
        hdr_table = Table(header_data, colWidths=[1*cm, 13*cm, 3*cm])
        hdr_table.setStyle(TableStyle([
            ("VALIGN",     (0,0), (-1,-1), "TOP"),
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
            ("BOX",        (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ("PADDING",    (0,0), (-1,-1), 6),
        ]))
        story.append(hdr_table)

        # Answer text
        story.append(Paragraph(
            f"<b>Answer:</b> {a_text[:600]}{'…' if len(a_text) > 600 else ''}",
            ParagraphStyle("ans", fontSize=9, fontName="Helvetica",
                           textColor=colors.HexColor("#374151"), leading=14,
                           leftIndent=8, spaceAfter=3, spaceBefore=3)
        ))

        # Scores mini-row
        scores_data = [[
            f"NLP: {round(nlp)}%",
            f"Voice: {round(voice)}%",
            f"Face: {round(face)}%",
        ]]
        sc_table = Table(scores_data, colWidths=[5.67*cm, 5.67*cm, 5.66*cm])
        sc_table.setStyle(TableStyle([
            ("FONTNAME",   (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("TEXTCOLOR",  (0,0), (-1,-1), GREY),
            ("ALIGN",      (0,0), (-1,-1), "CENTER"),
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
            ("BOX",        (0,0), (-1,-1), 0.4, colors.HexColor("#E2E8F0")),
            ("PADDING",    (0,0), (-1,-1), 4),
        ]))
        story.append(sc_table)

        # Feedback
        if fb:
            story.append(Paragraph(
                f"<i>💡 {fb[:300]}</i>",
                ParagraphStyle("fb", fontSize=8, fontName="Helvetica-Oblique",
                               textColor=GREY, leftIndent=8, spaceAfter=3,
                               spaceBefore=2, leading=12)
            ))

        story.append(Spacer(1, 8))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    story.append(divider())
    story.append(Paragraph(
        "Generated by AI Interview Simulator · Keep practising!",
        ParagraphStyle("footer", fontSize=8, fontName="Helvetica",
                       textColor=GREY, alignment=1)
    ))

    doc.build(story)
    return buf.getvalue()


# ── Communication Test Report ─────────────────────────────────────────────────

SECTION_LABELS = {
    "A": "Read Sentences",    "B": "Repeat Sentences",
    "C": "Short Answer",      "D": "Arrange Sentences",
    "E": "Story Retelling",   "F": "Open Questions",
    "G": "Describe Image",    "H": "Listening Comprehension",
}

BAND_DESCRIPTIONS = {
    "Fluent":      "Near-native fluency. Handles complex topics with ease.",
    "Advanced":    "Strong communicator. Minor errors do not impede understanding.",
    "Proficient":  "Competent speaker. Can handle most workplace conversations.",
    "Developing":  "Basic communication ability. Needs practice with complex topics.",
    "Beginner":    "Limited spoken ability. Significant improvement needed.",
}


def generate_comm_report(
    session: dict,
    section_details: list,
    candidate_name: str = "Candidate",
) -> bytes:
    """Build a PDF report for a communication test session."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    story = []

    h1 = ParagraphStyle("ch1", fontSize=22, fontName="Helvetica-Bold",
                         textColor=INDIGO, spaceAfter=4)
    h2 = ParagraphStyle("ch2", fontSize=14, fontName="Helvetica-Bold",
                         textColor=DARK, spaceAfter=6, spaceBefore=14)
    body = ParagraphStyle("cbody", fontSize=10, fontName="Helvetica",
                           textColor=DARK, spaceAfter=4, leading=15)
    small = ParagraphStyle("csmall", fontSize=9, fontName="Helvetica",
                            textColor=GREY, spaceAfter=2, leading=13)

    def divider():
        return HRFlowable(width="100%", thickness=0.5,
                          color=colors.HexColor("#E2E8F0"), spaceAfter=10)

    # ── Title ────────────────────────────────────────────────────────────────
    story.append(Paragraph("Communication Test Report", h1))
    story.append(divider())

    # ── Metadata ─────────────────────────────────────────────────────────────
    overall = session.get("overall_score", 0)
    band = session.get("band", "N/A")
    date_str = ""
    if session.get("start_time"):
        try:
            dt = datetime.fromisoformat(str(session["start_time"]))
            date_str = dt.strftime("%d %b %Y, %H:%M")
        except Exception:
            date_str = str(session["start_time"])[:16]

    duration = session.get("duration_minutes", "—")

    meta_data = [
        ["Candidate", candidate_name, "Date", date_str],
        ["Overall Score", f"{round(overall, 1)} / 100", "Band", band],
        ["Questions", str(session.get("questions_answered", 70)),
         "Duration", f"{duration} min" if duration else "—"],
    ]
    meta_table = Table(meta_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTNAME",  (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",  (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTSIZE",  (0,0), (-1,-1), 9),
        ("TEXTCOLOR", (0,0), (0,-1), GREY),
        ("TEXTCOLOR", (2,0), (2,-1), GREY),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
        ("BOX",       (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID", (0,0), (-1,-1), 0.3, colors.HexColor("#E2E8F0")),
        ("PADDING",   (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Band description
    band_desc = BAND_DESCRIPTIONS.get(band, "")
    if band_desc:
        story.append(Paragraph(f"<b>{band}</b>: {band_desc}", body))
    story.append(Spacer(1, 12))

    # ── Section scores table ─────────────────────────────────────────────────
    story.append(Paragraph("Section-by-Section Breakdown", h2))
    story.append(divider())

    section_scores = session.get("section_scores", {})
    table_data = [["Section", "Name", "Score", "Rating"]]
    for s in ["A", "B", "C", "D", "E", "F", "G", "H"]:
        sc = section_scores.get(s, 0)
        if sc >= 75:
            rating = "Strong"
        elif sc >= 55:
            rating = "Good"
        elif sc >= 40:
            rating = "Fair"
        else:
            rating = "Weak"
        table_data.append([
            s,
            SECTION_LABELS.get(s, s),
            f"{round(sc, 1)}%",
            rating,
        ])

    sec_table = Table(table_data, colWidths=[2*cm, 6*cm, 3*cm, 6*cm])
    sec_table.setStyle(TableStyle([
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("BACKGROUND",    (0,0), (-1,0), INDIGO),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
        ("BOX",           (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID",     (0,0), (-1,-1), 0.3, colors.HexColor("#E2E8F0")),
        ("PADDING",       (0,0), (-1,-1), 6),
        ("ALIGN",         (2,0), (2,-1), "CENTER"),
    ]))
    story.append(sec_table)
    story.append(Spacer(1, 16))

    # ── Strengths & Weaknesses ───────────────────────────────────────────────
    story.append(Paragraph("Recommendations", h2))
    story.append(divider())

    # Sort sections by score
    sorted_sections = sorted(section_scores.items(), key=lambda x: x[1], reverse=True)
    strong = sorted_sections[:3]
    weak = sorted_sections[-3:] if len(sorted_sections) >= 4 else []

    if strong:
        story.append(Paragraph("✓ Strongest Areas", ParagraphStyle(
            "cstr", fontSize=10, fontName="Helvetica-Bold",
            textColor=GREEN, spaceAfter=3, spaceBefore=6)))
        for s, sc in strong:
            story.append(Paragraph(
                f"• {SECTION_LABELS.get(s, s)} — {round(sc, 1)}%", body))

    if weak:
        story.append(Paragraph("⚠ Areas for Improvement", ParagraphStyle(
            "cweak", fontSize=10, fontName="Helvetica-Bold",
            textColor=AMBER, spaceAfter=3, spaceBefore=8)))
        for s, sc in weak:
            tips = {
                "A": "Practice reading aloud daily to improve fluency and pronunciation.",
                "B": "Listen to English podcasts and repeat sentences to build auditory memory.",
                "C": "Expand your vocabulary with everyday English terms.",
                "D": "Study English grammar rules for sentence structure.",
                "E": "Practice summarizing news articles or stories in your own words.",
                "F": "Prepare frameworks for common open-ended questions (STAR method).",
                "G": "Practice describing photos and scenes using varied vocabulary.",
                "H": "Improve listening by watching English content without subtitles.",
            }
            story.append(Paragraph(
                f"• {SECTION_LABELS.get(s, s)} ({round(sc, 1)}%) — {tips.get(s, '')}",
                body))

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(divider())
    story.append(Paragraph(
        f"Generated by ZenPrep · {datetime.utcnow().strftime('%d %b %Y %H:%M')} UTC",
        ParagraphStyle("cfooter", fontSize=8, fontName="Helvetica",
                       textColor=GREY, alignment=1)))

    doc.build(story)
    return buf.getvalue()


# ── GD Report ─────────────────────────────────────────────────────────────────

GD_BAND_DESCRIPTIONS = {
    "Exceptional":    "Outstanding performance. Strong leadership, clear arguments, and excellent teamwork.",
    "Proficient":     "Solid performer. Good participation with well-structured contributions.",
    "Developing":     "Shows promise. Participation and argument quality need further development.",
    "Beginner":       "Limited contribution. Focus on entering discussions and building structured points.",
    "Needs Practice": "Very low engagement. Regular GD practice is strongly recommended.",
}

GD_DIM_NOTES = {
    "participation": "How actively you spoke relative to the group.",
    "leadership":    "How often you introduced new directions or reframed the discussion.",
    "listening":     "How well you built on or referenced what others said.",
    "idea_quality":  "Depth, vocabulary variety, and structure of your arguments.",
    "teamwork":      "Use of collaborative language and group-oriented contributions.",
}


def generate_gd_report(session: dict, candidate_name: str = "Candidate") -> bytes:
    """Build a PDF report for a GD session from get_gd_results() output."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm,  bottomMargin=2*cm,
    )

    h1   = ParagraphStyle("gdh1",  fontSize=22, fontName="Helvetica-Bold",  textColor=INDIGO, spaceAfter=4)
    h2   = ParagraphStyle("gdh2",  fontSize=13, fontName="Helvetica-Bold",  textColor=DARK,   spaceAfter=6, spaceBefore=14)
    body = ParagraphStyle("gdbody",fontSize=9,  fontName="Helvetica",       textColor=DARK,   spaceAfter=4, leading=14)
    small= ParagraphStyle("gdsmall",fontSize=8, fontName="Helvetica",       textColor=GREY,   spaceAfter=2, leading=12)

    def divider():
        return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"),
                          spaceAfter=8, spaceBefore=4)

    story = []

    topic      = session.get("topic", {})
    scores_d   = session.get("scores", {})
    coaching   = session.get("coaching", {})
    content    = session.get("content_analysis", {})
    sentiment  = session.get("sentiment", {})
    p_intel    = session.get("participation_intelligence", {})
    transcript = session.get("transcript", [])
    overall    = float(session.get("overall_score", 0) or 0)
    band       = session.get("band", "N/A")
    started    = session.get("started_at", "")

    date_str = ""
    if started:
        try:
            date_str = datetime.fromisoformat(started).strftime("%b %d, %Y %H:%M")
        except Exception:
            date_str = str(started)[:16]

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph("Group Discussion Report", h1))
    story.append(divider())

    band_color = GREEN if overall >= 70 else (AMBER if overall >= 45 else RED)
    meta = [
        ["Candidate", candidate_name,                    "Topic",    topic.get("title", "—")],
        ["Date",      date_str,                          "Category", topic.get("category", "—")],
        ["Duration",  f'{session.get("duration_mins","—")} min', "Bots", str(session.get("bot_count","—"))],
        ["Score",     f"{overall:.0f} / 100",            "Band",     band],
    ]
    meta_t = Table(meta, colWidths=[3*cm, 6.5*cm, 3*cm, 4*cm])
    meta_t.setStyle(TableStyle([
        ("FONTNAME",       (0,0),(0,-1),  "Helvetica-Bold"),
        ("FONTNAME",       (2,0),(2,-1),  "Helvetica-Bold"),
        ("FONTNAME",       (1,0),(-1,-1), "Helvetica"),
        ("FONTSIZE",       (0,0),(-1,-1), 9),
        ("TEXTCOLOR",      (1,3),(1,3),   band_color),
        ("TEXTCOLOR",      (3,3),(3,3),   band_color),
        ("ROWBACKGROUNDS", (0,0),(-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
        ("BOX",            (0,0),(-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID",      (0,0),(-1,-1), 0.3, colors.HexColor("#E2E8F0")),
        ("PADDING",        (0,0),(-1,-1), 6),
    ]))
    story.append(meta_t)
    band_desc = GD_BAND_DESCRIPTIONS.get(band, "")
    if band_desc:
        story.append(Spacer(1, 4))
        story.append(Paragraph(band_desc, small))

    # ── Dimensions ────────────────────────────────────────────────────────────
    story.append(Paragraph("Performance Dimensions", h2))
    story.append(divider())
    dim_rows = [["Dimension", "Score", "What it measures"]]
    for key, label in [
        ("participation","Participation"), ("leadership","Leadership"),
        ("listening","Listening"), ("idea_quality","Idea Quality"), ("teamwork","Teamwork"),
    ]:
        val = scores_d.get(key, 0) or 0
        dim_rows.append([label, f"{val:.0f}%", GD_DIM_NOTES.get(key, "")])
    dim_t = Table(dim_rows, colWidths=[4*cm, 2.5*cm, 10*cm])
    dim_t.setStyle(TableStyle([
        ("FONTNAME",       (0,0),(-1,0),  "Helvetica-Bold"),
        ("FONTNAME",       (0,1),(-1,-1), "Helvetica"),
        ("FONTSIZE",       (0,0),(-1,-1), 9),
        ("BACKGROUND",     (0,0),(-1,0),  INDIGO),
        ("TEXTCOLOR",      (0,0),(-1,0),  colors.white),
        ("ROWBACKGROUNDS", (0,1),(-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
        ("BOX",            (0,0),(-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID",      (0,0),(-1,-1), 0.3, colors.HexColor("#E2E8F0")),
        ("PADDING",        (0,0),(-1,-1), 6),
        ("ALIGN",          (1,0),(1,-1),  "CENTER"),
    ]))
    story.append(dim_t)

    # ── Stats ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    dom   = p_intel.get("dominance_ratio", 0) or 0
    style = p_intel.get("engagement_style", "—")
    stats = [
        ["Arguments", "Questions Asked", "Interruptions", "Share of Voice", "Engagement"],
        [
            str(scores_d.get("arguments_count", 0) or 0),
            str(scores_d.get("questions_asked",  0) or 0),
            str(scores_d.get("interjections",    0) or 0),
            f"{dom:.0f}%",
            style,
        ],
    ]
    stats_t = Table(stats, colWidths=[3.2*cm]*5)
    stats_t.setStyle(TableStyle([
        ("FONTNAME",   (0,0),(-1,0),  "Helvetica-Bold"),
        ("FONTNAME",   (0,1),(-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,0),(-1,-1), 9),
        ("BACKGROUND", (0,0),(-1,0),  colors.HexColor("#EEF2FF")),
        ("ALIGN",      (0,0),(-1,-1), "CENTER"),
        ("BOX",        (0,0),(-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID",  (0,0),(-1,-1), 0.3, colors.HexColor("#E2E8F0")),
        ("PADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(stats_t)
    rec = p_intel.get("recommendation", "")
    if rec:
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"Tip: {rec}", small))

    # ── Speaking Style ────────────────────────────────────────────────────────
    story.append(Paragraph("Speaking Style", h2))
    story.append(divider())
    avg_voice = session.get("avg_voice_score")
    style_rows = [
        ["Tone", "Sentiment", "Confidence", "Avg Voice Score"],
        [
            sentiment.get("tone", "—").capitalize(),
            sentiment.get("sentiment", "—").capitalize(),
            sentiment.get("confidence_level", "—").capitalize(),
            f"{avg_voice:.0f} / 100" if avg_voice is not None else "N/A",
        ],
    ]
    style_t = Table(style_rows, colWidths=[4*cm]*4)
    style_t.setStyle(TableStyle([
        ("FONTNAME",   (0,0),(-1,0),  "Helvetica-Bold"),
        ("FONTNAME",   (0,1),(-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,0),(-1,-1), 9),
        ("BACKGROUND", (0,0),(-1,0),  colors.HexColor("#EEF2FF")),
        ("ALIGN",      (0,0),(-1,-1), "CENTER"),
        ("BOX",        (0,0),(-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID",  (0,0),(-1,-1), 0.3, colors.HexColor("#E2E8F0")),
        ("PADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(style_t)

    # ── AI Coaching ───────────────────────────────────────────────────────────
    story.append(Paragraph("AI Coaching", h2))
    story.append(divider())
    strengths = coaching.get("strengths", "")
    growth    = coaching.get("growth", "")
    actions   = coaching.get("action_items", "")
    if strengths:
        story.append(Paragraph("Strengths", ParagraphStyle("gds", fontSize=10,
            fontName="Helvetica-Bold", textColor=GREEN, spaceAfter=3)))
        for s in strengths.split(". "):
            s = s.strip()
            if len(s) > 8:
                story.append(Paragraph(f"• {s}.", body))
    if growth:
        story.append(Spacer(1, 5))
        story.append(Paragraph("Areas for Growth", ParagraphStyle("gdg", fontSize=10,
            fontName="Helvetica-Bold", textColor=AMBER, spaceAfter=3)))
        for s in growth.split(". "):
            s = s.strip()
            if len(s) > 8:
                story.append(Paragraph(f"• {s}.", body))
    if actions:
        story.append(Spacer(1, 5))
        story.append(Paragraph("Action Items", ParagraphStyle("gda", fontSize=10,
            fontName="Helvetica-Bold", textColor=INDIGO, spaceAfter=3)))
        for line in actions.split("  "):
            line = line.strip()
            if line:
                story.append(Paragraph(line, body))

    # ── Content Analysis ──────────────────────────────────────────────────────
    keywords  = content.get("keywords", [])
    arguments = content.get("arguments", [])
    relevance = float(content.get("relevance_score", 0) or 0)
    if keywords or arguments:
        story.append(Paragraph("Content Analysis", h2))
        story.append(divider())
        if arguments:
            story.append(Paragraph("Main Arguments", ParagraphStyle("gdma", fontSize=10,
                fontName="Helvetica-Bold", textColor=DARK, spaceAfter=3)))
            for i, arg in enumerate(arguments[:5], 1):
                story.append(Paragraph(f"{i}. {arg}", body))
            story.append(Spacer(1, 4))
        if keywords:
            kw_str = "  ·  ".join(kw["word"] for kw in keywords[:10])
            story.append(Paragraph(f"<b>Top Keywords:</b>  {kw_str}", body))
            story.append(Paragraph(f"<b>Topic Relevance:</b>  {relevance:.0f}%", body))

    # ── Transcript ────────────────────────────────────────────────────────────
    if transcript:
        story.append(Paragraph("Discussion Transcript", h2))
        story.append(divider())
        for turn in transcript:
            spk     = turn.get("speaker", "?")
            text    = turn.get("text", "")
            ts      = turn.get("timestamp", "")
            is_user = spk == "user"
            time_str = ""
            if ts:
                try:
                    time_str = datetime.fromisoformat(ts).strftime("%H:%M:%S")
                except Exception:
                    time_str = str(ts)[11:19] if len(str(ts)) > 19 else ""
            label = "You" if is_user else spk
            story.append(Paragraph(
                f"<b>{label}</b>  <font color='#94A3B8'>{time_str}</font>",
                ParagraphStyle("gdspk", fontSize=8, fontName="Helvetica-Bold",
                               textColor=INDIGO if is_user else GREY,
                               spaceAfter=1, spaceBefore=6),
            ))
            story.append(Paragraph(text[:400], ParagraphStyle(
                "gdturn", fontSize=8, fontName="Helvetica", textColor=DARK,
                spaceAfter=2, leading=12, leftIndent=8,
            )))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 12))
    story.append(divider())
    story.append(Paragraph(
        f"Generated by ZenPrep · {datetime.utcnow().strftime('%d %b %Y %H:%M')} UTC",
        ParagraphStyle("gdfooter", fontSize=8, fontName="Helvetica",
                       textColor=GREY, alignment=1),
    ))

    doc.build(story)
    return buf.getvalue()
