from sqlalchemy.orm import Session
from models.user import User
from schemas.user_schema import UserRegister, UpdateProfileRequest, ChangePasswordRequest
from core.security import hash_password, verify_password, create_access_token
from fastapi import HTTPException, status

def register_user(data: UserRegister, db: Session):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        branch=data.branch,
        year=data.year
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(email: str, password: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"user_id": user.id, "email": user.email})
    return token, user

def change_user_password(user: User, data: ChangePasswordRequest, db: Session) -> dict:
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
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
