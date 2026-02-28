# CLAUDE.md — Samvad AI Project Context

> Read this file completely before touching any code. This is your source of truth.

---

## What This Project Is

Samvad AI is an accessibility platform that makes digital content accessible to deaf and hearing-impaired Indians by generating real-time Indian Sign Language (ISL) avatar overlays. It also enables deaf people to create content by converting their signs into spoken audio.

This is a hackathon project for **AI for Bharat Hackathon (powered by AWS)**. AWS services are mandatory — the judges evaluate AWS integration directly.

---

## Repo Structure

```
samvad-ai/
├── CLAUDE.md                  ← You are here
├── FRONTEND_CONTEXT.md        ← Read this before touching any frontend file
├── docs/
│   ├── PHASE1.md              ← Active phase instructions
│   ├── PHASE2.md
│   ├── PHASE3.md
│   └── PHASE4.md
├── samvad-ui/                 ← React + Vite frontend (TypeScript)
│   ├── src/
│   │   ├── services/          ← API call functions
│   │   ├── hooks/             ← Custom React hooks
│   │   ├── components/        ← UI components
│   │   └── data/              ← Static JSON data files
│   └── .env                   ← VITE_API_URL
├── backend/                   ← FastAPI (Python)
│   ├── main.py                ← Entry point, uvicorn
│   ├── requirements.txt
│   ├── .env                   ← AWS credentials
│   ├── services/              ← Business logic (boto3 calls live here)
│   ├── routes/                ← FastAPI route handlers
│   ├── models/                ← Pydantic request/response schemas
│   ├── isl_clips/             ← Local ISL video dictionary clips (.mp4)
│   └── isl_dictionary.json    ← Word → filename mapping
└── samvad-extension/          ← Chrome extension (Phase 3 only)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | FastAPI + Python + uvicorn |
| AWS AI | Bedrock (Claude 3.5 Sonnet), Nova Reel, Transcribe, Polly |
| AWS Media | S3, MediaLive, MediaPackage, CloudFront |
| AWS Orchestration | Step Functions, Lambda |
| Sign Recognition | MediaPipe Holistic (browser-side, Phase 4) |
| Styling | Existing CSS/Tailwind — DO NOT change |

---

## AWS Services by Phase

| Phase | AWS Services Used |
|---|---|
| Phase 1 — Text to ISL | S3 (clip storage) |
| Phase 2 — Video to ISL | S3 (video upload), Transcribe (batch) |
| Phase 3 — Chrome Extension | Transcribe Streaming (real-time) |
| Phase 4 — Reverse Mode | Polly (neural TTS) |
| Future | Nova Reel, Bedrock, MediaLive, MediaPackage |

---

## Environment Variables

### backend/.env
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=samvad-ai-isl-clips
S3_UPLOAD_BUCKET=samvad-ai-video-uploads
ISL_CLIPS_MODE=local
```

### samvad-ui/.env
```
VITE_API_URL=http://localhost:8000
```

---

## The 4 Phases — Never Mix Them

Work on exactly one phase at a time. Do not implement Phase 2 features while working on Phase 1.

- **Phase 1** — User types text → ISL avatar clips play (dictionary approach, local clips)
- **Phase 2** — User uploads a video → audio transcribed → ISL clips play in PiP over the video
- **Phase 3** — Chrome extension overlays ISL on any website (YouTube, Instagram, Netflix)
- **Phase 4** — Reverse mode: deaf creator signs into webcam → AI generates spoken audio voiceover

---

## Hard Rules — Never Break These

1. **Do not redesign the UI.** The frontend looks good. Wire up what exists. Do not change colors, layouts, fonts, component structure, or tab order.
2. **Do not add new tabs.** The 4 tabs (Live Session Mode, Streaming, Assistive, Replay) are fixed.
3. **Do not add a database** unless explicitly told to in a phase file.
4. **Do not add authentication** — no login, no sessions, no user accounts.
5. **Do not use TypeScript `any` type.** Define proper interfaces.
6. **Do not call AWS services not listed** for the current phase.
7. **Do not move or rename existing files** unless the phase doc explicitly says to.
8. **Do not refactor working code** from a previous phase to add a feature from a later phase.
9. **Always read the phase file for the current phase** before writing code. The phase file overrides anything you think you know.
10. **CORS** must always allow `http://localhost:5173` in the backend.

---

## Running the Project

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000

# Frontend
cd samvad-ui
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## Current Phase

> **Check which PHASE{N}.md is marked as active before starting work.**
> When you begin a session, read CLAUDE.md → FRONTEND_CONTEXT.md → the current PHASE file. In that order.