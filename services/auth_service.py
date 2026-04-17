import os
import random
import secrets
from datetime import datetime, timedelta

import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.security import create_access_token, hash_password, verify_password
from models.user import User
from models.verification_code import VerificationCode
from schemas.user_schema import ChangePasswordRequest, UpdateProfileRequest, UserRegister
from services.email_service import send_verification_code

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _issue_token(user: User) -> str:
    return create_access_token({"user_id": user.id, "email": user.email})


def _public_auth_payload(user: User) -> tuple[str, User]:
    return _issue_token(user), user


def _create_code(email: str, purpose: str, db: Session) -> None:
    email = _normalize_email(email)
    recent = (
        db.query(VerificationCode)
        .filter(
            VerificationCode.email == email,
            VerificationCode.purpose == purpose,
            VerificationCode.consumed_at.is_(None),
        )
        .order_by(VerificationCode.created_at.desc())
        .first()
    )
    if recent and recent.created_at > datetime.utcnow() - timedelta(seconds=60):
        raise HTTPException(status_code=429, detail="Please wait before requesting another code")

    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    verification = VerificationCode(
        email=email,
        purpose=purpose,
        code_hash=hash_password(code),
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
    )
    db.add(verification)
    if not send_verification_code(email, code, purpose):
        db.rollback()
        raise HTTPException(status_code=503, detail="We could not send the verification email right now. Please try again shortly.")
    db.commit()


def _verify_code(email: str, code: str, purpose: str, db: Session) -> None:
    email = _normalize_email(email)
    if not code.isdigit():
        raise HTTPException(status_code=400, detail="Verification code must be 6 digits")

    verification = (
        db.query(VerificationCode)
        .filter(
            VerificationCode.email == email,
            VerificationCode.purpose == purpose,
            VerificationCode.consumed_at.is_(None),
        )
        .order_by(VerificationCode.created_at.desc())
        .first()
    )
    if not verification:
        raise HTTPException(status_code=400, detail="No active verification code found")
    if verification.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")
    if verification.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many incorrect attempts. Request a new code")

    verification.attempts += 1
    if not verify_password(code, verification.code_hash):
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code")

    verification.consumed_at = datetime.utcnow()
    db.commit()


def register_user(data: UserRegister, db: Session) -> User:
    email = _normalize_email(data.email)
    if not data.password:
        raise HTTPException(status_code=400, detail="Password is required")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        if not existing.email_verified:
            raise HTTPException(status_code=400, detail="Email already registered but not verified. Please verify your email or resend the code")
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name,
        email=email,
        password_hash=hash_password(data.password),
        email_verified=False,
        auth_provider="password",
        branch=data.branch,
        year=data.year,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _create_code(user.email, "signup", db)
    return user


def login_user(email: str, password: str, db: Session, google_auth: bool = False):
    email = _normalize_email(email)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not google_auth:
        if not user.password_hash or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.email_verified:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before signing in")

    return _public_auth_payload(user)


def resend_email_verification(email: str, db: Session) -> dict:
    email = _normalize_email(email)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")
    if user.email_verified:
        return {"message": "Email is already verified"}
    _create_code(email, "signup", db)
    return {"message": "Verification code sent"}


def verify_user_email(email: str, code: str, db: Session):
    email = _normalize_email(email)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")
    if not user.email_verified:
        _verify_code(email, code, "signup", db)
        user.email_verified = True
        db.commit()
        db.refresh(user)
    return _public_auth_payload(user)


def request_password_reset(email: str, db: Session) -> dict:
    email = _normalize_email(email)
    user = db.query(User).filter(User.email == email).first()
    if user:
        _create_code(email, "reset_password", db)
    return {"message": "If an account exists, a password reset code has been sent"}


def reset_user_password(email: str, code: str, new_password: str, db: Session) -> dict:
    email = _normalize_email(email)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")
    _verify_code(email, code, "reset_password", db)
    user.password_hash = hash_password(new_password)
    user.email_verified = True
    if user.auth_provider == "google":
        user.auth_provider = "google,password"
    db.commit()
    return {"message": "Password updated successfully"}


def _upsert_google_user(user_info: dict, db: Session):
    email = _normalize_email(user_info.get("email") or "")
    google_id = user_info.get("google_id") or user_info.get("sub")
    name = user_info.get("name") or email.split("@")[0]
    avatar_url = user_info.get("picture")
    verified = bool(user_info.get("verified_email", user_info.get("email_verified", False)))

    if not email or not google_id:
        raise HTTPException(status_code=401, detail="Google credential is missing required profile data")
    if not verified:
        raise HTTPException(status_code=401, detail="Google email is not verified")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user:
        user.email_verified = True
        user.google_id = user.google_id or google_id
        if "google" not in (user.auth_provider or ""):
            user.auth_provider = f"{user.auth_provider},google" if user.auth_provider else "google"
        if avatar_url:
            user.avatar_url = user.avatar_url or avatar_url
            user.picture = user.picture or avatar_url
        db.commit()
        db.refresh(user)
        return _public_auth_payload(user)

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(secrets.token_urlsafe(32)),
        email_verified=True,
        auth_provider="google",
        google_id=google_id,
        avatar_url=avatar_url,
        picture=avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _public_auth_payload(user)


def login_with_google(credential: str, db: Session):
    try:
        response = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
            timeout=10,
        )
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not verify Google credential")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    payload = response.json()
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if client_id and payload.get("aud") != client_id:
        raise HTTPException(status_code=401, detail="Google credential was issued for a different client")

    return _upsert_google_user(
        {
            "google_id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
            "verified_email": str(payload.get("email_verified")).lower() == "true",
        },
        db,
    )


def login_with_google_user_info(user_info: dict, db: Session):
    return _upsert_google_user(user_info, db)


def change_user_password(user: User, data: ChangePasswordRequest, db: Session) -> dict:
    if not user.password_hash or not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    if user.auth_provider == "google":
        user.auth_provider = "google,password"
    db.commit()
    return {"message": "Password updated successfully"}


def update_user_profile(user: User, data: UpdateProfileRequest, db: Session) -> User:
    if data.name is not None:
        user.name = data.name
    if data.branch is not None:
        user.branch = data.branch
    if data.year is not None:
        user.year = data.year
    if data.college is not None:
        user.college = data.college
    db.commit()
    db.refresh(user)
    return user
