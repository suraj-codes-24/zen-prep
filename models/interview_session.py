from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    interview_type      = Column(String, nullable=False)        # technical | hr
    subject_id          = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    topic_id            = Column(Integer, ForeignKey("topics.id"), nullable=True)
    subtopic_id         = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    difficulty          = Column(String, nullable=False)
    status              = Column(String, default="active")      # active | completed | abandoned
    total_questions     = Column(Integer, default=0)
    questions_answered  = Column(Integer, default=0)
    skips_used          = Column(Integer, default=0)
    start_time          = Column(DateTime, default=datetime.utcnow)
    end_time            = Column(DateTime, nullable=True)
    final_score         = Column(Float, nullable=True)

    user     = relationship("User", backref="sessions")
    subject  = relationship("Subject")
    topic    = relationship("Topic")
    subtopic = relationship("Subtopic")
