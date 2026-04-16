# ZenPrep — Technical Design Document Plan

> Full 90+ page technical report covering all architecture, diagrams, flowcharts, and screenshots.
> Discussed on 2026-03-28. **Not started yet.**

---

## Estimated Total: ~92 pages

| Chapter | Topic | Est. Pages |
|---------|-------|------------|
| 1 | Introduction & Project Overview | 4 |
| 2 | System Architecture | 8 |
| 3 | Database Design (full ERD) | 7 |
| 4 | Authentication & User Management | 4 |
| 5 | AI Engine (NLP + Voice + Face + Fusion) | 12 |
| 6 | Interview System (adaptive difficulty, state machine) | 7 |
| 7 | Coding Interview (sandbox, multi-lang, security) | 6 |
| 8 | Communication Test (Versant-style, 8 sections) | 7 |
| 9 | GD Room (bots, turn flow, scoring, coaching) | 10 |
| 10 | Resume & JD Analyser | 4 |
| 11 | PDF Report Generation | 3 |
| 12 | Frontend Architecture (16 components, recording pipeline) | 7 |
| 13 | API Reference (all endpoints) | 5 |
| 14 | Security Considerations | 3 |
| 15 | Performance & Known Issues | 2 |
| 16 | Deployment Roadmap (Phase 13 Docker) | 3 |
| **TOTAL** | | **~92 pages** |

---

## Chapter 1 — Introduction & Project Overview (4 pages)
- What ZenPrep is and the problem it solves
- Target users and use cases
- Key differentiators: multimodal scoring, adaptive difficulty, GD with AI bots
- Technology choices and why (FastAPI over Django, local Ollama over OpenAI API, Whisper over cloud STT)
- High-level feature list table

**Visuals:** Feature overview table, screenshot of Dashboard, screenshot of app navigation

---

## Chapter 2 — System Architecture (8 pages)
- Overall system design — monolithic vs microservice decision
- Three-layer architecture: Presentation → API → Data/AI
- How frontend communicates with backend (REST, FormData for audio/video)
- JWT authentication lifecycle
- Google OAuth 2.0 integration — token exchange, user account linking
- Email validation system via SMTP
- LLM architecture: Gemini (primary) with Groq (fallback), Ollama (local)
- Whisper pipeline — audio → transcription flow
- MediaPipe integration

**Visuals:**
- Full system architecture diagram (React ↔ FastAPI ↔ PostgreSQL ↔ Ollama ↔ Whisper ↔ MediaPipe)
- JWT auth flow diagram (register → login → token → protected routes)
- Request lifecycle diagram (frontend → middleware → router → service → DB → response)
- Screenshot: Swagger API docs

---

## Chapter 3 — Database Design (7 pages)
- Design philosophy — why PostgreSQL, schema decisions
- Every table explained: Users, Sessions, Answers, Questions, Subjects, Topics, Subtopics
- Coding tables: CodingProblem, CodingSet, CodingSession, CodingSubmission
- Communication tables: CommQuestion, CommSession, CommAnswer
- GD tables: GDTopic, GDSession, GDTurn, GDScore
- Indexing strategy, foreign key relationships
- Why certain fields are stored inline (multimodal scores on Answer row)

**Visuals:**
- Full ERD diagram (all tables, all relationships, cardinality)
- Schema reference tables (every column, type, nullable, description)
- Screenshot: example DB rows showing score data

---

## Chapter 4 — Authentication & User Management (4 pages)
- JWT implementation — token generation, expiry, refresh strategy
- Password hashing (bcrypt)
- Profile management — what can be updated
- Session ownership — how every resource is user-scoped

### 4.3 Google OAuth Integration
- Google OAuth 2.0 flow implementation
- Token exchange with Google API
- User account creation/linking
- Email validation for new users
- SMTP-based validation email sending
- Account linking for existing users (Google ID to existing email)
- Frontend OAuth callback handling
- Browser history management for SPA navigation

**Visuals:**
- Auth flow diagram (login → JWT → API calls → token expiry)
- Registration flow diagram
- Google OAuth flow diagram (user → Google → callback → token → login)
- Email validation flow diagram
- Screenshots: Login page, Profile page, Settings page, Google login button

---

## Chapter 5 — AI Engine Architecture (12 pages)

### 5.1 NLP Engine
- LLM architecture: Gemini (primary) with Groq (fallback), Ollama (local)
- CONCEPT_MAP — 79 concepts, structure
- Semantic similarity using sentence embeddings
- Keyword extraction and matching logic
- Answer depth scoring
- Structure scoring
- Follow-up question generation via LLM
- Final formula: 45% semantic + 25% keywords + 20% depth + 10% structure

### 5.2 Voice Engine
- Audio pipeline: WebM blob → Whisper transcription → librosa → parselmouth
- All 9 features explained individually:
  - Pace (WPM calculation)
  - Filler word detection (regex patterns)
  - Pronunciation (Whisper confidence)
  - Intonation (pitch variation)
  - Modulation (pitch range)
  - Rhythm (pause distribution)
  - Stress patterns
  - Silence ratio
  - Energy level (RMS amplitude)
- Parselmouth 0 Hz fallback to librosa
- Final voice formula

### 5.3 Face Engine
- MediaPipe FaceMesh — 468 landmark points
- Eye contact detection (gaze vector calculation)
- Attention score derivation
- Why version 0.10.11 is locked on Windows

### 5.4 Multimodal Score Fusion
- Technical interview: 70% NLP + 20% Voice + 10% Face
- HR interview: 50% NLP + 30% Voice + 20% Face
- Score normalization

**Visuals:**
- NLP scoring pipeline diagram
- Voice feature extraction pipeline (audio → FFT → 9 features → score)
- Face analysis pipeline (frame → MediaPipe → landmarks → score)
- Multimodal fusion diagram (weight combinations)
- Score formula reference table (all formulas)
- Screenshots: live scoring panel, voice breakdown in results

---

## Chapter 6 — Interview System (7 pages)
- Subject → Topic → Subtopic → Question hierarchy
- Question bank: 482 questions, categorization
- Adaptive difficulty algorithm — score history → next question difficulty
- No-repeat question logic — session-level deduplication
- Answer submission pipeline (audio + video + text together)
- Follow-up question generation via Ollama — prompt design
- Session state machine: start → question → answer → follow-up → next → end
- Evaluation routing: HR vs Technical different scoring weights
- Interview replay — transcript timeline construction

**Visuals:**
- Adaptive difficulty flowchart (score thresholds → difficulty adjustment)
- Session state machine diagram
- Answer submission flow (frontend → multimodal scoring → DB write)
- Follow-up generation flowchart (answer → Ollama prompt → follow-up)
- Screenshots: interview room, question card, follow-up card, replay

---

## Chapter 7 — Coding Interview System (6 pages)
- Problem structure — difficulty levels, company tags, problem sets
- 24 seeded problems — 2 difficulty levels × 4 companies
- Multi-language execution: Python, C++, Java
- Sandbox design — how code execution is isolated
- Batch compile approach
- Security measures — restricted imports, timeout, subprocess flags
- Test case evaluation — pass/fail logic, partial scoring
- Error sanitization
- Monaco editor integration

**Visuals:**
- Code execution pipeline (user code → sandbox → compiler → output → evaluator)
- Security layer diagram (what's blocked vs allowed)
- Screenshots: coding room with Monaco editor, test case results, problem list

---

## Chapter 8 — Communication Test System (7 pages)
- Versant-style design — what it tests and why
- 8 sections explained: Read Aloud, Repeat Sentence, Open Question, Sentence Build, Keywords, Free Response, Opinion, Vocabulary
- 140 seeded questions
- TTS integration — Edge Neural voices pipeline
- Per-section scoring formulas (all 8 different formulas):
  - A: 60% pace + 40% fluency
  - B: 70% wordMatch + 30% fluency
  - C: 80% keyword + 20% fluency
  - D: 75% sentenceMatch + 25% fluency
  - E: 60% semantic + 40% fluency
  - F: 40% fluency + 30% depth + 30% confidence
  - G: 50% depth + 30% fluency + 20% confidence
  - H: 80% keyword + 20% fluency
- Silence auto-submit — AudioContext/AnalyserNode polling logic
- Session orchestration — section progression, early finish

**Visuals:**
- Section progression diagram (8 sections → scoring → aggregate)
- TTS pipeline diagram (text → Edge Neural → audio stream → frontend)
- Silence detection flowchart (RMS polling → threshold → auto-submit)
- Per-section scoring formula table
- Screenshots: comm test in progress, results with radar chart + section scores

---

## Chapter 9 — Group Discussion Room (10 pages)

### 9.1 Bot Personality Architecture
- 5 bots: Alex (Initiator), Zoe (Challenger), Ethan (Synthesizer), Kate (Expert), Sam (Questioner)
- Each personality — style, fallback, behaviour triggers
- Bot count selection (3-5 bots)

### 9.2 LLM Prompt Engineering
- Base prompt structure per bot (Groq Cloud API)
- Difficulty-aware context injection (easy/medium/hard)
- Phase-aware instructions (early/mid/late)
- Bot-specific overrides (Zoe challenges weak args, Sam directs questions, Ethan synthesizes late)
- Silent user handling — `[user did not speak]` marker and bot reaction

### 9.3 Turn Flow State Machine
- Turn orchestration: bot speaks → pause → next bot or user
- Round tracking: botsSpokeRef, userSpokeRef, forcedDoneRef
- Forced turn logic — when and why user gets forced
- Silence detection during forced turns (5-second threshold)
- forcedDoneRef must be set in catch block (critical bug fix)

### 9.4 GD Scoring System
- 5 dimensions: participation, leadership, listening, idea_quality, teamwork
- Keyword extraction, argument analysis
- Sentiment analysis via Ollama
- Participation intelligence — share of voice, turn count, consistency
- Voice scoring: 4-feature (30% pace + 25% filler + 25% pause + 20% clarity)
- Final GD score: average of 5 dimensions

### 9.5 Coaching Generation
- End-of-session coaching via Ollama
- Data fed into coaching prompt
- Filtering `[user did not speak]` from analytics

**Visuals:**
- Bot personality architecture diagram
- Turn flow state machine (bot_speaking → pause → forced_turn → user_turn → processing)
- Forced turn flowchart (silence → auto-stop → submit → forcedDoneRef)
- GD scoring pipeline diagram
- Round tracking flowchart (botsSpokeRef reset logic)
- Screenshots: circular bot layout, hint card during forced turn, GD results + coaching tabs, setup topic grid

---

## Chapter 10 — Resume & JD Analyser (4 pages)
- PyMuPDF — PDF text extraction
- Resume section parsing (Skills, Experience, Education)
- Ollama prompt for resume analysis
- JD Gap Analysis — difflib similarity + keyword matching
- Matched vs missing skills identification
- ATS compatibility scoring

**Visuals:**
- Resume analysis pipeline (PDF → PyMuPDF → text → Ollama → output)
- JD gap analysis flowchart
- Screenshots: resume upload + analysis results, JD gap matched/missing skills

---

## Chapter 11 — PDF Report Generation (3 pages)
- reportlab pipeline — session data → PDF layout
- 3 report types: Interview, Communication, GD
- What each report contains
- Chart embedding in PDF
- Download endpoint design

**Visuals:**
- Screenshots: sample interview PDF, sample GD PDF report

---

## Chapter 12 — Frontend Architecture (7 pages)
- 16 lazy-loaded components — why lazy loading
- State management: local state + localStorage, no Redux
- State-based routing vs React Router decision
- Recording pipeline: getUserMedia → MediaRecorder → ondataavailable → Blob → FormData → fetch
- VoiceRecorder and VisionRecorder — why locked
- SidebarLayout wrapping system
- Design system tokens (colors, spacing, glassmorphism)
- recharts integration
- Monaco editor integration
- localStorage keys — what's persisted and why

**Visuals:**
- Component tree diagram (App.jsx → lazy routes → page components)
- Recording pipeline diagram (getUserMedia → MediaRecorder → Blob → API)
- Interview session state flow diagram
- Design system color/token reference table
- Screenshot: App.jsx route structure

---

## Chapter 13 — API Reference (5 pages)
- Every endpoint: method, path, auth required, request body, response shape
- Error codes and meanings
- File upload endpoints (audio, video, PDF)

#### 13.1.1 Authentication Endpoints
- POST `/auth/login` — Traditional email/password login
- POST `/auth/register` — New user registration
- GET `/auth/google/url` — Get Google OAuth authorization URL
- POST `/auth/google/callback` — Handle Google OAuth callback
- GET `/auth/validate-email` — Validate email via token

**Visuals:**
- Full endpoint table grouped by domain
- Screenshot: Swagger docs

---

## Chapter 14 — Security Considerations (3 pages)
- JWT security — token storage, expiry, no refresh token (current limitation)
- Code execution sandbox — what's restricted
- File upload validation
- SQL injection prevention (SQLAlchemy ORM)
- Passwords hashed, no plaintext storage
- Local-only AI (Ollama) — no data leaves the machine
- Google OAuth 2.0 security — token storage and validation
- CSRF protection via state parameter
- Email validation token security
- Secure redirect URI validation
- App-specific passwords for SMTP

---

## Chapter 15 — Performance & Known Issues (2 pages)
- Whisper on CPU — latency tradeoffs
- Parselmouth 0 Hz edge case — librosa fallback
- MediaPipe 0.10.11 lock on Windows — why upgrading breaks it
- Ollama cold start latency
- Large GD sessions memory considerations
- Google API rate limits
- Email delivery delays (SMTP)
- Token expiration handling
- Fallback LLM latency (Groq vs Gemini)

---

## Chapter 16 — Deployment Roadmap / Phase 13 (3 pages)
- Docker containerization plan — which services get containers
- Docker Compose design (FastAPI + PostgreSQL + Ollama + frontend)
- Environment variable management
- GPU passthrough for Ollama in Docker
- Cloud deployment considerations

---

## Pending Decisions
- [ ] Format: Word / LaTeX / Markdown?
- [ ] Diagrams: Mermaid code (auto-renders) or draw.io descriptions?
- [ ] Screenshots: user takes from running app
- [ ] Audience: college submission / portfolio / internal docs?
