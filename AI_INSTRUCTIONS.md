# Interview Simulator — AI Instructions

## Project Overview
AI-powered multimodal mock interview platform. FastAPI backend + React/Vite frontend.

## Locations
- **Root:** `C:\Users\suraj\Desktop\interview_simulator`
- **Backend:** `http://localhost:8000` — run with `uvicorn main:app --reload`
- **Frontend:** `http://localhost:5173` — run with `cd frontend && npm run dev`
- **API Docs:** `http://localhost:8000/docs`
- **Database:** PostgreSQL — `interview_db`, user `postgres`
- **Test Login:** `suraj@test.com` / `test123`

## Tech Stack
- Python 3.11.8, Node v24
- FastAPI + SQLAlchemy + PostgreSQL (psycopg2)
- React + Vite (CSS-in-JSX, no Tailwind classes — inline styles)
- Ollama (`qwen2.5-coder:7b` default, `llama3.1:8b` for GD bots) on local GPU (NVIDIA RTX 4050)
- Whisper (local, CPU), librosa, parselmouth, MediaPipe 0.10.11
- Monaco Editor (`@monaco-editor/react@4.7.0`) for coding interviews
- recharts for analytics charts
- reportlab for PDF report generation
- PyMuPDF for resume PDF parsing

## Key Files
| File | Purpose |
|------|---------|
| `main.py` | FastAPI entry point, all routers registered |
| `database.py` | PostgreSQL engine + Base |
| `ai_engine/nlp_engine.py` | NLP scoring + CONCEPT_MAP (79 concepts) |
| `ai_engine/hr_engine.py` | Ollama HR evaluation |
| `ai_engine/voice_engine.py` | Whisper + librosa + parselmouth (9-feature scoring) |
| `ai_engine/vision_engine.py` | MediaPipe FaceMesh |
| `services/evaluation_service.py` | Routes hr vs technical + multimodal scoring |
| `services/interview_service.py` | Adaptive difficulty + no-repeat questions |
| `services/coding_service.py` | Multi-language code execution (Python, C++, Java) — batch compile, sandboxed |
| `routes/coding_v2_routes.py` | Coding V2 routes (companies, levels, sessions, run, submit) |
| `models/coding.py` | CodingProblem, CodingSet, CodingSession, CodingSubmission |
| `seed_coding_v2.py` | Seeds 24 LeetCode-style problems (2 levels × 4 companies) |
| `services/ollama_utils.py` | Centralized Ollama API wrapper |
| `services/followup_service.py` | AI follow-up question generation |
| `services/resume_service.py` | Resume PDF analysis via Ollama |
| `services/jd_service.py` | JD gap analysis via Ollama |
| `services/report_service.py` | PDF report generation (interview + comm + GD) |
| `services/session_feedback_service.py` | AI coaching summary |
| `services/communication_service.py` | Comm test scoring + session orchestration |
| `models/communication.py` | CommQuestion, CommSession, CommAnswer models |
| `routes/communication_routes.py` | 7 comm test endpoints + TTS endpoint |
| `seed_communication.py` | Seeds 140 comm questions across 8 sections |
| `models/gd.py` | GDTopic, GDSession, GDTurn, GDScore models |
| `services/gd_service.py` | GD session orchestration — start, user turn, finish, results |
| `services/gd_bot_service.py` | 5 bot personalities (Alex/Maya/Ravi/Priya/Sam) via llama3.1:8b |
| `services/gd_eval_service.py` | GD scoring: 5 dimensions, keywords, arguments, sentiment, participation intelligence |
| `services/gd_voice_service.py` | Lightweight 4-feature GD voice scoring (pace, filler, pause, clarity) |
| `routes/gd_routes.py` | 6 GD endpoints + Whisper transcription per turn |
| `seed_gd.py` | Seeds 60 GD topics across 5 categories (idempotent) |
| `frontend/src/components/GDPage.jsx` | GD Room — 4 views: setup (editorial topic grid), prep (two-col timer), room (circular bot layout), results (tabbed coaching) |
| `frontend/src/App.jsx` | Router + lazy imports for all 16 page components |
| `frontend/src/VoiceRecorder.jsx` | Audio recording (do NOT modify) |
| `frontend/src/VisionRecorder.jsx` | Camera + MediaPipe (do NOT modify) |

## Score Formulas
```
Technical: 70% NLP + 20% Voice + 10% Face
HR:        50% NLP + 30% Voice + 20% Face

NLP:   45% semantic + 25% keywords + 20% depth + 10% structure
Voice (9-feature): 15% pace + 15% filler + 15% pronunciation + 15% intonation
       + 10% modulation + 10% rhythm + 10% stress + 5% silence + 5% energy

Comm Fluency: 15% pace + 15% filler + 15% pronunciation + 12% intonation
       + 10% modulation + 10% rhythm + 10% stress + 8% confidence + 5% silence

Comm Sections: A=60%pace+40%fluency  B=70%wordMatch+30%fluency
  C=80%keyword+20%fluency  D=75%sentenceMatch+25%fluency
  E=60%semantic+40%fluency  F=40%fluency+30%depth+30%confidence
  G=50%depth+30%fluency+20%confidence  H=80%keyword+20%fluency

GD Voice (4-feature): 30% pace + 25% filler + 25% pause_avg + 20% clarity
GD Score (5-dim avg): participation + leadership + listening + idea_quality + teamwork
```

## API Reference
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | `{email, password}` → `{access_token, user}` |
| POST | `/auth/register` | `{name, email, password, branch, year}` |
| PUT | `/auth/profile` | Update user profile |
| PUT | `/auth/password` | Change password |
| GET | `/interview/subjects` | List all subjects |
| GET | `/interview/topics?subject_id=X` | Topics for subject |
| GET | `/interview/subtopics?topic_id=X` | Subtopics |
| POST | `/interview/start` | Start session → `{session_id}` |
| GET | `/interview/question` | Next adaptive question |
| POST | `/interview/answer` | Submit answer with multimodal scores |
| POST | `/api/voice/analyze` | Analyze audio file |
| POST | `/api/vision/analyze` | Analyze video frame |
| GET | `/analytics/me` | User analytics (interview + coding + comm + gd) |
| POST | `/code/run` | Execute code in sandbox |
| POST | `/ai/followup` | Generate AI follow-up question |
| POST | `/resume/analyse` | Analyze resume PDF |
| POST | `/jd/analyse` | JD gap analysis |
| GET | `/reports/session/{id}` | Download interview PDF report |
| GET | `/reports/comm/{id}` | Download comm PDF report |
| GET | `/reports/gd/{id}` | Download GD PDF report |
| GET | `/comm/sections` | List comm test sections |
| POST | `/comm/start` | Start comm test session |
| GET | `/comm/question/{id}` | Next comm question |
| POST | `/comm/answer/{id}` | Submit comm answer (audio) |
| POST | `/comm/finish/{id}` | End comm test early |
| GET | `/comm/results/{id}` | Comm test results + voice breakdown |
| GET | `/comm/history` | User's comm test history |
| GET | `/comm/tts` | Text-to-speech via a4f-local (OpenAI.fm) |
| GET | `/gd/topics` | List GD topics (60 total, 5 categories) |
| POST | `/gd/start` | Start GD session `{topic_id, bot_count, duration_mins}` |
| POST | `/gd/user-turn/{id}` | Submit audio turn → transcript + bot responses + voice score |
| POST | `/gd/finish/{id}` | End GD session → full scoring + coaching |
| GET | `/gd/results/{id}` | GD results with content analysis, sentiment, participation |
| GET | `/gd/history` | User's GD session history |

## Coding Conventions
- Use explicit if-blocks — no lambdas
- Follow existing patterns in each file before adding new code
- No over-engineering — keep additions minimal and focused
- Backend: Python snake_case; Frontend: React camelCase/PascalCase
- Difficulty levels: `beginner`, `intermediate`, `advanced`, `expert`

## Frontend Design System
- Background: `#0B0F1E` | Cards: `#0F1629` | Border: `rgba(255,255,255,0.07)`
- Primary: `#6366F1` (indigo) | Success: `#22C55E` | Warning: `#F59E0B`
- GD accent: `#06B6D4` (cyan)
- Text: `#F1F5F9` primary, `#94A3B8` secondary | Font: Inter
- Style: Glassmorphism cards, CSS keyframe animations
- Frontend split: 16 lazy-loaded page components via React.lazy in App.jsx

## Current Phase Status
- Phase 1 — Core Backend (JWT, PostgreSQL, NLP, 133 questions): DONE
- Phase 2 — Intelligence Layer (Ollama HR + adaptive difficulty): DONE
- Phase 3 — Voice Analysis (Whisper + librosa + parselmouth): DONE
- Phase 4 — Face Analysis (MediaPipe + multimodal scoring): DONE
- Phase 5 — Frontend Redesign (16 pages, recharts, state-based routing): DONE
- Phase 5b — DB Redesign (drop dead tables, enrich answers/users/sessions): DONE
- Phase 6 — Profile + Settings + Onboarding pages: DONE
- Phase 7 — Coding Interview (Monaco Editor + multi-language: Python, C++, Java): DONE
- Phase 8 — AI Follow-up Questions (Ollama): DONE
- Phase 9 — Resume Analyser (PyMuPDF + Ollama): DONE
- Phase 10 — JD Gap Analyser (Ollama + difflib): DONE
- Phase 11 — Interview Replay (transcript timeline): DONE
- Phase 12 — PDF Reports (reportlab): DONE
- Phase 12.5 — UX & stability improvements: DONE
- Phase 14 — Question Bank Expansion (133 → 482 questions, NLP CONCEPT_MAP extended): DONE
- Phase 15 — Communication Interview (Versant-style, 8 sections, 140 questions): DONE
- Phase 15.5 — Enhanced Voice Engine (5 new dimensions, 9-feature scoring): DONE
- Phase 15.10 — Comm UX polish (AI TTS for questions, section animations, silence auto-submit, radar chart fix): DONE
- Phase 16 — Coding Room Hardening (batch compile, safety expansion, error sanitization, subprocess flags): DONE
- Phase 17 — GD Room (circular bot layout, glassmorphism, editorial topic grid, coaching tabs, Share of Voice): DONE
- Phase 17.5 — GD Backend Upgrade (voice scoring, Ollama sentiment, participation intelligence, keyword extraction, argument analysis, difficulty-aware bots, 60 topics, PDF report, analytics tab): DONE
- Phase 13 — Docker + Deploy: PLANNED

## Known Issues
- Parselmouth pitch occasionally returns 0 Hz (librosa fallback covers it)
- mediapipe MUST be version `0.10.11` on Windows — do not upgrade

## Git Rules
- Follow project standards for commit messages
- Ensure all code is tested before pushing

## Do NOT
- Upgrade mediapipe beyond 0.10.11
- Change the multimodal score weights without being asked
- Add features outside the scope of the current request
