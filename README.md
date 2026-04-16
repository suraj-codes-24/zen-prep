---
title: ZenPrep API
emoji: 🎯
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
license: mit
---

# ZenPrep — AI Multimodal Interview Simulator

A full-stack mock interview platform that combines NLP scoring, voice analysis, face analysis, coding evaluation, communication testing, and group discussion practice into one unified experience.

---

## Problem Statement

**The Gap in Interview Preparation**

Millions of students and job seekers struggle with interview preparation due to several critical gaps in traditional learning methods:

1. **Lack of Realistic Practice** — Mock interviews with peers or mentors are scarce, expensive, and often don't simulate real interview conditions
2. **No Multimodal Feedback** — Most platforms only evaluate text responses, ignoring critical non-verbal cues like voice tone, pacing, facial expressions, and body language
3. **No Adaptive Difficulty** — Static question banks don't adjust to the candidate's skill level, leading to either boredom or overwhelm
4. **Limited Subject Coverage** — Platforms focus on either technical interviews OR communication skills, but rarely both
5. **No Group Discussion Practice** — GD rounds are crucial for many companies (especially in India) but lack dedicated practice platforms
6. **Career Guidance Gap** — Resume analysis and job matching are often manual, time-consuming, and inconsistent
7. **No Follow-up Questions** — Real interviewers ask probing questions; most platforms only evaluate the first answer

**ZenPrep addresses all these gaps by providing:**
- **Multimodal AI evaluation** (NLP + Voice + Face) for realistic scoring
- **Adaptive difficulty** that adjusts question complexity based on performance
- **Comprehensive coverage** (Technical HR, Coding, Communication, GD, Career AI)
- **AI-powered follow-up questions** for deeper assessment
- **Real-time feedback** with detailed coaching insights
- **Accessible, affordable** alternative to expensive coaching programs

---

## Features

### Mock Interview
- Adaptive difficulty — questions get harder as you score better
- 482 questions across multiple subjects and topics
- NLP scoring: semantic similarity, keyword coverage, answer depth, structure
- 9-feature voice scoring: pace, filler words, pronunciation, intonation, modulation, rhythm, stress, silence, energy
- Face analysis via MediaPipe FaceMesh
- Multimodal score: 70% NLP + 20% Voice + 10% Face (Technical) / 50% NLP + 30% Voice + 20% Face (HR)
- AI follow-up question generation
- Interview replay with full transcript timeline
- PDF report download

### Coding Interview
- Monaco Editor with syntax highlighting
- Multi-language: Python, C++, Java
- LeetCode-style problems (4 companies × 2 difficulty levels = 24 problems)
- Sandboxed code execution

### Communication Test (Versant-style)
- 8 sections: Read Aloud, Repeat Sentence, Short Answer, Arrange, Story Retell, Open Question, Describe Image, Listening
- 140 questions seeded across all sections
- AI TTS reads questions aloud
- 9-feature voice fluency scoring per answer
- Band scoring (A1 → C2) with radar chart breakdown
- PDF report download

### GD Room (Group Discussion)
- 60 topics across 5 categories: Technology, Business, Society, Policy, Abstract
- 5 AI bot personalities: Alex (structured), Maya (challenger), Ravi (synthesizer), Priya (data-driven), Sam (questioner)
- Round-based turn flow: bot speaks → 7-sec pause → raise hand to queue turn → mic auto-opens if queued
- Forced user turn if all bots have spoken and user hasn't (40-sec window, 5-sec silence auto-submit)
- Whisper transcription per turn
- 5-dimension scoring: participation, leadership, listening, idea quality, teamwork
- Voice scoring: pace, filler words, pause, clarity
- Sentiment analysis, keyword extraction, argument detection
- Participation intelligence (share of voice, turn frequency)
- Tabbed coaching results with strength/improvement breakdown
- PDF report download

### Career AI
- Resume PDF parsing (PyMuPDF + Ollama)
- JD gap analysis with skill matching
- Personalized improvement suggestions

### Analytics
- Unified dashboard across all 4 modules
- Score trend charts, subject/topic breakdown, score distribution
- GD dimension averages radar chart
- Recent activity feed with all session types

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, PostgreSQL (psycopg2) |
| Frontend | React, Vite, inline CSS (no Tailwind) |
| LLM | Gemini (primary), Groq Cloud (fallback), Ollama — `qwen2.5-coder:7b`, `llama3.1:8b` |
| Voice | OpenAI Whisper (local), librosa, parselmouth |
| Face | MediaPipe FaceMesh 0.10.11 |
| Code Execution | subprocess sandbox (Python, C++, Java) |
| Charts | recharts |
| PDF | reportlab (reports), PyMuPDF (resume parsing) |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Authentication | Google OAuth, JWT |
| Email | SMTP (validation emails) |

---

## Local Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11.8 | Backend runtime |
| Node.js | v24 | Frontend dev server |
| PostgreSQL | 14+ | Database |
| Ollama | latest | Local LLM inference |
| Java JDK | 11+ | Coding sandbox (Java) |
| g++ | any | Coding sandbox (C++) |

---

### 1. Clone the repo

```bash
git clone https://github.com/suraj-codes-24/interview-simulator.git
cd interview-simulator
```

---

### 2. Set up Ollama

Install Ollama from [ollama.com](https://ollama.com), then pull the required models:

```bash
ollama pull qwen2.5-coder:7b   # used for interview scoring + follow-up questions
ollama pull llama3.1:8b        # used for GD bot personalities
```

Ollama must be running in the background before starting the backend:

```bash
ollama serve
```

It runs at `http://localhost:11434` by default.

---

### 3. PostgreSQL — create database

```bash
psql -U postgres
CREATE DATABASE interview_db;
\q
```

---

### 4. Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:<your_password>@localhost/interview_db
SECRET_KEY=your_jwt_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth (optional, for Google login/signup)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# Email/SMTP (optional, for validation emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address
SMTP_PASSWORD=your_app_specific_password
FROM_EMAIL=noreply@zen-prep.com
FRONTEND_URL=http://localhost:5173

# LLM API Keys (optional, for Gemini/Groq)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

> Ollama is expected to be running at `http://localhost:11434` (hardcoded). No env var needed for it.

---

### 5. Backend

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux / Mac

# Install Python dependencies
pip install -r requirements.txt

# Create all database tables
python -c "from database import Base, engine; Base.metadata.create_all(engine)"

# Seed question banks (run once)
python seed_coding_v2.py       # 24 LeetCode-style coding problems
python seed_communication.py   # 140 Versant-style comm questions
python seed_gd.py              # 60 GD topics across 5 categories

# Start the backend server
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`
Interactive API docs at `http://localhost:8000/docs`

---

### 6. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

### 7. Verify everything is running

Open three terminals:

| Terminal | Command | URL |
|----------|---------|-----|
| 1 — Ollama | `ollama serve` | `http://localhost:11434` |
| 2 — Backend | `uvicorn main:app --reload` | `http://localhost:8000` |
| 3 — Frontend | `cd frontend && npm run dev` | `http://localhost:5173` |

Register a new account or log in. All features — interview, coding, comm test, GD Room, career AI — are accessible from the dashboard sidebar.

---

### Coding Sandbox Requirements

The coding room executes Python, C++, and Java locally via subprocess. Make sure:

- **Python** — already available if backend is running
- **C++** — install `g++` (Linux: `sudo apt install g++`, Windows: MinGW or MSYS2)
- **Java** — install JDK 11+ and ensure `javac` + `java` are on your PATH

Test with:

```bash
g++ --version
java -version
javac -version
```

---

## Project Structure

```
interview_simulator/
├── main.py                         # FastAPI entry point
├── database.py                     # PostgreSQL engine
├── models/                         # SQLAlchemy models
│   ├── user.py
│   ├── question.py
│   ├── coding.py
│   ├── communication.py
│   └── gd.py
├── routes/                         # API route handlers
│   ├── auth_routes.py
│   ├── interview_routes.py
│   ├── coding_v2_routes.py
│   ├── communication_routes.py
│   ├── gd_routes.py
│   ├── analytics_routes.py
│   └── report_routes.py
├── services/                       # Business logic
│   ├── interview_service.py
│   ├── evaluation_service.py
│   ├── coding_service.py
│   ├── communication_service.py
│   ├── gd_service.py
│   ├── gd_bot_service.py
│   ├── gd_eval_service.py
│   ├── gd_voice_service.py
│   ├── resume_service.py
│   ├── jd_service.py
│   ├── report_service.py
│   ├── google_oauth_service.py      # Google OAuth authentication
│   ├── email_service.py            # Email validation
│   └── llm_utils.py                # LLM generation (Gemini + Groq)
├── ai_engine/                      # Scoring engines
│   ├── nlp_engine.py               # NLP + CONCEPT_MAP (79 concepts)
│   ├── hr_engine.py                # Ollama HR evaluation
│   ├── voice_engine.py             # Whisper + librosa + parselmouth
│   └── vision_engine.py            # MediaPipe FaceMesh
└── frontend/
    └── src/
        ├── App.jsx                 # Router + 16 lazy-loaded pages
        ├── shared.jsx              # Shared components (Bar, Spinner, API)
        ├── VoiceRecorder.jsx       # Audio capture
        ├── VisionRecorder.jsx      # Camera + MediaPipe
        └── components/
            ├── DashboardPage.jsx
            ├── InterviewPage.jsx
            ├── InterviewRoomPage.jsx
            ├── CodingInterviewPage.jsx
            ├── CommunicationTestPage.jsx
            ├── GDPage.jsx
            ├── AnalyticsPage.jsx
            ├── CareerAIPage.jsx
            ├── ProfilePage.jsx
            └── ...
```

---

## Score Formulas

**Interview**
```
Technical = 70% NLP + 20% Voice + 10% Face
HR        = 50% NLP + 30% Voice + 20% Face

NLP  = 45% semantic + 25% keywords + 20% depth + 10% structure
Voice = 15% pace + 15% filler + 15% pronunciation + 15% intonation
      + 10% modulation + 10% rhythm + 10% stress + 5% silence + 5% energy
```

**Communication**
```
Fluency = 15% pace + 15% filler + 15% pronunciation + 12% intonation
        + 10% modulation + 10% rhythm + 10% stress + 8% confidence + 5% silence

Section A = 60% pace + 40% fluency
Section B = 70% word match + 30% fluency
Section C = 80% keyword + 20% fluency
Section D = 75% sentence match + 25% fluency
Section E = 60% semantic + 40% fluency
Section F = 40% fluency + 30% depth + 30% confidence
Section G = 50% depth + 30% fluency + 20% confidence
Section H = 80% keyword + 20% fluency
```

**Group Discussion**
```
Voice  = 30% pace + 25% filler + 25% pause_avg + 20% clarity
Score  = avg(participation, leadership, listening, idea_quality, teamwork)
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login → JWT |
| POST | `/auth/register` | Register new user |
| GET | `/auth/google/url` | Get Google OAuth authorization URL |
| POST | `/auth/google/callback` | Handle Google OAuth callback |
| GET | `/auth/validate-email` | Validate email via token |
| POST | `/interview/start` | Start interview session |
| GET | `/interview/question` | Next adaptive question |
| POST | `/interview/answer` | Submit answer + multimodal scores |
| POST | `/api/voice/analyze` | Analyze audio file |
| POST | `/api/vision/analyze` | Analyze video frame |
| GET | `/analytics/me` | Full user analytics |
| POST | `/code/run` | Run code in sandbox |
| POST | `/comm/start` | Start comm test |
| POST | `/comm/answer/{id}` | Submit comm answer (audio) |
| GET | `/comm/results/{id}` | Comm test results |
| POST | `/gd/start` | Start GD session |
| POST | `/gd/user-turn/{id}` | Submit user audio turn |
| POST | `/gd/bot-turn/{id}` | Get next bot response |
| POST | `/gd/finish/{id}` | End GD + full scoring |
| GET | `/gd/results/{id}` | GD results + coaching |
| POST | `/resume/analyse` | Analyze resume PDF |
| POST | `/jd/analyse` | JD gap analysis |
| GET | `/reports/session/{id}` | Interview PDF report |
| GET | `/reports/comm/{id}` | Comm PDF report |
| GET | `/reports/gd/{id}` | GD PDF report |

Full interactive docs at `/docs` when backend is running.

---

## Known Issues

- Parselmouth pitch occasionally returns 0 Hz on short recordings — librosa fallback handles this automatically
- MediaPipe must stay at version `0.10.11` on Windows — newer versions break the FaceMesh pipeline
