# SAMVAD AI — Master Instructions for Claude Code
## Real-Time ISL Accessibility Pipeline (Phase 1: Local-First, No AWS)

---

## PROJECT OVERVIEW

**Samvad AI** is a real-time Generative AI pipeline that automatically generates Indian Sign Language (ISL) avatar overlays and multi-language audio dubbing for any live video stream or uploaded video. Phase 1 builds a **fully working local version** with dummy/mock services replacing AWS. Every button click must produce a visible, functional result.

**GitHub Repo:** `https://github.com/arjun-713/samvad-ai`
**Structure already present:**
```
samvad-ai/
├── backend/          ← Python FastAPI server (partially scaffolded)
├── samvad-ui/        ← React/TypeScript frontend (partially scaffolded)
├── daywise-tasks/    ← Planning docs
├── design.md
├── requirements.md
└── samvad-ai-6day-roadmap.md
```

---

## PHASE 1 GOAL

Build a **completely working local demo** where:
1. User opens `http://localhost:3000`
2. Clicks "Start Live Stream" → webcam activates → ISL avatar appears in PiP overlay within 3 seconds
3. Uploads a video → video plays + ISL avatar signs the spoken content + dubbed audio available
4. Types text into the "Text to ISL" box → avatar signs the text
5. Deaf creator can turn on "Reverse Mode" → signs into camera → spoken text + subtitles generated

**NO AWS in Phase 1.** Every AWS service is replaced by a local mock/dummy.

---

## ARCHITECTURE (PHASE 1 — LOCAL)

```
Browser (React)
    ↕ WebSocket + REST
FastAPI Backend (Python)
    ├── Mock Transcription (Whisper local OR simple audio chunks → text)
    ├── Mock Cultural Transcreation (Claude API via direct Anthropic SDK)
    ├── Mock ISL Grammar Converter (rule-based local NLP)
    ├── Mock Avatar Generator (pre-recorded ISL video clips OR CSS-animated avatar)
    ├── Mock TTS Audio Dubbing (gTTS or pyttsx3 locally)
    └── Mock Stream Multiplexer (FFmpeg local)
```

---

## ROLE ASSIGNMENTS FOR CLAUDE CODE

Claude Code should read the relevant `.md` file for its role and execute accordingly:

| File | Role | Who Reads It |
|------|------|-------------|
| `FRONTEND.md` | React/TypeScript UI developer | Frontend agent |
| `BACKEND.md` | Python FastAPI developer | Backend agent |
| `AWS.md` | AWS integration architect | AWS agent (Phase 2 only) |
| `TEST.md` | QA/Testing engineer | Test agent |
| `INSTRUCTIONS.md` | Project manager / orchestrator | Any agent needing full context |

---

## TECH STACK (PHASE 1)

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- `react-webcam` (webcam capture)
- `socket.io-client` (WebSocket for live stream)
- `react-player` (video playback)
- Axios (API calls)

### Backend
- Python 3.11+
- FastAPI + Uvicorn
- `python-socketio` (WebSocket server)
- `openai-whisper` (local speech-to-text — tiny model)
- `anthropic` SDK (Claude API for cultural transcreation — use Anthropic API key)
- `spacy` with `en_core_web_sm` (ISL grammar conversion)
- `gTTS` (Google Text-to-Speech — no key needed for mock)
- `opencv-python` (webcam/video frame processing)
- `mediapipe` (hand detection for reverse mode)
- `ffmpeg-python` (video manipulation)
- `python-multipart` (file uploads)

### Database (local)
- SQLite (via `sqlite3` stdlib) — for session metadata

---

## KEY USER FLOWS (ALL MUST WORK IN PHASE 1)

### Flow 1: Text → ISL Avatar
1. User types text in the input box on the main screen
2. Frontend POSTs to `/api/text-to-isl`
3. Backend: text → ISL grammar conversion → returns avatar video URL
4. Frontend plays the avatar video in the PiP panel

### Flow 2: Live Stream → ISL Avatar Overlay
1. User clicks "Start Live Stream"
2. Webcam activates via `react-webcam`
3. Frontend streams audio chunks via WebSocket to backend every 3 seconds
4. Backend: audio chunk → Whisper transcription → Claude cultural transcreation → ISL grammar → avatar clip returned via WebSocket
5. Frontend overlays the avatar clip in bottom-right PiP while webcam feed plays

### Flow 3: Video Upload → Full Accessibility Processing
1. User clicks "Upload Video" and selects a file
2. Frontend POSTs the file to `/api/process-video`
3. Backend: extracts audio → Whisper transcription → Claude transcreation → ISL avatar generation → multi-language TTS dubbing → returns processed video URL + avatar overlay data
4. Frontend plays video with ISL overlay and language selector for dubbing

### Flow 4: Reverse Mode (Deaf Creator)
1. User toggles "Reverse Mode" in settings
2. Webcam activates
3. Frontend streams video frames via WebSocket to backend every 100ms
4. Backend: MediaPipe detects hands → mock sign recognition → generates text → gTTS audio → returns to frontend
5. Frontend shows live subtitles and plays audio

---

## DUMMY/MOCK SERVICE SPECIFICATIONS

These are the Phase 1 replacements for AWS services:

| AWS Service (Phase 2) | Phase 1 Mock | Implementation |
|----------------------|--------------|----------------|
| Amazon Transcribe | OpenAI Whisper (tiny, local) | `whisper.load_model("tiny")` |
| Amazon Bedrock (Claude) | Anthropic API direct | `anthropic.Anthropic()` with ANTHROPIC_API_KEY |
| Amazon Nova Reel (Avatar) | Pre-recorded ISL video clips library + CSS avatar | Static MP4 clips mapped to ISL glosses |
| Amazon Polly (TTS) | gTTS | `gtts.gTTS(text, lang='hi')` |
| AWS MediaLive | FFmpeg local capture | `ffmpeg` subprocess |
| AWS MediaPackage | Local file serve | FastAPI `FileResponse` |
| Amazon CloudFront | Vite dev server static files | Direct localhost URL |
| AWS Step Functions | Async Python tasks | `asyncio` tasks in FastAPI |
| Amazon DynamoDB | SQLite | Local `sessions.db` |
| Amazon S3 | Local `./uploads/` and `./outputs/` dirs | OS file system |

---

## ISL AVATAR MOCK STRATEGY

Since Nova Reel is not available locally, use this fallback hierarchy:
1. **Primary:** A library of pre-recorded ISL video clips (MP4, 3-6 seconds each) stored in `backend/assets/isl_clips/`. Each clip corresponds to an ISL gloss word (e.g., `TOMORROW.mp4`, `MARKET.mp4`, `GO.mp4`). Stitch clips together for sentences.
2. **Fallback:** A CSS-animated SVG/Canvas avatar that performs simplified arm movements with text showing the ISL gloss. This always works even if no clip exists.
3. **Text display:** Always show the ISL gloss text alongside the avatar (e.g., "TOMORROW MARKET I-GO VEGETABLES BUY")

Create at minimum these ISL clips (can be placeholder colored boxes with text for now):
- Common greetings: HELLO, GOODBYE, THANK-YOU, PLEASE, SORRY
- Common verbs: GO, COME, EAT, DRINK, SEE, KNOW, WANT, HELP
- Common nouns: INDIA, NEWS, CRICKET, SCHOOL, DOCTOR, HOME, WATER, FOOD
- Numbers: 1-10
- Question markers: WHAT, WHO, WHERE, WHEN, WHY, HOW

---

## ENVIRONMENT SETUP

Create a `.env` file in `backend/`:
```
ANTHROPIC_API_KEY=your_key_here
ENVIRONMENT=local
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
ISL_CLIPS_DIR=./assets/isl_clips
MAX_UPLOAD_SIZE_MB=100
WHISPER_MODEL=tiny
```

Create a `.env` file in `samvad-ui/`:
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENV=local
```

---

## CRITICAL REQUIREMENTS FOR PHASE 1

1. **Every button must do something visible** — no dead UI elements
2. **Loading states must be shown** during processing (spinners, progress bars)
3. **Error states must be handled gracefully** — show user-friendly messages
4. **The ISL gloss text must always be displayed** even when video clips are placeholder
5. **The entire pipeline must complete end-to-end** — from input to visible output
6. **Response time targets (local):** Text-to-ISL < 5s, Video upload processing < 30s per minute of video

---

## FILE STRUCTURE TARGET (END OF PHASE 1)

```
samvad-ai/
├── backend/
│   ├── main.py                    ← FastAPI app entry point
│   ├── requirements.txt
│   ├── .env
│   ├── assets/
│   │   └── isl_clips/             ← ISL video clip library
│   ├── uploads/                   ← Incoming video uploads
│   ├── outputs/                   ← Processed video outputs
│   ├── sessions.db                ← SQLite database
│   └── services/
│       ├── transcription.py       ← Whisper mock service
│       ├── transcreation.py       ← Claude cultural transcreation
│       ├── isl_grammar.py         ← ISL grammar converter
│       ├── avatar_generator.py    ← ISL avatar video stitcher
│       ├── tts_service.py         ← gTTS audio dubbing
│       ├── reverse_mode.py        ← MediaPipe sign detection
│       └── pipeline.py            ← Orchestrator (async pipeline)
├── samvad-ui/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── LiveStream.tsx     ← Webcam + ISL overlay
│   │   │   ├── VideoUpload.tsx    ← Upload + process flow
│   │   │   ├── TextToISL.tsx      ← Text input → avatar
│   │   │   ├── ISLAvatar.tsx      ← PiP avatar player
│   │   │   ├── ReverseMode.tsx    ← Deaf creator mode
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── StatusPanel.tsx    ← Pipeline status display
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useWebcam.ts
│   │   │   └── useISLPipeline.ts
│   │   ├── api/
│   │   │   └── client.ts          ← Axios API client
│   │   └── types/
│   │       └── index.ts           ← TypeScript interfaces
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── .env
├── INSTRUCTIONS.md
├── FRONTEND.md
├── BACKEND.md
├── AWS.md
└── TEST.md
```

---

## PHASE 2 PREVIEW (DO NOT IMPLEMENT YET)

Phase 2 replaces each mock with the real AWS service:
- Whisper → Amazon Transcribe Streaming API
- Direct Claude → Amazon Bedrock (Claude 3.5 Sonnet)
- Video clips → Amazon Nova Reel (real-time generation)
- gTTS → Amazon Polly Neural TTS
- Local pipeline → AWS Step Functions
- SQLite → Amazon DynamoDB
- Local files → Amazon S3
- Localhost → AWS MediaLive + MediaPackage + CloudFront

See `AWS.md` for the complete migration guide.