# SAMVAD AI — 6-DAY PROTOTYPE ROADMAP

**AI for Bharat Hackathon | Team: Blunders of the World**  
**Phase:** Feb 25 – Mar 2, 2026 | **Day 7 (Mar 3):** Final Freeze & Submission

---

## 📊 PROGRESS TRACKER

### Day 1 - ✅ COMPLETE (100%)
- Frontend: 4 pages, 22 languages, dark mode
- Backend: FastAPI with health endpoints
- Integration: Frontend-backend communication working

### Day 2 - 🔄 IN PROGRESS (40%)
- Backend Coding: ✅ COMPLETE
- AWS Setup: ⏳ Pending credentials
- Frontend: ⏳ Not started
- Testing: ⏳ Not started

### Days 3-7 - ⏳ PENDING

---

## 🎯 GOLDEN RULE
**No new features after Day 5. Day 6 = test, record, submit.**

AWS credits may arrive late — all Days 1–2 tasks are built mock-first, real-AWS-ready.

---

## 👥 Team Roles
- **Lead/Backend (M)** - Backend development, AWS integration
- **Frontend (F)** - React UI, user experience
- **AWS Integration (A)** - AWS services, infrastructure
- **QA/Demo/Docs (Q)** - Testing, documentation, demo video

---

## DAY 1 — Feb 25 ✅ COMPLETE

### Status: Complete
- [x] React + Vite + TypeScript frontend (4 pages)
- [x] FastAPI backend with health/status endpoints
- [x] Frontend-backend integration (CORS, connection test)
- [x] 22 Indian language selector UI
- [x] Dark mode, avatar selection, signing speed slider
- [x] Git repo on GitHub, 15 commits, branch: `feat/day-1-complete`
- [ ] **PENDING:** AWS IAM setup (waiting for $100 credits)

---

## DAY 2 — Feb 26 | "THE EARS" — Amazon Transcribe

### Goal
Real audio goes in, real text comes out

### Lead/Backend (M) ✅ CODING COMPLETE
- [ ] Receive AWS credits email, apply promo code immediately
- [ ] Create AWS Budget: $120 total, alerts at $30 / $60 / $90 / $110
- [ ] Create IAM user `samvad-dev` with least-privilege policies:
  - AmazonTranscribeFullAccess
  - AmazonS3FullAccess
  - AmazonPollyFullAccess
  - AmazonBedrockFullAccess
- [ ] Generate access keys, configure `.env` file (never commit to git)
- [x] Add S3 bucket: `samvad-audio-uploads-dev` (code ready)
- [x] Build FastAPI endpoint: `POST /api/transcribe`
  - [x] Accepts audio file upload (WAV/MP3)
  - [x] Uploads to S3
  - [x] Calls Amazon Transcribe (batch mode)
  - [x] Returns transcript text + detected language
- [x] Created S3Service with upload/delete/presigned URL methods
- [x] Created TranscribeService with job management and cleanup
- [x] Added Pydantic models for request/response validation
- [x] Updated requirements.txt with new dependencies
- [x] Created test script and documentation
- [ ] Test endpoint with Postman/curl using a sample Hindi audio clip (pending AWS credentials)

### Frontend (F)
- [ ] Build audio upload component on Assistive Mode page
  - File upload button + drag-and-drop
  - Microphone recording button (Web Audio API, 30s max)
  - Language selector pre-filled from existing component
- [ ] Wire "Test Transcription" button to `POST /api/transcribe`
- [ ] Show transcript result in a text box below the upload area
- [ ] Loading spinner + error state handling

### AWS Integration (A)
- [ ] Set up AWS CLI locally, verify credentials work
- [ ] Test Amazon Transcribe via AWS console with a sample file
- [ ] Document the exact Transcribe job config (language codes, output format)
- [ ] Create the S3 bucket with correct CORS policy for direct uploads

### QA/Demo/Docs (Q)
- [ ] Record 5 test audio clips: English, Hindi, Tamil, Telugu, Bengali (10–15 seconds each, clear speech)
- [ ] Create test matrix: input language × expected output accuracy
- [ ] Begin draft of Project Summary document (200 words)
- [ ] Set up screen recording software (OBS or Loom) for demo video later

### Day 2 Exit Criteria
✅ Backend code complete - Audio file → S3 → Transcribe → transcript text  
⏳ Pending AWS credentials configuration for live testing  
⏳ Frontend integration pending  

**Backend Status:** All coding tasks complete. Ready for AWS configuration and testing.

---

## DAY 3 — Feb 27 | "THE BRAIN" — Amazon Bedrock (Claude 3.5 Sonnet)

### Goal
Text goes in, ISL Gloss structure comes out

### Lead/Backend (M)
- [ ] Build FastAPI endpoint: `POST /api/translate-to-isl`
  - Input: transcript text + source language
  - Calls Amazon Bedrock (claude-3-5-sonnet-20241022)
  - System prompt: Convert spoken text to ISL Gloss using Topic-Comment syntax. Handle idioms culturally.
  - Output JSON: `{ "isl_gloss": [...], "emotional_tone": "...", "confidence": 0.0–1.0 }`
  - Return structured ISL Gloss array
- [ ] Chain `/api/transcribe` → `/api/translate-to-isl` into one pipeline call: `POST /api/process-audio` (end-to-end: audio → ISL Gloss)
- [ ] Add basic error handling: Bedrock throttle retry (3x with backoff)

### Frontend (F)
- [ ] Display ISL Gloss output in a styled card on the Assistive Mode page
  - Show each gloss token as a badge/chip
  - Show emotional tone label
  - Show confidence score as a progress bar
- [ ] Add "Copy Gloss" button
- [ ] Update Live Session page: show ISL Gloss panel alongside the video player

### AWS Integration (A)
- [ ] Test Bedrock access via AWS console (model: claude-3-5-sonnet)
- [ ] Experiment with 3 different system prompts, pick best ISL Gloss output
- [ ] Document the winning prompt in `/backend/prompts/isl_gloss.txt`
- [ ] Verify Bedrock region (us-east-1 recommended for Claude 3.5 Sonnet)

### QA/Demo/Docs (Q)
- [ ] Test ISL Gloss output for all 5 audio clips from Day 2
- [ ] Flag any idiom/metaphor translation failures for prompt refinement
- [ ] Test edge cases: very fast speech, code-switching (Hinglish), silence
- [ ] Update Project Summary with Bedrock integration details

### Day 3 Exit Criteria
✅ Audio → transcript → ISL Gloss JSON visible in UI. Pipeline stable end-to-end.

---

## DAY 4 — Feb 28 | "THE VOICE" — Amazon Polly + Avatar Display

### Goal
Multi-language audio dubbing + visual avatar placeholder

### Lead/Backend (M)
- [ ] Build FastAPI endpoint: `POST /api/synthesize-audio`
  - Input: text + target language code (hi-IN, ta-IN, te-IN, etc.)
  - Calls Amazon Polly Neural TTS
  - Returns MP3 audio (base64 or S3 presigned URL)
- [ ] Extend `POST /api/process-audio` to include Polly step:
  - Audio → Transcript → ISL Gloss → Dubbed Audio (all in one call)
- [ ] Map all 22 UI languages to correct Polly voice IDs
  - Note: Polly doesn't cover all 22 — document which ones are supported, use closest available for unsupported ones

### Frontend (F)
- [ ] Add audio playback component: show waveform, play/pause, download
- [ ] Display selected avatar (Maya/Arjun/Priya) with a placeholder sign animation loop (CSS animation or GIF) while ISL video isn't ready
- [ ] Wire end-to-end pipeline button on Assistive Mode:
  - Upload Audio → Process → Show Gloss + Play Dubbed Audio
- [ ] Polish the Live Session page with the full pipeline result display

### AWS Integration (A)
- [ ] Test all supported Polly voices for Indian languages
- [ ] Create language-to-voice mapping JSON file for backend use
- [ ] Estimate AWS cost so far (Transcribe + Bedrock + Polly), update budget tracker
- [ ] Set up CloudWatch basic alarms for Lambda/API error rates (if using Lambda)

### QA/Demo/Docs (Q)
- [ ] Full end-to-end test: upload audio → get dubbed audio in 3+ languages
- [ ] Measure actual latency of the full pipeline (target: under 10s for demo)
- [ ] Bug list: document all issues found, prioritize P1 (blocker) vs P2 (nice-to-fix)
- [ ] Draft demo video script (2–3 minutes):
  - Intro → Problem → Live demo → Architecture slide → Cost comparison

### Day 4 Exit Criteria
✅ Full pipeline works: audio in → ISL Gloss + dubbed audio out. Avatar placeholder visible.

---

## DAY 5 — Mar 1 | "THE SHOWCASE" — Polish, Deploy, Bi-directional Mode

### Goal
Everything works, looks good, is deployed to a live URL

### Lead/Backend (M)
- [ ] Deploy backend to a live URL (pick one):
  - **Option A:** AWS EC2 t3.micro (cheapest, ~$0.01/hr)
  - **Option B:** AWS Lambda + API Gateway (serverless, pay-per-call)
  - **Option C:** Railway.app or Render.com free tier (fastest, no AWS cost)
  - **RECOMMENDED:** Railway.app for speed, link to AWS services from there
- [ ] Add `/api/sign-to-speech` endpoint (Bi-directional Reverse Mode):
  - Input: text description of ISL gesture sequence
  - Output: spoken audio via Polly (basic version — no actual CV needed)
  - This shows the concept even without live webcam CV
- [ ] Final `.env` validation: all keys present, no hardcoded secrets

### Frontend (F)
- [ ] Deploy frontend to Vercel or Netlify (free, takes 10 minutes)
- [ ] Update API base URL in `.env.production` to point to live backend
- [ ] Final UI polish pass:
  - Fix any broken responsive layouts on mobile
  - Ensure all 4 pages load without errors
  - Verify dark mode works everywhere
  - Add loading skeletons for async operations
- [ ] Record demo-ready screen at 1080p (Loom or OBS)

### AWS Integration (A)
- [ ] Review total AWS spend so far, project remaining budget
- [ ] Enable S3 bucket versioning and lifecycle rules (auto-delete after 7 days)
- [ ] Create a read-only demo IAM role for evaluators if needed
- [ ] Document all AWS services used with region and config in README

### QA/Demo/Docs (Q)
- [ ] Full regression test on deployed URLs (not localhost):
  - All 4 UI pages load
  - Transcribe pipeline works
  - Polly dubbing works
  - ISL Gloss displays correctly
  - No CORS errors in console
  - Mobile view acceptable
- [ ] Shoot raw demo video footage (multiple takes, pick best)
- [ ] Write final Project Summary (400–500 words)
- [ ] Prepare GitHub repo: clean README, architecture diagram, setup guide

### Day 5 Exit Criteria
✅ Live frontend URL + live backend URL. Full pipeline working on deployed infra. Demo video raw footage complete. Zero P1 bugs.

---

## DAY 6 — Mar 2 | "THE SUBMISSION" — Final Polish & Submit

### Goal
Everything submitted before midnight. No surprises.

### Lead/Backend (M) — Morning
- [ ] Final backend code review: remove all debug logs, print statements
- [ ] Verify `.env.example` is updated with all required keys (no real values)
- [ ] Tag release: `git tag v1.0.0-prototype`, push to main branch
- [ ] Verify GitHub repo is public (or add hackathon evaluators as collaborators)
- [ ] Final architecture diagram updated in README

### Frontend (F) — Morning
- [ ] Final frontend code review: no console.logs, no TODO comments visible
- [ ] Verify live Vercel/Netlify URL is stable (check uptime)
- [ ] Test the live URL on: Chrome, Firefox, mobile Safari
- [ ] Screenshot all 4 pages for submission backup

### QA/Demo/Docs (Q) — Full Day
- [ ] Edit demo video (2–3 min max):
  - 0:00–0:20 Problem statement (show the 63M stat)
  - 0:20–0:50 Live demo: upload Hindi audio → see ISL Gloss + Tamil dubbed audio
  - 0:50–1:20 Show architecture slide from the PPT
  - 1:20–1:50 Show cost comparison (₹5000 → ₹399)
  - 1:50–2:30 Show all 4 UI pages, dark mode, 22 languages
  - 2:30–3:00 GitHub repo walkthrough, live URL
- [ ] Upload demo video to YouTube (Unlisted) or Google Drive (link-shared)
- [ ] Final submission checklist:
  - [ ] Project Summary text (400–500 words) — ready to paste
  - [ ] Demo Video link — YouTube/Drive URL
  - [ ] GitHub Repository link — public
  - [ ] Working live prototype URL — tested and stable
  - [ ] Problem Statement — copied from PPT slide 1
- [ ] **SUBMIT on hackathon dashboard by 6:00 PM** (6-hour buffer before midnight)

### AWS Integration (A) — Morning
- [ ] Final AWS cost audit: total spent vs $120 budget
- [ ] Disable any services not needed post-submission to stop billing
- [ ] Document cost breakdown in README: per-pipeline-call estimate
- [ ] Keep backend live until March 4 (submission deadline) for evaluator testing

### ALL TEAM — Evening
- [ ] Confirm submission received on dashboard
- [ ] Share live URL in team chat, do one final end-to-end test together
- [ ] Done.

---

## DAY 7 — Mar 3 | BUFFER / SUBMISSION DEADLINE SAFETY NET

**Only use this day if Day 6 submission failed or a critical bug was found.**

- Re-test live URL if evaluators report issues
- Fix any critical post-submission bugs
- Prepare for potential Q&A from evaluators

**Official deadline:** March 4, 2026

---

## 💰 BUDGET ALLOCATION ($120 Total)

| Phase | Estimated Cost |
|-------|----------------|
| Days 1–2 (Setup + Transcribe) | ~$5 |
| Day 3 (Bedrock/Claude 3.5) | ~$15 |
| Day 4 (Polly + pipeline) | ~$10 |
| Day 5 (Deployment + testing) | ~$20 |
| Days 6–7 (Live for evaluators) | ~$10 |
| Safety buffer | ~$60 |
| **TOTAL ESTIMATED** | **~$60** (well within $120) |

### Cost-Saving Tips
- Use Amazon Transcribe batch (not streaming) — 4x cheaper for demo
- Cache Bedrock responses for repeated test inputs
- Use Polly standard voices for testing, Neural only for demo recording
- Set S3 lifecycle: auto-delete uploads after 24 hours

---

## ⚠️ RISK REGISTER

### RISK: AWS credits don't arrive by Day 2
**MITIGATION:** Use personal card with $10 limit for Days 2–3, reimburse when credits arrive. If no card available: mock the Transcribe + Bedrock responses in backend (return hardcoded JSON), demo the UI pipeline fully, note in submission that AWS integration is architecture-ready.

### RISK: Bedrock Claude 3.5 not available in chosen region
**MITIGATION:** Switch to us-east-1. If still unavailable, use us-west-2.

### RISK: Amazon Nova Reel (avatar video synthesis) not available in time
**MITIGATION:** Already handled — avatar placeholder animation covers this. Note in submission: "Nova Reel integration is architecturally complete, pending production access."

### RISK: Live URL goes down during evaluation
**MITIGATION:** Deploy to TWO platforms (e.g., Vercel + Railway backup). Submit the more stable one as primary.

### RISK: Demo video too long / unclear
**MITIGATION:** Hard cap at 3 minutes. Lead reviews script on Day 4. Record multiple short takes, assemble on Day 6.

---

## 🎬 WHAT EVALUATORS WILL SEE (The Demo Path)

1. Open live URL → homepage loads cleanly
2. Navigate to Assistive Mode
3. Upload a Hindi audio clip (pre-recorded, max 30 seconds)
4. Click "Process with Samvad AI"
5. Watch: transcript appears → ISL Gloss tokens display → dubbed Tamil audio plays
6. Switch language to Telugu, click Process again — new dubbed audio plays
7. Navigate to Live Session page → show mock stream UI, avatar placeholder
8. Show Replay Library → stored session example
9. Show architecture slide from PPT
10. Show GitHub repo with clean README

**This is a complete, testable, impressive prototype.**

---

**Roadmap version:** Feb 26, 2026  
**Team:** Blunders of the World  
**Hackathon:** AI for Bharat
