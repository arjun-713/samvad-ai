"""Cultural transcreation service using Claude API (Phase 1: direct Anthropic SDK)"""
import os
import json
import anthropic


class CulturalTranscreationService:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.client = anthropic.Anthropic(api_key=api_key) if api_key else None
        self.model = "claude-3-5-sonnet-20241022"

    async def transcreate(self, text: str, source_language: str = "hi-IN", context: str = "general") -> dict:
        """
        Perform cultural transcreation for ISL.
        Returns structured JSON with ISL-adapted content.
        """
        # If no API key, return a mock/passthrough result
        if not self.client:
            return self._mock_transcreation(text)

        lang_name = {
            "hi-IN": "Hindi", "en-IN": "English (Indian)", "ta-IN": "Tamil",
            "te-IN": "Telugu", "bn-IN": "Bengali", "mr-IN": "Marathi",
            "kn-IN": "Kannada", "ml-IN": "Malayalam", "gu-IN": "Gujarati",
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

        try:
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

            return json.loads(response_text)

        except json.JSONDecodeError:
            return self._mock_transcreation(text)
        except Exception as e:
            print(f"Transcreation error: {e}")
            return self._mock_transcreation(text)

    def _mock_transcreation(self, text: str) -> dict:
        """Fallback when Claude API is not available"""
        return {
            "transcreated_text": text,
            "emotional_tone": "neutral",
            "cultural_notes": ["No cultural adaptation (API key not configured or fallback mode)"],
            "name_signs": {},
            "emphasis_words": [],
            "visual_metaphors": {}
        }
