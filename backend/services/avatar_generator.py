"""Avatar generator — maps ISL gloss sequences to pre-recorded video clips.
Phase 1: Uses clip library + CSS fallback. Phase 2: Amazon Nova Reel.
"""
import os
import glob
from pathlib import Path


class AvatarGenerator:
    def __init__(self):
        self.clips_dir = os.getenv("ISL_CLIPS_DIR", "./assets/isl_clips")
        self._clip_index = self._build_index()

    def _build_index(self) -> dict:
        """Index all available ISL clip files"""
        index = {}
        if not os.path.exists(self.clips_dir):
            return index
        for f in glob.glob(os.path.join(self.clips_dir, "*.mp4")):
            word = Path(f).stem.upper()
            index[word] = f"/assets/isl_clips/{Path(f).name}"
        return index

    def get_avatar_url(self, isl_gloss: str) -> str:
        """
        Return the first matching clip URL, or empty string for CSS fallback.
        In Phase 2, this would stitch multiple clips together.
        """
        words = isl_gloss.split()

        # Try to find a clip for the full sentence (pre-recorded phrases)
        sentence_key = "_".join(words)
        if sentence_key in self._clip_index:
            return self._clip_index[sentence_key]

        # Try to find clip for first meaningful word
        for word in words:
            clean_word = word.replace("?", "").replace("!", "").replace("+", "")
            if clean_word in self._clip_index:
                return self._clip_index[clean_word]

        # No clip found — frontend will use CSS animated avatar
        return ""

    def create_placeholder_clips(self):
        """
        Create placeholder MP4 files for common ISL signs.
        These are colored videos with text — replace with real ISL videos later.
        """
        import cv2
        import numpy as np

        common_signs = [
            "HELLO", "BYE", "THANK-YOU", "PLEASE", "SORRY",
            "YES", "NO", "HELP", "WATER", "FOOD", "HOME",
            "INDIA", "SCHOOL", "DOCTOR", "WORK",
            "TODAY", "TOMORROW", "YESTERDAY", "NOW",
            "GO", "COME", "EAT", "DRINK", "SEE", "KNOW",
            "WHAT", "WHO", "WHERE", "WHEN", "WHY", "HOW",
            "I", "YOU", "HE", "SHE", "WE", "THEY",
            "GOOD", "BAD", "HAPPY", "SAD",
            "MARKET", "BUS", "TRAIN", "STATION",
        ]

        os.makedirs(self.clips_dir, exist_ok=True)

        for sign in common_signs:
            output_path = os.path.join(self.clips_dir, f"{sign}.mp4")
            if os.path.exists(output_path):
                continue

            # Create a 2-second colored video with the sign text
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, 24, (320, 240))

            colors = {
                "HELLO": (0, 200, 100), "SORRY": (0, 100, 255), "HELP": (255, 200, 0),
                "THANK-YOU": (100, 200, 50), "PLEASE": (200, 150, 0),
                "YES": (0, 220, 0), "NO": (0, 0, 220),
            }
            color = colors.get(sign, (50, 100, 200))

            for frame_num in range(48):  # 2 seconds at 24fps
                frame = np.full((240, 320, 3), color, dtype=np.uint8)

                # Add sign text
                cv2.putText(frame, sign, (20, 120), cv2.FONT_HERSHEY_SIMPLEX,
                            1.2, (255, 255, 255), 3, cv2.LINE_AA)
                cv2.putText(frame, "ISL Sign", (20, 160), cv2.FONT_HERSHEY_SIMPLEX,
                            0.6, (200, 200, 200), 1, cv2.LINE_AA)

                # Animated "hands" (simple rectangles that move)
                hand_x = int(80 + 60 * abs((frame_num % 24) / 12.0 - 1.0))
                cv2.rectangle(frame, (hand_x, 180), (hand_x + 40, 220), (220, 180, 140), -1)
                cv2.rectangle(frame, (240 - hand_x, 180), (280 - hand_x, 220), (220, 180, 140), -1)

                out.write(frame)

            out.release()

        print(f"Created {len(common_signs)} placeholder ISL clips in {self.clips_dir}")
        self._clip_index = self._build_index()
