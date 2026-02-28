import cv2
import mediapipe as mp
import numpy as np
import os
import argparse
from pathlib import Path

# Initialize MediaPipe
mp_pose = mp.solutions.pose

def crop_video(input_path, output_path):
    print(f"Processing: {input_path}")
    cap = cv2.VideoCapture(str(input_path))
    if not cap.isOpened():
        print(f"Error: Could not open {input_path}")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Detect bounding box based on sample frames
    all_landmarks = []
    with mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5) as pose:
        # Sample every 5th frame to speed up
        for i in range(0, min(60, total_frames), 5):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret: break
            
            results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
            if results.pose_landmarks:
                for lm in results.pose_landmarks.landmark:
                    # Filter out lower body landmarks (23+)
                    # Focus on shoulders (11, 12), elbows (13, 14), wrists (15, 16), and head (0-10)
                    # We'll use 0-22 which covers head, shoulders, arms, wrists
                    # Let's just use all for now and see the range
                    all_landmarks.append((lm.x, lm.y))

    if not all_landmarks:
        print(f"Warning: No signer detected in {input_path}. Skipping.")
        cap.release()
        return

    # Calculate bounding box
    xs = [pt[0] for pt in all_landmarks]
    ys = [pt[1] for pt in all_landmarks]
    
    print(f"DEBUG: Found {len(all_landmarks)} landmarks across sampled frames.")
    print(f"DEBUG: Raw normalized X range: {min(xs):.4f} to {max(xs):.4f}")
    print(f"DEBUG: Raw normalized Y range: {min(ys):.4f} to {max(ys):.4f}")

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    # Convert normalized to pixel coords
    px_min_x, px_max_x = int(min_x * width), int(max_x * width)
    px_min_y, px_max_y = int(min_y * height), int(max_y * height)

    # Add small padding
    pad_w = int((px_max_x - px_min_x) * 0.1)
    pad_h = int((px_max_y - px_min_y) * 0.1)
    
    # Target a fixed aspect ratio or size
    # For Signer PiP, a square or 4:5 is good.
    # Let's try to constrain it to ~70% of the smaller dimension if it's too large
    target_side = min(width, height)
    if (px_max_x - px_min_x) < target_side * 0.8:
        target_side = int(max(px_max_x - px_min_x + 2*pad_w, px_max_y - px_min_y + 2*pad_h))

    # Center point
    cx = (px_min_x + px_max_x) // 2
    cy = (px_min_y + px_max_y) // 2
    
    # Calculate crop coordinates
    x1 = max(0, cx - target_side // 2)
    y1 = max(0, cy - target_side // 2)
    x2 = min(width, x1 + target_side)
    y2 = min(height, y1 + target_side)
    
    # Re-adjust if we hit boundaries
    if x2 - x1 < target_side: x1 = max(0, x2 - target_side)
    if y2 - y1 < target_side: y1 = max(0, y2 - target_side)
    
    crop_w = x2 - x1
    crop_size = (x2 - x1, y2 - y1)
    print(f"Crop decided: {x1, y1} to {x2, y2} (size: {crop_size})")

    # Re-open and process full video
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    import imageio
    
    # We'll use imageio to write with libx264 which is browser-friendly
    writer = imageio.get_writer(str(output_path), fps=fps, codec='libx264', quality=8)

    while True:
        ret, frame = cap.read()
        if not ret: break
        
        cropped_frame = frame[y1:y2, x1:x2]
        # Convert BGR (OpenCV) to RGB (imageio)
        rgb_frame = cv2.cvtColor(cropped_frame, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb_frame)

    cap.release()
    writer.close()
    print(f"Saved (H.264): {output_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", default="isl_clips")
    parser.add_argument("--output_dir", default="isl_clips_cropped")
    parser.add_argument("--files", nargs="*", help="Specific files to process")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.files:
        files = [Path(f) for f in args.files]
    else:
        files = list(input_dir.glob("*.mp4"))
        
    print(f"Found {len(files)} files to process.")

    for f in files:
        if not f.exists():
            f = input_dir / f.name
        if not f.exists():
            print(f"File not found: {f}")
            continue
        output_file = output_dir / f.name
        if output_file.exists():
            print(f"Skipping {f.name} (already exists)")
            continue
        crop_video(f, output_file)

if __name__ == "__main__":
    main()
