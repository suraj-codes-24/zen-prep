from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from schemas.user_schema import (
    ChangePasswordRequest,
    EmailRequest,
    GoogleAuthRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserLogin,
    UserRegister,
    UserResponse,
    VerifyEmailRequest,
)
from services.auth_service import (
    change_user_password,
    login_user,
    login_with_google,
    login_with_google_user_info,
    register_user,
    request_password_reset,
    resend_email_verification,
    reset_user_password,
    update_user_profile,
    verify_user_email,
)
from services.google_oauth_service import get_google_auth_url, get_google_user_info

router = APIRouter(prefix="/auth", tags=["Auth"])


class GoogleCallbackRequest(BaseModel):
    code: str


@router.get("/google/url")
def get_google_auth_url_endpoint():
    return {"auth_url": get_google_auth_url()}


@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(data: GoogleCallbackRequest, db: Session = Depends(get_db)):
    user_info = await get_google_user_info(data.code)
    token, user = login_with_google_user_info(user_info, db)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/validate-email")
def validate_email():
    raise HTTPException(status_code=410, detail="Email validation links have been replaced by 6-digit verification codes")


@router.post("/register", response_model=UserResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return register_user(data, db)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    token, user = login_user(data.email, data.password, db)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/verify-email", response_model=TokenResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    token, user = verify_user_email(data.email, data.code, db)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/resend-verification")
def resend_verification(data: EmailRequest, db: Session = Depends(get_db)):
    return resend_email_verification(data.email, db)


@router.post("/forgot-password")
def forgot_password(data: EmailRequest, db: Session = Depends(get_db)):
    return request_password_reset(data.email, db)


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_user_password(data.email, data.code, data.new_password, db)


@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    token, user = login_with_google(data.credential, db)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user_profile(user=current_user, data=data, db=db)


@router.put("/password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return change_user_password(user=current_user, data=data, db=db)
