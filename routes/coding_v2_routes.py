from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from core.dependencies import get_current_user
from models.user import User
from services.coding_service import (
    get_companies,
    get_levels_for_company,
    get_company_progress,
    get_sets_by_company,
    start_coding_session,
    get_coding_session,
    get_active_coding_session,
    submit_solution,
    run_tests_only,
    LEVEL_TOPICS,
)

router = APIRouter(prefix="/coding", tags=["Coding V2"])


class StartCodingRequest(BaseModel):
    set_id: int


class SubmitCodeRequest(BaseModel):
    session_id: int
    problem_id: int
    code: str
    language: str = "python"


class RunCodeRequest(BaseModel):
    session_id: int
    problem_id: int
    code: str
    language: str = "python"


@router.get("/active")
def active_coding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if user has an active coding session."""
    result = get_active_coding_session(db, current_user.id)
    if not result:
        return {"active": False}
    return {"active": True, **result}


@router.get("/companies")
def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get distinct company names from coding sets."""
    return get_companies(db)


@router.get("/levels")
def list_levels(
    company: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all 100 levels for a company with unlock status."""
    return get_levels_for_company(db, company, current_user.id)


@router.get("/progress")
def company_progress(
    company: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's progress summary for a company."""
    return get_company_progress(db, company, current_user.id)


@router.get("/sets")
def list_sets(
    company: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get coding sets for a company."""
    return get_sets_by_company(db, company)


@router.post("/start")
def start_session(
    body: StartCodingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new coding session (or resume existing active one)."""
    return start_coding_session(db, current_user.id, body.set_id)


@router.get("/session/{session_id}")
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get coding session details with problems."""
    return get_coding_session(db, session_id, current_user.id)


@router.post("/run")
def run_code(
    body: RunCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run tests without saving submission (for Run button)."""
    return run_tests_only(db, current_user.id, body.session_id, body.problem_id, body.code, body.language)


@router.post("/submit")
def submit(
    body: SubmitCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a solution for a problem in a coding session."""
    return submit_solution(
        db, current_user.id, body.session_id, body.problem_id,
        body.code, body.language,
    )
