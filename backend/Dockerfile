# ══════════════════════════════════════════════
# Backend Dockerfile — Optimized multi-stage
# ══════════════════════════════════════════════

# ── Stage 1: Builder (install deps in temp layer) ──
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools needed for wheel compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Split requirements: core (fast, small) and ml (slow, large)
# This maximizes Docker layer cache — core rarely changes
COPY requirements-core.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements-core.txt

COPY requirements-ml.txt .
RUN pip install --no-cache-dir --prefix=/install \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements-ml.txt

# Download spaCy model into install prefix
RUN PYTHONPATH=/install/lib/python3.11/site-packages \
    /install/bin/python -m spacy download en_core_web_sm 2>/dev/null || true

# ── Stage 2: Runtime (slim, no build tools) ──
FROM python:3.11-slim AS runtime

WORKDIR /app

# Only the runtime system deps — no gcc/g++
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove

# Copy only installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy app code last (changes most often → cache-friendly)
COPY . .

# Create dirs + generate placeholder clips in one layer
RUN mkdir -p uploads outputs/audio assets/isl_clips && \
    python setup.py 2>/dev/null || true

EXPOSE 8000

CMD ["python", "main.py"]
