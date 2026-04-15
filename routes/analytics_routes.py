from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from services.analytics_service import get_user_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/me")
def my_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full performance summary for the logged-in user."""
    result = get_user_analytics(db=db, user_id=current_user.id)
    return result
