"""Reverse Mode — detect sign language gestures and convert to text/speech.
Phase 1: MediaPipe hand detection + mock sign classification.
Phase 2: Real ISL recognition model via SageMaker.
"""
import base64
import numpy as np


class ReverseModeService:
    def __init__(self):
        self._mp_hands = None
        self._mp_drawing = None
        self._init_mediapipe()

        # Mock sign vocabulary
        self.sign_vocabulary = [
            "HELLO", "HOW", "YOU", "I", "GOOD", "BAD",
            "THANK-YOU", "PLEASE", "HELP", "WATER", "FOOD", "HOME",
            "SCHOOL", "WORK", "HAPPY", "SAD", "YES", "NO",
        ]

    def _init_mediapipe(self):
        try:
            import mediapipe as mp
            self._mp_hands = mp.solutions.hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.5,
            )
            self._mp_drawing = mp.solutions.drawing_utils
        except ImportError:
            print("⚠ MediaPipe not available. Reverse mode will use mock.")
            self._mp_hands = None

    def process_frame(self, frame_base64: str) -> dict:
        """Process a webcam frame, detect hands, classify sign"""
        import cv2

        # Decode frame
        img_bytes = base64.b64decode(frame_base64)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return self._empty_result()

        hand_count = 0
        detected_signs = []

        if self._mp_hands is not None:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self._mp_hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                hand_count = len(results.multi_hand_landmarks)

                # Phase 1: Mock classification based on hand position
                for hand_landmarks in results.multi_hand_landmarks:
                    sign = self._mock_classify(hand_landmarks)
                    if sign:
                        detected_signs.append(sign)
        else:
            # Full mock — pretend we detected something
            import random
            if random.random() > 0.6:
                detected_signs = [random.choice(self.sign_vocabulary)]
                hand_count = 1

        return {
            "detected_signs": detected_signs,
            "hand_count": hand_count,
            "confidence": 0.7 if detected_signs else 0.0,
        }

    def _mock_classify(self, hand_landmarks) -> str:
        """Simple mock classification based on hand position/shape"""
        import random

        # Get the wrist position
        wrist = hand_landmarks.landmark[0]

        # Top of frame = one set of signs, bottom = another
        if wrist.y < 0.3:
            return random.choice(["HELLO", "YOU", "HELP", "GOOD"])
        elif wrist.y < 0.6:
            return random.choice(["I", "THANK-YOU", "YES", "NO"])
        else:
            return random.choice(["WATER", "FOOD", "HOME", "WORK"])

    def signs_to_text(self, signs: list[str]) -> str:
        """Convert detected ISL signs to a natural language sentence"""
        if not signs:
            return ""

        text_map = {
            "HELLO": "Hello", "HOW": "How", "YOU": "you",
            "I": "I", "GOOD": "good", "BAD": "bad",
            "THANK-YOU": "Thank you", "PLEASE": "Please",
            "HELP": "Help", "WATER": "I need water",
            "FOOD": "I want food", "HOME": "I want to go home",
            "SCHOOL": "school", "WORK": "I'm going to work",
            "HAPPY": "I am happy", "SAD": "I am sad",
            "YES": "Yes", "NO": "No",
        }

        sentences = [text_map.get(sign, sign.lower()) for sign in signs]
        return " ".join(sentences)

    def _empty_result(self) -> dict:
        return {
            "detected_signs": [],
            "hand_count": 0,
            "confidence": 0.0,
        }
