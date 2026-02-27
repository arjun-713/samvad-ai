# SETUP.md — Getting Samvad AI Running Locally

## Step-by-Step for Any Developer Joining the Project

---

## PREREQUISITES

- Python 3.11+ (`python --version`)
- Node.js 20+ (`node --version`)
- FFmpeg installed on system:
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html and add to PATH
- Git

---

## ONE-TIME SETUP

### Step 1: Clone and enter repo
```bash
git clone https://github.com/arjun-713/samvad-ai
cd samvad-ai
```

### Step 2: Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Mac/Linux
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Install spaCy language model (required for ISL grammar)
python -m spacy download en_core_web_sm

# Create .env file
cp .env.example .env
# Open .env and add your ANTHROPIC_API_KEY

# Run setup script (creates directories + placeholder ISL clips)
python setup.py
```

### Step 3: Frontend
```bash
cd ../samvad-ui

npm install

# Create .env file
cp .env.example .env
# Defaults are fine for local development
```

---

## RUNNING THE PROJECT

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

**Terminal 2 — Frontend:**
```bash
cd samvad-ui
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 800 ms
  ➜  Local:   http://localhost:3000/
```

**Open:** http://localhost:3000

---

## VERIFY IT'S WORKING

```bash
# Health check
curl http://localhost:8000/api/health

# Should return:
# {"status":"ok","environment":"local","services":{...}}

# Quick text-to-ISL test
curl -X POST http://localhost:8000/api/text-to-isl \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en-IN"}'

# Should return ISL gloss within 5 seconds
```

---

## .env.example files

### `backend/.env.example`
```
# REQUIRED: Your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

# Environment: local | demo | aws
# Always use "local" for development
ENVIRONMENT=local

# File directories (auto-created by setup.py)
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
ISL_CLIPS_DIR=./assets/isl_clips

# Whisper model: tiny (fast) | base (better) | small (best local)
# Use "tiny" for development, "base" for demo
WHISPER_MODEL=tiny

# AWS credentials (leave blank for local environment)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=

# Max upload size in MB
MAX_UPLOAD_SIZE_MB=100
```

### `samvad-ui/.env.example`
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENV=local
```

---

## COMMON ISSUES

### "whisper not found" or torch errors
```bash
pip install openai-whisper torch --index-url https://download.pytorch.org/whl/cpu
```
Note: Whisper with CPU-only torch is slower but works fine for development.

### "spacy model not found"
```bash
python -m spacy download en_core_web_sm
```

### "ANTHROPIC_API_KEY not set"
Add your key to `backend/.env`. Get a key from https://console.anthropic.com

### "Port 8000 already in use"
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9   # Mac/Linux
netstat -ano | findstr :8000    # Windows
```

### "Camera permission denied"
The browser requires HTTPS for camera access on non-localhost domains. Since you're on localhost:3000 it should work fine. If issues, use Chrome.

### gTTS rate limit error
gTTS uses Google's TTS API. If you get rate limited during testing, add a small delay between calls or switch to `ENVIRONMENT=demo` to use Polly for TTS.

### Whisper taking too long on first load
The first call loads the model (~74MB for tiny). Subsequent calls are fast. This is expected.

---

## ADDING REAL ISL CLIPS

Replace the placeholder clips with real ISL videos:

1. Record a person signing each word (3-6 seconds per clip)
2. Requirements: plain background, good lighting, 640x480 minimum
3. Name files exactly: `HELLO.mp4`, `THANK-YOU.mp4`, `GO.mp4`, etc.
4. Place in `backend/assets/isl_clips/`
5. Restart backend — it auto-indexes the clips directory

The system will automatically use real clips when available, falling back to CSS avatar for any missing ones.

---

## SWITCHING TO DEMO MODE

Only do this right before the demo:

```bash
# 1. Verify AWS works
python scripts/verify_aws.py

# 2. Switch to demo mode
# In backend/.env:
ENVIRONMENT=demo

# 3. Start server
uvicorn main:app --reload --port 8000

# 4. After demo — switch back!
# In backend/.env:
ENVIRONMENT=local
python scripts/cleanup_aws.py
```