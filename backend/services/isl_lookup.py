import json
import os
from pathlib import Path

DICT_PATH = Path(__file__).parent.parent / "isl_dictionary.json"

# Vocabulary dictionary loaded dynamically inside resolve_clips


def resolve_clips(gloss_tokens: list[str], mode: str = "local") -> list[dict]:
    """
    Maps ISL gloss tokens to video clip URLs.
    mode: 'local' → serves from /clips/ static mount
          's3'    → serves from S3 public bucket
    Returns list of { word, url, found }
    """
    try:
        with open(DICT_PATH) as f:
            dictionary = json.load(f)
    except Exception as e:
        print(f"Error loading dictionary: {e}")
        dictionary = {}

    region = os.getenv("AWS_REGION", "ap-south-1")
    bucket = os.getenv("S3_BUCKET_NAME", "samvad-ai-isl-clips")

    results = []
    for token in gloss_tokens:
        key = token.lower()
        filename = dictionary.get(key)
        found = filename is not None
        if not found:
            filename = dictionary.get("UNKNOWN", "unknown.webm")

        if mode == "s3":
            url = f"https://{bucket}.s3.{region}.amazonaws.com/isl-clips/{filename}"
        else:
            url = f"http://localhost:8000/clips/{filename}"

        results.append({"word": token, "url": url, "found": found})

    return results
