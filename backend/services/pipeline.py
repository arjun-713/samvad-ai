"""Full video processing pipeline — orchestrates all services for Flow 3 (Video Upload)"""
import os
import uuid
import time
import subprocess
from pathlib import Path

from services.transcription import TranscriptionService
from services.transcreation import CulturalTranscreationService
from services.isl_grammar import ISLGrammarConverter
from services.avatar_generator import AvatarGenerator
from services.tts_service import TTSService


class PipelineService:
    def __init__(self):
        self.transcriber = TranscriptionService()
        self.transcreator = CulturalTranscreationService()
        self.isl_converter = ISLGrammarConverter()
        self.avatar = AvatarGenerator()
        self.tts = TTSService()
        self.output_dir = os.getenv("OUTPUT_DIR", "./outputs")
        self.upload_dir = os.getenv("UPLOAD_DIR", "./uploads")

    def _extract_audio(self, video_path: str) -> str:
        """Extract audio from video using ffmpeg"""
        audio_path = video_path.rsplit(".", 1)[0] + ".wav"
        try:
            subprocess.run([
                "ffmpeg", "-i", video_path,
                "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                audio_path, "-y"
            ], capture_output=True, check=True, timeout=120)
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"ffmpeg extraction failed: {e}. Using video file directly.")
            return video_path
        return audio_path

    async def process_video(self, video_path: str, filename: str = "",
                            status_callback=None) -> dict:
        """
        Full pipeline:
        video → extract audio → Whisper transcribe → Claude transcreate →
        ISL grammar → avatar lookup → gTTS dub → return result
        """
        start_time = time.time()

        # Step 1: Extract audio
        if status_callback:
            await status_callback("transcribing", "Extracting audio...", 10)

        audio_path = self._extract_audio(video_path)

        # Step 2: Transcribe with Whisper
        if status_callback:
            await status_callback("transcribing", "Transcribing audio with Whisper...", 25)

        transcription = self.transcriber.transcribe_file(audio_path)
        segments = transcription.get("segments", [])
        full_text = transcription.get("text", "")

        # Step 3: Transcreate each segment
        if status_callback:
            await status_callback("transcreating", "Cultural adaptation...", 40)

        subtitles = []
        for i, seg in enumerate(segments):
            tcr = await self.transcreator.transcreate(seg["text"])
            adapted_text = tcr.get("transcreated_text", seg["text"])

            # Step 4: Convert to ISL gloss
            isl_gloss = self.isl_converter.convert(adapted_text)

            # Step 5: Get avatar URL
            avatar_url = self.avatar.get_avatar_url(isl_gloss)

            subtitles.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"],
                "isl_gloss": isl_gloss,
                "avatar_url": avatar_url,
                "emotional_tone": tcr.get("emotional_tone", "neutral"),
            })

            if status_callback and i % 3 == 0:
                pct = 40 + (i / max(len(segments), 1)) * 30
                await status_callback("generating_avatar", f"Processing segment {i+1}/{len(segments)}", pct)

        # Step 6: Generate dubbed audio
        if status_callback:
            await status_callback("dubbing", "Generating dubbed audio...", 80)

        dubbed_audio = self.tts.generate_multi_language(full_text, ["hi-IN", "ta-IN", "te-IN"])

        # Done
        processing_time = int((time.time() - start_time) * 1000)

        if status_callback:
            await status_callback("complete", "Processing complete!", 100)

        # Build video URL
        video_url = f"/outputs/{Path(video_path).name}" if os.path.exists(video_path) else ""

        return {
            "original_url": video_url,
            "isl_overlay_url": "",
            "subtitles": subtitles,
            "dubbed_audio": dubbed_audio,
            "processing_time_ms": processing_time,
            "full_transcript": full_text,
            "total_segments": len(segments),
        }
