from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

from services.s3 import S3Service
from services.transcribe import TranscribeService
from models.schemas import TranscribeResponse, ErrorResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize services
s3_service = S3Service()
transcribe_service = TranscribeService()

app = FastAPI(
    title="Samvad AI Backend",
    description="Sign language interpretation API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Samvad AI Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint for frontend connectivity test"""
    return {
        "status": "Samvad Backend is alive",
        "service": "healthy",
        "timestamp": "2026-02-25"
    }

@app.get("/api/status")
def get_status():
    """Get detailed system status"""
    return {
        "backend": "operational",
        "aws_configured": bool(os.getenv("AWS_ACCESS_KEY_ID")),
        "services": {
            "transcribe": "ready",
            "polly": "ready",
            "bedrock": "ready"
        }
    }

@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (WAV/MP3)"),
    language_code: str = Form(default='en-US', description="Language code (e.g., en-US, hi-IN, ta-IN)")
):
    """
    Transcribe audio file to text using Amazon Transcribe
    
    - **audio**: Audio file upload (WAV or MP3 format)
    - **language_code**: Language code for transcription (default: en-US)
    
    Returns transcript text and metadata
    """
    try:
        logger.info(f"Received transcription request for language: {language_code}")
        
        # Validate file type
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Read file content
        file_content = await audio.read()
        
        # Upload to S3
        logger.info(f"Uploading audio file to S3: {audio.filename}")
        s3_uri = s3_service.upload_audio_file(file_content, audio.filename)
        
        # Transcribe audio
        logger.info(f"Starting transcription for: {s3_uri}")
        result = transcribe_service.transcribe_audio(s3_uri, language_code)
        
        # Return response
        return TranscribeResponse(
            transcript=result['transcript'],
            language_code=result['language_code'],
            s3_uri=s3_uri,
            job_name=result['job_name']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in transcription endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
