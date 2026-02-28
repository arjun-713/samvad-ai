import requests
import os
import json
import argparse
from typing import List, Dict

# DIKSHA API Base
BASE_URL = "https://diksha.gov.in/api/content/v1"

def get_content_details(do_id: str, headers: Dict = None) -> Dict:
    """Fetches metadata for a specific DIKSHA content ID."""
    url = f"{BASE_URL}/read/{do_id}"
    params = {"fields": "name,artifactUrl,streamingUrl,contentType,mimeType"}
    response = requests.get(url, params=params, headers=headers)
    if response.status_code == 200:
        return response.json().get("result", {}).get("content", {})
    else:
        print(f"Error fetching {do_id}: {response.status_code}")
        return {}

def download_video(content: Dict, output_dir: str):
    """Downloads the video file from artifactUrl."""
    name = content.get("name", content.get("identifier", "unknown"))
    url = content.get("artifactUrl")
    
    if not url:
        print(f"No download URL for {name}")
        return

    # Clean filename
    clean_name = "".join(c for c in name if c.isalnum() or c in (" ", "_")).strip().replace(" ", "_").lower()
    ext = os.path.splitext(url)[1] or ".mp4"
    filename = f"{clean_name}{ext}"
    filepath = os.path.join(output_dir, filename)

    print(f"Downloading {name} -> {filename}...")
    try:
        r = requests.get(url, stream=True)
        r.raise_for_status()
        with open(filepath, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Success: {filepath}")
    except Exception as e:
        print(f"Failed to download {name}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Download NCERT ISL Videos from DIKSHA")
    parser.add_argument("--ids", nargs="+", help="List of 'do_ids' to download")
    parser.add_argument("--urls", nargs="+", help="List of DIKSHA URLs to extract IDs from and download")
    parser.add_argument("--output", default="isl_clips", help="Directory to save videos")
    parser.add_argument("--cookie", help="Browser session cookie if login is required")
    parser.add_argument("--collection", help="Crawl a collection ID (do_...) for all children")

    args = parser.parse_args()
    
    os.makedirs(args.output, exist_ok=True)
    
    headers = {}
    if args.cookie:
        headers["Cookie"] = args.cookie

    do_ids = args.ids or []
    
    if args.urls:
        for url in args.urls:
            if "do_" in url:
                do_id = url.split("/")[-1]
                if "?" in do_id:
                    do_id = do_id.split("?")[0]
                do_ids.append(do_id)

    if args.collection:
        print(f"Crawling collection {args.collection}...")
        col_data = get_content_details(args.collection, headers)
        children = col_data.get("children", [])
        if not children:
            # Try recursive fetch for hierarchical collections
            print("No immediate children found. This might be a flattened collection or empty.")
        for child in children:
            do_ids.append(child.get("identifier"))

    if not do_ids:
        print("No Content IDs found to download. Use --ids, --urls, or --collection.")
        return

    print(f"Processing {len(set(do_ids))} unique IDs...")
    for do_id in set(do_ids):
        details = get_content_details(do_id, headers)
        if details:
            download_video(details, args.output)

if __name__ == "__main__":
    main()
