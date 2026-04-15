from database import engine, Base
from sqlalchemy import text

# Import all models
from models.user import User
from models.subject import Subject
from models.topic import Topic
from models.subtopic import Subtopic
from models.question import Question
from models.interview_session import InterviewSession
from models.answer import Answer


print("Dropping schema public cascade...")
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    conn.execute(text("CREATE SCHEMA public;"))
    conn.commit()

print("Creating all tables based on new models...")
Base.metadata.create_all(bind=engine)

print("Database reset complete.")
