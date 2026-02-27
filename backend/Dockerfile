# ══════════════════════════════════════════════
#  Samvad AI Backend — Optimized multi-stage
#  Cross-platform: Windows / Linux / macOS
# ══════════════════════════════════════════════

# ── Stage 1: Builder (compile wheels, download models) ──
FROM python:3.11-slim AS builder

WORKDIR /build

# Build tools for C/Rust extensions (removed in final image)
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Core deps first (fast, rarely change → cached layer)
COPY requirements-core.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements-core.txt

# ML deps second (slow, large → separate cached layer)
# CPU-only torch saves ~1.5GB
COPY requirements-ml.txt .
RUN pip install --no-cache-dir --prefix=/install \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements-ml.txt

# Download spaCy model into install prefix
ENV PYTHONPATH=/install/lib/python3.11/site-packages
RUN python -c "import subprocess, sys; subprocess.run([sys.executable, '-m', 'spacy', 'download', 'en_core_web_sm'], env={**__import__('os').environ, 'PYTHONPATH': '/install/lib/python3.11/site-packages', 'PATH': '/install/bin:' + __import__('os').environ['PATH']})" 2>/dev/null || true


# ── Stage 2: Runtime (slim — no gcc, no build tools) ──
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system deps only (libgl1 replaces obsolete libgl1-mesa-glx)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0t64 \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder (no build artifacts)
COPY --from=builder /install /usr/local

# Copy app code last (changes most often → best cache hit)
COPY . .

# Create dirs + generate placeholder clips in one layer
RUN mkdir -p uploads outputs/audio assets/isl_clips && \
    python setup.py 2>/dev/null || true

EXPOSE 8000

# Uvicorn listens on 0.0.0.0 so Docker port mapping works
CMD ["python", "main.py"]
