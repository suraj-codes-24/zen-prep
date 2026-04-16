from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for Google OAuth users
    branch        = Column(String, nullable=True)
    year          = Column(Integer, nullable=True)
    college       = Column(String, nullable=True)
    avatar_url    = Column(String, nullable=True)
    picture       = Column(String, nullable=True)  # Google profile picture
    google_id     = Column(String, unique=True, nullable=True, index=True)  # Google OAuth ID
    email_verified = Column(Boolean, default=False)  # Email verification status
    validation_token = Column(String, nullable=True)  # Email validation token
    created_at    = Column(DateTime, default=datetime.utcnow)
