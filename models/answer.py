from sqlalchemy import Column, Integer, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Answer(Base):
    __tablename__ = "answers"

    id               = Column(Integer, primary_key=True, index=True)
    session_id       = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id      = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer      = Column(Text, nullable=False)

    # NLP breakdown (all 0-100)
    semantic_score   = Column(Float, nullable=True)
    keyword_score    = Column(Float, nullable=True)
    depth_score      = Column(Float, nullable=True)
    structure_score  = Column(Float, nullable=True)
    nlp_score        = Column(Float, nullable=True)   # weighted NLP total

    # Multimodal
    voice_score      = Column(Float, nullable=True)
    face_score       = Column(Float, nullable=True)
    total_score      = Column(Float, nullable=True)   # final weighted score

    # AI feedback text
    feedback         = Column(Text, nullable=True)

    session  = relationship("InterviewSession", backref="answers")
    question = relationship("Question", backref="answers")
