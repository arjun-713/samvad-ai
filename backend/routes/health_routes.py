"""Health and system routes"""
from fastapi import APIRouter

router = APIRouter()

SUPPORTED_LANGUAGES = [
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


@router.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": "local",
        "services": {
            "whisper": "available",
            "transcreation": "available",
            "isl_grammar": "available",
            "avatar": "available",
            "tts": "available",
            "reverse_mode": "available",
        }
    }


@router.get("/api/languages")
async def get_languages():
    return SUPPORTED_LANGUAGES


@router.get("/api/status")
async def get_status():
    return {
        "active_streams": 0,
        "processed_today": 0,
        "uptime_seconds": 0,
    }
