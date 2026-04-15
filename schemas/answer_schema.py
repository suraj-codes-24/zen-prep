from pydantic import BaseModel, Field


# --- Request: Submit an answer ---
class SubmitAnswerRequest(BaseModel):
    session_id: int
    question_id: int
    user_answer: str
    voice_score: float = Field(0.0, ge=0.0, le=100.0)
    face_score: float = Field(0.0, ge=0.0, le=100.0)


# --- Response: Score breakdown ---
class SubmitAnswerResponse(BaseModel):
    answer_id: int | None
    session_id: int
    question_id: int
    user_answer: str
    semantic_score: float
    keyword_score: float
    depth_score: float
    structure_score: float
    nlp_score: float
    voice_score: float = 0.0
    face_score: float = 0.0
    total_score: float = 0.0
    feedback: str

    class Config:
        from_attributes = True
