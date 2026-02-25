# Day 1: Foundations & Setup
**Date:** Feb 25, 2026

## Goal
Get the core infrastructure running: GitHub repo, React UI, Python backend, and AWS security locked down.

## End of Day Deliverables
- [ ] GitHub repo created and linked to Kiro IDE
- [ ] React UI running locally (visual only, no logic yet)
- [ ] AWS budget alert configured ($100)
- [ ] Python backend responding to health checks from frontend

---

## Phase 1: AWS Security (DO THIS FIRST)

### AWS Credits & Budget
- [ ] Apply $100 promo code to AWS account
- [ ] Create Cost Budget in AWS Budgets
  - Budget amount: $100
  - Alert thresholds: 50%, 75%, 90%
  - Email notifications enabled

### IAM Configuration
- [ ] Create IAM user: `samvad-dev`
- [ ] Generate access key + secret key (programmatic access)
- [ ] Attach policies:
  - Bedrock Full Access
  - Transcribe Full Access
  - Polly Full Access
  - S3 Full Access
- [ ] Store credentials in `.env` file
- [ ] Add `.env` to `.gitignore`

**Security Check:** Never commit AWS keys to Git. Ever.

---

## Phase 2: Frontend (React) ✅

### Project Setup
- [x] Initialize React project (Vite + TypeScript)

### UI Implementation
- [x] Generate UI components using Stitch prompt
- [x] Build layout:
  - Left: Video player placeholder with PIP signer view
  - Right: AI controls (avatar, text input, translate button)
- [x] Add interactive elements (toggles, buttons, sliders)
- [x] Verify visual functionality (no backend logic yet)

### Git Commit
- [x] `git add .`
- [x] `git commit -m "feat: initial UI layout with Samvad AI interface"`
- [ ] `git push`

---

## Phase 3: Backend (Python)

### Environment Setup
- [ ] Create backend folder
- [ ] Set up virtual environment
  ```bash
  python -m venv venv
  venv\Scripts\activate
  ```

### Dependencies
- [ ] Install packages
  ```bash
  pip install fastapi uvicorn boto3 python-dotenv
  ```

### API Implementation
- [ ] Create `main.py` with health check endpoint
  ```python
  @app.get("/api/health")
  def health_check():
      return {"status": "Samvad Backend is alive"}
  ```
- [ ] Configure CORS for localhost frontend

### Git Commit
- [ ] `git add .`
- [ ] `git commit -m "feat: initial backend setup"`
- [ ] `git push`

---

## Phase 4: Frontend-Backend Integration

### Connection Test
- [ ] Add fetch request in React app
- [ ] Wire "Connect Live Stream" button to `/api/health`
- [ ] Verify response in browser console
- [ ] Confirm CORS is working

---

## End of Day Security Checklist
- [ ] No AWS keys in code
- [ ] `.env` in `.gitignore`
- [ ] AWS budget alert active
- [ ] Code pushed to GitHub
- [ ] IAM user (not root) configured

---

## Notes
- Backend runs on different port than frontend (e.g., :8000 vs :3000)
- MediaLive permissions will be added later
- Keep commits small and descriptive
