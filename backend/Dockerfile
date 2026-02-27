# ── Backend Dockerfile ──
FROM python:3.11-slim

WORKDIR /app

# System deps (ffmpeg for video pipeline, build tools for wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm

# App code
COPY . .

# Create required directories
RUN mkdir -p uploads outputs/audio assets/isl_clips

# Generate placeholder ISL clips
RUN python setup.py || true

EXPOSE 8000

CMD ["python", "main.py"]
