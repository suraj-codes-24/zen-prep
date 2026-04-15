FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ libsndfile1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Pre-download sentence-transformers model to avoid cold-start delay
# This ensures HuggingFace Space doesn't hang on first request
RUN PYTHONPATH=/install/lib/python3.11/site-packages \
    python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"


FROM python:3.11-slim

# Install runtime dependencies (libsndfile for audio, libgl for opencv)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 libgomp1 libglib2.0-0 libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY --from=builder /root/.cache /root/.cache

# HuggingFace Spaces runs as user 1000
RUN useradd -m -u 1000 appuser
WORKDIR /app
COPY --chown=appuser:appuser . .

# Set permission for logs/data if needed
RUN mkdir -p /app/logs && chown appuser:appuser /app/logs

USER appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
