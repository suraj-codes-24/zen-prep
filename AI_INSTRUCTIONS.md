# ZenPrep AI Instructions

Updated: 2026-04-17

This file is the fast orientation guide for agents or contributors working inside this repository.

## Project Identity

- Repo: `C:\Users\suraj\Desktop\zen-prep`
- Frontend: React + Vite in `frontend/`
- Backend: FastAPI in repo root
- Database: PostgreSQL through `DATABASE_URL`
- Current deployment branch: `codex/deployment-sync`

## Local Run Targets

- Backend: `uvicorn main:app --reload`
- Frontend: `cd frontend && npm run dev`
- Backend URL: `http://localhost:8000`
- Frontend URL: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Production Targets

- Frontend production: `https://frontend-six-nu-77.vercel.app`
- Backend host: Hugging Face Space using the repo `suraj-codes-24/suraj-codes-24`
- Database: Neon Postgres

## Current Product Reality

- Interview flow is working with follow-up questions.
- Voice analysis is authenticated and wired from the interview room.
- Face analysis is computed and consumed server-side for interview scoring.
- Communication tests are no longer counted as interviews in dashboard analytics.
- Empty interview sessions finish as `abandoned`.
- GD forced turns include hints, topic guidance, and a ready-to-read script card with copy support.

## Important Data State

- Non-demo users were intentionally removed from the current shared database.
- Demo data exists for `suraj14mk@gmail.com` across interview, communication, coding, and GD so dashboard and analytics pages render with meaningful content.
- Do not delete or reset that seeded data unless explicitly asked.

## Key Files

| File | Why It Matters |
|------|----------------|
| `main.py` | App entry, middleware, router registration, CORS |
| `database.py` | SQLAlchemy engine and session factory |
| `routes/interview_routes.py` | Interview session lifecycle, question fetch, finish, seed endpoint |
| `routes/answer_routes.py` | Interview answer submission |
| `routes/voice_routes.py` | Voice analysis endpoint |
| `routes/vision_routes.py` | Vision frame ingestion and face metric recording |
| `routes/analytics_routes.py` | User analytics API |
| `routes/communication_routes.py` | Communication session flow, TTS, history |
| `routes/gd_routes.py` | GD topics, user turns, bot turns, finish, results |
| `services/evaluation_service.py` | Interview score fusion and answer persistence |
| `services/vision_session_service.py` | Per-session face metric aggregation |
| `services/analytics_service.py` | Dashboard and analytics counts |
| `services/followup_service.py` | Follow-up question generation |
| `services/llm_utils.py` | Shared LLM wrapper with resilient startup behavior |
| `frontend/src/components/InterviewRoomPage.jsx` | Interview room flow and follow-up UI |
| `frontend/src/VisionRecorder.jsx` | Camera recorder feeding `/api/vision/analyze` |
| `frontend/src/components/GDPage.jsx` | GD setup, room, coaching, ready-script sidebar |

## Rules To Preserve

- Keep `mediapipe==0.10.11` on Windows.
- Do not revert the analytics separation between interview and communication data.
- Do not reintroduce client-trusted face score aggregation as the final source of truth.
- Do not remove auth from interview voice analysis requests.
- Do not treat empty interview sessions as completed sessions.
- Respect the existing inline-style frontend pattern unless the task is a broader UI refactor.

## Known Good Behaviors

- `npm run build` in `frontend/` is a good quick frontend check.
- Import smoke checks against `main.py` and the touched backend modules are a good backend sanity check.
- Dashboard, analytics, profile, and report-oriented pages should show meaningful data for the seeded demo account.

## Useful Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Service health |
| POST | `/interview/start` | Start interview |
| GET | `/interview/question` | Fetch next interview question |
| POST | `/interview/finish` | Finalize interview |
| POST | `/ai/followup` | Generate follow-up question |
| POST | `/api/voice/analyze` | Analyze audio |
| POST | `/api/vision/analyze` | Analyze image frame |
| GET | `/analytics/me` | Aggregate user analytics |
| POST | `/comm/start` | Start communication test |
| GET | `/comm/question/{session_id}` | Get next communication question |
| POST | `/comm/answer/{session_id}` | Submit communication answer |
| GET | `/gd/topics` | List GD topics |
| POST | `/gd/start` | Start GD session |
| POST | `/gd/user-turn/{session_id}` | Submit GD audio turn |
| POST | `/gd/bot-turn/{session_id}` | Fetch next bot turn |
| POST | `/gd/finish/{session_id}` | Finish GD session |

## Quick Verification Checklist After Changes

1. Run `npm run build` inside `frontend/` for any frontend change.
2. Smoke import `main.py` or the touched route/service modules for backend changes.
3. If analytics-related code changes, check that interview counts are still separate from communication counts.
4. If GD UI changes, confirm the forced-turn right sidebar still shows hints and the ready-script card.
5. If interview flow changes, confirm voice auth and face-score aggregation still work.
