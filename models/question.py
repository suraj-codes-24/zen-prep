from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Question(Base):
    __tablename__ = "questions"

    id               = Column(Integer, primary_key=True, index=True)
    subject_id       = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic_id         = Column(Integer, ForeignKey("topics.id"), nullable=False)
    subtopic_id      = Column(Integer, ForeignKey("subtopics.id"), nullable=False)
    title            = Column(String, nullable=False)
    difficulty       = Column(String, index=True)   # beginner | intermediate | advanced | expert
    type             = Column(String)                # technical | hr
    question_text    = Column(Text)
    ideal_answer     = Column(Text)
    tags             = Column(String, default="")
    companies        = Column(String, default="")
    time_complexity  = Column(String, default="N/A")
    space_complexity = Column(String, default="N/A")

    subject  = relationship("Subject")
    topic    = relationship("Topic")
    subtopic = relationship("Subtopic")
