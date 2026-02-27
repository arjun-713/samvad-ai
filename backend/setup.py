"""One-time setup script for Samvad AI backend"""
import os
import sys


def main():
    print("=" * 50)
    print("  Samvad AI — Backend Setup")
    print("=" * 50)

    # 1. Create directories
    dirs = ["uploads", "outputs", "outputs/audio", "assets", "assets/isl_clips"]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        print(f"  ✓ Directory: {d}")

    # 2. Check .env
    if not os.path.exists(".env"):
        print("  ⚠ Missing .env file — creating from template")
        with open(".env", "w") as f:
            f.write("ANTHROPIC_API_KEY=\nENVIRONMENT=local\nUPLOAD_DIR=./uploads\nOUTPUT_DIR=./outputs\nISL_CLIPS_DIR=./assets/isl_clips\nWHISPER_MODEL=tiny\n")
    else:
        print("  ✓ .env exists")

    # 3. Check dependencies
    deps = {
        "fastapi": "FastAPI",
        "whisper": "Whisper (ASR)",
        "anthropic": "Anthropic API",
        "gtts": "gTTS",
        "cv2": "OpenCV",
        "spacy": "spaCy",
        "mediapipe": "MediaPipe",
        "socketio": "Socket.IO",
    }
    print("\n  Dependency Check:")
    for module, name in deps.items():
        try:
            __import__(module)
            print(f"    ✓ {name}")
        except ImportError:
            print(f"    ✗ {name} — pip install required")

    # 4. Check spaCy model
    try:
        import spacy
        spacy.load("en_core_web_sm")
        print("    ✓ spaCy model (en_core_web_sm)")
    except Exception:
        print("    ✗ spaCy model — run: python -m spacy download en_core_web_sm")

    # 5. Generate placeholder ISL clips
    print("\n  Generating placeholder ISL clips...")
    try:
        from services.avatar_generator import AvatarGenerator
        gen = AvatarGenerator()
        gen.create_placeholder_clips()
        print("  ✓ Placeholder clips created")
    except Exception as e:
        print(f"  ⚠ Clip generation skipped: {e}")

    # 6. Check ffmpeg
    import shutil
    if shutil.which("ffmpeg"):
        print("  ✓ ffmpeg found")
    else:
        print("  ⚠ ffmpeg not found — video pipeline will be limited")

    print("\n" + "=" * 50)
    print("  Setup complete! Start with:")
    print("  python main.py")
    print("=" * 50)


if __name__ == "__main__":
    main()
