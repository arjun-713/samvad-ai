# BACKEND.md — Samvad AI Backend Developer Guide
## Role: Python FastAPI Backend Agent

Read `INSTRUCTIONS.md` first for full project context.

---

## YOUR MISSION

Build the complete Python FastAPI backend in `backend/`. All AWS services are mocked locally. The backend must handle all 4 user flows end-to-end and respond within the latency targets.

---

## SETUP COMMANDS

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

---

## `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-socketio==5.11.2
python-multipart==0.0.9
anthropic==0.28.0
openai-whisper==20231117
torch==2.3.0  # required by whisper — use CPU version if no GPU
spacy==3.7.4
gtts==2.5.1
opencv-python-headless==4.9.0.80
mediapipe==0.10.14
ffmpeg-python==0.2.0
aiofiles==23.2.1
python-dotenv==1.0.1
pydantic==2.7.1
httpx==0.27.0
numpy==1.26.4
pillow==10.3.0
```

---

## `main.py` — Entry Point

```python
import os
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from routes import text_routes, video_routes, stream_routes, health_routes
from socket_handlers import register_socket_handlers

load_dotenv()

# Create dirs if not exist
os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)
os.makedirs(os.getenv("OUTPUT_DIR", "./outputs"), exist_ok=True)
os.makedirs(os.getenv("ISL_CLIPS_DIR", "./assets/isl_clips"), exist_ok=True)

# FastAPI app
app = FastAPI(title="Samvad AI", version="1.0.0-local")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(health_routes.router, prefix="/api")
app.include_router(text_routes.router, prefix="/api")
app.include_router(video_routes.router, prefix="/api")
app.include_router(stream_routes.router, prefix="/api")

# Serve outputs directory as static files
app.mount("/outputs", StaticFiles(directory="./outputs"), name="outputs")
app.mount("/assets", StaticFiles(directory="./assets"), name="assets")

# Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000', 'http://localhost:5173']
)
register_socket_handlers(sio)

# Combine FastAPI + Socket.IO
from socketio import ASGIApp
socket_app = ASGIApp(sio, app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
```

---

## ROUTE: `routes/health_routes.py`

```python
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "environment": "local",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "transcription": "whisper-tiny (local)",
            "transcreation": "claude-3-5-sonnet (anthropic api)",
            "avatar": "pre-recorded clips + css fallback",
            "tts": "gtts (local)",
            "stream": "websocket (local)"
        }
    }

@router.get("/languages")
async def get_languages():
    return [
        {"code": "hi-IN", "name": "Hindi"},
        {"code": "en-IN", "name": "English (Indian)"},
        {"code": "ta-IN", "name": "Tamil"},
        {"code": "te-IN", "name": "Telugu"},
        {"code": "bn-IN", "name": "Bengali"},
        {"code": "mr-IN", "name": "Marathi"},
        {"code": "kn-IN", "name": "Kannada"},
        {"code": "ml-IN", "name": "Malayalam"},
        {"code": "gu-IN", "name": "Gujarati"},
    ]
```

---

## ROUTE: `routes/text_routes.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.transcreation import CulturalTranscreationService
from services.isl_grammar import ISLGrammarConverter
from services.avatar_generator import AvatarGenerator

router = APIRouter(tags=["text-to-isl"])

class TextToISLRequest(BaseModel):
    text: str
    language: str = "hi-IN"

@router.post("/text-to-isl")
async def text_to_isl(request: TextToISLRequest):
    if not request.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if len(request.text) > 500:
        raise HTTPException(400, "Text too long (max 500 chars)")
    
    try:
        # Step 1: Cultural transcreation via Claude
        transcreation_svc = CulturalTranscreationService()
        transcreation = await transcreation_svc.transcreate(request.text, request.language)
        
        # Step 2: ISL grammar conversion
        grammar_svc = ISLGrammarConverter()
        isl_gloss = grammar_svc.convert(transcreation["transcreated_text"])
        
        # Step 3: Generate/lookup avatar
        avatar_svc = AvatarGenerator()
        avatar_url = avatar_svc.get_avatar_url(isl_gloss)
        
        return {
            "gloss": isl_gloss,
            "emotional_tone": transcreation.get("emotional_tone", "neutral"),
            "avatar_url": avatar_url,
            "duration_seconds": len(isl_gloss.split()) * 1.2,  # ~1.2s per sign
            "cultural_notes": transcreation.get("cultural_notes", []),
            "name_signs": transcreation.get("name_signs", {}),
            "emphasis_words": transcreation.get("emphasis_words", []),
        }
    except Exception as e:
        raise HTTPException(500, f"Pipeline error: {str(e)}")
```

---

## ROUTE: `routes/video_routes.py`

```python
import os
import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from services.pipeline import VideoProcessingPipeline

router = APIRouter(tags=["video"])

# In-memory job store (use Redis in Phase 2)
processing_jobs: dict = {}

@router.post("/process-video")
async def process_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...)
):
    # Validate file
    allowed_types = ["video/mp4", "video/avi", "video/quicktime", "video/x-matroska"]
    if video.content_type not in allowed_types and not video.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(400, "Unsupported video format. Use MP4, AVI, MOV, or MKV.")
    
    # Save uploaded file
    job_id = str(uuid.uuid4())[:8]
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    input_path = os.path.join(upload_dir, f"{job_id}_{video.filename}")
    
    content = await video.read()
    if len(content) > 100 * 1024 * 1024:  # 100MB limit
        raise HTTPException(400, "File too large (max 100MB)")
    
    with open(input_path, "wb") as f:
        f.write(content)
    
    # Process synchronously for local demo (use background tasks for large files)
    pipeline = VideoProcessingPipeline(job_id)
    try:
        result = await pipeline.process(input_path)
        return result
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {str(e)}")

@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in processing_jobs:
        raise HTTPException(404, "Job not found")
    return processing_jobs[job_id]
```

---

## SERVICE: `services/transcription.py` — Whisper Mock

```python
import whisper
import tempfile
import base64
import os
from pathlib import Path

class TranscriptionService:
    _model = None  # Singleton — load once
    
    @classmethod
    def _get_model(cls):
        if cls._model is None:
            model_name = os.getenv("WHISPER_MODEL", "tiny")
            print(f"Loading Whisper model: {model_name} (first load may take ~30s)")
            cls._model = whisper.load_model(model_name)
        return cls._model
    
    def transcribe_file(self, audio_path: str, language: str = "hi") -> dict:
        """Transcribe an audio/video file"""
        model = self._get_model()
        result = model.transcribe(audio_path, language=language[:2], fp16=False)
        
        segments = []
        for seg in result.get("segments", []):
            segments.append({
                "text": seg["text"].strip(),
                "start": seg["start"],
                "end": seg["end"],
                "confidence": 1.0 - seg.get("no_speech_prob", 0.0)
            })
        
        return {
            "text": result["text"].strip(),
            "language": result["language"],
            "segments": segments,
        }
    
    def transcribe_base64_audio(self, audio_base64: str) -> dict:
        """Transcribe base64-encoded audio chunk (for live stream)"""
        audio_bytes = base64.b64decode(audio_base64)
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        try:
            result = self.transcribe_file(tmp_path)
            return result
        finally:
            os.unlink(tmp_path)
```

---

## SERVICE: `services/transcreation.py` — Claude Cultural Transcreation

```python
import os
import json
import anthropic
from functools import lru_cache

class CulturalTranscreationService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-3-5-sonnet-20241022"
    
    async def transcreate(self, text: str, source_language: str = "hi-IN", context: str = "general") -> dict:
        """
        Perform cultural transcreation for ISL.
        Returns structured JSON with ISL-adapted content.
        """
        lang_name = {
            "hi-IN": "Hindi", "en-IN": "English (Indian)", "ta-IN": "Tamil",
            "te-IN": "Telugu", "bn-IN": "Bengali", "mr-IN": "Marathi"
        }.get(source_language, "Hindi")
        
        prompt = f"""You are an expert in Indian Sign Language (ISL) and Indian cultural adaptation.

INPUT TEXT (Source: {lang_name}): {text}
CONTEXT: {context}

TASK: Transcreate the above text for deaf Indian audiences who use ISL as their primary language.

REQUIREMENTS:
1. Preserve the emotional tone and intent — do NOT do literal word-for-word translation
2. Adapt idioms and metaphors to visual equivalents (e.g., "raining cats and dogs" → "heavy rain")
3. Identify culturally significant references (politicians, festivals, places) and provide their ISL name-signs
4. Flag the emotional tone
5. Identify words that need emphasis in signing

OUTPUT: Respond ONLY with a valid JSON object (no markdown, no backticks):
{{
  "transcreated_text": "simplified text suitable for ISL conversion",
  "emotional_tone": "neutral|happy|sad|angry|urgent|sarcastic|excited",
  "cultural_notes": ["list of cultural adaptations made"],
  "name_signs": {{"entity": "ISL description"}},
  "emphasis_words": ["words needing emphasis"],
  "visual_metaphors": {{"original": "visual equivalent"}}
}}"""
        
        message = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = message.content[0].text.strip()
        
        # Clean up any accidental markdown
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if Claude doesn't return valid JSON
            return {
                "transcreated_text": text,
                "emotional_tone": "neutral",
                "cultural_notes": [],
                "name_signs": {},
                "emphasis_words": [],
                "visual_metaphors": {}
            }
```

---

## SERVICE: `services/isl_grammar.py` — ISL Grammar Converter

```python
import spacy
import re
from typing import List

class ISLGrammarConverter:
    """
    Converts transcreated text to ISL grammatical structure.
    ISL uses Topic-Comment structure (Time → Topic → Comment), not SVO.
    """
    
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    # ISL gloss dictionary — English → ISL gloss
    GLOSS_MAP = {
        # Greetings
        "hello": "HELLO", "hi": "HELLO", "goodbye": "BYE", "bye": "BYE",
        "thank": "THANK-YOU", "thanks": "THANK-YOU", "please": "PLEASE",
        "sorry": "SORRY", "excuse": "SORRY",
        # Common verbs
        "go": "GO", "going": "GO", "went": "GO",
        "come": "COME", "coming": "COME", "came": "COME",
        "eat": "EAT", "eating": "EAT", "ate": "EAT",
        "drink": "DRINK", "drinking": "DRINK",
        "see": "SEE", "seeing": "SEE", "saw": "SEE",
        "know": "KNOW", "knowing": "KNOW", "knew": "KNOW",
        "want": "WANT", "wanting": "WANT", "wanted": "WANT",
        "help": "HELP", "helping": "HELP",
        "need": "NEED", "needs": "NEED",
        "have": "HAVE", "has": "HAVE",
        "say": "SAY", "said": "SAY",
        "think": "THINK", "thought": "THINK",
        "feel": "FEEL", "felt": "FEEL",
        "work": "WORK", "working": "WORK",
        "play": "PLAY", "playing": "PLAY",
        "learn": "LEARN", "learning": "LEARN",
        "teach": "TEACH", "teaching": "TEACH",
        # Common nouns
        "india": "INDIA", "indian": "INDIA",
        "government": "GOVERNMENT",
        "news": "NEWS",
        "cricket": "CRICKET",
        "school": "SCHOOL",
        "hospital": "HOSPITAL", "doctor": "DOCTOR",
        "home": "HOME", "house": "HOME",
        "water": "WATER",
        "food": "FOOD",
        "money": "MONEY",
        "work": "WORK",
        "today": "TODAY", "tomorrow": "TOMORROW", "yesterday": "YESTERDAY",
        "now": "NOW", "later": "LATER",
        "morning": "MORNING", "evening": "EVENING", "night": "NIGHT",
        # Numbers
        "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
        "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
        # Question words  
        "what": "WHAT?", "who": "WHO?", "where": "WHERE?",
        "when": "WHEN?", "why": "WHY?", "how": "HOW?",
        # Pronouns
        "i": "I", "me": "ME", "my": "MY",
        "you": "YOU", "your": "YOUR",
        "he": "HE", "she": "SHE", "they": "THEY", "we": "WE",
        # Articles/conjunctions (drop these in ISL)
        "a": "", "an": "", "the": "", "and": "", "or": "", "but": "",
        "is": "", "are": "", "was": "", "were": "", "be": "", "been": "",
        "to": "", "of": "", "in": "", "on": "", "at": "", "for": "",
    }
    
    # Time markers come FIRST in ISL
    TIME_WORDS = {
        "today", "tomorrow", "yesterday", "now", "later", "soon",
        "morning", "evening", "night", "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday", "week", "month", "year",
        "already", "before", "after", "always", "never", "sometimes"
    }
    
    def convert(self, text: str) -> str:
        """Convert English text to ISL gloss notation"""
        if not text:
            return ""
        
        words = text.lower().split()
        
        # Step 1: Separate time words to front
        time_words_found = []
        other_words = []
        for word in words:
            clean = re.sub(r'[^\w]', '', word)
            if clean in self.TIME_WORDS:
                time_words_found.append(clean)
            else:
                other_words.append(clean)
        
        # Step 2: Map to ISL glosses
        reordered = time_words_found + other_words
        glosses = []
        for word in reordered:
            if word in self.GLOSS_MAP:
                gloss = self.GLOSS_MAP[word]
                if gloss:  # Skip empty (dropped words)
                    glosses.append(gloss)
            elif word and len(word) > 1:
                # Unknown word: uppercase it (fingerspell)
                glosses.append(word.upper())
        
        # Step 3: Detect question (ends with ?)
        is_question = text.strip().endswith("?")
        result = " ".join(glosses)
        if is_question and "?" not in result:
            result = result + " ?"
        
        return result if result else text.upper()
    
    def convert_with_spacy(self, text: str) -> str:
        """More accurate conversion using spaCy dependency parsing"""
        if not self.nlp:
            return self.convert(text)  # Fallback to simple version
        
        doc = self.nlp(text)
        
        # Extract time expressions
        time_tokens = [tok for tok in doc if tok.dep_ in ("npadvmod", "advmod") 
                      and tok.lower_ in self.TIME_WORDS]
        
        # Extract main content tokens (skip stopwords that ISL doesn't need)
        isl_skip_pos = {"DET", "AUX", "CCONJ", "SCONJ", "PART"}
        content_tokens = [tok for tok in doc if tok.pos_ not in isl_skip_pos 
                         and tok not in time_tokens]
        
        ordered = time_tokens + content_tokens
        glosses = [self.GLOSS_MAP.get(tok.lower_, tok.text.upper()) for tok in ordered]
        glosses = [g for g in glosses if g]  # Remove empty strings
        
        return " ".join(glosses)
```

---

## SERVICE: `services/avatar_generator.py` — Avatar Generator

```python
import os
import glob
from pathlib import Path

class AvatarGenerator:
    """
    Phase 1: Maps ISL gloss sequences to pre-recorded video clips.
    Falls back to CSS avatar URL (frontend handles rendering).
    """
    
    def __init__(self):
        self.clips_dir = os.getenv("ISL_CLIPS_DIR", "./assets/isl_clips")
        self._clip_index = self._build_index()
    
    def _build_index(self) -> dict:
        """Index all available ISL clip files"""
        index = {}
        if not os.path.exists(self.clips_dir):
            return index
        for f in glob.glob(os.path.join(self.clips_dir, "*.mp4")):
            word = Path(f).stem.upper()
            index[word] = f"/assets/isl_clips/{Path(f).name}"
        return index
    
    def get_avatar_url(self, isl_gloss: str) -> str:
        """
        For Phase 1: Return the first matching clip URL, or empty string for CSS fallback.
        In a real implementation, this would stitch multiple clips together.
        """
        words = isl_gloss.split()
        
        # Try to find a clip for the full sentence (pre-recorded phrases)
        sentence_key = "_".join(words)
        if sentence_key in self._clip_index:
            return self._clip_index[sentence_key]
        
        # Try to find clip for first meaningful word
        for word in words:
            clean_word = word.replace("?", "").replace("!", "").replace("+", "")
            if clean_word in self._clip_index:
                return self._clip_index[clean_word]
        
        # No clip found — frontend will use CSS animated avatar
        return ""
    
    def create_placeholder_clips(self):
        """
        Create placeholder MP4 files for common ISL signs.
        These are colored videos with text — replace with real ISL videos later.
        """
        import cv2
        import numpy as np
        
        common_signs = [
            "HELLO", "BYE", "THANK-YOU", "PLEASE", "SORRY",
            "YES", "NO", "HELP", "WATER", "FOOD", "HOME",
            "INDIA", "SCHOOL", "DOCTOR", "WORK",
            "TODAY", "TOMORROW", "YESTERDAY", "NOW",
            "GO", "COME", "EAT", "DRINK", "SEE", "KNOW",
            "WHAT", "WHO", "WHERE", "WHEN", "WHY", "HOW",
            "I", "YOU", "HE", "SHE", "WE", "THEY",
        ]
        
        os.makedirs(self.clips_dir, exist_ok=True)
        
        for sign in common_signs:
            output_path = os.path.join(self.clips_dir, f"{sign}.mp4")
            if os.path.exists(output_path):
                continue
            
            # Create a 2-second colored video with the sign text
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, 24, (320, 240))
            
            colors = {"HELLO": (0, 200, 100), "SORRY": (0, 100, 255), "HELP": (255, 200, 0)}
            color = colors.get(sign, (50, 100, 200))
            
            for frame_num in range(48):  # 2 seconds at 24fps
                frame = np.full((240, 320, 3), color, dtype=np.uint8)
                
                # Add sign text
                cv2.putText(frame, sign, (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 
                           1.2, (255, 255, 255), 3, cv2.LINE_AA)
                cv2.putText(frame, f"ISL Sign", (20, 160), cv2.FONT_HERSHEY_SIMPLEX,
                           0.6, (200, 200, 200), 1, cv2.LINE_AA)
                
                # Animated "hands" (simple rectangles that move)
                hand_x = int(80 + 60 * abs((frame_num % 24) / 12.0 - 1.0))
                cv2.rectangle(frame, (hand_x, 180), (hand_x+40, 220), (220, 180, 140), -1)
                cv2.rectangle(frame, (240-hand_x, 180), (280-hand_x, 220), (220, 180, 140), -1)
                
                out.write(frame)
            
            out.release()
        
        print(f"Created {len(common_signs)} placeholder ISL clips in {self.clips_dir}")
        self._clip_index = self._build_index()
```

---

## SERVICE: `services/tts_service.py` — Text-to-Speech

```python
import os
import uuid
import asyncio
from gtts import gTTS

LANG_MAP = {
    "hi-IN": "hi", "ta-IN": "ta", "te-IN": "te", "bn-IN": "bn",
    "mr-IN": "mr", "kn-IN": "kn", "ml-IN": "ml", "gu-IN": "gu",
    "en-IN": "en"
}

class TTSService:
    def __init__(self):
        self.output_dir = os.getenv("OUTPUT_DIR", "./outputs")
    
    def generate_audio(self, text: str, language_code: str = "hi-IN") -> str:
        """Generate TTS audio file. Returns URL path."""
        lang = LANG_MAP.get(language_code, "hi")
        filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
        output_path = os.path.join(self.output_dir, filename)
        
        try:
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(output_path)
            return f"/outputs/{filename}"
        except Exception as e:
            print(f"TTS error for {language_code}: {e}")
            return ""
    
    def generate_multi_language(self, text: str, languages: list = None) -> list:
        """Generate audio in multiple languages"""
        if languages is None:
            languages = ["hi-IN", "ta-IN", "te-IN"]
        
        results = []
        lang_names = {
            "hi-IN": "Hindi", "ta-IN": "Tamil", "te-IN": "Telugu",
            "bn-IN": "Bengali", "mr-IN": "Marathi", "en-IN": "English"
        }
        
        for lang_code in languages:
            url = self.generate_audio(text, lang_code)
            if url:
                results.append({
                    "language": lang_names.get(lang_code, lang_code),
                    "language_code": lang_code,
                    "url": url
                })
        
        return results
```

---

## SERVICE: `services/pipeline.py` — Full Video Pipeline

```python
import os
import uuid
import ffmpeg
from services.transcription import TranscriptionService
from services.transcreation import CulturalTranscreationService
from services.isl_grammar import ISLGrammarConverter
from services.avatar_generator import AvatarGenerator
from services.tts_service import TTSService

class VideoProcessingPipeline:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.output_dir = os.getenv("OUTPUT_DIR", "./outputs")
    
    async def process(self, video_path: str) -> dict:
        """End-to-end video processing pipeline"""
        
        # Step 1: Extract audio
        audio_path = os.path.join(self.output_dir, f"{self.job_id}_audio.wav")
        try:
            (ffmpeg
             .input(video_path)
             .output(audio_path, acodec='pcm_s16le', ac=1, ar='16000')
             .overwrite_output()
             .run(quiet=True))
        except Exception as e:
            raise RuntimeError(f"Audio extraction failed: {e}")
        
        # Step 2: Transcription
        transcription_svc = TranscriptionService()
        transcription = transcription_svc.transcribe_file(audio_path)
        
        # Step 3: Cultural transcreation per segment
        transcreation_svc = CulturalTranscreationService()
        grammar_svc = ISLGrammarConverter()
        avatar_svc = AvatarGenerator()
        
        subtitles = []
        for seg in transcription["segments"]:
            if not seg["text"].strip():
                continue
            
            transcreation = await transcreation_svc.transcreate(seg["text"])
            isl_gloss = grammar_svc.convert(transcreation["transcreated_text"])
            avatar_url = avatar_svc.get_avatar_url(isl_gloss)
            
            subtitles.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"],
                "isl_gloss": isl_gloss,
                "avatar_url": avatar_url,
                "emotional_tone": transcreation.get("emotional_tone", "neutral"),
            })
        
        # Step 4: Multi-language audio dubbing
        full_text = transcription["text"]
        tts_svc = TTSService()
        dubbed_audio = tts_svc.generate_multi_language(full_text, ["hi-IN", "ta-IN", "te-IN"])
        
        # Step 5: Copy original video to outputs
        output_video = os.path.join(self.output_dir, f"{self.job_id}_output.mp4")
        import shutil
        shutil.copy(video_path, output_video)
        
        # Clean up temp audio
        try:
            os.unlink(audio_path)
        except:
            pass
        
        return {
            "original_url": f"/outputs/{self.job_id}_output.mp4",
            "isl_overlay_url": "",  # Phase 2: pre-composited ISL overlay
            "subtitles": subtitles,
            "dubbed_audio": dubbed_audio,
            "processing_time_ms": 0,  # TODO: measure actual time
            "full_transcript": full_text,
            "total_segments": len(subtitles),
        }
```

---

## WEBSOCKET HANDLERS: `socket_handlers.py`

```python
import socketio
from services.transcription import TranscriptionService
from services.transcreation import CulturalTranscreationService
from services.isl_grammar import ISLGrammarConverter
from services.avatar_generator import AvatarGenerator

def register_socket_handlers(sio: socketio.AsyncServer):
    
    transcription_svc = TranscriptionService()
    transcreation_svc = CulturalTranscreationService()
    grammar_svc = ISLGrammarConverter()
    avatar_svc = AvatarGenerator()
    
    active_streams: dict = {}  # sid → stream config
    
    @sio.on('connect')
    async def connect(sid, environ):
        print(f"Client connected: {sid}")
        await sio.emit('pipeline_status', {
            'stage': 'idle', 'message': 'Connected', 'progress': 0
        }, to=sid)
    
    @sio.on('disconnect')
    async def disconnect(sid):
        print(f"Client disconnected: {sid}")
        active_streams.pop(sid, None)
    
    @sio.on('start_stream')
    async def start_stream(sid, data):
        active_streams[sid] = {'language': data.get('language', 'hi-IN'), 'sequence': 0}
        await sio.emit('pipeline_status', {
            'stage': 'transcribing', 'message': 'Listening...', 'progress': 10
        }, to=sid)
    
    @sio.on('stop_stream')
    async def stop_stream(sid):
        active_streams.pop(sid, None)
        await sio.emit('pipeline_status', {
            'stage': 'idle', 'message': 'Stream stopped', 'progress': 0
        }, to=sid)
    
    @sio.on('audio_chunk')
    async def handle_audio_chunk(sid, data):
        if sid not in active_streams:
            return
        
        config = active_streams[sid]
        
        try:
            # Update status
            await sio.emit('pipeline_status', {
                'stage': 'transcribing', 'message': 'Transcribing audio...', 'progress': 20
            }, to=sid)
            
            # Transcribe
            transcription = transcription_svc.transcribe_base64_audio(data['audio_base64'])
            text = transcription.get('text', '').strip()
            
            if not text or len(text) < 3:
                return  # Skip empty/noise
            
            await sio.emit('pipeline_status', {
                'stage': 'transcreating', 'message': f'Adapting: "{text[:30]}..."', 'progress': 50
            }, to=sid)
            
            # Transcreation
            transcreation = await transcreation_svc.transcreate(text, config['language'])
            
            await sio.emit('pipeline_status', {
                'stage': 'generating_avatar', 'message': 'Generating ISL...', 'progress': 80
            }, to=sid)
            
            # ISL grammar + avatar
            isl_gloss = grammar_svc.convert(transcreation['transcreated_text'])
            avatar_url = avatar_svc.get_avatar_url(isl_gloss)
            
            # Send result
            await sio.emit('isl_result', {
                'gloss': isl_gloss,
                'emotional_tone': transcreation.get('emotional_tone', 'neutral'),
                'avatar_url': avatar_url,
                'duration_seconds': len(isl_gloss.split()) * 1.2,
                'cultural_notes': transcreation.get('cultural_notes', []),
                'name_signs': transcreation.get('name_signs', {}),
                'emphasis_words': transcreation.get('emphasis_words', []),
                'original_text': text,
            }, to=sid)
            
            await sio.emit('pipeline_status', {
                'stage': 'complete', 'message': 'Done! Listening...', 'progress': 100
            }, to=sid)
            
        except Exception as e:
            await sio.emit('pipeline_status', {
                'stage': 'error', 'message': f'Error: {str(e)[:50]}', 'progress': 0
            }, to=sid)
    
    @sio.on('video_frame')
    async def handle_video_frame(sid, data):
        """Handle video frames for reverse mode (sign-to-speech)"""
        # Phase 1 mock: detect if hands are visible using MediaPipe
        from services.reverse_mode import ReverseModeService
        reverse_svc = ReverseModeService()
        result = reverse_svc.process_frame(data['frame_base64'])
        
        if result['detected_signs']:
            await sio.emit('reverse_result', result, to=sid)
```

---

## SERVICE: `services/reverse_mode.py` — MediaPipe Mock

```python
import base64
import numpy as np
import cv2

class ReverseModeService:
    def __init__(self):
        try:
            import mediapipe as mp
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.7,
            )
            self.mp_available = True
        except ImportError:
            self.mp_available = False
    
    def process_frame(self, frame_base64: str) -> dict:
        """
        Phase 1 mock: Detect hands in frame.
        Returns mock sign detection result.
        """
        try:
            img_bytes = base64.b64decode(frame_base64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception:
            return {"detected_signs": [], "generated_text": "", "audio_url": "", "confidence": 0}
        
        if not self.mp_available or frame is None:
            # Mock response for Phase 1
            return {
                "detected_signs": ["HELLO"],
                "generated_text": "Hello, how are you?",
                "audio_url": "",
                "confidence": 0.75
            }
        
        # Real MediaPipe detection
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if not results.multi_hand_landmarks:
            return {"detected_signs": [], "generated_text": "", "audio_url": "", "confidence": 0}
        
        # Phase 1: Return mock signs when hands detected
        # Phase 2: This will be replaced with actual sign classification model
        mock_signs = ["HELLO", "THANK-YOU", "PLEASE"]
        return {
            "detected_signs": mock_signs[:1],
            "generated_text": "Hello! (Sign detected — Phase 1 mock)",
            "audio_url": "",
            "confidence": 0.70,
            "hand_count": len(results.multi_hand_landmarks),
            "note": "Phase 1: Using mock sign classification. Real model in Phase 2."
        }
```

---

## STARTUP SCRIPT: `setup.py`

Create this utility to initialize the project:

```python
"""Run this once to set up the local environment"""
import os
import subprocess

print("=== Samvad AI Local Setup ===")

# Create directories
dirs = ["uploads", "outputs", "assets/isl_clips"]
for d in dirs:
    os.makedirs(d, exist_ok=True)
    print(f"✓ Created {d}/")

# Create placeholder ISL clips
print("\nCreating placeholder ISL clips...")
try:
    from services.avatar_generator import AvatarGenerator
    ag = AvatarGenerator()
    ag.create_placeholder_clips()
    print("✓ ISL clips created")
except Exception as e:
    print(f"⚠ Could not create clips (install opencv first): {e}")

# Check Whisper
print("\nChecking Whisper...")
try:
    import whisper
    print("✓ Whisper available")
except ImportError:
    print("✗ Install whisper: pip install openai-whisper")

# Check Anthropic key
key = os.getenv("ANTHROPIC_API_KEY", "")
if key:
    print(f"✓ ANTHROPIC_API_KEY set ({key[:8]}...)")
else:
    print("✗ Set ANTHROPIC_API_KEY in .env file!")

print("\n=== Setup complete. Run: uvicorn main:app --reload --port 8000 ===")
```

---

## WHAT TO CHECK BEFORE CONSIDERING BACKEND DONE

- [ ] `uvicorn main:app --reload` starts without errors on port 8000
- [ ] `GET /api/health` returns 200 with service status
- [ ] `GET /api/languages` returns the 9 language options
- [ ] `POST /api/text-to-isl` with `{"text": "Hello", "language": "hi-IN"}` returns ISL result
- [ ] `POST /api/process-video` with a real MP4 file returns full pipeline result
- [ ] WebSocket connection from frontend shows "Connected" in logs
- [ ] `audio_chunk` WebSocket event triggers full pipeline and returns `isl_result`
- [ ] ISL clips are created in `assets/isl_clips/`
- [ ] `.env` file has `ANTHROPIC_API_KEY` set and Claude API is reachable
- [ ] All error cases return proper HTTP error codes with descriptive messages