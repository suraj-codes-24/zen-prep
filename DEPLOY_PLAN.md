# ZenPrep — Free Tier Deployment Plan

## Stack (100% free, no credit card)

| Layer | Service | Cost |
|-------|---------|------|
| Frontend | Vercel | $0 |
| Backend | HuggingFace Spaces (Docker) | $0 |
| Database | Neon (PostgreSQL) | $0 |
| LLM | Groq `llama-3.1-8b-instant` | $0 |
| Whisper STT | Groq `whisper-large-v3-turbo` | $0 |

```
[User Browser]
     ↓
Vercel (React frontend)
     ↓ VITE_API_URL
HuggingFace Space (FastAPI, port 7860)
  ├── librosa / parselmouth / mediapipe  (CPU, on HF VM)
  ├── Neon PostgreSQL                    (external, free)
  └── Groq API                           (LLM + Whisper, free)
```

---

## All Files That Need Changes

### Backend

| # | File | Change | Size |
|---|------|--------|------|
| 1 | `services/ollama_utils.py` | Full rewrite — Groq SDK replaces requests to localhost:11434 | Medium |
| 2 | `ai_engine/hr_engine.py` | Remove local Ollama call, use `ollama_utils.generate()` | Small |
| 3 | `ai_engine/voice_engine.py` | Remove whisper+torch, add Groq STT client, fix `analyze_pronunciation` signature | Large |
| 4 | `routes/gd_routes.py` | Remove `get_whisper_model`, add Groq STT call inline | Small |
| 5 | `core/config.py` | Add `GROQ_API_KEY = os.getenv("GROQ_API_KEY")` | Tiny |
| 6 | `.env.example` | Add `GROQ_API_KEY`, update DB URL format with `?sslmode=require` | Tiny |
| 7 | `main.py` | Add `FRONTEND_URL` env var to CORS origins | Tiny |
| 8 | `requirements.txt` | Remove `openai-whisper` + `torch`, add `groq>=0.9.0` | Tiny |
| 9 | `database.py` | Add `pool_size=3, max_overflow=2` to `create_engine()` for Neon limits | Tiny |

### Frontend

| # | File | Line | Change |
|---|------|------|--------|
| 10 | `frontend/src/shared.jsx` | 3 | `const API = import.meta.env.VITE_API_URL \|\| "http://127.0.0.1:8000"` |
| 11 | `frontend/src/VisionRecorder.jsx` | 3 | Same env var fix (has its own local `API` constant) |
| 12 | `frontend/src/VoiceRecorder.jsx` | 163 | Fix hardcoded `fetch("http://localhost:8000/api/voice/analyze")` |
| 13 | `frontend/src/components/GDPage.jsx` | 1387 | Fix hardcoded `http://localhost:8000/reports/gd/${id}` |

### New Files

| # | File | Purpose |
|---|------|---------|
| 14 | `Dockerfile` | Multi-stage build for HuggingFace Spaces (port 7860, uid 1000) |
| 15 | `README.md` | Add HF Spaces YAML frontmatter at top |

---

## Exact Code Changes

### 1. `services/ollama_utils.py` — full rewrite

Replace entire file. Keep same public interface: `generate()`, `extract_json_object()`, `extract_json_array()`, `OllamaUnavailable`.

```python
import os
from groq import Groq, APIConnectionError

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL_MAP = {
    "llama3.1:8b":        "llama-3.1-8b-instant",
    "qwen2.5-coder:7b":   "llama-3.1-8b-instant",
}
DEFAULT_MODEL = "llama-3.1-8b-instant"

class OllamaUnavailable(Exception):
    pass

def generate(prompt, model="llama3.1:8b", temperature=0.7, num_predict=512):
    groq_model = MODEL_MAP.get(model, DEFAULT_MODEL)
    try:
        resp = _client.chat.completions.create(
            model=groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=num_predict,
        )
        return resp.choices[0].message.content.strip()
    except APIConnectionError as e:
        raise OllamaUnavailable(str(e)) from e
```

`extract_json_object()` and `extract_json_array()` stay the same (they just call `generate()` and parse).

### 2. `ai_engine/hr_engine.py` — remove rogue Ollama call

Lines 5 and 49–67 have a direct `requests.post(OLLAMA_URL)` that bypasses `ollama_utils.py`. Replace with:

```python
from services.ollama_utils import generate, OllamaUnavailable
# remove local OLLAMA_URL and MODEL_NAME constants
# replace requests.post(...) block with:
response_text = generate(prompt, model="llama3.1:8b", num_predict=600)
```

### 3. `ai_engine/voice_engine.py` — Groq STT

- Remove `import whisper`, `import torch`
- Remove `_whisper_model` global, `get_whisper_model()`, eager preload block (lines 20–36)
- Add Groq STT client at module level:
  ```python
  from groq import Groq as _GroqClient
  _groq_stt = _GroqClient(api_key=os.getenv("GROQ_API_KEY"))
  ```
- Rewrite `transcribe_audio(audio_path)`:
  ```python
  def transcribe_audio(audio_path: str) -> str:
      with open(audio_path, "rb") as f:
          resp = _groq_stt.audio.transcriptions.create(
              file=(os.path.basename(audio_path), f, "audio/wav"),
              model="whisper-large-v3-turbo",
              language="en",
          )
      return resp.text.strip().lower()
  ```
- Rewrite `analyze_pronunciation(audio_path)` — no `model` param (Groq has no word timestamps):
  ```python
  # Returns fixed estimate since Groq STT has no word-level confidence
  transcript = transcribe_audio(audio_path)
  word_count = len(transcript.split())
  return {"score": 75, "avg_confidence": 0.75, "low_confidence_words": 0, "total_words": word_count}
  ```
- In `analyze_voice()` remove `model = get_whisper_model()` and update `analyze_pronunciation(audio_path, model)` → `analyze_pronunciation(audio_path)`

### 4. `routes/gd_routes.py` — GD Whisper call

Lines 18–19, 81–91:

- Remove `from ai_engine.voice_engine import get_whisper_model`
- Replace the whisper block with:
  ```python
  from groq import Groq as _GroqSTT
  _gd_stt = _GroqSTT(api_key=os.getenv("GROQ_API_KEY"))

  # inside the route:
  with open(tmp_path, "rb") as f:
      stt_resp = _gd_stt.audio.transcriptions.create(
          file=(os.path.basename(tmp_path), f, "audio/wav"),
          model="whisper-large-v3-turbo", language="en",
      )
  transcript = stt_resp.text.strip()
  # pass whisper_segments=None — gd_voice_service handles None gracefully
  voice_score = score_gd_voice(transcript, duration_sec, whisper_segments=None)
  ```

### 5–9. Small config/env changes

**`core/config.py`** — add:
```python
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
```

**`.env.example`** — add:
```
GROQ_API_KEY=gsk_...your_key_here...
FRONTEND_URL=https://your-app.vercel.app

# Neon DB (note: ?sslmode=require is mandatory)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**`main.py`** — update CORS:
```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    os.getenv("FRONTEND_URL", ""),
],
```

**`requirements.txt`** — remove `openai-whisper`, `torch`, `torchaudio`. Add `groq>=0.9.0`.

**`database.py`** — update `create_engine`:
```python
engine = create_engine(DATABASE_URL, pool_size=3, max_overflow=2, pool_pre_ping=True)
```

### 10–13. Frontend env var fixes

**`frontend/src/shared.jsx` line 3:**
```js
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
```

**`frontend/src/VisionRecorder.jsx` line 3:**
```js
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
```

**`frontend/src/VoiceRecorder.jsx` line 163:**
```js
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const res = await fetch(`${API_BASE}/api/voice/analyze`, {
```

**`frontend/src/components/GDPage.jsx` line 1387:**
```js
<a href={`${API}/reports/gd/${sessionData.session_id}`}
```
(`API` is already imported from `../shared` in GDPage.jsx)

### 14. `Dockerfile` (new file at repo root)

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
    libsndfile1 libgomp1 libglib2.0-0 libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY --from=builder /root/.cache /root/.cache

RUN useradd -m -u 1000 appuser
WORKDIR /app
COPY --chown=appuser:appuser . .
USER appuser

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
```

### 15. `README.md` — add HF frontmatter at top

```yaml
---
title: ZenPrep Interview Simulator
emoji: 🎯
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---
```

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| `analyze_pronunciation()` loses word-level confidence (no Groq word timestamps) | Medium | Return fixed 75/100 estimate — affects 15% weight of voice score |
| Groq STT rate limit: 20 req/min audio | Medium | App rate limiter already in place; fine for demo use |
| Groq LLM rate limit: 14,400 req/day | Low | ~700 full interviews/day — more than enough |
| HF cold start after inactivity (~30s wake) | Low | First request slow; subsequent requests fast |
| Neon 10 connection limit | Low | Fixed by `pool_size=3, max_overflow=2` in database.py |
| Docker image ~3.5 GB, 30–40 min build | Low | One-time cost; rebuilds only on code changes |
| mediapipe 0.10.11 — AMD64 only | None | HF free tier is AMD64 Linux ✓ |

---

## Deployment Steps (After Code Changes)

```
1. Sign up → neon.tech          → create project → copy DATABASE_URL
2. Sign up → console.groq.com   → create API key → copy GROQ_API_KEY
3. Push repo to GitHub
4. Sign up → huggingface.co     → New Space → Docker → link GitHub repo
   Add Secrets: DATABASE_URL, SECRET_KEY, GROQ_API_KEY, ADMIN_EMAILS, FRONTEND_URL
5. Wait for HF build (~30 min first time)
6. Seed the database (run locally pointing at Neon):
       DATABASE_URL="..." python seed_gd.py
       DATABASE_URL="..." python seed_communication.py
       DATABASE_URL="..." python seed_coding_v2.py
       DATABASE_URL="..." python seed_questions.py   (or hit /interview/seed-questions)
7. Sign up → vercel.com → import frontend/ subdirectory from GitHub
   Add env var: VITE_API_URL = https://your-space.hf.space
8. Update HF Secret: FRONTEND_URL = https://your-app.vercel.app
9. Test end-to-end from Vercel URL
```

---

## Groq Free Tier Summary

| Resource | Free Limit | App Usage |
|----------|-----------|-----------|
| `llama-3.1-8b-instant` | 14,400 req/day | ~10 LLM calls per interview |
| `whisper-large-v3-turbo` | 7,200 req/day + 2hrs audio/day | ~5 STT calls per interview |
| Rate limit (LLM) | 30 req/min | Fine for single user |
| Rate limit (audio) | 20 req/min | Fine for single user |
| Signup | Email/Google/GitHub | No credit card |
