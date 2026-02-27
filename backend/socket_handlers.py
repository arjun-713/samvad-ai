"""WebSocket event handlers for real-time live stream and reverse mode"""
import socketio
import asyncio
import traceback

from services.transcription import TranscriptionService
from services.transcreation import CulturalTranscreationService
from services.isl_grammar import ISLGrammarConverter
from services.avatar_generator import AvatarGenerator
from services.reverse_mode import ReverseModeService
from services.tts_service import TTSService


def register_handlers(sio: socketio.AsyncServer):
    transcriber = TranscriptionService()
    transcreator = CulturalTranscreationService()
    isl_converter = ISLGrammarConverter()
    avatar = AvatarGenerator()
    reverse_service = ReverseModeService()
    tts = TTSService()

    active_streams = {}

    @sio.event
    async def connect(sid, environ):
        print(f"🔌 Client connected: {sid}")
        await sio.emit("pipeline_status", {
            "stage": "idle", "message": "Connected", "progress": 0
        }, room=sid)

    @sio.event
    async def disconnect(sid):
        print(f"❌ Client disconnected: {sid}")
        active_streams.pop(sid, None)

    @sio.event
    async def start_stream(sid, data):
        """Start a live stream session"""
        language = data.get("language", "hi-IN") if data else "hi-IN"
        active_streams[sid] = {"language": language, "sequence": 0}
        print(f"▶ Stream started for {sid} (lang={language})")
        await sio.emit("pipeline_status", {
            "stage": "idle", "message": "Stream started, waiting for audio...", "progress": 0
        }, room=sid)

    @sio.event
    async def stop_stream(sid, data=None):
        """Stop a live stream session"""
        active_streams.pop(sid, None)
        print(f"⏹ Stream stopped for {sid}")
        await sio.emit("pipeline_status", {
            "stage": "idle", "message": "Stream stopped", "progress": 0
        }, room=sid)

    @sio.event
    async def audio_chunk(sid, data):
        """Process a 3-second audio chunk from live stream"""
        if sid not in active_streams:
            return

        audio_base64 = data.get("audio_base64", "")
        if not audio_base64:
            return

        try:
            # Step 1: Transcribe
            await sio.emit("pipeline_status", {
                "stage": "transcribing", "message": "Listening...", "progress": 20
            }, room=sid)

            transcription = transcriber.transcribe_base64_audio(audio_base64)
            text = transcription.get("text", "").strip()

            if not text:
                await sio.emit("pipeline_status", {
                    "stage": "idle", "message": "No speech detected", "progress": 0
                }, room=sid)
                return

            # Step 2: Transcreate
            await sio.emit("pipeline_status", {
                "stage": "transcreating", "message": "Adapting...", "progress": 50
            }, room=sid)

            language = active_streams[sid].get("language", "hi-IN")
            tcr = await transcreator.transcreate(text, language)
            adapted_text = tcr.get("transcreated_text", text)

            # Step 3: ISL grammar
            await sio.emit("pipeline_status", {
                "stage": "generating_avatar", "message": "Generating ISL...", "progress": 75
            }, room=sid)

            isl_gloss = isl_converter.convert(adapted_text)
            avatar_url = avatar.get_avatar_url(isl_gloss)

            # Step 4: Emit ISL result
            await sio.emit("isl_result", {
                "gloss": isl_gloss,
                "emotional_tone": tcr.get("emotional_tone", "neutral"),
                "avatar_url": avatar_url,
                "duration_seconds": max(len(isl_gloss.split()) * 0.8, 2.0),
                "cultural_notes": tcr.get("cultural_notes", []),
                "name_signs": tcr.get("name_signs", {}),
                "emphasis_words": tcr.get("emphasis_words", []),
            }, room=sid)

            await sio.emit("pipeline_status", {
                "stage": "complete", "message": f"'{text[:50]}...' processed", "progress": 100
            }, room=sid)

        except Exception as e:
            print(f"Audio chunk error: {traceback.format_exc()}")
            await sio.emit("pipeline_status", {
                "stage": "error", "message": f"Error: {str(e)[:100]}", "progress": 0
            }, room=sid)

    @sio.event
    async def video_frame(sid, data):
        """Process a video frame for reverse mode (sign → text)"""
        frame_base64 = data.get("frame_base64", "")
        if not frame_base64:
            return

        try:
            result = reverse_service.process_frame(frame_base64)
            signs = result.get("detected_signs", [])

            if signs:
                generated_text = reverse_service.signs_to_text(signs)

                # Generate TTS audio
                audio_result = tts.generate_audio(generated_text, "en-IN") if generated_text else {}

                await sio.emit("reverse_result", {
                    "detected_signs": signs,
                    "generated_text": generated_text,
                    "audio_url": audio_result.get("url", ""),
                    "confidence": result.get("confidence", 0.0),
                    "hand_count": result.get("hand_count", 0),
                }, room=sid)

        except Exception as e:
            print(f"Video frame error: {e}")
