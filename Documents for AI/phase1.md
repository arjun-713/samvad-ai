# PHASE1.md — Text to ISL

> **Status: START HERE**
> Complete this phase fully before opening PHASE2.md.
> Read CLAUDE.md and FRONTEND_CONTEXT.md first.

---

## Goal

User types text in the Translation Deck → clicks Translate → ISL avatar clips play in the Signer PiP card, one word at a time, in ISL grammar order.

No AI video generation. No Nova Reel. Dictionary-based clip lookup only.

---

## AWS Setup (Do This First, Before Any Code)

### Step 1 — IAM User
1. AWS Console → IAM → Users → Create User → name: `samvad-ai-dev`
2. Attach policy: `AmazonS3FullAccess`
3. Create access key → save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Step 2 — S3 Bucket for ISL Clips
1. Create bucket: `samvad-ai-isl-clips` in `ap-south-1`
2. Block Public Access → **uncheck** "Block all public access" → Save
3. Add bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::samvad-ai-isl-clips/*"
  }]
}
```

### Step 3 — Environment Variables
Add to `backend/.env`:
```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=samvad-ai-isl-clips
ISL_CLIPS_MODE=local
```
Add to `samvad-ui/.env` (create if missing):
```
VITE_API_URL=http://localhost:8000
```

---

## ISL Dataset Setup

### Dataset
Download from: https://huggingface.co/datasets/Exploration-Lab/CISLR

This is a word-level ISL video dataset (~4700 words). Each clip is a short MP4 of one ISL sign.

For the initial demo, you only need 30-50 clips. Download these words as priority:
`hello, good, morning, evening, night, how, are, you, i, me, my, name, is, what, where, yes, no, okay, thank, please, sorry, help, need, want, know, understand, come, go, stop, again`

### Folder Structure
```
backend/
  isl_clips/
    hello.mp4
    good.mp4
    morning.mp4
    ...
    unknown.mp4     ← fallback for words not in dictionary
```

All filenames: lowercase, single word, `.mp4`.

### Dictionary File
Create `backend/isl_dictionary.json`:
```json
{
  "hello": "hello.mp4",
  "good": "good.mp4",
  "morning": "morning.mp4",
  "how": "how.mp4",
  "are": "are.mp4",
  "you": "you.mp4",
  "UNKNOWN": "unknown.mp4"
}
```

---

## Backend — New Files to Create

```
backend/services/isl_grammar.py
backend/services/isl_lookup.py
backend/routes/text_to_isl.py
backend/scripts/upload_clips_to_s3.py
```

Do not modify any existing file except `main.py` (to register the new route and mount static files).

---

## backend/services/isl_grammar.py

```python
import spacy

nlp = spacy.load("en_core_web_sm")

STOP_WORDS = {"a", "an", "the", "is", "am", "are", "was", "were", "be", "been", "being"}
TIME_WORDS = {"today", "tomorrow", "yesterday", "now", "later", "soon", "morning", "evening", "night"}

def convert_to_isl_gloss(text: str) -> list[str]:
    """
    Converts English text to ISL gloss token list.
    Rules applied:
    - Remove articles (a, an, the)
    - Remove linking to-be verbs (is, am, are, was, were)
    - Move time words to front
    - Uppercase all tokens
    - Split contractions (don't → do not, can't → cannot)
    Returns list of uppercase gloss tokens.
    """
    doc = nlp(text.lower())
    tokens = []
    time_tokens = []

    for token in doc:
        word = token.text.strip()
        if not word or token.is_punct:
            continue
        if word in STOP_WORDS:
            continue
        if word in TIME_WORDS:
            time_tokens.append(word.upper())
        else:
            tokens.append(word.upper())

    return time_tokens + tokens
```

---

## backend/services/isl_lookup.py

```python
import json
import os
from pathlib import Path

DICT_PATH = Path(__file__).parent.parent / "isl_dictionary.json"
CLIPS_DIR = Path(__file__).parent.parent / "isl_clips"

with open(DICT_PATH) as f:
    DICTIONARY = json.load(f)

def resolve_clips(gloss_tokens: list[str], mode: str = "local") -> list[dict]:
    """
    Maps gloss tokens to video clip URLs.
    mode: 'local' → localhost static URLs
          's3'    → S3 public URLs
    Returns list of dicts: { word, url, found }
    """
    base_url = os.getenv("VITE_API_URL", "http://localhost:8000") if mode == "local" else \
               f"https://{os.getenv('S3_BUCKET_NAME')}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/isl-clips"

    results = []
    for token in gloss_tokens:
        key = token.lower()
        filename = DICTIONARY.get(key, DICTIONARY.get("UNKNOWN", "unknown.mp4"))
        found = key in DICTIONARY
        if mode == "local":
            url = f"http://localhost:8000/clips/{filename}"
        else:
            url = f"{base_url}/{filename}"
        results.append({"word": token, "url": url, "found": found})

    return results
```

---

## backend/routes/text_to_isl.py

```python
from fastapi import APIRouter
from pydantic import BaseModel
from services.isl_grammar import convert_to_isl_gloss
from services.isl_lookup import resolve_clips
import os

router = APIRouter()

class TextToISLRequest(BaseModel):
    text: str
    speed: float = 1.0
    persona: str = "maya"

class ClipItem(BaseModel):
    word: str
    url: str
    found: bool

class TextToISLResponse(BaseModel):
    gloss: list[str]
    clips: list[ClipItem]
    coverage: float
    mode: str

@router.post("/api/text-to-isl", response_model=TextToISLResponse)
def text_to_isl(req: TextToISLRequest):
    mode = os.getenv("ISL_CLIPS_MODE", "local")
    gloss = convert_to_isl_gloss(req.text)
    clips = resolve_clips(gloss, mode)
    found_count = sum(1 for c in clips if c["found"])
    coverage = found_count / len(clips) if clips else 0.0
    return TextToISLResponse(
        gloss=gloss,
        clips=[ClipItem(**c) for c in clips],
        coverage=round(coverage, 2),
        mode=mode
    )
```

---

## backend/main.py — Changes Only

Add these lines. Do not remove anything existing:

```python
# At top, with other imports
from fastapi.staticfiles import StaticFiles
from routes.text_to_isl import router as text_to_isl_router

# After app = FastAPI(...)
app.mount("/clips", StaticFiles(directory="isl_clips"), name="clips")
app.include_router(text_to_isl_router)
```

CORS should already exist. Verify it allows `http://localhost:5173`. If not:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)
```

---

## backend/requirements.txt — Add If Missing

```
spacy>=3.7.0
python-dotenv>=1.0.0
```

Then run: `python -m spacy download en_core_web_sm`

---

## backend/scripts/upload_clips_to_s3.py

Run this once when ready to switch to S3:
```python
import boto3, os
from pathlib import Path

s3 = boto3.client("s3")
bucket = os.getenv("S3_BUCKET_NAME")
clips_dir = Path("../isl_clips")

for clip in clips_dir.glob("*.mp4"):
    print(f"Uploading {clip.name}...")
    s3.upload_file(str(clip), bucket, f"isl-clips/{clip.name}",
                   ExtraArgs={"ContentType": "video/mp4"})
    print(f"Done: {clip.name}")
print("All clips uploaded.")
```

To switch to S3: change `ISL_CLIPS_MODE=s3` in `backend/.env`. No other code changes needed.

---

## Frontend — What to Change

Only touch the **Live Session Mode** tab. No other tab.

### New File: `samvad-ui/src/services/islService.ts`

```typescript
interface ClipItem {
  word: string;
  url: string;
  found: boolean;
}

interface TextToISLResponse {
  gloss: string[];
  clips: ClipItem[];
  coverage: number;
  mode: string;
}

export async function translateToISL(
  text: string,
  speed: number,
  persona: string
): Promise<TextToISLResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/text-to-isl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speed, persona }),
  });
  if (!res.ok) throw new Error('Translation failed');
  return res.json();
}
```

### New File: `samvad-ui/src/hooks/useISLPlayback.ts`

```typescript
import { useState, useRef, useCallback } from 'react';

interface ClipItem {
  word: string;
  url: string;
  found: boolean;
}

export function useISLPlayback(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentWord, setCurrentWord] = useState('');
  const clipsRef = useRef<ClipItem[]>([]);
  const speedRef = useRef(1.0);
  const indexRef = useRef(0);

  const playClips = useCallback((clips: ClipItem[], speed: number) => {
    if (!videoRef.current || clips.length === 0) return;
    clipsRef.current = clips;
    speedRef.current = speed;
    indexRef.current = 0;
    setIsPlaying(true);
    loadClip(0, videoRef.current, clips, speed);
  }, []);

  function loadClip(
    index: number,
    video: HTMLVideoElement,
    clips: ClipItem[],
    speed: number
  ) {
    if (index >= clips.length) {
      setIsPlaying(false);
      setCurrentWord('');
      setCurrentIndex(-1);
      return;
    }
    const clip = clips[index];
    video.src = clip.url;
    video.playbackRate = speed;
    setCurrentIndex(index);
    setCurrentWord(clip.word);
    video.play().catch(() => {});
    video.onended = () => loadClip(index + 1, video, clips, speed);
  }

  const stop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentWord('');
    setCurrentIndex(-1);
  }, []);

  return { isPlaying, currentIndex, currentWord, playClips, stop };
}
```

### Changes to the Live Session Mode component

Find the component that renders Tab 1 (Live Session Mode). Make these surgical changes only:

**1. Add a translate button below the textarea:**

Place immediately after the `<textarea>` element and before the "Interpret Tone" / "Summarize Key Points" buttons:
```tsx
<button
  onClick={handleTranslate}
  disabled={!text.trim() || isLoading}
  className="..."  // match existing orange button style
>
  {isLoading ? 'Translating...' : 'Translate to ISL'}
</button>
```

**2. Add gloss chips display:**

Below the translate button, render the gloss tokens when available:
```tsx
{gloss.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {gloss.map((token, i) => (
      <span
        key={i}
        className={`px-2 py-1 rounded-full text-xs font-mono ${
          i === currentIndex
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {token}
      </span>
    ))}
  </div>
)}
```

**3. Wire up the Signer PiP card:**

Find the PiP card component (the one labeled "Signer"). Inside it, conditionally render a video element:
```tsx
<video
  ref={signerVideoRef}
  style={{ display: isPlaying ? 'block' : 'none' }}
  className="w-full h-full object-cover"
  playsInline
  muted={false}
/>
{!isPlaying && <img src={avatarPlaceholder} ... />}  {/* existing static image */}
```

**4. Wire up state:**

```typescript
const [text, setText] = useState('');
const [speed, setSpeed] = useState(1.2);
const [persona, setPersona] = useState('maya');
const [gloss, setGloss] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(false);
const signerVideoRef = useRef<HTMLVideoElement>(null);
const { isPlaying, currentIndex, currentWord, playClips } = useISLPlayback(signerVideoRef);

const handleTranslate = async () => {
  if (!text.trim()) return;
  setIsLoading(true);
  try {
    const result = await translateToISL(text, speed, persona);
    setGloss(result.gloss);
    playClips(result.clips, speed);
  } catch (e) {
    console.error('Translation error:', e);
  } finally {
    setIsLoading(false);
  }
};
```

Wire the textarea `onChange` to `setText`. Wire the speed slider `onChange` to `setSpeed`. Wire the persona selector `onClick` to `setPersona`.

---

## Testing Checklist

Run these in order. Do not move on until each passes.

```bash
# 1. Backend health
curl http://localhost:8000/api/health
# Expected: {"status": "ok"}

# 2. Static clip serving
curl -I http://localhost:8000/clips/morning.mp4
# Expected: 200, content-type: video/mp4

# 3. Text to ISL endpoint
curl -X POST http://localhost:8000/api/text-to-isl \
  -H "Content-Type: application/json" \
  -d '{"text": "Good morning, how are you?", "speed": 1.0, "persona": "maya"}'
# Expected: gloss array + clips array with URLs
```

Frontend:
- [ ] Type "Good morning" → click Translate → Signer PiP plays MORNING then GOOD clips in sequence
- [ ] Active gloss chip highlights in orange as each clip plays
- [ ] Speed slider at 2x → clips play visibly faster
- [ ] Empty textarea → Translate button is disabled
- [ ] Unknown word → UNKNOWN fallback clip plays, no crash

---

## Definition of Done

Phase 1 is complete when every item below is true:

- [ ] `POST /api/text-to-isl` returns correct gloss + clips for any English input
- [ ] Clips are served from `backend/isl_clips/` via `/clips/` static mount
- [ ] Signer PiP card plays clips sequentially
- [ ] Speed slider value affects playback rate
- [ ] Gloss chips display and highlight current word
- [ ] Unknown words fall back to UNKNOWN clip gracefully
- [ ] `upload_clips_to_s3.py` script exists and `ISL_CLIPS_MODE=s3` switch works
- [ ] No TypeScript errors, no console errors during normal use
- [ ] Backend health check returns ok with AWS credentials loaded

**Only after all boxes are checked: open PHASE2.md**