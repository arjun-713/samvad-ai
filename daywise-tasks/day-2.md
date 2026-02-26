# Day 2: The Brain & The Voice
**Date:** Feb 26, 2026

## Goal
By midnight, your Python backend should be able to take an English or Hindi audio file/text, translate it into Indian Sign Language (ISL) Gloss structure, and output a dubbed audio file in a regional language.

## End of Day Deliverables
- [ ] The Ears: Python script using boto3 + Amazon Transcribe to convert audio to text
- [ ] The Brain: Bedrock API with Claude 3.5 Sonnet converting text to ISL Topic-Comment syntax
- [ ] The Voice: Amazon Polly integration generating .mp3 in regional languages
- [ ] The API: FastAPI route chaining all three steps together

---

## Phase 1: The Ears (Amazon Transcribe)

**Note:** For today, use a static audio file. Live streaming will come later.

### Setup
- [ ] Verify boto3 is installed in Python environment
- [ ] Create test audio file (.wav or .mp3)
  - Example: "Where is the nearest train station?"

### Implementation
- [ ] Write function to upload audio to temporary S3 bucket
- [ ] Trigger Amazon Transcribe job
- [ ] Parse JSON response to extract plain text string

### Code Structure
```python
def transcribe_audio(audio_file_path):
    # Upload to S3
    # Start Transcribe job
    # Wait for completion
    # Parse and return text
    pass
```

### Test
- [ ] Upload sample audio file
- [ ] Verify transcription accuracy
- [ ] Extract clean text output

---

## Phase 2: The Brain (Amazon Bedrock + Claude 3.5)

**Core Feature:** Cultural Transcreation - ISL uses Topic-Comment syntax, not Subject-Verb-Object.

### Setup
- [ ] Use boto3 to invoke Bedrock runtime
- [ ] Model: `anthropic.claude-3-5-sonnet-20240620-v1:0`

### System Prompt
```
You are an expert Indian Sign Language (ISL) translator. 
Convert the following text into ISL Gloss format (Topic-Comment structure, 
all caps, removing connecting verbs/articles like 'is', 'the', 'a'). 

Example: 'I am going to the store' becomes 'STORE ME GO'. 

Translate this: [INSERT TEXT]
```

### Implementation
- [ ] Create function to call Bedrock with Claude
- [ ] Pass transcribed text from Phase 1
- [ ] Parse ISL Gloss output

### Code Structure
```python
def convert_to_isl_gloss(text):
    # Call Bedrock with Claude 3.5
    # Use ISL system prompt
    # Return ISL Gloss format
    pass
```

### Test
- [ ] Input: "I am going to the store"
- [ ] Expected Output: "STORE ME GO"
- [ ] Print ISL Gloss to terminal
- [ ] Verify Topic-Comment structure

---

## Phase 3: The Voice (Amazon Polly)

### Setup
- [ ] Use boto3 to call Polly client
- [ ] Choose Indian neural voices

### Available Indian Voices
- Hindi: 'Aditi', 'Kajal'
- Tamil: Check available voices
- Telugu: Check available voices
- Bengali: Check available voices

### Implementation
- [ ] Create function `synthesize_speech(text, language_code, voice_id)`
- [ ] Pass original text (not ISL Gloss) to Polly
- [ ] Save output stream as .mp3 file

### Code Structure
```python
def synthesize_speech(text, language_code='hi-IN', voice_id='Aditi'):
    # Call Polly
    # Get audio stream
    # Save as output.mp3
    pass
```

### Test
- [ ] Generate audio in Hindi
- [ ] Generate audio in Tamil
- [ ] Verify audio quality
- [ ] Confirm file is playable

---

## Phase 4: The Integration (API)

### Create New Endpoint
- [ ] Route: `POST /api/process-media`
- [ ] Accept: text string OR audio file

### Request Body
```json
{
  "input_type": "text" | "audio",
  "content": "text string or base64 audio",
  "target_language": "hi-IN" | "ta-IN" | "te-IN" | "bn-IN",
  "voice_id": "Aditi"
}
```

### Processing Chain
1. **If audio:** Transcribe it (Phase 1)
2. **Convert to ISL Gloss:** Send to Claude (Phase 2)
3. **Generate dubbed audio:** Send to Polly (Phase 3)
4. **Return response**

### Response Format
```json
{
  "original_text": "Where is the nearest train station?",
  "isl_gloss": "TRAIN STATION NEAR WHERE",
  "dubbed_audio_url": "https://...",
  "dubbed_audio_base64": "data:audio/mp3;base64,...",
  "language": "hi-IN",
  "voice_id": "Aditi"
}
```

### Implementation Checklist
- [ ] Create `/api/process-media` endpoint
- [ ] Handle text input
- [ ] Handle audio file upload
- [ ] Chain all three services
- [ ] Return complete response
- [ ] Add error handling
- [ ] Add logging

---

## End of Day Checklist

### Functionality
- [ ] Successfully convert voice to ISL Gloss text string
- [ ] Generate MP3 file in regional language
- [ ] API endpoint working end-to-end
- [ ] All three AWS services integrated

### Testing
- [ ] Test with English input
- [ ] Test with Hindi input
- [ ] Test with audio file
- [ ] Test with text input
- [ ] Verify ISL Gloss accuracy
- [ ] Verify audio output quality

### AWS Cost Management
- [ ] Check for lingering AWS resources
- [ ] Verify no unnecessary Transcribe jobs running
- [ ] Confirm S3 bucket cleanup
- [ ] Review AWS billing dashboard
- [ ] Transcribe and Polly are pay-per-request (safe)

### Documentation
- [ ] Document API endpoint usage
- [ ] Add example requests/responses
- [ ] Update README with new features
- [ ] Document ISL Gloss conversion logic

---

## Code Organization

### Suggested File Structure
```
backend/
├── main.py                      # FastAPI app
├── services/
│   ├── __init__.py
│   ├── transcribe.py           # Amazon Transcribe
│   ├── bedrock.py              # Claude ISL conversion
│   ├── polly.py                # Amazon Polly
│   └── s3.py                   # S3 operations
├── models/
│   └── schemas.py              # Pydantic models
├── utils/
│   └── audio.py                # Audio processing
└── tests/
    └── test_process_media.py   # Integration tests
```

---

## Example Usage

### Test with Text
```bash
curl -X POST http://localhost:8000/api/process-media \
  -H "Content-Type: application/json" \
  -d '{
    "input_type": "text",
    "content": "Where is the nearest train station?",
    "target_language": "hi-IN",
    "voice_id": "Aditi"
  }'
```

### Test with Audio
```bash
curl -X POST http://localhost:8000/api/process-media \
  -F "audio=@test_audio.mp3" \
  -F "target_language=hi-IN" \
  -F "voice_id=Aditi"
```

---

## Success Criteria

✅ Audio transcription working  
✅ ISL Gloss conversion accurate  
✅ Regional audio generation working  
✅ API endpoint functional  
✅ Error handling implemented  
✅ AWS costs under control  

---

## Notes

- **ISL Gloss Format:** All caps, Topic-Comment structure, no articles/connecting verbs
- **Audio Format:** .wav or .mp3 for input, .mp3 for output
- **S3 Bucket:** Use temporary bucket, clean up after processing
- **Streaming:** Will be implemented later, focus on static files today
- **Voice Selection:** Test multiple Indian voices for quality

---

## Tomorrow (Day 3)

- Avatar generation using ISL Gloss
- Real-time streaming implementation
- Frontend integration with new API
- Video generation with sign language

---

## Resources

- [Amazon Transcribe Docs](https://docs.aws.amazon.com/transcribe/)
- [Amazon Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [Amazon Polly Docs](https://docs.aws.amazon.com/polly/)
- [ISL Grammar Guide](https://example.com/isl-grammar)
- [Claude 3.5 Sonnet Docs](https://docs.anthropic.com/claude/)
