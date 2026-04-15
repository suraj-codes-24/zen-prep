from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, nullable=False)
    description   = Column(Text, nullable=False)
    difficulty    = Column(String, nullable=False)       # easy | medium | hard
    company       = Column(String, nullable=False)       # Google, Amazon, etc.
    starter_code  = Column(Text, default="")
    test_cases    = Column(JSON, default=[])              # [{input, expected}]
    function_name = Column(String, default="solution")
    time_limit    = Column(Integer, default=5)            # seconds per test case
    tags          = Column(String, default="")
    hints         = Column(JSON, default=[])              # ["Hint 1", "Hint 2"]
    examples      = Column(JSON, default=[])              # [{input, output, explanation}]
    constraints   = Column(JSON, default=[])              # ["1 <= n <= 10^5", ...]


class CodingSet(Base):
    __tablename__ = "coding_sets"

    id               = Column(Integer, primary_key=True, index=True)
    company          = Column(String, nullable=False)
    round_name       = Column(String, nullable=False)
    problem_count    = Column(Integer, default=3)
    duration_minutes = Column(Integer, default=90)
    level_number     = Column(Integer, default=1)
    topic            = Column(String, default="")         # Arrays, Strings, etc.

    problems = relationship("CodingSetProblem", backref="coding_set", order_by="CodingSetProblem.order_index")


class CodingSetProblem(Base):
    __tablename__ = "coding_set_problems"

    id          = Column(Integer, primary_key=True, index=True)
    set_id      = Column(Integer, ForeignKey("coding_sets.id"), nullable=False)
    problem_id  = Column(Integer, ForeignKey("coding_problems.id"), nullable=False)
    order_index = Column(Integer, default=0)

    problem = relationship("CodingProblem")


class CodingSession(Base):
    __tablename__ = "coding_sessions"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    coding_set_id  = Column(Integer, ForeignKey("coding_sets.id"), nullable=False)
    start_time     = Column(DateTime, default=datetime.utcnow)
    end_time       = Column(DateTime, nullable=True)
    status         = Column(String, default="active")     # active | completed | timed_out
    score          = Column(Float, nullable=True)

    user       = relationship("User")
    coding_set = relationship("CodingSet")
    submissions = relationship("CodingSubmission", backref="session")


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id                = Column(Integer, primary_key=True, index=True)
    coding_session_id = Column(Integer, ForeignKey("coding_sessions.id"), nullable=False)
    problem_id        = Column(Integer, ForeignKey("coding_problems.id"), nullable=False)
    code              = Column(Text, nullable=False)
    language          = Column(String, default="python")
    passed_cases      = Column(Integer, default=0)
    total_cases       = Column(Integer, default=0)
    runtime_ms        = Column(Integer, nullable=True)
    submitted_at      = Column(DateTime, default=datetime.utcnow)

    problem = relationship("CodingProblem")
