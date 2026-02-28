from fastapi import APIRouter, HTTPException
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
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    mode = os.getenv("ISL_CLIPS_MODE", "local")
    gloss = convert_to_isl_gloss(req.text)

    if not gloss:
        return TextToISLResponse(gloss=[], clips=[], coverage=0.0, mode=mode)

    clips_raw = resolve_clips(gloss, mode)
    found_count = sum(1 for c in clips_raw if c["found"])
    coverage = round(found_count / len(clips_raw), 2) if clips_raw else 0.0

    return TextToISLResponse(
        gloss=gloss,
        clips=[ClipItem(**c) for c in clips_raw],
        coverage=coverage,
        mode=mode,
    )
