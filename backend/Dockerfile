# ══════════════════════════════════════════════
#  Samvad AI Backend
#  Cross-platform: Windows / Linux / macOS
# ══════════════════════════════════════════════
FROM python:3.11-slim

WORKDIR /app

# System deps: ffmpeg for video pipeline, curl for healthcheck
# Install build tools, compile wheels, then remove build tools — all in one layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0t64 \
    curl \
    build-essential gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Core Python deps (fast, small — cached layer)
COPY requirements-core.txt .
RUN pip install --no-cache-dir -r requirements-core.txt

# ML Python deps (larger — separate cached layer, CPU-only torch)
COPY requirements-ml.txt .
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements-ml.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Remove build tools after pip install (saves ~200MB)
RUN apt-get purge -y --auto-remove build-essential gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# App code (changes most → last for cache)
COPY . .

# Create dirs + placeholder clips
RUN mkdir -p uploads outputs/audio assets/isl_clips && \
    python setup.py 2>/dev/null || true

EXPOSE 8000

CMD ["python", "main.py"]
