# PHASE2.md — Video Upload to ISL (Picture-in-Picture)

> **Status: Start only after PHASE1.md checklist is fully complete.**
> Read CLAUDE.md and FRONTEND_CONTEXT.md before starting.

---

## Goal

User uploads a pre-recorded video → Samvad transcribes the audio via AWS Transcribe → converts speech to ISL clips → plays the original video with an ISL avatar in PiP, synced to the speech timestamps.

---

## AWS Setup for Phase 2

### Step 1 — Add Transcribe permissions to IAM user
AWS Console → IAM → Users → `samvad-ai-dev` → Add permissions → Attach policy:
`AmazonTranscribeFullAccess`

### Step 2 — New S3 bucket for uploaded videos
Create bucket: `samvad-ai-video-uploads` in `ap-south-1`
Keep **Block Public Access ON** (this bucket is private — Transcribe accesses it via IAM, not public URL).

Add lifecycle rule:
- Prefix: (empty, applies to all objects)
- Expiration: **1 day** (auto-deletes uploaded videos to control costs)

### Step 3 — Update backend/.env
```
S3_UPLOAD_BUCKET=samvad-ai-video-uploads
```

---

## Backend — New Files to Create

```
backend/services/video_upload.py
backend/services/transcribe_video.py
backend/routes/video_to_isl.py
```

Do not modify Phase 1 files. Only add to `main.py` to register the new router.

---

## backend/services/video_upload.py

```python
import boto3
import os
import uuid
from pathlib import Path

s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION"))
UPLOAD_BUCKET = os.getenv("S3_UPLOAD_BUCKET")

def upload_video_to_s3(file_bytes: bytes, filename: str) -> dict:
    """
    Uploads video to S3. Returns s3_key and s3_uri.
    """
    job_id = str(uuid.uuid4())[:8]
    ext = Path(filename).suffix.lower()
    s3_key = f"uploads/{job_id}{ext}"

    s3.put_object(
        Bucket=UPLOAD_BUCKET,
        Key=s3_key,
        Body=file_bytes,
        ContentType=f"video/{ext.lstrip('.')}"
    )
    s3_uri = f"s3://{UPLOAD_BUCKET}/{s3_key}"
    return {"job_id": job_id, "s3_key": s3_key, "s3_uri": s3_uri}
```

---

## backend/services/transcribe_video.py

```python
import boto3
import os
import json
import time
import uuid

transcribe = boto3.client("transcribe", region_name=os.getenv("AWS_REGION"))
s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION"))
UPLOAD_BUCKET = os.getenv("S3_UPLOAD_BUCKET")

def start_transcription(s3_uri: str, language_code: str = "hi-IN") -> str:
    """
    Starts a Transcribe batch job. Returns job_name.
    """
    job_name = f"samvad-{uuid.uuid4().hex[:12]}"
    ext = s3_uri.split(".")[-1].lower()
    media_format = ext if ext in ["mp4", "mov", "webm", "mp3", "wav"] else "mp4"

    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={"MediaFileUri": s3_uri},
        MediaFormat=media_format,
        LanguageCode=language_code,
        OutputBucketName=UPLOAD_BUCKET,
        OutputKey=f"transcripts/{job_name}.json",
        Settings={"ShowSpeakerLabels": False},
        # Word-level timestamps — REQUIRED for clip sync
        JobExecutionSettings={"AllowDeferredExecution": False},
    )
    # Enable word timestamps via separate param
    # Note: EnableWordTimeOffsets is in TranscriptionJobSettings for newer SDK versions
    return job_name

def get_job_status(job_name: str) -> dict:
    """
    Returns status dict: { status, transcript, words }
    status: 'processing' | 'complete' | 'failed'
    words: list of { word, start_ms, end_ms } — only when complete
    """
    response = transcribe.get_transcription_job(TranscriptionJobName=job_name)
    job = response["TranscriptionJob"]
    status = job["TranscriptionJobStatus"]

    if status == "IN_PROGRESS":
        return {"status": "processing"}

    if status == "FAILED":
        return {"status": "failed", "reason": job.get("FailureReason", "Unknown")}

    # COMPLETED — fetch the transcript JSON from S3
    transcript_key = f"transcripts/{job_name}.json"
    obj = s3.get_object(Bucket=UPLOAD_BUCKET, Key=transcript_key)
    transcript_data = json.loads(obj["Body"].read())

    full_text = transcript_data["results"]["transcripts"][0]["transcript"]
    items = transcript_data["results"]["items"]

    words = []
    for item in items:
        if item["type"] != "pronunciation":
            continue
        word = item["alternatives"][0]["content"]
        start_ms = int(float(item["start_time"]) * 1000)
        end_ms = int(float(item["end_time"]) * 1000)
        words.append({"word": word, "start_ms": start_ms, "end_ms": end_ms})

    return {"status": "complete", "transcript": full_text, "words": words}
```

---

## backend/routes/video_to_isl.py

```python
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.video_upload import upload_video_to_s3
from services.transcribe_video import start_transcription, get_job_status
from services.isl_grammar import convert_to_isl_gloss
from services.isl_lookup import resolve_clips
import os

router = APIRouter()

# Simple in-memory cache: job_id -> { s3_uri, job_name, language }
JOB_CACHE: dict = {}

MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500MB

@router.post("/api/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    language: str = Form(default="hi-IN")
):
    # Validate file type
    allowed_types = ["video/mp4", "video/quicktime", "video/webm"]
    if file.content_type not in allowed_types:
        raise HTTPException(415, "Unsupported file type. Use MP4, MOV, or WebM.")

    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(413, "File too large. Maximum size is 500MB.")

    # Upload to S3
    upload = upload_video_to_s3(content, file.filename)
    job_id = upload["job_id"]

    # Start Transcribe job
    job_name = start_transcription(upload["s3_uri"], language)

    # Cache job info
    JOB_CACHE[job_id] = {
        "job_name": job_name,
        "s3_key": upload["s3_key"],
        "language": language,
    }

    return {"job_id": job_id, "status": "processing"}


@router.get("/api/video-status/{job_id}")
def video_status(job_id: str):
    if job_id not in JOB_CACHE:
        raise HTTPException(404, "Job not found")

    cache = JOB_CACHE[job_id]
    result = get_job_status(cache["job_name"])

    if result["status"] != "complete":
        return result

    # Convert words to ISL clips with timestamps
    mode = os.getenv("ISL_CLIPS_MODE", "local")
    clips_with_timestamps = []

    for w in result["words"]:
        gloss_tokens = convert_to_isl_gloss(w["word"])
        if not gloss_tokens:
            continue
        token = gloss_tokens[0]
        resolved = resolve_clips([token], mode)
        clip = resolved[0]
        clips_with_timestamps.append({
            "word": clip["word"],
            "url": clip["url"],
            "found": clip["found"],
            "start_ms": w["start_ms"],
            "end_ms": w["end_ms"],
        })

    # Build video URL
    s3_key = cache["s3_key"]
    bucket = os.getenv("S3_UPLOAD_BUCKET")
    region = os.getenv("AWS_REGION")
    video_url = f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"

    found = sum(1 for c in clips_with_timestamps if c["found"])
    coverage = found / len(clips_with_timestamps) if clips_with_timestamps else 0.0

    return {
        "status": "complete",
        "transcript": result["transcript"],
        "clips": clips_with_timestamps,
        "video_url": video_url,
        "coverage": round(coverage, 2),
    }
```

---

## backend/main.py — Add Only

```python
from routes.video_to_isl import router as video_to_isl_router
app.include_router(video_to_isl_router)
```

---

## Frontend — Streaming Tab Only

**Do not touch the Live Session Mode tab.**

All Phase 2 UI lives in the **Streaming tab** (Tab 2).

### New File: `samvad-ui/src/services/videoService.ts`

```typescript
export interface VideoClip {
  word: string;
  url: string;
  found: boolean;
  start_ms: number;
  end_ms: number;
}

export interface VideoStatusResponse {
  status: 'processing' | 'complete' | 'failed';
  transcript?: string;
  clips?: VideoClip[];
  video_url?: string;
  coverage?: number;
  reason?: string;
}

export async function uploadVideo(
  file: File,
  language: string,
  onProgress: (pct: number) => void
): Promise<{ job_id: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText));
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', `${import.meta.env.VITE_API_URL}/api/upload-video`);
    xhr.send(formData);
  });
}

export async function getVideoStatus(jobId: string): Promise<VideoStatusResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/video-status/${jobId}`);
  if (!res.ok) throw new Error('Status check failed');
  return res.json();
}
```

### New File: `samvad-ui/src/hooks/useVideoSync.ts`

```typescript
import { useEffect, useRef } from 'react';

interface VideoClip {
  word: string;
  url: string;
  start_ms: number;
  end_ms: number;
}

export function useVideoSync(
  mainVideoRef: React.RefObject<HTMLVideoElement>,
  islVideoRef: React.RefObject<HTMLVideoElement>,
  clips: VideoClip[]
) {
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  useEffect(() => {
    const main = mainVideoRef.current;
    const isl = islVideoRef.current;
    if (!main || !isl || clips.length === 0) return;

    function syncISL() {
      const currentMs = main!.currentTime * 1000;
      const activeClip = clipsRef.current.find(
        (c) => currentMs >= c.start_ms && currentMs < c.end_ms
      );
      if (activeClip) {
        if (isl!.src !== activeClip.url) {
          isl!.src = activeClip.url;
          isl!.play().catch(() => {});
        }
      } else {
        isl!.pause();
      }
    }

    function onPause() { isl!.pause(); }
    function onPlay() { syncISL(); }

    main.addEventListener('timeupdate', syncISL);
    main.addEventListener('pause', onPause);
    main.addEventListener('play', onPlay);
    main.addEventListener('seeked', syncISL);

    return () => {
      main.removeEventListener('timeupdate', syncISL);
      main.removeEventListener('pause', onPause);
      main.removeEventListener('play', onPlay);
      main.removeEventListener('seeked', syncISL);
    };
  }, [clips]);
}
```

### Streaming Tab Component

The Streaming tab component needs these states and UI sections:

**States:**
```typescript
const [file, setFile] = useState<File | null>(null);
const [language, setLanguage] = useState('hi-IN');
const [uploadProgress, setUploadProgress] = useState(0);
const [jobId, setJobId] = useState<string | null>(null);
const [processingStatus, setProcessingStatus] = useState<string>('');
const [videoResult, setVideoResult] = useState<VideoStatusResponse | null>(null);
const mainVideoRef = useRef<HTMLVideoElement>(null);
const islVideoRef = useRef<HTMLVideoElement>(null);
useVideoSync(mainVideoRef, islVideoRef, videoResult?.clips ?? []);
```

**UI sections (in order):**

1. **Upload zone** — shown when `videoResult` is null:
   - Large dashed-border dropzone accepting video files
   - File browser button as fallback
   - Reject non-video files client-side before upload
   - Show selected filename once a file is chosen
   - Language selector: Hindi (hi-IN), English (en-IN), Tamil (ta-IN), Telugu (te-IN)
   - "Process Video" button — disabled until file is selected
   - Upload progress bar (0-100%) — shown once upload starts
   - Status text: "Uploading...", "Transcribing audio...", "Generating ISL...", "Ready"

2. **Video player** — shown when `videoResult?.status === 'complete'`:
   - Main `<video>` element with `ref={mainVideoRef}` playing `videoResult.video_url`
   - ISL overlay `<video>` element with `ref={islVideoRef}` positioned bottom-right of main video
   - Transcript text displayed below the player
   - Coverage indicator: "X% of words covered by ISL dictionary"
   - "Upload Another" button to reset state

**Polling logic:**
```typescript
useEffect(() => {
  if (!jobId) return;
  const poll = setInterval(async () => {
    const status = await getVideoStatus(jobId);
    if (status.status === 'complete' || status.status === 'failed') {
      clearInterval(poll);
      setVideoResult(status);
      setProcessingStatus(status.status === 'complete' ? 'Ready' : 'Failed');
    }
  }, 3000);
  return () => clearInterval(poll);
}, [jobId]);
```

---

## Testing Checklist

```bash
# 1. Upload a short video (30 seconds, Hindi speech)
curl -X POST http://localhost:8000/api/upload-video \
  -F "file=@test.mp4" \
  -F "language=hi-IN"
# Note the job_id

# 2. Poll until complete (check every 5 seconds)
curl http://localhost:8000/api/video-status/{job_id}
# Wait for status: "complete"

# 3. Verify clips have timestamps
# Response clips array must have start_ms and end_ms > 0
```

Frontend:
- [ ] Upload a 30-second video → progress bar fills → "Transcribing audio..." status shows
- [ ] After ~30-60 seconds → video player appears with ISL overlay
- [ ] Pausing main video pauses ISL overlay
- [ ] Seeking main video → ISL overlay jumps to correct clip for that timestamp
- [ ] Uploading a non-video file → rejected with clear error before any upload
- [ ] "Upload Another" button resets everything cleanly

---

## Definition of Done

- [ ] `POST /api/upload-video` uploads to S3 and starts Transcribe job
- [ ] `GET /api/video-status/{job_id}` returns clips with `start_ms` and `end_ms` timestamps
- [ ] Video player in Streaming tab shows original video + ISL PiP overlay
- [ ] ISL clips sync to video timestamps (pause, seek, play all work)
- [ ] Non-video files rejected before upload
- [ ] Coverage percentage shown to user
- [ ] No Phase 1 functionality broken

**Only after all boxes are checked: open PHASE3.md**