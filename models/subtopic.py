from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Subtopic(Base):
    __tablename__ = "subtopics"

    id       = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    name     = Column(String, nullable=False, index=True)

    topic = relationship("Topic", back_populates="subtopics")

    def __repr__(self):
        return f"<Subtopic(id={self.id}, name='{self.name}', topic_id={self.topic_id})>"
