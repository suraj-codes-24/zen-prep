from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from services.jd_service import extract_skills, compare_with_analytics, create_prep_plan
from services.analytics_service import get_user_analytics

router = APIRouter(prefix="/jd", tags=["JD Analyser"])


class JDAnalyseRequest(BaseModel):
    jd_text: str = Field(..., max_length=15000)


@router.post("/analyse")
def analyse_jd(
    data: JDAnalyseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyse a job description against the user's interview performance.
    Returns required skills, match scores, missing skills, and a 7-day prep plan.
    """
    if not data.jd_text or len(data.jd_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description is too short.")

    # 1. Extract skills from JD
    required_skills = extract_skills(data.jd_text)

    # 2. Fetch user's topic performance from analytics
    analytics = get_user_analytics(db=db, user_id=current_user.id)
    topic_breakdown = analytics.get("topic_breakdown", {})

    # 3. Compare required skills vs user performance
    comparison = compare_with_analytics(required_skills, topic_breakdown)

    # 4. Generate prep plan for missing/weak skills
    prep_plan = create_prep_plan(comparison["missing_skills"])

    return {
        "required_skills":  required_skills,
        "match_scores":     comparison["match_scores"],
        "missing_skills":   comparison["missing_skills"],
        "prep_plan":        prep_plan,
    }
