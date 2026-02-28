# PHASE4.md — Reverse Mode (Sign Language to Voice)

> **Status: Start only after PHASE3.md checklist is fully complete.**
> Read CLAUDE.md and FRONTEND_CONTEXT.md before starting.

---

## Goal

A deaf creator opens the app, toggles **Reverse Mode ON**, signs into their webcam, and Samvad generates a spoken audio voiceover they can download. Two input paths: live webcam signing, and uploaded video of signing.

---

## AWS Setup for Phase 4

### Step 1 — Add Polly permissions to IAM user
AWS Console → IAM → Users → `samvad-ai-dev` → Add permissions → Attach:
`AmazonPollyFullAccess`

### Step 2 — Verify ap-south-1 supports Polly Neural
Polly Neural in `ap-south-1` supports:
- Hindi: `Kajal` (neural, female) ✓
- Indian English: `Aditi` (standard only in some regions — use `Raveena` as fallback)
- Tamil, Telugu: standard engine only (neural not available)

---

## Backend — New Files Only

```
backend/services/polly_tts.py
backend/services/sign_recognition.py
backend/routes/reverse_mode.py
```

Add to `main.py` only. Do not touch Phase 1/2/3 files.

---

## backend/services/polly_tts.py

```python
import boto3
import base64
import os

polly = boto3.client("polly", region_name=os.getenv("AWS_REGION", "ap-south-1"))

VOICE_MAP = {
    "hi-IN": {"voice_id": "Kajal", "engine": "neural"},
    "en-IN": {"voice_id": "Raveena", "engine": "standard"},
    "ta-IN": {"voice_id": "Aditi", "engine": "standard"},
    "te-IN": {"voice_id": "Aditi", "engine": "standard"},
}

def synthesize_speech(text: str, language: str = "hi-IN") -> dict:
    """
    Converts text to speech using Amazon Polly.
    Returns { audio_base64, duration_seconds, character_count }
    """
    config = VOICE_MAP.get(language, VOICE_MAP["hi-IN"])

    response = polly.synthesize_speech(
        Text=text[:3000],  # Polly limit per call
        OutputFormat="mp3",
        VoiceId=config["voice_id"],
        Engine=config["engine"],
        LanguageCode=language,
        SampleRate="22050",
    )

    audio_bytes = response["AudioStream"].read()
    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

    return {
        "audio_base64": audio_base64,
        "character_count": len(text),
    }
```

---

## backend/services/sign_recognition.py

For video upload processing (server-side):

```python
import cv2
import json
import mediapipe as mp
import numpy as np
from pathlib import Path

SIGNS_LIBRARY_PATH = Path(__file__).parent.parent / "signs_library.json"
mp_hands = mp.solutions.hands

with open(SIGNS_LIBRARY_PATH) as f:
    SIGNS_LIBRARY = json.load(f)


def landmarks_to_vector(hand_landmarks) -> list[float]:
    """Flatten 21 hand landmarks to a 63-dim vector."""
    vec = []
    for lm in hand_landmarks.landmark:
        vec.extend([lm.x, lm.y, lm.z])
    return vec


def cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def match_sign(vector: list) -> tuple[str, float]:
    """Returns (best_match_word, confidence) or ('', 0.0)"""
    best_word, best_score = '', 0.0
    for word, data in SIGNS_LIBRARY.items():
        score = cosine_similarity(vector, data["landmarks"])
        if score > best_score:
            best_score = score
            best_word = word
    return best_word, best_score


def recognize_signs_from_video(video_path: str, confidence_threshold: float = 0.80) -> list[str]:
    """
    Extracts frames at 5fps, runs MediaPipe hand detection,
    matches against signs library.
    Returns ordered list of recognized words.
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_interval = max(1, int(fps / 5))

    recognized = []
    last_word = ''
    consecutive = 0

    with mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7) as hands:
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % frame_interval != 0:
                frame_idx += 1
                continue

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb)

            if result.multi_hand_landmarks:
                lm = result.multi_hand_landmarks[0]
                vector = landmarks_to_vector(lm)
                word, confidence = match_sign(vector)
                if confidence >= confidence_threshold:
                    if word == last_word:
                        consecutive += 1
                        if consecutive == 3:
                            recognized.append(word)
                    else:
                        consecutive = 1
                        last_word = word
            else:
                consecutive = 0

            frame_idx += 1

    cap.release()
    return recognized
```

Add to `backend/requirements.txt`:
```
mediapipe>=0.10.0
opencv-python-headless>=4.8.0
```

---

## backend/routes/reverse_mode.py

```python
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.polly_tts import synthesize_speech
from services.sign_recognition import recognize_signs_from_video
import tempfile, os

router = APIRouter()

@router.post("/api/reverse-mode/text-to-speech")
def text_to_speech(payload: dict):
    text = payload.get("text", "").strip()
    language = payload.get("language", "hi-IN")
    if not text:
        raise HTTPException(400, "Text is required")
    if len(text) > 3000:
        raise HTTPException(400, "Text too long. Maximum 3000 characters.")
    result = synthesize_speech(text, language)
    return result


@router.post("/api/reverse-mode/video-to-speech")
async def video_to_speech(
    file: UploadFile = File(...),
    language: str = Form(default="hi-IN")
):
    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        words = recognize_signs_from_video(tmp_path)
        if not words:
            return {"text": "", "audio_base64": None, "message": "No signs recognized"}
        text = ' '.join(words)
        audio = synthesize_speech(text, language)
        return {"text": text, "recognized_signs": words, **audio}
    finally:
        os.unlink(tmp_path)
```

---

## backend/main.py — Add Only

```python
from routes.reverse_mode import router as reverse_mode_router
app.include_router(reverse_mode_router)
```

---

## backend/signs_library.json

Create this file with at minimum 20 signs. Format:

```json
{
  "hello": {
    "dominant_hand": "right",
    "landmarks": [0.5, 0.2, 0.1, 0.6, 0.3, 0.0, ...],
    "description": "Open palm wave"
  },
  "thank_you": {
    "dominant_hand": "right",
    "landmarks": [...],
    "description": "Flat hand from chin forward"
  }
}
```

**To build the library:** Create a script `backend/scripts/capture_sign.py` that:
1. Opens webcam with OpenCV
2. Runs MediaPipe Hands on each frame
3. On pressing SPACE: saves the current hand landmark vector to JSON
4. On pressing Q: exits and saves to `signs_library.json`

Run it for each of the 20+ target signs and capture a representative frame.

---

## Also create `samvad-ui/src/data/signs_library.json`

Copy the same `signs_library.json` to the frontend so the browser-side recognition hook can use it without a network call.

---

## Frontend — Reverse Mode Toggle (Live Session Mode Tab)

The **Reverse Mode toggle already exists** in the UI. Wire it up.

### New File: `samvad-ui/src/hooks/useSignRecognition.ts`

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import signsLibrary from '../data/signs_library.json';

declare const Holistic: any; // MediaPipe loaded via CDN

interface SignMatch {
  word: string;
  confidence: number;
}

function landmarksToVector(landmarks: any[]): number[] {
  return landmarks.flatMap(lm => [lm.x, lm.y, lm.z]);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

function matchSign(vector: number[]): SignMatch {
  let bestWord = '';
  let bestScore = 0;
  for (const [word, data] of Object.entries(signsLibrary as any)) {
    const score = cosineSimilarity(vector, (data as any).landmarks);
    if (score > bestScore) { bestScore = score; bestWord = word; }
  }
  return { word: bestWord, confidence: bestScore };
}

export function useSignRecognition(videoRef: React.RefObject<HTMLVideoElement>) {
  const [currentSign, setCurrentSign] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [sentence, setSentence] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const lastWordRef = useRef('');
  const consecutiveRef = useRef(0);
  const holisticRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!videoRef.current) return;
    setIsActive(true);
    setSentence([]);

    // MediaPipe loaded via CDN script tag (add to index.html)
    const holistic = new (window as any).Holistic({
      locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`,
    });
    holistic.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.7 });
    holistic.onResults((results: any) => {
      const hand = results.rightHandLandmarks || results.leftHandLandmarks;
      if (!hand) { consecutiveRef.current = 0; return; }
      const vector = landmarksToVector(hand);
      const { word, confidence } = matchSign(vector);
      setCurrentSign(word);
      setConfidence(confidence);
      if (confidence >= 0.8) {
        if (word === lastWordRef.current) {
          consecutiveRef.current++;
          if (consecutiveRef.current === 3) {
            setSentence(prev => [...prev, word]);
          }
        } else {
          lastWordRef.current = word;
          consecutiveRef.current = 1;
        }
      }
    });
    holisticRef.current = holistic;

    const camera = new (window as any).Camera(videoRef.current, {
      onFrame: async () => { await holistic.send({ image: videoRef.current! }); },
      width: 640, height: 480,
    });
    camera.start();
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    holisticRef.current?.close();
  }, []);

  return { currentSign, confidence, sentence, isActive, start, stop };
}
```

**Add to `samvad-ui/index.html`** (before closing `</head>`):
```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
```

---

## Frontend — What to Change in Live Session Mode Tab

When the **Reverse Mode toggle** is switched ON:

1. **Left panel switches from video feed to webcam:**
   ```typescript
   const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
   videoRef.current.srcObject = stream;
   ```
   Do not request microphone — `audio: false` always.

2. **Show a "Start Signing" button** below the webcam feed (same style as existing orange buttons).

3. **Right panel (Translation Deck) switches content:**
   - Hide the textarea and translate button
   - Show: current recognized sign (large, bold, center)
   - Show: confidence bar (thin progress bar below the sign)
   - Show: accumulated sentence so far
   - Show: "Stop & Generate Voice" button
   - Show: audio player + download button (after Polly returns)

4. **"Start Signing" → calls `start()` from `useSignRecognition`**

5. **"Stop & Generate Voice" → calls `stop()`, then:**
   ```typescript
   const text = sentence.join(' ');
   const res = await fetch(`${VITE_API_URL}/api/reverse-mode/text-to-speech`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ text, language }),
   });
   const { audio_base64 } = await res.json();
   const blob = new Blob([Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0))], { type: 'audio/mp3' });
   const url = URL.createObjectURL(blob);
   // Set audio element src to url, offer download
   ```

When Reverse Mode is toggled **OFF**: stop webcam stream, restore normal Translation Deck UI.

---

## Frontend — Assistive Tab (Video Upload Reverse Mode)

The **Assistive tab** (Tab 3) gets the video-upload variant of reverse mode.

UI in Assistive tab:
1. Upload zone — accepts video of person signing (drag/drop or browse)
2. Language selector
3. "Recognize Signs" button
4. Processing status: "Analyzing signing..."
5. Results: recognized text + audio player + download button

API call: `POST /api/reverse-mode/video-to-speech` with the video file.

---

## Testing Checklist

```bash
# Test Polly TTS
curl -X POST http://localhost:8000/api/reverse-mode/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello my name is Arjun", "language": "hi-IN"}'
# Decode audio_base64 and verify it plays:
# python3 -c "import base64; open('test.mp3','wb').write(base64.b64decode('<paste base64>'))"
# Play test.mp3
```

Frontend:
- [ ] Toggle Reverse Mode ON → webcam activates in left panel
- [ ] Hold the "hello" sign → "HELLO" appears within 1 second
- [ ] 3+ frames of same sign → word commits to sentence
- [ ] Click Stop & Generate Voice → audio plays automatically
- [ ] Download button → MP3 downloads correctly
- [ ] Toggle Reverse Mode OFF → normal UI restores, webcam stops
- [ ] Assistive tab: upload a signing video → recognized text + audio returned

---

## Definition of Done

- [ ] Reverse Mode toggle switches UI to webcam + sign recognition mode
- [ ] At least 20 signs recognizable at >80% confidence with known test signs
- [ ] Committed words accumulate into a sentence
- [ ] Sentence sent to Polly → MP3 audio returned and plays
- [ ] Download button works
- [ ] Webcam never requests microphone access
- [ ] Assistive tab video upload flow works end-to-end
- [ ] No Phase 1/2/3 functionality broken

---

## Honest Note for Judges

The sign recognition in Phase 4 is **gesture matching** against a curated library of 20-50 signs — not full ISL recognition. Full ISL recognition requires a custom-trained deep learning model which is beyond the scope of a 48-hour hackathon. The architecture is designed to accept a real model later by swapping the `matchSign` function. This should be stated clearly during the demo.