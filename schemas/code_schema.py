from pydantic import BaseModel
from typing import List


class CodeRunRequest(BaseModel):
    language: str       # "python" | "cpp" | "java"
    code: str
    problem_id: int


class TestCaseResult(BaseModel):
    input: str
    expected: str
    actual: str
    passed: bool


class CodeRunResponse(BaseModel):
    output: str
    runtime_ms: int
    passed_cases: List[TestCaseResult]
    total: int
    passed: int
