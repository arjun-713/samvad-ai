# Backend Services

## Overview
This directory contains AWS service integrations for Samvad AI.

## Services

### S3Service (`s3.py`)
Handles audio file uploads to Amazon S3.

**Methods:**
- `upload_audio_file(file_content, file_name)` - Upload audio to S3
- `get_presigned_url(s3_uri, expiration)` - Generate presigned URL
- `delete_file(s3_uri)` - Delete file from S3

### TranscribeService (`transcribe.py`)
Handles audio-to-text transcription using Amazon Transcribe.

**Methods:**
- `transcribe_audio(s3_uri, language_code)` - Transcribe audio file
- `detect_language(s3_uri)` - Detect audio language

## Supported Languages

### Amazon Transcribe Language Codes
- `en-US` - English (US)
- `en-IN` - English (India)
- `hi-IN` - Hindi
- `ta-IN` - Tamil
- `te-IN` - Telugu
- `bn-IN` - Bengali
- `mr-IN` - Marathi
- `gu-IN` - Gujarati
- `kn-IN` - Kannada
- `ml-IN` - Malayalam
- `pa-IN` - Punjabi

## Usage Example

```python
from services.s3 import S3Service
from services.transcribe import TranscribeService

# Initialize services
s3_service = S3Service()
transcribe_service = TranscribeService()

# Upload audio
s3_uri = s3_service.upload_audio_file(audio_bytes, "audio.mp3")

# Transcribe
result = transcribe_service.transcribe_audio(s3_uri, "hi-IN")
print(result['transcript'])
```

## Configuration

Required environment variables:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: us-east-1)
- `S3_BUCKET_NAME` - S3 bucket name (default: samvad-audio-uploads-dev)

## Error Handling

All services raise exceptions with descriptive error messages. The main API endpoint catches these and returns appropriate HTTP error responses.

## Testing

Run the test script:
```bash
python test_transcribe.py
```

Or test via API docs:
```
http://localhost:8000/docs
```
