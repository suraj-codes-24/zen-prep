from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.user_schema import UserRegister, UserLogin, TokenResponse, UserResponse, UpdateProfileRequest, ChangePasswordRequest
from services.auth_service import register_user, login_user, update_user_profile, change_user_password

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return register_user(data, db)

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    token, user = login_user(data.email, data.password, db)
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the logged-in user's profile fields."""
    return update_user_profile(user=current_user, data=data, db=db)

@router.put("/password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the logged-in user's password after verifying the current one."""
    return change_user_password(user=current_user, data=data, db=db)
