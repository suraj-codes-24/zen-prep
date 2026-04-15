from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class GDTopic(Base):
    __tablename__ = "gd_topics"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    category    = Column(String, nullable=False)    # Technology | Business | Society | Policy
    difficulty  = Column(String, default="medium")  # easy | medium | hard
    description = Column(Text, nullable=True)


class GDSession(Base):
    __tablename__ = "gd_sessions"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id      = Column(Integer, ForeignKey("gd_topics.id"), nullable=False)
    bot_count     = Column(Integer, default=3)
    duration_mins = Column(Integer, default=10)
    status        = Column(String, default="active")   # active | completed
    started_at    = Column(DateTime, default=datetime.utcnow)
    ended_at      = Column(DateTime, nullable=True)
    overall_score = Column(Float, nullable=True)

    user  = relationship("User")
    topic = relationship("GDTopic")
    turns = relationship("GDTurn", backref="session", order_by="GDTurn.timestamp")
    score = relationship("GDScore", uselist=False, backref="session")


class GDTurn(Base):
    __tablename__ = "gd_turns"

    id                 = Column(Integer, primary_key=True, index=True)
    session_id         = Column(Integer, ForeignKey("gd_sessions.id"), nullable=False)
    speaker            = Column(String, nullable=False)    # "user" | bot name
    text               = Column(Text, nullable=False)
    duration_sec       = Column(Float, nullable=True)
    raised_hand        = Column(Boolean, default=False)    # True = user raised hand, False = force/auto
    timestamp          = Column(DateTime, default=datetime.utcnow)
    # Voice scoring (user turns only)
    voice_pace         = Column(Float, nullable=True)      # WPM
    voice_filler_count = Column(Integer, nullable=True)    # count of uh/um/like
    voice_pause_avg    = Column(Float, nullable=True)      # avg pause seconds
    voice_clarity      = Column(Float, nullable=True)      # whisper confidence 0-100
    voice_score        = Column(Float, nullable=True)      # weighted composite 0-100


class GDScore(Base):
    __tablename__ = "gd_scores"

    id               = Column(Integer, primary_key=True, index=True)
    session_id       = Column(Integer, ForeignKey("gd_sessions.id"), nullable=False)
    participation    = Column(Float, nullable=True)
    leadership       = Column(Float, nullable=True)
    listening        = Column(Float, nullable=True)
    idea_quality     = Column(Float, nullable=True)
    teamwork         = Column(Float, nullable=True)
    arguments_count  = Column(Integer, default=0)
    interjections    = Column(Integer, default=0)
    questions_asked  = Column(Integer, default=0)
    ai_strengths       = Column(Text, nullable=True)
    ai_growth          = Column(Text, nullable=True)
    ai_action_items    = Column(Text, nullable=True)
    # Voice aggregate
    avg_voice_score    = Column(Float, nullable=True)
    # Content analysis
    content_keywords   = Column(Text, nullable=True)   # JSON list of {word, count}
    content_arguments  = Column(Text, nullable=True)   # JSON list of argument strings
    relevance_score    = Column(Float, nullable=True)
    # Sentiment
    sentiment_tone     = Column(String, nullable=True) # assertive | neutral | hesitant
    sentiment_polarity = Column(String, nullable=True) # positive | neutral | negative
    confidence_level   = Column(String, nullable=True) # high | medium | low
    # Participation intelligence
    dominance_ratio    = Column(Float, nullable=True)
    interruption_rate  = Column(Float, nullable=True)
    engagement_style   = Column(String, nullable=True) # Dominant | Balanced | Passive | Observer
