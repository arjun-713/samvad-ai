"""Text-to-ISL API route — Flow 1"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.transcreation import CulturalTranscreationService
from services.isl_grammar import ISLGrammarConverter
from services.avatar_generator import AvatarGenerator

router = APIRouter()

transcreator = CulturalTranscreationService()
isl_converter = ISLGrammarConverter()
avatar = AvatarGenerator()


class TextToISLRequest(BaseModel):
    text: str
    language: str = "hi-IN"


@router.post("/api/text-to-isl")
async def text_to_isl(request: TextToISLRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    if len(request.text) > 500:
        raise HTTPException(status_code=400, detail="Text too long (max 500 characters)")

    try:
        # Step 1: Cultural transcreation via Claude
        transcreation = await transcreator.transcreate(
            request.text, request.language
        )

        adapted_text = transcreation.get("transcreated_text", request.text)

        # Step 2: Convert to ISL grammar/gloss
        isl_gloss = isl_converter.convert(adapted_text)

        # Step 3: Get avatar clip URL
        avatar_url = avatar.get_avatar_url(isl_gloss)

        return {
            "gloss": isl_gloss,
            "emotional_tone": transcreation.get("emotional_tone", "neutral"),
            "avatar_url": avatar_url,
            "duration_seconds": max(len(isl_gloss.split()) * 0.8, 2.0),
            "cultural_notes": transcreation.get("cultural_notes", []),
            "name_signs": transcreation.get("name_signs", {}),
            "emphasis_words": transcreation.get("emphasis_words", []),
        }

    except Exception as e:
        print(f"Text-to-ISL error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
