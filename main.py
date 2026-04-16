import os
import time
import collections
import imageio_ffmpeg
os.environ["PATH"] += os.pathsep + os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from core.logger import logger

from routes.auth_routes import router as auth_router
from routes.interview_routes import router as interview_router
from routes.answer_routes import router as answer_router
from routes.analytics_routes import router as analytics_router
from routes.voice_routes import router as voice_router
from routes.vision_routes import router as vision_router
from routes.code_routes import router as code_router
from routes.ai_routes import router as ai_router
from routes.resume_routes import router as resume_router
from routes.jd_routes import router as jd_router
from routes.report_routes import router as report_router
from routes.coding_v2_routes import router as coding_v2_router
from routes.communication_routes import router as comm_router
from routes.gd_routes import router as gd_router
from routes.contact_routes import router as contact_router

from database import engine, Base

# Import all models so SQLAlchemy creates all tables
import models.user
import models.subject
import models.topic
import models.subtopic
import models.question
import models.interview_session
import models.answer
import models.coding
import models.communication
import models.gd

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZenPrep API", version="2.0.0")

logger.info("Interview Simulator API starting up")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://frontend-six-nu-77.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Rate limiting (per-IP, in-memory) ────────────────────────────────────────
# Expensive endpoints: max requests per window per IP
_RATE_LIMITS = {
    "/coding/run":       (10, 60),   # 10 req / 60s
    "/coding/submit":    (10, 60),
    "/code/run":         (10, 60),
    "/resume/analyse":   (5,  60),   # 5 req / 60s
    "/jd/analyse":       (5,  60),
    "/api/voice/analyze":(15, 60),   # 15 req / 60s
    "/gd/user-turn":     (20, 60),
    "/comm/answer":      (20, 60),
}
_rate_buckets: dict = collections.defaultdict(lambda: collections.deque())


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    path = request.url.path
    for route_prefix, (max_req, window) in _RATE_LIMITS.items():
        if path.startswith(route_prefix):
            ip = request.client.host if request.client else "unknown"
            key = f"{ip}:{route_prefix}"
            now = time.time()
            bucket = _rate_buckets[key]
            while bucket and bucket[0] < now - window:
                bucket.popleft()
            if len(bucket) >= max_req:
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "error": {"type": "RateLimited", "message": "Too many requests. Please slow down."}},
                )
            bucket.append(now)
            break
    return await call_next(request)


# ── Request logging middleware ────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    ms = round((time.time() - start) * 1000, 1)
    logger.info("%s %s | %d | %.1fms", request.method, request.url.path, response.status_code, ms)
    return response


app.include_router(auth_router)
app.include_router(interview_router)
app.include_router(answer_router)
app.include_router(analytics_router)
app.include_router(voice_router, tags=["Voice"])
app.include_router(vision_router)
app.include_router(code_router)
app.include_router(ai_router, prefix="/ai")
app.include_router(resume_router)
app.include_router(jd_router)
app.include_router(report_router)
app.include_router(coding_v2_router)
app.include_router(comm_router)
app.include_router(gd_router)
app.include_router(contact_router)

# ── Global error handlers ────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("HTTP %d | %s %s | %s", exc.status_code, request.method, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "type": "HTTPException",
                "message": exc.detail,
                "path": str(request.url.path),
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation 422 | %s %s | %s", request.method, request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "type": "ValidationError",
                "message": "Invalid request parameters",
                "details": exc.errors(),
                "path": str(request.url.path),
            },
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled 500 | %s %s | %s: %s", request.method, request.url.path, type(exc).__name__, exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "type": "InternalError",
                "message": "An unexpected error occurred.",
                "path": str(request.url.path),
            },
        },
    )


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"success": True, "message": "Interview Simulator API is running"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "ZenPrep", "version": "2.0"}