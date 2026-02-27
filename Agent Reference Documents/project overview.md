# PROJECT_OVERVIEW.md — Samvad AI
## Complete Context for Any AI Agent Starting Work on This Project

---

## WHAT IS THIS PROJECT?

**Samvad AI** is a real-time accessibility platform that automatically generates **Indian Sign Language (ISL) avatars** and **multi-language audio dubbing** for any live video stream or uploaded video. Built for the **AI for Bharat Hackathon** (powered by AWS).

**Team:** Blunders of the World? | **Leader:** Mallikarjun G D
**GitHub:** https://github.com/arjun-713/samvad-ai
**Problem Statement:** Design an AI-driven solution that helps create, manage, personalize, or distribute digital content more effectively.

**The core problem:** 18 million deaf Indians are excluded from 99.8% of live digital content. Human ISL interpreters cost ₹5,000–₹15,000/hour. Samvad AI does the same at ~₹315/hour.

---

## CURRENT STATE OF THE REPO

The repo has:
- `samvad-ui/` — React/TypeScript frontend, partially scaffolded (Vite + Tailwind setup exists)
- `backend/` — Python FastAPI backend, partially scaffolded (some structure exists)
- `daywise-tasks/` — Planning documents
- `design.md` — Design notes
- `requirements.md` — Requirements doc
- `samvad-ai-6day-roadmap.md` — Roadmap

**What needs to be built:** Everything that's not scaffolding. See "What to Build" below.

---

## PHASE 1 GOAL (CURRENT PHASE)

Build a **fully working local demo** with:
- No AWS services required (except optionally Bedrock/Polly on demo day)
- Every button click produces a visible result
- All 4 user flows work end-to-end

**Phase 2** (post-hackathon) replaces local mocks with real AWS services.

---

## THE 4 USER FLOWS (ALL MUST WORK)

### Flow 1: Text → ISL Avatar
User types text → AI adapts it culturally → converts to ISL grammar → avatar signs it

### Flow 2: Live Stream → ISL Overlay
User clicks "Start Live Stream" → camera activates → audio captured every 3 seconds → transcribed → culturally adapted → ISL avatar appears as PiP overlay

### Flow 3: Video Upload → Full Accessibility Processing
User uploads video → audio extracted → transcribed → ISL generated per segment → multi-language audio dubbed → accessible video returned with timeline-synced ISL

### Flow 4: Reverse Mode (Deaf Creator)
Deaf user signs into camera → AI detects signs → generates spoken voice + subtitles → deaf user can create content

---

## ARCHITECTURE

```
Browser (React/TypeScript on port 3000)
        ↕ REST API + WebSocket
FastAPI Backend (Python on port 8000)
        │
        ├─ services/transcription_local.py  ← Whisper (local ASR)
        ├─ services/transcreation_local.py  ← Claude via Anthropic API
        ├─ services/transcreation_bedrock.py ← Claude via AWS Bedrock (demo only)
        ├─ services/isl_grammar.py          ← spaCy rule-based ISL converter
        ├─ services/avatar_generator.py     ← ISL video clip library + CSS fallback
        ├─ services/tts_local.py            ← gTTS audio dubbing
        ├─ services/tts_aws.py              ← Amazon Polly (demo only)
        ├─ services/reverse_mode.py         ← MediaPipe hand detection
        ├─ services/pipeline.py             ← Full video processing orchestrator
        └─ socket_handlers.py               ← WebSocket event handlers
```

### The Environment Toggle
A single `.env` variable controls everything:
```
ENVIRONMENT=local   → everything runs locally (development + testing)
ENVIRONMENT=demo    → Bedrock + Polly use AWS (demo day only)
ENVIRONMENT=aws     → full AWS (Phase 2)
```

---

## COMPLETE FILE STRUCTURE (TARGET)

```
samvad-ai/
├── backend/
│   ├── main.py                          ← FastAPI entry point + Socket.IO mount
│   ├── config.py                        ← Environment toggle (use_aws() function)
│   ├── requirements.txt
│   ├── setup.py                         ← One-time setup script
│   ├── .env                             ← ANTHROPIC_API_KEY, ENVIRONMENT, etc.
│   ├── assets/
│   │   └── isl_clips/                   ← ISL video clips (HELLO.mp4, GO.mp4, etc.)
│   ├── uploads/                         ← Incoming video uploads (gitignored)
│   ├── outputs/                         ← Processed outputs (gitignored)
│   ├── sessions.db                      ← SQLite (gitignored)
│   ├── routes/
│   │   ├── health_routes.py             ← GET /api/health, GET /api/languages
│   │   ├── text_routes.py               ← POST /api/text-to-isl
│   │   ├── video_routes.py              ← POST /api/process-video
│   │   └── stream_routes.py             ← Stream management endpoints
│   ├── services/
│   │   ├── transcription_local.py       ← Whisper
│   │   ├── transcription_aws.py         ← Amazon Transcribe (demo mode)
│   │   ├── transcreation_local.py       ← Direct Anthropic API
│   │   ├── transcreation_bedrock.py     ← AWS Bedrock (demo mode)
│   │   ├── transcreation_shared.py      ← Shared prompt builder + response parser
│   │   ├── isl_grammar.py               ← ISL grammar converter
│   │   ├── avatar_generator.py          ← ISL clip library + placeholder generator
│   │   ├── tts_local.py                 ← gTTS
│   │   ├── tts_aws.py                   ← Amazon Polly (demo mode)
│   │   ├── reverse_mode.py              ← MediaPipe sign detection
│   │   └── pipeline.py                  ← Full video pipeline orchestrator
│   ├── socket_handlers.py               ← WebSocket event handlers
│   ├── scripts/
│   │   ├── verify_aws.py                ← Pre-demo AWS check
│   │   ├── cleanup_aws.py               ← Post-demo AWS cleanup
│   │   └── check_budget.py              ← AWS spend tracker
│   └── tests/
│       ├── conftest.py
│       ├── test_health.py
│       ├── test_isl_grammar.py
│       ├── test_transcreation_local.py
│       ├── test_avatar_generator.py
│       ├── test_tts_service.py
│       ├── test_api_text_to_isl.py
│       └── benchmark.py
├── samvad-ui/
│   ├── src/
│   │   ├── App.tsx                      ← Main layout, sidebar nav, routing
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── LiveStream.tsx            ← Flow 2: webcam + ISL overlay
│   │   │   ├── VideoUpload.tsx           ← Flow 3: upload + pipeline stages
│   │   │   ├── TextToISL.tsx             ← Flow 1: text input → avatar
│   │   │   ├── ISLAvatar.tsx             ← Reusable PiP avatar player
│   │   │   ├── ReverseMode.tsx           ← Flow 4: deaf creator mode
│   │   │   ├── PipelineStatus.tsx        ← Stage indicator component
│   │   │   ├── LanguageSelector.tsx      ← Language dropdown
│   │   │   └── SettingsPanel.tsx         ← Settings drawer
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts           ← Socket.IO connection
│   │   │   ├── useWebcam.ts              ← Camera + audio capture
│   │   │   └── useISLPipeline.ts         ← API call state management
│   │   ├── api/
│   │   │   └── client.ts                 ← Axios API client
│   │   └── types/
│   │       └── index.ts                  ← All TypeScript interfaces
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── .env
├── scripts/                             ← (also in backend/scripts but keep here for root access)
├── .github/
│   └── workflows/
│       └── test.yml
├── INSTRUCTIONS.md                      ← Master doc (read first)
├── PROJECT_OVERVIEW.md                  ← This file
├── FRONTEND.md                          ← Frontend agent guide
├── BACKEND.md                           ← Backend agent guide
├── AWS.md                               ← AWS strategy + service implementations
└── TEST.md                              ← Testing guide
```

---

## TECHNOLOGY STACK

### Backend (Python)
| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.111.0 | Web framework |
| uvicorn[standard] | 0.29.0 | ASGI server |
| python-socketio | 5.11.2 | WebSocket server |
| python-multipart | 0.0.9 | File uploads |
| anthropic | 0.28.0 | Claude API (local mode) |
| boto3 | 1.34.0 | AWS SDK (demo mode) |
| openai-whisper | 20231117 | Local speech-to-text |
| torch | 2.3.0 | Required by Whisper |
| spacy | 3.7.4 | ISL grammar conversion |
| gtts | 2.5.1 | Local TTS |
| opencv-python-headless | 4.9.0.80 | Video processing + placeholder clips |
| mediapipe | 0.10.14 | Hand detection (reverse mode) |
| ffmpeg-python | 0.2.0 | Audio extraction from video |
| aiofiles | 23.2.1 | Async file I/O |
| python-dotenv | 1.0.1 | .env file loading |
| pydantic | 2.7.1 | Request/response validation |

### Frontend (TypeScript/React)
| Package | Purpose |
|---------|---------|
| react 18 + typescript | UI framework |
| vite | Build tool |
| tailwindcss | Styling |
| socket.io-client | WebSocket |
| react-webcam | Camera capture |
| react-player | Video playback |
| axios | HTTP client |
| lucide-react | Icons |

---

## ENVIRONMENT FILES

### `backend/.env`
```
# Required always
ANTHROPIC_API_KEY=sk-ant-...
ENVIRONMENT=local

# Directories
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
ISL_CLIPS_DIR=./assets/isl_clips

# Whisper
WHISPER_MODEL=tiny

# AWS (only needed for ENVIRONMENT=demo or aws)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=samvad-ai-demo
```

### `samvad-ui/.env`
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENV=local
```

---

## HOW TO START THE PROJECT FROM SCRATCH

```bash
# 1. Clone repo
git clone https://github.com/arjun-713/samvad-ai
cd samvad-ai

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env  # Then add your ANTHROPIC_API_KEY
python setup.py  # Creates dirs + placeholder ISL clips
uvicorn main:app --reload --port 8000

# 3. Frontend setup (new terminal)
cd samvad-ui
npm install
npm run dev

# 4. Open http://localhost:3000
```

---

## ISL GRAMMAR — HOW IT WORKS

Indian Sign Language uses **Topic-Comment structure**, NOT English SVO (Subject-Verb-Object):

| Language | Structure | Example |
|----------|-----------|---------|
| English | SVO | "I am going to market tomorrow" |
| Hindi | SOV | "Main kal bazaar ja raha hoon" |
| ISL | Time → Topic → Comment | "TOMORROW MARKET I GO" |

Key ISL grammar rules the converter must implement:
1. **Time words come first** — TODAY, TOMORROW, YESTERDAY, NOW, LATER
2. **Articles and aux verbs are dropped** — "a", "the", "is", "are", "was", "be"
3. **Conjunctions dropped** — "and", "or", "but"
4. **Question marker at end** — sentence ending with "?" gets "?" appended
5. **Words are uppercased** — ISL uses GLOSS notation
6. **Unknown words are fingerspelled** — shown in caps

Example:
```
Input:  "I am going to the market tomorrow to buy vegetables"
Gloss:  "TOMORROW MARKET I GO VEGETABLES BUY"
```

---

## ISL AVATAR STRATEGY

Since Nova Reel (AWS) is expensive and inconsistent for ISL, Phase 1 uses:

**Priority 1:** Pre-recorded MP4 clips per sign word
- Store in `backend/assets/isl_clips/`
- Named `HELLO.mp4`, `GO.mp4`, `MARKET.mp4`, etc.
- Can be: (a) Real person signing, (b) Placeholder colored video with text

**Priority 2:** CSS animated SVG avatar (always available as fallback)
- Shows animated hand positions
- Displays ISL gloss text prominently as colored chips
- Emotional tone shown as a badge

The frontend `ISLAvatar.tsx` component:
1. If `result.avatar_url` is a valid URL → play MP4 video
2. If empty → render CSS animated avatar with gloss text

**For the demo:** Record yourself or a team member signing 20-30 common phrases. These look far more impressive than any AI-generated video.

---

## CULTURAL TRANSCREATION — WHY IT MATTERS

Regular translation fails ISL because:
- "It's raining cats and dogs" → literal: shows picture of cats and dogs (meaningless)
- "Masterstroke by Modi" → "masterstroke" has no ISL sign
- "Kohli ne dhoya Pakistan ko" → "dhoya" (washed) is a cricket idiom

Claude API is used to:
1. Understand the actual MEANING beyond words
2. Find the visual/cultural equivalent in ISL
3. Preserve emotional tone (excited cricket commentary vs. solemn news)
4. Identify famous Indian people/places and their ISL name-signs

This is the core AI innovation that differentiates Samvad from YouTube auto-captions.

---

## WHAT THE JUDGES WILL TEST

Based on the hackathon criteria:
1. **Does it work?** — All 4 flows must produce output
2. **Is the AI doing something real?** — Cultural transcreation must be visibly different from word-for-word
3. **Is the latency acceptable?** — Target: result within 3-5 seconds of speaking
4. **Impact?** — The "63 million Indians" story + cost reduction from ₹5000/hr to ₹315/hr
5. **AWS integration?** — They want to see AWS services in the architecture, even if the demo runs locally

**Prepare for these judge questions:**
- "How is this different from YouTube auto-captions?" → Cultural transcreation, ISL grammar, avatar
- "What AWS services does it use?" → Point to architecture diagram, explain Bedrock/Transcribe/Polly
- "What's the latency?" → Show the pipeline status stages, quote <2s (demo may be 3-5s locally)
- "Can it scale?" → Explain the serverless/parallel AWS architecture

---

## DEMO PREPARATION CHECKLIST

### 3 days before demo
- [ ] All 4 flows work locally
- [ ] All tests in TEST.md pass
- [ ] Record 20-30 ISL clips (real person, or placeholder if time is short)
- [ ] Record demo_video.mp4 (30 seconds of clear Hindi/English speech)
- [ ] AWS Bedrock model access enabled

### 1 day before demo
- [ ] Run through entire demo script 3 times
- [ ] `python scripts/verify_aws.py` with ENVIRONMENT=demo
- [ ] Run `python scripts/check_budget.py` to confirm < $20 spent
- [ ] Screenshot of architecture diagram ready for questions

### Demo day
- [ ] Set ENVIRONMENT=demo
- [ ] Both servers running (backend 8000, frontend 3000)
- [ ] demo_video.mp4 ready to upload
- [ ] Know your demo script (pre-scripted text to type, pre-scripted things to say)
- [ ] After demo: cleanup_aws.py + set ENVIRONMENT=local

---

## KNOWN LIMITATIONS TO ACKNOWLEDGE (IF ASKED)

1. **ISL clips are pre-recorded, not generative** — "In production, Amazon Nova Reel generates photorealistic real-time avatars"
2. **Whisper tiny model is less accurate on noisy audio** — "Production uses Amazon Transcribe with custom ISL vocabulary"
3. **Reverse mode is mock sign classification** — "Real sign recognition uses a custom SageMaker model trained on ISL corpus"
4. **No regional ISL dialects** — "Northern vs Southern ISL is on the Phase 2 roadmap"
5. **Avatar doesn't stitch multiple clips smoothly** — "Full clip stitching with transitions is Phase 2"

---

## DOCUMENTS REFERENCE

| File | Purpose |
|------|---------|
| `PROJECT_OVERVIEW.md` | This file — full context for any agent |
| `INSTRUCTIONS.md` | Technical architecture + file structure target |
| `FRONTEND.md` | React/TypeScript implementation guide |
| `BACKEND.md` | Python FastAPI implementation guide |
| `AWS.md` | AWS integration strategy + demo setup |
| `TEST.md` | Testing guide (local-first, no AWS credits wasted) |