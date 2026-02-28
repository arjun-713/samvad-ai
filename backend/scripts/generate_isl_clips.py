"""
One-time script. Generates ISL video clips for all dictionary words using Amazon Nova Reel.
Run once: python scripts/generate_isl_clips.py
Takes 60-90 minutes. Saves .mp4 files to backend/isl_clips/
"""
import boto3
import json
import os
import time
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Nova Reel only available in us-east-1
bedrock = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_BEDROCK_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_BEDROCK_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

OUTPUT_DIR = Path(__file__).parent.parent / "isl_clips"
OUTPUT_DIR.mkdir(exist_ok=True)

S3_OUTPUT_BUCKET = os.getenv("S3_BUCKET_NAME", "samvad-ai-isl-clips")

WORDS = [
    "hello", "goodbye", "good", "morning", "evening", "night",
    "how", "are", "you", "i", "me", "my", "name", "is",
    "what", "where", "when", "yes", "no", "okay",
    "thank", "please", "sorry", "help", "need", "want",
    "know", "understand", "come", "go", "stop", "again",
    "today", "tomorrow", "yesterday", "now", "later",
    "water", "food", "home", "school", "work",
    "happy", "sad", "hot", "cold", "big", "small", "new",
    "friend", "family", "mother", "father", "brother", "sister",
    "teacher", "student", "doctor", "time", "day", "week",
    "month", "year", "left", "right", "up", "down",
    "inside", "outside", "open", "close", "start", "finish",
    "read", "write", "speak", "listen", "walk", "run",
    "sit", "stand", "sleep", "eat", "drink", "buy",
    "sell", "call", "wait", "play", "clean", "dirty",
    "fast", "slow", "strong", "weak", "early", "late",
    "beautiful", "important", "absent", "all the best", "apple",
    "ball", "bandage", "bathroom", "bedroom", "belt", "birthday",
    "black", "blue", "boat", "boss", "brain", "bright",
    "bucket", "bus conductor", "butter", "button", "car", "careless",
    "cat", "cheap", "clever", "comb", "cow", "cry",
    "dark", "date", "deaf", "delivery", "door", "drawer",
    "egg", "email", "fan", "flower", "funny", "gas stove",
    "good afternoon", "government", "grandson", "hard", "health", "horse",
    "hungry", "independence", "key", "knife", "less", "light",
    "long", "loud", "many", "milk", "my name is", "namaste",
    "nurse", "opinion", "orange", "paper", "paratha", "pen",
    "pencil", "pickle", "pizza", "post office", "potato", "question",
    "radio", "rainbow", "rasgulla", "regional", "republic day", "rice",
    "rupee", "shirt", "shoes", "tall", "triangle", "university",
    "who", "green", "red", "yellow", "white", "brown",
    "purple", "pink", "grey", "sun", "moon", "star",
    "rain", "wind", "tree", "forest", "mountain", "river",
    "ocean", "animal", "dog", "bird", "fish", "elephant",
    "lion", "tiger", "snake", "monkey", "bread", "fruit",
    "vegetable", "meat", "sugar", "salt", "tea", "coffee",
    "juice", "table", "chair", "bed", "window", "office",
    "hospital", "market", "bank", "city", "village", "country",
    "world", "book", "computer", "phone", "bag", "money",
    "clothes", "hat", "watch", "color", "sound", "music",
    "art", "unknown"
]

ISL_PROMPT_TEMPLATE = """A photorealistic video of an Indian Sign Language (ISL) interpreter 
signing the word "{word}". 
Medium close-up shot from waist to head. 
The interpreter is Indian, wearing a solid dark teal top for hand contrast. 
Neutral light grey background. 
Clear, deliberate hand shape and movement for the ISL sign "{word}". 
Natural facial expression appropriate for the sign. 
Professional studio lighting. 
Smooth fluid motion. 24fps."""


def generate_clip(word: str) -> bool:
    output_path = OUTPUT_DIR / f"{word}.mp4"
    if output_path.exists():
        print(f"  ✓ {word}.mp4 already exists, skipping")
        return True

    print(f"  Generating {word}...", end=" ", flush=True)

    prompt = ISL_PROMPT_TEMPLATE.format(word=word.replace("_", " "))
    s3_output_key = f"nova-reel-output/{word}.mp4"

    try:
        response = bedrock.start_async_invoke(
            modelId="amazon.nova-reel-v1:0",
            modelInput={
                "taskType": "TEXT_VIDEO",
                "textToVideoParams": {"text": prompt},
                "videoGenerationConfig": {
                    "durationSeconds": 6,
                    "fps": 24,
                    "dimension": "1280x720",
                    "seed": abs(hash(word)) % 2147483647,
                }
            },
            outputDataConfig={
                "s3OutputDataConfig": {
                    "s3Uri": f"s3://{S3_OUTPUT_BUCKET}/{s3_output_key}"
                }
            }
        )

        invocation_arn = response.get("invocationArn")

        if not invocation_arn:
            print(f"FAILED — no invocationArn returned")
            return False

        # Poll for completion
        bedrock_jobs = boto3.client(
            "bedrock",
            region_name=os.getenv("AWS_BEDROCK_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

        for attempt in range(120):  # max 10 min wait
            time.sleep(5)
            job_response = bedrock_jobs.get_async_invoke(
                invocationArn=invocation_arn
            )
            status = job_response["status"]

            if status == "Completed":
                # Download from S3
                s3.download_file(S3_OUTPUT_BUCKET, s3_output_key, str(output_path))
                print(f"done ✓")
                return True
            elif status == "Failed":
                reason = job_response.get("failureMessage", "Unknown")
                print(f"FAILED — {reason}")
                return False
            elif attempt % 6 == 0:
                print(f"waiting...", end=" ", flush=True)

        print(f"TIMEOUT")
        return False

    except Exception as e:
        print(f"ERROR — {e}")
        return False


def main():
    print(f"\nSamvad AI — Nova Reel ISL Clip Generator")
    print(f"Generating {len(WORDS)} clips to {OUTPUT_DIR}")
    print(f"Estimated time: {len(WORDS) * 1.5:.0f} minutes\n")

    success = 0
    failed = []

    for i, word in enumerate(WORDS, 1):
        print(f"[{i}/{len(WORDS)}] {word}")
        if generate_clip(word):
            success += 1
        else:
            failed.append(word)
        time.sleep(2)  # Brief pause between jobs

    print(f"\n{'='*40}")
    print(f"Done. {success}/{len(WORDS)} clips generated.")
    if failed:
        print(f"Failed words: {', '.join(failed)}")
        print("Re-run the script to retry failed words.")
    else:
        print("All clips generated successfully!")
    print(f"Clips saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
