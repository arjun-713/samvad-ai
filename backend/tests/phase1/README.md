# Phase 1 Test Suite: Video Generation & Glossary

This folder contains the test cases for **Phase 1: Dictionary Expansion & Real Video Integration**.

## Contents
- `prompts.json`: A categorized list of English prompts to test various features.

## Testing Checklist

### 1. Real Video Verification (H.264 & Centering)
Use prompts from `direct_ncert_real_videos`.
- **Expected**: Video should load instantly (H.264) and the signer should be centered in the frame (AI-cropped).
- **Words to Try**: "absent", "good morning", "famous".

### 2. Phrase Matching Logic
Use prompts from `phrase_matching_logic`.
- **Expected**: "good morning" should play one continuous professional video, NOT two separate videos for "good" and "morning".
- **Logic**: The backend uses greedy matching to prioritize long phrases in the dictionary.

### 3. Hybrid Playback
Use `hybrid_signer_sentences`.
- **Expected**: The system should smoothly transition between high-quality NCERT `.mp4` videos and high-fidelity `.webm` placeholders.
- **Example**: "I am absent today"
  - `I` (.webm)
  - `am` (skipped if not in dict)
  - `absent` (.mp4 - Real)
  - `today` (.webm)

### 4. Edge Cases
- **Expected**: Case-insensitivity (e.g., "HI" works as "hi") and fallback to `unknown.webm` for words not in the 242-word dictionary.

---
*Samvad AI - Empowering Accessibility*
