from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class CommQuestion(Base):
    __tablename__ = "comm_questions"

    id            = Column(Integer, primary_key=True, index=True)
    section       = Column(String, nullable=False)          # A|B|C|D|E|F|G|H
    section_name  = Column(String, nullable=False)          # "Read Sentences", etc.
    prompt_text   = Column(Text, nullable=False)            # sentence/story/question shown
    ideal_answer  = Column(Text, default="")                # for scoring (transcript comparison)
    image_url     = Column(String, nullable=True)           # Section G only
    audio_text    = Column(Text, nullable=True)             # Section B/H: text for TTS
    time_limit    = Column(Integer, default=15)             # seconds allowed per question
    order_index   = Column(Integer, default=0)              # order within section
    difficulty    = Column(String, default="standard")


class CommSession(Base):
    __tablename__ = "comm_sessions"

    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id"), nullable=False)
    status             = Column(String, default="active")   # active | completed
    start_time         = Column(DateTime, default=datetime.utcnow)
    end_time           = Column(DateTime, nullable=True)
    total_questions    = Column(Integer, default=70)
    questions_answered = Column(Integer, default=0)
    current_section    = Column(String, default="A")
    current_index      = Column(Integer, default=0)
    question_ids       = Column(JSONB, default=dict)         # {"A": [1,2,3], "B": [4,5,...]}
    section_scores     = Column(JSONB, default=dict)        # {"A": 85.2, "B": 72.0, ...}
    overall_score      = Column(Float, nullable=True)
    band               = Column(String, nullable=True)      # Fluent|Advanced|Proficient|Developing|Beginner

    user    = relationship("User")
    answers = relationship("CommAnswer", backref="session")


class CommAnswer(Base):
    __tablename__ = "comm_answers"

    id               = Column(Integer, primary_key=True, index=True)
    session_id       = Column(Integer, ForeignKey("comm_sessions.id"), nullable=False)
    question_id      = Column(Integer, ForeignKey("comm_questions.id"), nullable=False)
    section          = Column(String, nullable=False)
    user_transcript  = Column(Text, nullable=True)

    # Voice metrics (from voice engine)
    pace_score       = Column(Float, nullable=True)
    filler_score     = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    silence_score    = Column(Float, nullable=True)
    energy_score     = Column(Float, nullable=True)
    fluency_score    = Column(Float, nullable=True)         # combined voice fluency

    # Enhanced voice quality columns
    pronunciation_score = Column(Float, nullable=True)
    intonation_score    = Column(Float, nullable=True)
    modulation_score    = Column(Float, nullable=True)
    rhythm_score        = Column(Float, nullable=True)
    stress_score        = Column(Float, nullable=True)

    # Content metrics (NLP / difflib)
    word_match_score     = Column(Float, nullable=True)
    keyword_match_score  = Column(Float, nullable=True)
    sentence_match_score = Column(Float, nullable=True)
    semantic_score       = Column(Float, nullable=True)
    depth_score          = Column(Float, nullable=True)

    # Final weighted score for this answer
    section_weighted_score = Column(Float, nullable=True)
    feedback             = Column(Text, nullable=True)
    time_taken           = Column(Float, nullable=True)     # seconds

    question = relationship("CommQuestion")
