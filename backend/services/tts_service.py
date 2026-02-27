"""Text-to-Speech service using gTTS (Phase 1 local)"""
import os
import uuid
from pathlib import Path
from gtts import gTTS


class TTSService:
    def __init__(self):
        self.output_dir = os.getenv("OUTPUT_DIR", "./outputs")
        os.makedirs(os.path.join(self.output_dir, "audio"), exist_ok=True)

    # gTTS language codes for Indian languages
    LANG_MAP = {
        "hi-IN": "hi", "en-IN": "en", "ta-IN": "ta",
        "te-IN": "te", "bn-IN": "bn", "mr-IN": "mr",
        "kn-IN": "kn", "ml-IN": "ml", "gu-IN": "gu",
    }

    LANG_NAMES = {
        "hi-IN": "Hindi", "en-IN": "English", "ta-IN": "Tamil",
        "te-IN": "Telugu", "bn-IN": "Bengali", "mr-IN": "Marathi",
        "kn-IN": "Kannada", "ml-IN": "Malayalam", "gu-IN": "Gujarati",
    }

    def generate_audio(self, text: str, language: str = "hi-IN") -> dict:
        """Generate TTS audio and return URL"""
        lang_code = self.LANG_MAP.get(language, "hi")
        filename = f"tts_{uuid.uuid4().hex[:8]}_{lang_code}.mp3"
        filepath = os.path.join(self.output_dir, "audio", filename)

        try:
            tts = gTTS(text=text, lang=lang_code, slow=False)
            tts.save(filepath)
        except Exception as e:
            print(f"TTS error for {language}: {e}")
            # Fallback to English
            tts = gTTS(text=text, lang="en", slow=False)
            tts.save(filepath)

        return {
            "language": self.LANG_NAMES.get(language, language),
            "language_code": language,
            "url": f"/outputs/audio/{filename}",
            "filepath": filepath,
        }

    def generate_multi_language(self, text: str, languages: list[str] = None) -> list[dict]:
        """Generate dubbed audio in multiple languages"""
        if languages is None:
            languages = ["hi-IN", "ta-IN", "te-IN"]

        results = []
        for lang in languages:
            try:
                result = self.generate_audio(text, lang)
                results.append(result)
            except Exception as e:
                print(f"Skipping {lang}: {e}")
        return results
