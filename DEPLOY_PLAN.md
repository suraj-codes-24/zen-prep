# ZenPrep Deployment Plan

Updated: 2026-04-17

This is the current deployment reference for the live ZenPrep stack.

## Live Stack

| Layer | Provider | Status |
|-------|----------|--------|
| Frontend | Vercel | Live |
| Backend | Hugging Face Spaces (Docker) | Live |
| Database | Neon Postgres | Live |
| LLM | Gemini primary, Groq fallback | Configured |
| STT | Groq Whisper | Configured |
| TTS | `edge-tts` | Configured |

## Current Targets

- Frontend URL: [zenprep.xyz](https://zenprep.xyz)
- Backend deployment source: Hugging Face Space repo `suraj-codes-24/suraj-codes-24`
- Database: Neon Postgres via `DATABASE_URL`
- Active branch used for recent deployment work: `codex/deployment-sync`

## Recent Production-Relevant Fixes

- Interview room voice uploads now include auth.
- Face analysis is stored and aggregated server-side for scoring.
- Follow-up answers submit cleanly without duplicate-answer collisions.
- Empty interview sessions are marked `abandoned`.
- Dashboard and analytics no longer count communication tests as interviews.
- GD forced-turn coaching now includes a ready-script card with copy support.

## Required Environment Variables

### Backend

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SECRET_KEY=change_me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ADMIN_EMAILS=zenprep1@gmail.com

GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://zenprep.xyz/auth/callback

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@zen-prep.com
FRONTEND_URL=https://zenprep.xyz
```

### Frontend

```env
VITE_API_URL=https://your-huggingface-space-url
```

## Backend Deployment Notes

- The backend runs as a Docker Space.
- `main.py` creates tables on startup and runs the auth schema check.
- CORS allows localhost dev URLs, the Vercel production URL, and `FRONTEND_URL`.
- `services/llm_utils.py` is resilient to missing `google.genai` imports, which helps prevent startup failures in misconfigured environments.

## Docker Expectations

The backend image must include:

- Python 3.11
- build tools for native packages
- `libsndfile1`
- `libgomp1`
- `libglib2.0-0`
- `libgl1`

The app should start with:

```bash
uvicorn main:app --host 0.0.0.0 --port 7860 --workers 1
```

## Deployment Workflow

### Frontend

1. Push the branch with the desired frontend changes.
2. Ensure Vercel is pointed at the `frontend/` directory.
3. Confirm `VITE_API_URL` targets the active Hugging Face backend.
4. Open the Vercel deployment and verify the build succeeds.

### Backend

1. Push the backend changes to the Hugging Face Space repository.
2. Wait for the Docker build to finish.
3. Confirm the Space has all required secrets.
4. Hit `/health` once the Space is up.

### Database

1. Confirm the Neon connection string is valid.
2. Ensure the app can connect with pool settings from `database.py`.
3. Seed or verify content as needed.

## Post-Deploy Checklist

1. Open the frontend home page.
2. Log in with the demo account.
3. Verify dashboard cards load.
4. Open analytics and confirm interview, communication, coding, and GD counts all render.
5. Start an interview and confirm:
   - question loads
   - audio upload succeeds
   - face metrics post successfully
   - finish marks the session correctly
6. Open GD and confirm the forced-turn sidebar shows:
   - hints/topic card
   - ready-script card
   - copy button

## Demo Data Notes

- The shared database currently keeps only `zenprep1@gmail.com`.
- Demo data has been inserted across interview, communication, coding, and GD for visualization.
- If a fresh deployment uses a new database, seed the content and recreate demo sessions if product screenshots are needed.

## Risks And Watch Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hugging Face cold starts | Slow first request | Warm the backend with a health hit before a demo |
| Neon free-tier connection limits | Intermittent DB contention | Keep pool sizes small as configured |
| Groq or Gemini quota issues | LLM or STT degradation | Keep both providers configured |
| MediaPipe version drift | Vision breakage on Windows | Pin `mediapipe==0.10.11` |
| Wrong `FRONTEND_URL` or OAuth redirect | Login or CORS failure | Keep Vercel URL and Google OAuth config aligned |

## Latest Deployment-Linked Commits

- `3f114a5` - interview flow, face-score handling, analytics counting fixes
- `8c9f441` - GD ready-script sidebar enhancement
