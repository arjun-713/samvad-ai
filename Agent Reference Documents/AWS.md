# AWS.md — Samvad AI AWS Integration Guide
## Budget Strategy: $100 Credits, Maximum Demo Impact

---

## THE $100 RULE

You have ~$100 in AWS credits. Spend them like this:

| Purpose | Budget | When |
|---------|--------|------|
| Demo recording session | $20 | Final day, 1-2 hours |
| Live judge testing | $40 | Event day only |
| Buffer / mistakes / retries | $40 | Throughout |

**Rule: develop and test everything locally. Switch AWS ON only for demo recording and judge testing. Run `python scripts/cleanup_aws.py` immediately after.**

---

## THE KEY INSIGHT

The judges care about:
- Does the ISL avatar appear when someone speaks? ✓
- Is the cultural adaptation smart (not robotic)? ✓
- Does it feel real-time? ✓
- Does the full pipeline work? ✓

They do NOT care whether:
- Transcribe or Whisper did the speech-to-text
- Nova Reel or a pre-recorded clip was the avatar
- Polly or gTTS did the dubbing
- DynamoDB or SQLite stored the session

**So: the local version IS the demo. AWS only adds the "cloud-native" story.**

---

## MINIMUM AWS NEEDED FOR A CREDIBLE DEMO

Only 3 services actually need to be real AWS:

| Service | Why | Cost for Full Demo Day |
|---------|-----|----------------------|
| Amazon Bedrock (Claude 3.5 Sonnet) | Cultural transcreation — the AI brain judges will ask about | ~$0.50 |
| Amazon Polly | Audio dubbing — tiny cost, great quality | ~$0.05 |
| Amazon S3 | Temp storage for Transcribe (if used) | ~$0.01 |

**Total for entire demo day: ~$1.00**

Everything else (MediaLive, Nova Reel, CloudFront, DynamoDB) → local mock. Judges see the architecture diagram, not the infra.

---

## ENVIRONMENT TOGGLE SYSTEM

The entire codebase uses a single flag in `.env`:

```
# .env values:
ENVIRONMENT=local   # Everything runs locally — use always during development
ENVIRONMENT=demo    # Bedrock + Polly use AWS, everything else stays local
ENVIRONMENT=aws     # Full AWS (Phase 2, post-hackathon)
```

### `backend/config.py` — The switch
```python
import os
from dotenv import load_dotenv
load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

def use_aws(service: str) -> bool:
    """
    service: "bedrock" | "transcribe" | "polly" | "s3" | "dynamodb" | "nova_reel"
    """
    if ENVIRONMENT == "local":
        return False
    if ENVIRONMENT == "demo":
        # Only these 3 services use AWS in demo mode
        return service in ["bedrock", "polly", "s3"]
    if ENVIRONMENT == "aws":
        return True
    return False
```

Each service factory uses this:
```python
# In any service file:
from config import use_aws

def get_transcreation_service():
    if use_aws("bedrock"):
        from services.transcreation_bedrock import BedrockTranscreationService
        return BedrockTranscreationService()
    return LocalTranscreationService()  # Direct Anthropic API — same quality
```

---

## SERVICE IMPLEMENTATIONS

### 1. Cultural Transcreation

**Local (`services/transcreation_local.py`)** — uses direct Anthropic API:
```python
import anthropic, json, os
from services.transcreation_shared import build_prompt, parse_response

class LocalTranscreationService:
    """Uses Anthropic API directly. Same Claude model as Bedrock. Use for all development."""
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    async def transcreate(self, text: str, source_language: str = "hi-IN", context: str = "general") -> dict:
        msg = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            temperature=0.3,
            messages=[{"role": "user", "content": build_prompt(text, source_language, context)}]
        )
        return parse_response(msg.content[0].text)
```

**AWS (`services/transcreation_bedrock.py`)** — swaps to Bedrock for demo:
```python
import boto3, json, os
from services.transcreation_shared import build_prompt, parse_response

class BedrockTranscreationService:
    """Uses Amazon Bedrock. Only activate for demo/production."""
    def __init__(self):
        self.client = boto3.client('bedrock-runtime', region_name=os.getenv("AWS_REGION", "ap-south-1"))
    
    async def transcreate(self, text: str, source_language: str = "hi-IN", context: str = "general") -> dict:
        response = self.client.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "temperature": 0.3,
                "messages": [{"role": "user", "content": build_prompt(text, source_language, context)}]
            })
        )
        result = json.loads(response['body'].read())
        return parse_response(result['content'][0]['text'])
```

**Shared (`services/transcreation_shared.py`)**:
```python
import json

def build_prompt(text: str, source_language: str, context: str) -> str:
    lang_name = {
        "hi-IN": "Hindi", "en-IN": "English (Indian)", "ta-IN": "Tamil",
        "te-IN": "Telugu", "bn-IN": "Bengali", "mr-IN": "Marathi"
    }.get(source_language, "Hindi")
    
    return f"""You are an expert in Indian Sign Language (ISL) and Indian cultural adaptation.

INPUT TEXT (Source: {lang_name}): {text}
CONTEXT: {context}

TASK: Transcreate the above text for deaf Indian audiences who use ISL as their primary language.

REQUIREMENTS:
1. Preserve emotional tone — do NOT do literal word-for-word translation
2. Adapt idioms to visual equivalents (e.g. "raining cats and dogs" → "heavy rain")
3. Identify culturally significant references and provide their ISL name-signs
4. Flag emotional tone accurately

OUTPUT: Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "transcreated_text": "simplified text for ISL conversion",
  "emotional_tone": "neutral|happy|sad|angry|urgent|sarcastic|excited",
  "cultural_notes": ["list of adaptations made"],
  "name_signs": {{"entity_name": "ISL description"}},
  "emphasis_words": ["words needing emphasis"],
  "visual_metaphors": {{"original_idiom": "visual equivalent"}}
}}"""

def parse_response(response_text: str) -> dict:
    text = response_text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "transcreated_text": response_text[:200],
            "emotional_tone": "neutral",
            "cultural_notes": [],
            "name_signs": {},
            "emphasis_words": [],
            "visual_metaphors": {}
        }
```

---

### 2. Audio Dubbing (TTS)

**Local (`services/tts_local.py`)**:
```python
from gtts import gTTS
import os, uuid

LANG_MAP = {
    "hi-IN": "hi", "ta-IN": "ta", "te-IN": "te",
    "bn-IN": "bn", "mr-IN": "mr", "en-IN": "en"
}
LANG_NAMES = {
    "hi-IN": "Hindi", "ta-IN": "Tamil", "te-IN": "Telugu",
    "bn-IN": "Bengali", "mr-IN": "Marathi", "en-IN": "English"
}

class LocalTTSService:
    def __init__(self):
        self.output_dir = os.getenv("OUTPUT_DIR", "./outputs")
    
    def generate_audio(self, text: str, language_code: str = "hi-IN") -> str:
        lang = LANG_MAP.get(language_code, "hi")
        filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
        path = os.path.join(self.output_dir, filename)
        try:
            gTTS(text=text[:300], lang=lang, slow=False).save(path)
            return f"/outputs/{filename}"
        except Exception as e:
            print(f"gTTS error: {e}")
            return ""
    
    def generate_multi_language(self, text: str, languages: list = None) -> list:
        if not languages:
            languages = ["hi-IN", "ta-IN", "te-IN"]
        return [
            {"language": LANG_NAMES.get(l, l), "language_code": l, "url": self.generate_audio(text, l)}
            for l in languages
        ]
```

**AWS (`services/tts_aws.py`)**:
```python
import boto3, os, uuid
from services.tts_local import LANG_NAMES

POLLY_VOICE_MAP = {
    "hi-IN": ("Aditi", "standard"),
    "ta-IN": ("Raveena", "standard"),
    "en-IN": ("Aditi", "standard"),
}

class PollyTTSService:
    def __init__(self):
        self.polly = boto3.client('polly', region_name=os.getenv("AWS_REGION", "ap-south-1"))
        self.output_dir = os.getenv("OUTPUT_DIR", "./outputs")
    
    def generate_audio(self, text: str, language_code: str = "hi-IN") -> str:
        if language_code not in POLLY_VOICE_MAP:
            # Polly doesn't support all Indian languages — fall back to gTTS
            from services.tts_local import LocalTTSService
            return LocalTTSService().generate_audio(text, language_code)
        
        voice_id, engine = POLLY_VOICE_MAP[language_code]
        response = self.polly.synthesize_speech(
            Text=text[:3000],
            OutputFormat='mp3',
            VoiceId=voice_id,
            Engine=engine,
            LanguageCode=language_code,
            SampleRate='22050'
        )
        filename = f"polly_{uuid.uuid4().hex[:8]}.mp3"
        path = os.path.join(self.output_dir, filename)
        with open(path, 'wb') as f:
            f.write(response['AudioStream'].read())
        return f"/outputs/{filename}"
    
    def generate_multi_language(self, text: str, languages: list = None) -> list:
        if not languages:
            languages = ["hi-IN", "ta-IN"]
        return [
            {"language": LANG_NAMES.get(l, l), "language_code": l, "url": self.generate_audio(text, l)}
            for l in languages
        ]
```

---

### 3. ISL Avatar — DO NOT use Nova Reel for Hackathon

Nova Reel is $0.08/clip. For a demo with 30 utterances = $2.40. It's not the cost — it's the quality. Nova Reel output is often inconsistent for ISL-specific poses. Pre-recorded clips look better.

**Do this instead:**
1. Record a team member signing 50-100 common words (HELLO, GO, MARKET, etc.) on camera — plain background, good lighting, 3-6 seconds each
2. Name files `HELLO.mp4`, `GO.mp4`, `MARKET.mp4` and place in `backend/assets/isl_clips/`
3. The avatar generator stitches available clips; for unknown words it uses the CSS animated fallback

The judges will see a real human signing. This is MORE impressive than an AI-generated video that might look glitchy.

**If you cannot record clips in time:** The CSS animated avatar from FRONTEND.md with prominently displayed ISL gloss text is acceptable. Frame it as "Phase 1 avatar — generative video in Phase 2."

---

## ONE-TIME AWS SETUP (15 MINUTES)

Do this once, before the demo day:

### Step 1: S3 Bucket
```bash
aws s3 mb s3://samvad-ai-demo --region ap-south-1
# Add to .env: AWS_S3_BUCKET=samvad-ai-demo
```

### Step 2: Bedrock Model Access
AWS Console → Amazon Bedrock → Model Access → Enable:
- `Anthropic Claude 3.5 Sonnet` (us-east-1 or ap-south-1)

Free to enable; costs per use only.

### Step 3: IAM Credentials
Create IAM user with only these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "bedrock:InvokeModel",
      "polly:SynthesizeSpeech",
      "polly:DescribeVoices",
      "s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket",
      "ce:GetCostAndUsage"
    ],
    "Resource": "*"
  }]
}
```

Get Access Key ID and Secret. Add to `backend/.env`:
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
```

That's it. No MediaLive, no ECS, no CloudFront, no Lambda for the hackathon.

---

## SCRIPTS

### `scripts/verify_aws.py` — Run before demo
```python
"""Run this 30 minutes before demo to verify AWS is working."""
import boto3, os, sys
from dotenv import load_dotenv
load_dotenv()

errors = 0

# Check Bedrock
print("Checking Bedrock (Claude)...", end=" ")
try:
    import json
    client = boto3.client('bedrock-runtime', region_name=os.getenv("AWS_REGION", "ap-south-1"))
    response = client.invoke_model(
        modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"Say OK"}]})
    )
    print("✓ OK")
except Exception as e:
    print(f"✗ FAILED: {e}")
    print("  → Will fall back to direct Anthropic API (same quality)")
    errors += 1

# Check Polly
print("Checking Polly...", end=" ")
try:
    polly = boto3.client('polly', region_name=os.getenv("AWS_REGION", "ap-south-1"))
    polly.describe_voices(LanguageCode='hi-IN')
    print("✓ OK")
except Exception as e:
    print(f"✗ FAILED: {e}")
    print("  → Will fall back to gTTS (slightly lower quality)")
    errors += 1

# Check Anthropic direct (fallback)
print("Checking Anthropic API (fallback)...", end=" ")
try:
    import anthropic
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    client.messages.create(model="claude-3-5-sonnet-20241022", max_tokens=10, messages=[{"role":"user","content":"Say OK"}])
    print("✓ OK")
except Exception as e:
    print(f"✗ FAILED: {e}")
    print("  *** This is critical — cultural transcreation will not work ***")
    errors += 1

print(f"\n{'All systems go!' if errors == 0 else f'{errors} issue(s) found — check above'}")
print("Start demo: ENVIRONMENT=demo uvicorn main:app --reload --port 8000")
```

### `scripts/cleanup_aws.py` — Run after demo
```python
"""Run this immediately after demo to avoid ongoing charges."""
import boto3, os
from dotenv import load_dotenv
load_dotenv()

region = os.getenv("AWS_REGION", "ap-south-1")
bucket = os.getenv("AWS_S3_BUCKET")

print("Cleaning up AWS resources...")

if bucket:
    try:
        s3 = boto3.client('s3', region_name=region)
        objs = s3.list_objects_v2(Bucket=bucket).get('Contents', [])
        for obj in objs:
            s3.delete_object(Bucket=bucket, Key=obj['Key'])
        print(f"✓ Deleted {len(objs)} S3 objects from {bucket}")
    except Exception as e:
        print(f"S3: {e}")

try:
    tc = boto3.client('transcribe', region_name=region)
    jobs = tc.list_transcription_jobs().get('TranscriptionJobSummaries', [])
    for job in jobs:
        if 'samvad' in job['TranscriptionJobName'].lower():
            tc.delete_transcription_job(TranscriptionJobName=job['TranscriptionJobName'])
    if jobs:
        print(f"✓ Deleted {len(jobs)} Transcribe jobs")
except Exception as e:
    print(f"Transcribe: {e}")

print("\nDone. Verify in AWS Console → Billing that no services are running.")
print("Remember to set ENVIRONMENT=local in .env")
```

### `scripts/check_budget.py` — Check spend anytime
```python
"""Check how much of the $100 budget has been used."""
import boto3
from datetime import datetime, timedelta

ce = boto3.client('ce', region_name='us-east-1')  # Cost Explorer is us-east-1 only

response = ce.get_cost_and_usage(
    TimePeriod={
        'Start': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
        'End': datetime.now().strftime('%Y-%m-%d')
    },
    Granularity='DAILY',
    Metrics=['BlendedCost'],
    GroupBy=[{'Type': 'SERVICE', 'Key': 'SERVICE'}]
)

total = 0.0
print("=== AWS Spend (Last 30 Days) ===")
service_totals = {}
for day in response['ResultsByTime']:
    for group in day['Groups']:
        cost = float(group['Metrics']['BlendedCost']['Amount'])
        if cost > 0.0001:
            svc = group['Keys'][0]
            service_totals[svc] = service_totals.get(svc, 0) + cost
            total += cost

for svc, cost in sorted(service_totals.items(), key=lambda x: -x[1]):
    print(f"  {svc}: ${cost:.4f}")

print(f"\nTotal spent: ${total:.2f}")
print(f"Budget remaining: ${100 - total:.2f}")
print(f"Status: {'✓ Safe' if total < 80 else '⚠ Getting close to limit!'}")
```

---

## DEMO DAY TIMELINE

```
T-60min: python scripts/verify_aws.py
T-30min: Record a quick test run of all 4 flows
T-0:     ENVIRONMENT=demo — start server
         Open http://localhost:3000
         Judges arrive

During demo:
  1. Text → ISL (30 sec)
  2. Live stream (60 sec — speak clearly)
  3. Video upload demo_video.mp4 (pre-prepared, 30 sec video)
  4. Show architecture diagram
  5. Answer questions

After judges leave:
  Ctrl+C to stop server
  python scripts/cleanup_aws.py
  Set ENVIRONMENT=local in .env
  python scripts/check_budget.py
```

---

## PHASE 2 (POST-HACKATHON) — What Actually Needs AWS

After the hackathon, if you want to productize:

| Service | Why | Monthly Cost (100 streams) |
|---------|-----|--------------------------|
| AWS MediaLive | Real RTMP ingestion | ~$18,360 |
| Amazon Transcribe Streaming | Real-time ASR | ~$10,368 |
| Amazon Nova Reel | Generative ISL avatar | ~$8,000 |
| Amazon Polly Neural | 22 languages TTS | ~$160 |
| Amazon CloudFront | Global CDN | ~$4,250 |
| Amazon DynamoDB | Session storage | ~$50 |
| Amazon S3 | Media storage | ~$230 |

Total Phase 2: ~$41,418/month for 100 streams.
Per stream hour: ~$5.75 vs $60+ for manual ISL interpreter.

See the full CDK infrastructure code in `infrastructure/` (create post-hackathon).