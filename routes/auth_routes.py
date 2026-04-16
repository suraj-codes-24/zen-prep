from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.user_schema import UserRegister, UserLogin, TokenResponse, UserResponse, UpdateProfileRequest, ChangePasswordRequest
from services.auth_service import register_user, login_user, update_user_profile, change_user_password
from services.google_oauth_service import get_google_user_info, get_google_auth_url
from services.email_service import send_validation_email, generate_validation_token
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])


class GoogleAuthRequest(BaseModel):
    code: str


@router.get("/google/url")
def get_google_auth_url_endpoint():
    """Get the Google OAuth authorization URL."""
    return {"auth_url": get_google_auth_url()}


@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Handle Google OAuth callback and login/signup user."""
    user_info = await get_google_user_info(data.code)
    
    # Check if user exists with this Google ID
    existing_user = db.query(User).filter(User.google_id == user_info["google_id"]).first()
    
    if existing_user:
        # User exists, login
        token, user = login_user(existing_user.email, None, db, google_auth=True)
        return {"access_token": token, "token_type": "bearer", "user": user}
    
    # Check if user exists with this email
    email_user = db.query(User).filter(User.email == user_info["email"]).first()
    
    if email_user:
        # Link Google account to existing user
        email_user.google_id = user_info["google_id"]
        email_user.picture = user_info.get("picture")
        db.commit()
        token, user = login_user(email_user.email, None, db, google_auth=True)
        return {"access_token": token, "token_type": "bearer", "user": user}
    
    # Create new user
    new_user_data = UserRegister(
        email=user_info["email"],
        name=user_info["name"],
        password=None,  # No password for Google users
    )
    new_user = register_user(new_user_data, db)
    new_user.google_id = user_info["google_id"]
    new_user.picture = user_info.get("picture")
    new_user.email_verified = user_info.get("verified_email", False)
    db.commit()
    
    # Send validation email if email is not verified by Google
    if not new_user.email_verified:
        validation_token = generate_validation_token()
        new_user.validation_token = validation_token
        db.commit()
        send_validation_email(new_user.email, new_user.name, validation_token)
    
    token, user = login_user(new_user.email, None, db, google_auth=True)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/validate-email")
def validate_email(token: str, db: Session = Depends(get_db)):
    """Validate email using the token sent via email."""
    user = db.query(User).filter(User.validation_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired validation token")
    
    user.email_verified = True
    user.validation_token = None
    db.commit()
    
    return {"message": "Email verified successfully"}


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
