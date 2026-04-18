# ZenPrep 🧘

> AI-powered interview preparation platform with multimodal feedback — voice, face, and NLP analysis across interviews, coding, communication tests, and group discussions.

🔗 **Live App:** [zenprep.xyz](https://zenprep.xyz)

---

## ✨ Features

- 🎤 **AI Mock Interviews** — Adaptive questions, follow-up generation, voice & face scoring
- 💻 **Coding Module** — Multi-language problem bank with execution and scoring
- 🗣️ **Communication Tests** — TTS-driven sections with audio answer analysis
- 👥 **Group Discussion** — Bot personalities, forced-turn coaching, ready-script sidebar
- 📊 **Analytics Dashboard** — Cross-module stats, session history, PDF reports
- 🤖 **Career AI** — Resume parsing, JD gap analysis, personalized recommendations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Neon) |
| LLM | Gemini (primary) + Groq (fallback) |
| STT | Groq Whisper |
| TTS | edge-tts |
| Deployment | Vercel (frontend) + Hugging Face Docker (backend) |

---

## 🚀 Running Locally

### Prerequisites

- Node.js (v18+)
- Python 3.11+
- PostgreSQL database (or a [Neon](https://neon.tech) connection string)
- API keys: Gemini, Groq, Google OAuth

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/zen-prep.git
cd zen-prep
```

---

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
```

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ADMIN_EMAILS=your@email.com

GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@zen-prep.com
CONTACT_TO_EMAIL=your@email.com
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API docs available at: `http://localhost:8000/docs`
Health check: `http://localhost:8000/health`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🏗️ Project Structure

```
zen-prep/
├── main.py                  # App entry point, middleware, CORS
├── database.py              # SQLAlchemy engine and sessions
├── routes/                  # API route handlers
│   ├── interview_routes.py
│   ├── answer_routes.py
│   ├── voice_routes.py
│   ├── vision_routes.py
│   ├── analytics_routes.py
│   ├── communication_routes.py
│   └── gd_routes.py
├── services/                # Business logic and AI integrations
│   ├── evaluation_service.py
│   ├── llm_utils.py
│   ├── analytics_service.py
│   └── ...
└── frontend/                # React + Vite frontend
    └── src/
        ├── components/
        └── ...
```

---

## 🌐 Production Deployment

| Service | Provider | URL |
|---------|----------|-----|
| Frontend | Vercel | [zenprep.xyz](https://zenprep.xyz) |
| Backend | Hugging Face Spaces (Docker) | — |
| Database | Neon Postgres | — |

### Deploy Frontend (Vercel)
1. Push your branch to GitHub.
2. Point Vercel to the `frontend/` directory.
3. Set `VITE_API_URL` to your Hugging Face backend URL.

### Deploy Backend (Hugging Face Docker)
1. Push backend changes to the Hugging Face Space repo.
2. Wait for the Docker build to complete.
3. Ensure all secrets are set in the Space settings.
4. Hit `/health` to confirm the Space is live.

---

## ⚠️ Notes

- **Windows users:** Pin `mediapipe==0.10.11` to avoid vision breakage.
- **Cold starts:** The Hugging Face backend may be slow on the first request — hit `/health` once before a demo.
- **Database:** Tables are auto-created on backend startup via `main.py`.
- The backend requires `libsndfile1`, `libgomp1`, `libglib2.0-0`, and `libgl1` in the Docker environment.

---

## 📄 License

MIT