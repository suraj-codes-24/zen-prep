from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# ── Hierarchy Responses ──────────────────────────────────────────────────────

class SubjectResponse(BaseModel):
    id: int
    name: str
    type: str = "technical"        # ← added
    topic_count: int = 0
    question_count: int = 0

class TopicResponse(BaseModel):
    id: int
    name: str
    subject_id: int
    subtopic_count: int = 0
    question_count: int = 0

class SubtopicResponse(BaseModel):
    id: int
    name: str
    topic_id: int
    question_count: int = 0


# ── Interview ────────────────────────────────────────────────────────────────

class StartInterviewRequest(BaseModel):
    interview_type: str
    subject_id: int
    topic_id: Optional[int] = None
    subtopic_id: Optional[int] = None
    difficulty: str


class StartInterviewResponse(BaseModel):
    session_id: int
    interview_type: str
    subject_name: str
    topic_name: Optional[str] = None
    difficulty: str
    start_time: datetime
    message: str

    class Config:
        from_attributes = True


class QuestionResponse(BaseModel):
    question_id: int
    title: str
    question_text: str
    type: str
    subject_name: str
    topic_name: str
    subtopic_name: str
    difficulty: str

    class Config:
        from_attributes = True


class QuestionListItem(BaseModel):
    question_id: int
    title: str
    difficulty: str
    type: str
    companies: str = ""
    tags: str = ""

    class Config:
        from_attributes = True