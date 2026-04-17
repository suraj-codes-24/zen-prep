# ZenPrep — Free Tier Deployment Plan

## Stack (100% free, no credit card)

| Layer | Service | Cost |
|-------|---------|------|
| Frontend | Vercel | $0 |
| Backend | HuggingFace Spaces (Docker) | $0 |
| Database | Neon (PostgreSQL) | $0 |
| LLM | Gemini (primary), Groq Cloud API (LLaMA models) | $0 |
| STT | Groq Cloud API (fast speech-to-text) | $0 |
| TTS | edge-tts (Microsoft Edge) | $0 |

```
[User Browser]
     ↓
Vercel (React frontend)
     ↓ VITE_API_URL
HuggingFace Space (FastAPI, port 7860)
  ├── librosa / parselmouth / mediapipe  (CPU, on HF VM)
  ├── Neon PostgreSQL                    (external, free)
  ├── Gemini API                         (primary LLM, free)
  └── Groq Cloud API                     (LLaMA + STT, free)
```

---

## Current Deployment Setup

The codebase is already configured for deployment with:
- **LLM:** Gemini (primary) + Groq Cloud API (LLaMA models)
- **STT:** Groq Cloud API (fast speech-to-text)
- **TTS:** edge-tts (Microsoft Edge)
- **Face Analysis:** opencv-python-headless, MediaPipe 0.10.11
- **Voice Analysis:** librosa, parselmouth, scipy

### Backend Configuration

| # | File | Status |
|---|------|--------|
| 1 | `services/llm_utils.py` | Uses Gemini + Groq Cloud API |
| 2 | `ai_engine/hr_engine.py` | Uses LLM (Gemini/Groq) |
| 3 | `ai_engine/voice_engine.py` | Uses librosa + parselmouth |
| 4 | `routes/gd_routes.py` | Uses Groq Cloud API for STT |
| 5 | `core/config.py` | Has GEMINI_API_KEY, GROQ_API_KEY, GOOGLE_OAUTH config |
| 6 | `requirements.txt` | Updated with groq, google-generativeai, httpx |
| 7 | `Dockerfile` | Multi-stage build with libgl1 (not libgl1-mesa-glx) |

### Frontend Configuration

| # | File | Status |
|---|------|--------|
| 8 | `frontend/src/shared.jsx` | Uses VITE_API_URL env var |
| 9 | `frontend/src/VoiceRecorder.jsx` | Uses API_BASE from shared.jsx |
| 10 | `frontend/src/VisionRecorder.jsx` | Uses API from shared.jsx |
| 11 | `frontend/src/components/GDPage.jsx` | Uses API from shared.jsx |
| 12 | `frontend/src/components/LandingPage.jsx` | Contact form sends email via backend |

### Environment Variables Required

**Backend (HuggingFace Space):**
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ADMIN_EMAILS=admin@example.com
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address
SMTP_PASSWORD=your_app_specific_password
FROM_EMAIL=noreply@zen-prep.com
FRONTEND_URL=https://your-app.vercel.app
```

**Frontend (Vercel):**
```env
VITE_API_URL=https://your-space.hf.space
```

### Dockerfile

```dockerfile
FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ libsndfile1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Pre-download sentence-transformers model to avoid cold-start delay
RUN PYTHONPATH=/install/lib/python3.11/site-packages \
    python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"


FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 libgomp1 libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY --from=builder /root/.cache /root/.cache

RUN useradd -m -u 1000 appuser
WORKDIR /app
COPY --chown=appuser:appuser . .
USER appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
```

### README.md Frontmatter

```yaml
---
title: ZenPrep Interview Simulator
emoji: 🎯
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
license: mit
---
```

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Groq STT rate limit: 20 req/min audio | Medium | App rate limiter already in place; fine for demo use |
| Groq LLM rate limit: 14,400 req/day | Low | ~700 full interviews/day — more than enough |
| Gemini API rate limits | Low | Free tier generous; fallback to Groq available |
| HF cold start after inactivity (~30s wake) | Low | First request slow; subsequent requests fast |
| Neon 10 connection limit | Low | Fixed by `pool_size=3, max_overflow=2` in database.py |
| Docker image ~3.5 GB, 30–40 min build | Low | One-time cost; rebuilds only on code changes |
| mediapipe 0.10.11 — AMD64 only | None | HF free tier is AMD64 Linux ✓ |
| Google OAuth token expiration | Low | JWT refresh mechanism implemented |

---

## Deployment Steps

```
1. Sign up → neon.tech          → create project → copy DATABASE_URL
2. Sign up → console.groq.com   → create API key → copy GROQ_API_KEY
3. Sign up → ai.google.dev      → create API key → copy GEMINI_API_KEY
4. Sign up → console.cloud.google.com → create OAuth credentials → copy GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
5. Sign up → huggingface.co     → New Space → Docker → link GitHub repo
   Add Secrets: DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, GROQ_API_KEY, GOOGLE_CLIENT_ID, 
                GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, ADMIN_EMAILS, FRONTEND_URL,
                SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL
6. Wait for HF build (~30 min first time)
7. Seed the database (run locally pointing at Neon):
       DATABASE_URL="..." python seed_gd.py
       DATABASE_URL="..." python seed_communication.py
       DATABASE_URL="..." python seed_coding_v2.py
       DATABASE_URL="..." python seed_questions.py   (or hit /interview/seed-questions)
8. Sign up → vercel.com → import frontend/ subdirectory from GitHub
   Add env var: VITE_API_URL = https://your-space.hf.space
9. Update HF Secret: FRONTEND_URL = https://your-app.vercel.app
10. Update Google OAuth redirect URI in Google Cloud Console to: https://your-app.vercel.app/auth/callback
11. Test end-to-end from Vercel URL
```

---

## API Free Tier Summary

**Groq Cloud API:**
| Resource | Free Limit | App Usage |
|----------|-----------|-----------|
| LLaMA models | 14,400 req/day | ~10 LLM calls per interview |
| Whisper STT | 7,200 req/day + 2hrs audio/day | ~5 STT calls per interview |
| Rate limit (LLM) | 30 req/min | Fine for single user |
| Rate limit (audio) | 20 req/min | Fine for single user |
| Signup | Email/Google/GitHub | No credit card |

**Gemini API:**
| Resource | Free Limit | App Usage |
|----------|-----------|-----------|
| Gemini models | Generous free tier | Primary LLM for scoring |
| Rate limit | Depends on model | Fallback to Groq if needed |
| Signup | Google account | No credit card |

**edge-tts:**
| Resource | Cost |
|----------|------|
| Text-to-Speech | Free (Microsoft Edge) |
