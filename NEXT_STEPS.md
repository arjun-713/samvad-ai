# Samvad AI — Next Steps Roadmap

> **What's Done:** Frontend (10 components), Backend (7 services, 4 routes, WebSocket), Docker Compose (cross-platform). Both build and run successfully.

---

## 🔴 Priority 1 — Testing (from `Test.md`)

### Backend Tests
- [ ] Create `backend/tests/conftest.py` — force `ENVIRONMENT=local` for all tests
- [ ] Create `backend/tests/test_health.py` — health + languages endpoints
- [ ] Create `backend/tests/test_isl_grammar.py` — time-fronting, article drops, question markers, edge cases (19 tests)
- [ ] Create `backend/tests/test_transcreation_local.py` — Claude API tests (skipped without API key)
- [ ] Create `backend/tests/test_avatar_generator.py` — initialization, URL lookup, placeholder generation
- [ ] Create `backend/tests/test_tts_service.py` — local TTS file generation, Hindi, multi-language
- [ ] Create `backend/tests/test_api_text_to_isl.py` — full API integration tests (empty/long rejection, response time)
- [ ] Create `backend/tests/benchmark.py` — ISL grammar < 5ms, full pipeline < 5000ms

### Frontend Tests
- [ ] Install test deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- [ ] Create `samvad-ui/vitest.config.ts` + `src/test/setup.ts`
- [ ] Create `src/test/isl_grammar.test.ts` — gloss display splitting
- [ ] Create `src/test/components/TextToISL.test.tsx` — textarea, button, quick phrases, gloss display
- [ ] Create `src/test/components/ISLAvatar.test.tsx` — CSS avatar, video element, emotional tone badge

### CI Pipeline
- [ ] Create `.github/workflows/test.yml` — runs backend + frontend tests on push/PR

---

## 🟡 Priority 2 — Feature Completion & Polish

### Add Anthropic API Key
- [ ] Get an Anthropic API key and add to `backend/.env`
- [ ] Verify Claude transcreation produces culturally adapted ISL output
- [ ] Test idiom adaptation (e.g., "raining cats and dogs" → visual equivalent)

### End-to-End Flow Testing (Manual Checklist)
- [ ] **Flow 1 (Text → ISL):** Type text → get ISL gloss + avatar + cultural notes
- [ ] **Flow 2 (Live Stream):** Webcam + mic → real-time ISL overlay (requires Whisper model download)
- [ ] **Flow 3 (Video Upload):** Upload MP4 → full pipeline → PiP ISL avatar + dubbed audio
- [ ] **Flow 4 (Reverse Mode):** Sign into camera → generated text + TTS audio

### UI Polish
- [ ] Mobile responsive layout at 375px width — no horizontal overflow
- [ ] Loading spinners during all async operations
- [ ] Error states with retry buttons on all flows
- [ ] Smooth transitions between pipeline stages
- [ ] PiP overlay position respects Settings panel preference

### Backend Improvements
- [ ] Install spaCy model (`python -m spacy download en_core_web_sm`) for better ISL grammar
- [ ] Generate real placeholder ISL clips with `python setup.py`
- [ ] Install ffmpeg for video audio extraction in Flow 3
- [ ] Add logging/error tracking (structured JSON logs)

---

## 🟢 Priority 3 — Phase 2 Upgrades (AWS / Production)

### Replace Mocks with Real Services
- [ ] Whisper → Amazon Transcribe (real-time streaming)
- [ ] Claude direct → Amazon Bedrock (Claude on AWS)
- [ ] gTTS → Amazon Polly (natural-sounding Indian voices)
- [ ] Placeholder clips → Amazon Nova Reel (AI-generated ISL avatar videos)
- [ ] Local files → Amazon S3 (uploads, outputs, clips)

### Infrastructure
- [ ] Add Redis for caching ISL translations (save API calls)
- [ ] Add PostgreSQL for user sessions and usage analytics
- [ ] Deploy to AWS ECS/Fargate with GitHub Actions CD pipeline
- [ ] Set up CloudFront CDN for static assets + ISL clips
- [ ] Add rate limiting and API key auth
- [ ] Add budget alerts (`scripts/check_budget.py`)

### Advanced Features
- [ ] Real ISL sign recognition model (replace mock MediaPipe classifier)
- [ ] Multi-clip stitching for full sentence avatar videos
- [ ] Lip-sync for dubbed audio
- [ ] Picture-in-Picture API for floating ISL overlay on any page
- [ ] User accounts + saved translations history
- [ ] Analytics dashboard (daily usage, popular phrases, language distribution)

---

## 📋 Quick Start Commands

```bash
# Run everything with Docker
docker compose up --build

# Run locally (without Docker)
# Terminal 1 — Backend
cd backend
py -m pip install -r requirements.txt
py -m spacy download en_core_web_sm
py setup.py
py main.py

# Terminal 2 — Frontend
cd samvad-ui
npm install
npm run dev

# Run tests
cd backend && pytest tests/ -v
cd samvad-ui && npm run test
```
