"""Transcription service using OpenAI Whisper (local, Phase 1)"""
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
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
