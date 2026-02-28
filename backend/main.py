from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional
import boto3
import json
import os
import uuid
import time
import base64

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Samvad AI Backend",
    description="Sign language interpretation API powered by AWS",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# AWS Clients (lazy-initialised so the app starts even without creds)
# -------------------------------------------------------------------
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "samvad-audio-uploads-dev")

def get_s3_client():
    return boto3.client("s3", region_name=AWS_REGION)

def get_transcribe_client():
    return boto3.client("transcribe", region_name=AWS_REGION)

def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

def get_polly_client():
    return boto3.client("polly", region_name=AWS_REGION)


# -------------------------------------------------------------------
# Polly Voice Mapping – Indian languages to best available voices
# -------------------------------------------------------------------
POLLY_VOICE_MAP = {
    "en": {"voice_id": "Kajal", "language_code": "en-IN", "engine": "neural"},
    "hi": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "bn": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "te": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "mr": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "ta": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "gu": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "kn": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "ml": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "or": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "pa": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "as": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
    "ur": {"voice_id": "Kajal", "language_code": "hi-IN", "engine": "neural"},
}

TRANSCRIBE_LANGUAGE_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "bn": "bn-IN",
    "te": "te-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "ur": "ur-IN",
}


# -------------------------------------------------------------------
# Pydantic Models
# -------------------------------------------------------------------
class TranslateRequest(BaseModel):
    text: str
    source_language: str = "en"

class SynthesizeRequest(BaseModel):
    text: str
    target_language: str = "hi"

class SignToSpeechRequest(BaseModel):
    gesture_description: str
    target_language: str = "hi"


# -------------------------------------------------------------------
# 1. Root / Health / Status
# -------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "Samvad AI Backend API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": [
            "/api/health",
            "/api/status",
            "/api/transcribe",
            "/api/translate-to-isl",
            "/api/process-audio",
            "/api/synthesize-audio",
            "/api/sign-to-speech",
        ],
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "Samvad Backend is alive",
        "service": "healthy",
        "version": "2.0.0",
    }


@app.get("/api/status")
def get_status():
    aws_configured = bool(os.getenv("AWS_ACCESS_KEY_ID"))
    return {
        "backend": "operational",
        "aws_configured": aws_configured,
        "services": {
            "transcribe": "ready" if aws_configured else "not_configured",
            "polly": "ready" if aws_configured else "not_configured",
            "bedrock": "ready" if aws_configured else "not_configured",
            "s3": "ready" if aws_configured else "not_configured",
        },
    }


# -------------------------------------------------------------------
# 2. POST /api/transcribe — Audio → Text (Amazon Transcribe)
# -------------------------------------------------------------------
@app.post("/api/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en"),
):
    """Upload audio file → S3 → Amazon Transcribe → transcript text."""
    try:
        s3 = get_s3_client()
        transcribe = get_transcribe_client()

        # Generate unique S3 key
        file_ext = audio.filename.split(".")[-1] if audio.filename else "wav"
        s3_key = f"uploads/{uuid.uuid4()}.{file_ext}"

        # Upload to S3
        audio_bytes = await audio.read()
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=audio_bytes,
            ContentType=audio.content_type or "audio/wav",
        )

        # Determine media format
        media_format = file_ext.lower()
        if media_format not in ["mp3", "mp4", "wav", "flac", "ogg", "amr", "webm"]:
            media_format = "wav"

        # Get Transcribe language code
        transcribe_lang = TRANSCRIBE_LANGUAGE_MAP.get(language, "en-IN")

        # Start transcription job
        job_name = f"samvad-{uuid.uuid4().hex[:8]}-{int(time.time())}"
        s3_uri = f"s3://{S3_BUCKET}/{s3_key}"

        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": s3_uri},
            MediaFormat=media_format,
            LanguageCode=transcribe_lang,
            OutputBucketName=S3_BUCKET,
            OutputKey=f"transcripts/{job_name}.json",
        )

        # Poll for completion (max 60s for short clips)
        for _ in range(60):
            result = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            status = result["TranscriptionJob"]["TranscriptionJobStatus"]
            if status == "COMPLETED":
                break
            elif status == "FAILED":
                reason = result["TranscriptionJob"].get("FailureReason", "Unknown")
                raise HTTPException(status_code=500, detail=f"Transcription failed: {reason}")
            time.sleep(1)
        else:
            raise HTTPException(status_code=504, detail="Transcription timed out")

        # Fetch transcript from S3
        transcript_obj = s3.get_object(
            Bucket=S3_BUCKET,
            Key=f"transcripts/{job_name}.json",
        )
        transcript_data = json.loads(transcript_obj["Body"].read().decode("utf-8"))
        transcript_text = transcript_data["results"]["transcripts"][0]["transcript"]

        return {
            "transcript": transcript_text,
            "language_detected": transcribe_lang,
            "job_name": job_name,
            "status": "success",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")


# -------------------------------------------------------------------
# 3. POST /api/translate-to-isl — Text → ISL Gloss (Amazon Bedrock)
# -------------------------------------------------------------------
ISL_SYSTEM_PROMPT = """You are an expert Indian Sign Language (ISL) interpreter and linguist. Your task is to convert spoken language text into ISL Gloss notation.

ISL uses Topic-Comment syntax (different from English Subject-Verb-Object). Follow these rules:
1. Reorder words into ISL grammar: Topic first, then Comment
2. Remove articles (a, an, the), prepositions where ISL uses spatial reference
3. Convert verb tenses to time markers (PAST, FUTURE, NOW)
4. Handle idioms culturally — translate the meaning, not the literal words
5. For Indian cultural references, keep them as-is in the gloss
6. Mark emotional tone and facial expressions needed

You MUST respond with ONLY valid JSON in exactly this format:
{
  "isl_gloss": ["TOKEN1", "TOKEN2", "TOKEN3"],
  "emotional_tone": "neutral|happy|sad|angry|surprised|questioning",
  "confidence": 0.85,
  "notes": "Brief explanation of translation choices"
}

Examples:
- "I am going to school" → {"isl_gloss": ["SCHOOL", "I", "GO", "NOW"], "emotional_tone": "neutral", "confidence": 0.9, "notes": "Standard topic-comment reorder"}
- "What is your name?" → {"isl_gloss": ["YOUR", "NAME", "WHAT", "?-FACE"], "emotional_tone": "questioning", "confidence": 0.95, "notes": "Question marker added"}
"""

@app.post("/api/translate-to-isl")
async def translate_to_isl(request: TranslateRequest):
    """Convert text to ISL Gloss using Amazon Bedrock (Claude)."""
    try:
        bedrock = get_bedrock_client()

        user_message = f"Convert this {request.source_language} text to ISL Gloss:\n\n\"{request.text}\""

        # Call Bedrock Claude
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "system": ISL_SYSTEM_PROMPT,
            "messages": [
                {"role": "user", "content": user_message}
            ],
        })

        # Try Claude 3.5 Sonnet first, fallback to Claude 3 Sonnet
        model_id = "anthropic.claude-3-5-sonnet-20241022-v2:0"
        try:
            response = bedrock.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )
        except Exception:
            # Fallback to Claude 3 Sonnet
            model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
            response = bedrock.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )

        response_body = json.loads(response["body"].read())
        assistant_text = response_body["content"][0]["text"]

        # Parse the JSON response from Claude
        # Strip markdown code fences if present
        clean_text = assistant_text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("\n", 1)[1]
            clean_text = clean_text.rsplit("```", 1)[0]
        isl_result = json.loads(clean_text.strip())

        return {
            "isl_gloss": isl_result.get("isl_gloss", []),
            "emotional_tone": isl_result.get("emotional_tone", "neutral"),
            "confidence": isl_result.get("confidence", 0.8),
            "notes": isl_result.get("notes", ""),
            "original_text": request.text,
            "model_used": model_id,
            "status": "success",
        }

    except json.JSONDecodeError:
        # If Claude didn't return valid JSON, return a best-effort response
        return {
            "isl_gloss": request.text.upper().split(),
            "emotional_tone": "neutral",
            "confidence": 0.5,
            "notes": "Fallback: word-level gloss (Claude response was not valid JSON)",
            "original_text": request.text,
            "status": "partial",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ISL translation error: {str(e)}")


# -------------------------------------------------------------------
# 4. POST /api/synthesize-audio — Text → Dubbed Audio (Amazon Polly)
# -------------------------------------------------------------------
@app.post("/api/synthesize-audio")
async def synthesize_audio(request: SynthesizeRequest):
    """Convert text to speech using Amazon Polly Neural TTS."""
    try:
        polly = get_polly_client()

        voice_config = POLLY_VOICE_MAP.get(request.target_language, POLLY_VOICE_MAP["hi"])

        response = polly.synthesize_speech(
            Text=request.text,
            OutputFormat="mp3",
            VoiceId=voice_config["voice_id"],
            LanguageCode=voice_config["language_code"],
            Engine=voice_config["engine"],
        )

        audio_stream = response["AudioStream"].read()
        audio_base64 = base64.b64encode(audio_stream).decode("utf-8")

        return {
            "audio_base64": audio_base64,
            "content_type": "audio/mpeg",
            "voice_id": voice_config["voice_id"],
            "language_code": voice_config["language_code"],
            "text_length": len(request.text),
            "status": "success",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")


# -------------------------------------------------------------------
# 5. POST /api/process-audio — End-to-End Pipeline
#    Audio → Transcript → ISL Gloss → Dubbed Audio
# -------------------------------------------------------------------
@app.post("/api/process-audio")
async def process_audio(
    audio: UploadFile = File(...),
    source_language: str = Form("en"),
    target_language: str = Form("hi"),
):
    """Full pipeline: audio upload → transcription → ISL Gloss → dubbed audio."""
    try:
        results = {}

        # Step 1: Transcribe
        s3 = get_s3_client()
        transcribe = get_transcribe_client()

        file_ext = audio.filename.split(".")[-1] if audio.filename else "wav"
        s3_key = f"uploads/{uuid.uuid4()}.{file_ext}"

        audio_bytes = await audio.read()
        s3.put_object(
            Bucket=S3_BUCKET, Key=s3_key, Body=audio_bytes,
            ContentType=audio.content_type or "audio/wav",
        )

        media_format = file_ext.lower()
        if media_format not in ["mp3", "mp4", "wav", "flac", "ogg", "amr", "webm"]:
            media_format = "wav"

        transcribe_lang = TRANSCRIBE_LANGUAGE_MAP.get(source_language, "en-IN")
        job_name = f"samvad-{uuid.uuid4().hex[:8]}-{int(time.time())}"
        s3_uri = f"s3://{S3_BUCKET}/{s3_key}"

        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": s3_uri},
            MediaFormat=media_format,
            LanguageCode=transcribe_lang,
            OutputBucketName=S3_BUCKET,
            OutputKey=f"transcripts/{job_name}.json",
        )

        for _ in range(60):
            result = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            status = result["TranscriptionJob"]["TranscriptionJobStatus"]
            if status == "COMPLETED":
                break
            elif status == "FAILED":
                reason = result["TranscriptionJob"].get("FailureReason", "Unknown")
                raise HTTPException(status_code=500, detail=f"Transcription failed: {reason}")
            time.sleep(1)
        else:
            raise HTTPException(status_code=504, detail="Transcription timed out")

        transcript_obj = s3.get_object(Bucket=S3_BUCKET, Key=f"transcripts/{job_name}.json")
        transcript_data = json.loads(transcript_obj["Body"].read().decode("utf-8"))
        transcript_text = transcript_data["results"]["transcripts"][0]["transcript"]
        results["transcript"] = transcript_text

        # Step 2: ISL Gloss via Bedrock
        bedrock = get_bedrock_client()
        user_msg = f"Convert this {source_language} text to ISL Gloss:\n\n\"{transcript_text}\""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "system": ISL_SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": user_msg}],
        })

        model_id = "anthropic.claude-3-5-sonnet-20241022-v2:0"
        try:
            bedrock_resp = bedrock.invoke_model(
                modelId=model_id, contentType="application/json",
                accept="application/json", body=body,
            )
        except Exception:
            model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
            bedrock_resp = bedrock.invoke_model(
                modelId=model_id, contentType="application/json",
                accept="application/json", body=body,
            )

        resp_body = json.loads(bedrock_resp["body"].read())
        assistant_text = resp_body["content"][0]["text"]

        clean = assistant_text.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1]
            clean = clean.rsplit("```", 1)[0]

        try:
            isl_result = json.loads(clean.strip())
        except json.JSONDecodeError:
            isl_result = {
                "isl_gloss": transcript_text.upper().split(),
                "emotional_tone": "neutral",
                "confidence": 0.5,
                "notes": "Fallback gloss",
            }

        results["isl_gloss"] = isl_result.get("isl_gloss", [])
        results["emotional_tone"] = isl_result.get("emotional_tone", "neutral")
        results["confidence"] = isl_result.get("confidence", 0.8)
        results["gloss_notes"] = isl_result.get("notes", "")

        # Step 3: Polly dubbed audio
        polly = get_polly_client()
        voice_config = POLLY_VOICE_MAP.get(target_language, POLLY_VOICE_MAP["hi"])

        polly_resp = polly.synthesize_speech(
            Text=transcript_text,
            OutputFormat="mp3",
            VoiceId=voice_config["voice_id"],
            LanguageCode=voice_config["language_code"],
            Engine=voice_config["engine"],
        )

        audio_stream = polly_resp["AudioStream"].read()
        results["dubbed_audio_base64"] = base64.b64encode(audio_stream).decode("utf-8")
        results["dubbed_voice"] = voice_config["voice_id"]
        results["dubbed_language"] = voice_config["language_code"]
        results["model_used"] = model_id
        results["status"] = "success"

        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


# -------------------------------------------------------------------
# 6. POST /api/sign-to-speech — Reverse / Bi-directional Mode
# -------------------------------------------------------------------
@app.post("/api/sign-to-speech")
async def sign_to_speech(request: SignToSpeechRequest):
    """Convert ISL gesture description → spoken audio (reverse mode)."""
    try:
        # Use Bedrock to interpret the gesture description into natural speech
        bedrock = get_bedrock_client()

        system_prompt = """You are a translator that converts Indian Sign Language (ISL) gesture descriptions or ISL Gloss sequences into natural spoken language. 
Given a description of sign gestures or a gloss sequence, produce a natural, grammatically correct sentence in the specified language.
Respond with ONLY the natural language sentence, nothing else."""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 512,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": f"Convert this ISL gesture/gloss to natural {request.target_language} speech:\n\n{request.gesture_description}"}
            ],
        })

        model_id = "anthropic.claude-3-5-sonnet-20241022-v2:0"
        try:
            response = bedrock.invoke_model(
                modelId=model_id, contentType="application/json",
                accept="application/json", body=body,
            )
        except Exception:
            model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
            response = bedrock.invoke_model(
                modelId=model_id, contentType="application/json",
                accept="application/json", body=body,
            )

        resp_body = json.loads(response["body"].read())
        natural_text = resp_body["content"][0]["text"].strip()

        # Synthesize the natural text to audio via Polly
        polly = get_polly_client()
        voice_config = POLLY_VOICE_MAP.get(request.target_language, POLLY_VOICE_MAP["hi"])

        polly_resp = polly.synthesize_speech(
            Text=natural_text,
            OutputFormat="mp3",
            VoiceId=voice_config["voice_id"],
            LanguageCode=voice_config["language_code"],
            Engine=voice_config["engine"],
        )

        audio_stream = polly_resp["AudioStream"].read()
        audio_base64 = base64.b64encode(audio_stream).decode("utf-8")

        return {
            "natural_text": natural_text,
            "audio_base64": audio_base64,
            "content_type": "audio/mpeg",
            "voice_id": voice_config["voice_id"],
            "gesture_input": request.gesture_description,
            "status": "success",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sign-to-speech error: {str(e)}")


# -------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
