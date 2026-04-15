from fastapi import APIRouter, HTTPException, Depends
from schemas.code_schema import CodeRunRequest, CodeRunResponse
from services.code_service import run_python_code
from core.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/code", tags=["Coding"])


@router.post("/run", response_model=CodeRunResponse)
def run_code(data: CodeRunRequest, current_user: User = Depends(get_current_user)):
    """
    Execute user code against problem test cases.
    Currently supports Python only.
    """
    if data.language.lower() not in ("python",):
        raise HTTPException(
            status_code=400,
            detail=f"Language '{data.language}' is not supported yet. Use 'python'."
        )

    result = run_python_code(code=data.code, problem_id=data.problem_id)
    return result
