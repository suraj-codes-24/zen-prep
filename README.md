# ZenPrep

ZenPrep is a full-stack interview preparation platform built with FastAPI, React, and PostgreSQL. It combines text evaluation, voice analysis, face analysis, coding practice, communication testing, group discussion practice, analytics, and PDF reports in one product.

## Features

- **Mock Interview**: Subject, topic, and subtopic driven interview setup with adaptive question fetching, NLP scoring, voice and face analysis, and follow-up question generation
- **Coding Interview**: Monaco editor based coding room with Python, C++, and Java execution
- **Communication Test**: Multi-section speaking test with TTS playback and voice-based fluency scoring
- **Group Discussion**: Topic-based GD setup with multiple AI bot participants, pause/raise-hand flow, and comprehensive scoring
- **Career AI**: Resume PDF analysis, JD gap analysis, and skill comparison against user analytics
- **Analytics**: Unified dashboard across interview, coding, communication, and GD with trends and breakdowns


## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, inline styles |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL via `DATABASE_URL` |
| Voice | `librosa`, `parselmouth`, `soundfile`, `scipy` |
| Vision | OpenCV + MediaPipe FaceMesh |
| LLM | Gemini primary, Groq fallback |
| STT | Groq Whisper transcription |
| TTS | `edge-tts` |
| Reports | `reportlab` |

## Project Layout

```text
zen-prep/
|-- main.py
|-- database.py
|-- ai_engine/
|-- core/
|-- data/
|-- frontend/
|-- models/
|-- routes/
|-- schemas/
|-- services/
|-- README.md
```

## Local Setup

### 1. Prerequisites

- Python 3.11+
- Node.js 20+ or newer
- PostgreSQL or a Neon Postgres database
- `g++` and JDK 11+ if you want local coding execution for C++ and Java

### 2. Install backend dependencies

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment variables

Create `.env` in the repo root.

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=change_me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@zen-prep.com
FRONTEND_URL=http://localhost:5173

ADMIN_EMAILS=suraj14mk@gmail.com
```

### 4. Start the backend

```bash
uvicorn main:app --reload
```

Backend:
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

### 5. Seed data

Create tables automatically by starting the app once, then seed optional content:

```bash
python seed_coding_v2.py
python seed_communication.py
python seed_gd.py
```

Interview questions are seeded through the admin-only endpoint:

```text
POST /interview/seed-questions
```

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:
- App: `http://localhost:5173`

## Important Runtime Notes

- Keep `mediapipe==0.10.11` on Windows.
- `services/llm_utils.py` now tolerates missing `google.genai` imports so startup does not crash just because that SDK is unavailable.
- Interview face scoring is now based on backend-recorded metrics, not a client-trusted aggregate alone.
- Communication and interview analytics are intentionally counted separately.

## Main API Areas

| Area | Prefix |
|------|--------|
| Auth | `/auth` |
| Interview | `/interview` |
| Answers | `/answer` |
| Voice analysis | `/api/voice` |
| Vision analysis | `/api/vision` |
| Coding | `/code` and coding v2 routes |
| Communication | `/comm` |
| GD | `/gd` |
| Analytics | `/analytics` |
| Reports | `/reports` |
| Career AI | `/resume`, `/jd`, `/ai` |

## Recent Fixes Reflected In This Repo

- Fixed interview scoring flow, face-score persistence, follow-up submission, and analytics counting
- Improved GD forced-turn sidebar with phase-aware ready script and copy action
- Fixed contact form auto-refresh issue on landing page

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Hugging Face Spaces (Docker)
- **Database**: Neon PostgreSQL

See deployment configuration in `vercel.json` (root) and `frontend/vercel.json`.
