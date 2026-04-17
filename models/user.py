from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    auth_provider = Column(String, default="password", nullable=False)
    google_id = Column(String, unique=True, nullable=True, index=True)
    branch = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    college = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    validation_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
