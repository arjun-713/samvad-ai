"""
Run after generate_isl_clips.py to upload local clips to S3.
python scripts/upload_clips_to_s3.py
"""
import boto3, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION"))
bucket = os.getenv("S3_BUCKET_NAME")
clips_dir = Path(__file__).parent.parent / "isl_clips"

files = list(clips_dir.glob("*.mp4"))
print(f"Uploading {len(files)} clips to s3://{bucket}/isl-clips/")

for clip in files:
    print(f"  {clip.name}...", end=" ")
    s3.upload_file(
        str(clip), bucket, f"isl-clips/{clip.name}",
        ExtraArgs={"ContentType": "video/mp4"}
    )
    print("✓")

print("Done.")
