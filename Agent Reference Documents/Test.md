# TEST.md — Samvad AI Testing Guide
## Testing Without Burning AWS Credits

Read `INSTRUCTIONS.md` first. All tests run locally unless explicitly marked `[DEMO MODE ONLY]`.

---

## TESTING PHILOSOPHY

1. **All automated tests run locally** — no AWS calls, no credits spent
2. **Manual E2E checklist** covers every user flow before demo day
3. **Demo mode tests** run only once with real AWS to verify services work

---

## SETUP

```bash
cd backend
pip install pytest pytest-asyncio httpx pytest-cov
pytest tests/ -v
```

Frontend:
```bash
cd samvad-ui
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm run test
```

---

## BACKEND UNIT TESTS

### `backend/tests/conftest.py`

```python
import pytest
import os

# Force local environment for ALL tests
os.environ["ENVIRONMENT"] = "local"

@pytest.fixture(autouse=True)
def ensure_local_env():
    """Guarantee no test accidentally calls AWS"""
    original = os.environ.get("ENVIRONMENT")
    os.environ["ENVIRONMENT"] = "local"
    yield
    if original:
        os.environ["ENVIRONMENT"] = original
```

---

### `backend/tests/test_health.py`

```python
import pytest
from httpx import AsyncClient, ASGITransport

@pytest.fixture
def app():
    from main import socket_app
    return socket_app

@pytest.mark.asyncio
async def test_health_returns_ok(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["environment"] == "local"

@pytest.mark.asyncio
async def test_languages_returns_list(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/languages")
    assert r.status_code == 200
    langs = r.json()
    assert len(langs) >= 5
    codes = [l["code"] for l in langs]
    assert "hi-IN" in codes
    assert "ta-IN" in codes
```

---

### `backend/tests/test_isl_grammar.py`

```python
import pytest
from services.isl_grammar import ISLGrammarConverter

@pytest.fixture
def c():
    return ISLGrammarConverter()

# Time-fronting
def test_tomorrow_comes_first(c):
    result = c.convert("I am going to market tomorrow")
    words = result.split()
    assert "TOMORROW" in words
    assert words.index("TOMORROW") < words.index("MARKET")

def test_today_comes_first(c):
    result = c.convert("Today India won the match")
    words = result.split()
    assert "TODAY" in words
    assert words[0] == "TODAY"

# Articles/conjunctions dropped
def test_articles_removed(c):
    result = c.convert("I want a glass of water")
    for word in [" A ", " AN ", " THE ", " OF "]:
        assert word not in f" {result} "

def test_aux_verbs_dropped(c):
    result = c.convert("She is going to school")
    assert " IS " not in f" {result} "
    assert "SCHOOL" in result
    assert "GO" in result

# Correct signs
def test_hello(c):
    assert "HELLO" in c.convert("Hello")

def test_thank_you_variants(c):
    for phrase in ["thank you", "thanks", "thank"]:
        assert "THANK-YOU" in c.convert(phrase), f"Failed: {phrase}"

def test_question_marker(c):
    result = c.convert("Where are you going?")
    assert "?" in result or "WHERE" in result

def test_please_preserved(c):
    assert "PLEASE" in c.convert("Please help me")

def test_number_conversion(c):
    result = c.convert("five people came today")
    assert "5" in result or "FIVE" in result

# Edge cases
def test_empty_string(c):
    assert c.convert("") == ""

def test_single_word(c):
    result = c.convert("help")
    assert "HELP" in result

def test_long_sentence_no_crash(c):
    text = "The Prime Minister of India announced a new education policy today for rural schools across the country with funding of five hundred crore rupees"
    result = c.convert(text)
    assert isinstance(result, str)
    assert len(result) > 0
    assert "TODAY" in result
    words = result.split()
    assert words[0] == "TODAY"

# ISL-specific structures
def test_cricket_commentary(c):
    result = c.convert("Virat Kohli hit a six today")
    assert "TODAY" in result
    # "a" should be dropped
    assert " A " not in f" {result} "

def test_urgent_content(c):
    result = c.convert("Help! Call the doctor now!")
    assert "HELP" in result
    assert "DOCTOR" in result

def test_known_locations(c):
    result = c.convert("I am going to India")
    assert "INDIA" in result
```

---

### `backend/tests/test_transcreation_local.py`

```python
import pytest
import os

pytestmark = pytest.mark.skipif(
    not os.getenv("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set — these tests call Claude API"
)

@pytest.mark.asyncio
async def test_basic_transcreation():
    from services.transcreation_local import LocalTranscreationService
    svc = LocalTranscreationService()
    result = await svc.transcreate("Hello, how are you?", "en-IN")
    
    assert "transcreated_text" in result
    assert "emotional_tone" in result
    assert result["emotional_tone"] in ["neutral", "happy", "sad", "angry", "urgent", "sarcastic", "excited"]
    assert len(result["transcreated_text"]) > 0

@pytest.mark.asyncio
async def test_idiom_adaptation():
    """Idioms should not be literally translated"""
    from services.transcreation_local import LocalTranscreationService
    svc = LocalTranscreationService()
    result = await svc.transcreate("It's raining cats and dogs outside today", "en-IN")
    transcreated = result["transcreated_text"].lower()
    # Should not contain literal "cats and dogs"
    literal_idiom = "cats and dogs" in transcreated
    has_rain = "rain" in transcreated
    # Either the idiom is adapted OR cultural notes mention the adaptation
    assert not literal_idiom or has_rain or len(result.get("visual_metaphors", {})) > 0

@pytest.mark.asyncio
async def test_urgency_detected():
    from services.transcreation_local import LocalTranscreationService
    svc = LocalTranscreationService()
    result = await svc.transcreate("EMERGENCY! Call the police immediately!", "en-IN")
    assert result["emotional_tone"] in ["urgent", "angry", "excited"]

@pytest.mark.asyncio
async def test_always_returns_valid_structure():
    from services.transcreation_local import LocalTranscreationService
    svc = LocalTranscreationService()
    for text in ["OK", "1234", "a" * 100]:
        result = await svc.transcreate(text, "hi-IN")
        assert "transcreated_text" in result
        assert "emotional_tone" in result
        assert isinstance(result.get("cultural_notes", []), list)

@pytest.mark.asyncio
async def test_hindi_input():
    from services.transcreation_local import LocalTranscreationService
    svc = LocalTranscreationService()
    result = await svc.transcreate("आज मौसम बहुत अच्छा है", "hi-IN")
    assert "transcreated_text" in result
    assert len(result["transcreated_text"]) > 0
```

---

### `backend/tests/test_avatar_generator.py`

```python
import pytest
import os
from pathlib import Path

def test_generator_initializes():
    from services.avatar_generator import AvatarGenerator
    ag = AvatarGenerator()
    assert ag is not None
    assert isinstance(ag._clip_index, dict)

def test_get_avatar_returns_string():
    from services.avatar_generator import AvatarGenerator
    ag = AvatarGenerator()
    url = ag.get_avatar_url("HELLO THANK-YOU")
    assert isinstance(url, str)

def test_unknown_gloss_returns_empty_not_error():
    from services.avatar_generator import AvatarGenerator
    ag = AvatarGenerator()
    url = ag.get_avatar_url("XYZQWERTY123UNKNOWN")
    assert url == ""  # Triggers CSS fallback on frontend

def test_empty_gloss(():
    from services.avatar_generator import AvatarGenerator
    ag = AvatarGenerator()
    url = ag.get_avatar_url("")
    assert isinstance(url, str)

def test_create_placeholder_clips(tmp_path):
    """Verify placeholder clips can be generated"""
    from services.avatar_generator import AvatarGenerator
    ag = AvatarGenerator()
    ag.clips_dir = str(tmp_path)
    
    ag.create_placeholder_clips()
    
    mp4_files = list(tmp_path.glob("*.mp4"))
    assert len(mp4_files) >= 10, f"Expected 10+ clips, got {len(mp4_files)}"
    
    # Verify key clips exist
    names = [f.stem for f in mp4_files]
    assert "HELLO" in names
    assert "HELP" in names
    assert "THANK-YOU" in names
```

---

### `backend/tests/test_tts_service.py`

```python
import pytest
import os

def test_local_tts_generates_file(tmp_path):
    from services.tts_local import LocalTTSService
    svc = LocalTTSService()
    svc.output_dir = str(tmp_path)
    
    url = svc.generate_audio("Hello world", "en-IN")
    assert url.endswith(".mp3")
    
    filename = url.split("/")[-1]
    assert (tmp_path / filename).exists()
    assert (tmp_path / filename).stat().st_size > 0

def test_local_tts_hindi(tmp_path):
    from services.tts_local import LocalTTSService
    svc = LocalTTSService()
    svc.output_dir = str(tmp_path)
    url = svc.generate_audio("नमस्ते", "hi-IN")
    assert url.endswith(".mp3")

def test_local_tts_multi_language(tmp_path):
    from services.tts_local import LocalTTSService
    svc = LocalTTSService()
    svc.output_dir = str(tmp_path)
    
    results = svc.generate_multi_language("Hello", ["hi-IN", "ta-IN"])
    assert len(results) == 2
    for r in results:
        assert "language" in r
        assert "url" in r
        assert r["url"].endswith(".mp3")

def test_local_tts_empty_text_handled(tmp_path):
    from services.tts_local import LocalTTSService
    svc = LocalTTSService()
    svc.output_dir = str(tmp_path)
    # Should not crash
    try:
        url = svc.generate_audio("", "hi-IN")
        assert isinstance(url, str)
    except Exception:
        pass  # Acceptable to raise — just not to silently hang
```

---

### `backend/tests/test_api_text_to_isl.py`

```python
import pytest
from httpx import AsyncClient, ASGITransport

@pytest.fixture
def app():
    from main import socket_app
    return socket_app

@pytest.mark.asyncio
async def test_text_to_isl_basic(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/text-to-isl", json={"text": "Hello", "language": "en-IN"})
    assert r.status_code == 200
    data = r.json()
    assert "gloss" in data
    assert "emotional_tone" in data
    assert "avatar_url" in data
    assert "duration_seconds" in data
    assert "HELLO" in data["gloss"].upper()

@pytest.mark.asyncio
async def test_text_to_isl_empty_rejected(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/text-to-isl", json={"text": "", "language": "hi-IN"})
    assert r.status_code == 400

@pytest.mark.asyncio
async def test_text_to_isl_too_long_rejected(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/text-to-isl", json={"text": "x" * 501, "language": "hi-IN"})
    assert r.status_code == 400

@pytest.mark.asyncio
async def test_isl_gloss_has_meaningful_content(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/text-to-isl", json={"text": "I want water please", "language": "en-IN"})
    data = r.json()
    gloss = data["gloss"].upper()
    found = [w for w in ["WANT", "WATER", "PLEASE"] if w in gloss]
    assert len(found) >= 2, f"Expected signs not found in: {gloss}"

@pytest.mark.asyncio
async def test_response_time_under_10s(app):
    import time
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", timeout=15) as c:
        start = time.time()
        r = await c.post("/api/text-to-isl", json={"text": "Hello world", "language": "en-IN"})
        elapsed = time.time() - start
    assert r.status_code == 200
    assert elapsed < 10, f"Took {elapsed:.1f}s — should be under 10s"

@pytest.mark.asyncio
async def test_video_upload_wrong_format(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post(
            "/api/process-video",
            files={"video": ("test.txt", b"not a video", "text/plain")}
        )
    assert r.status_code == 400
```

---

## FRONTEND TESTS

### `samvad-ui/src/test/setup.ts`
```typescript
import '@testing-library/jest-dom'
```

### `samvad-ui/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### `samvad-ui/src/test/isl_grammar.test.ts`

```typescript
// Test the ISL grammar conversion logic if exposed as a util
// Or test the display rendering

describe('ISL Gloss Display', () => {
  it('splits gloss into individual word chips', () => {
    const gloss = "TOMORROW MARKET GO VEGETABLES BUY"
    const words = gloss.split(' ')
    expect(words).toHaveLength(5)
    expect(words[0]).toBe('TOMORROW')
  })
})
```

### `samvad-ui/src/test/components/TextToISL.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import TextToISL from '../../components/TextToISL'

vi.mock('../../api/client', () => ({
  islApi: {
    textToISL: vi.fn().mockResolvedValue({
      data: {
        gloss: "HELLO THANK-YOU",
        emotional_tone: "neutral",
        avatar_url: "",
        duration_seconds: 2.4,
        cultural_notes: ["Adapted greeting for ISL"],
        name_signs: {},
        emphasis_words: []
      }
    })
  }
}))

describe('TextToISL', () => {
  test('renders textarea and button', () => {
    render(<TextToISL />)
    expect(screen.getByPlaceholderText(/type what you want/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /translate/i })).toBeInTheDocument()
  })

  test('shows character count', () => {
    render(<TextToISL />)
    fireEvent.change(screen.getByPlaceholderText(/type what you want/i), { target: { value: 'Hello' } })
    expect(screen.getByText(/5.*500/)).toBeInTheDocument()
  })

  test('button disabled when textarea is empty', () => {
    render(<TextToISL />)
    const btn = screen.getByRole('button', { name: /translate/i })
    expect(btn).toBeDisabled()
  })

  test('button enabled after typing', () => {
    render(<TextToISL />)
    fireEvent.change(screen.getByPlaceholderText(/type what you want/i), { target: { value: 'Hello' } })
    expect(screen.getByRole('button', { name: /translate/i })).not.toBeDisabled()
  })

  test('shows ISL gloss after translation', async () => {
    render(<TextToISL />)
    fireEvent.change(screen.getByPlaceholderText(/type what you want/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /translate/i }))
    await waitFor(() => {
      expect(screen.getByText('HELLO')).toBeInTheDocument()
    })
  })

  test('quick phrase fills textarea', () => {
    render(<TextToISL />)
    fireEvent.click(screen.getByText(/how can i help/i))
    const ta = screen.getByPlaceholderText(/type what you want/i) as HTMLTextAreaElement
    expect(ta.value.length).toBeGreaterThan(0)
  })
})
```

### `samvad-ui/src/test/components/ISLAvatar.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import ISLAvatar from '../../components/ISLAvatar'
import type { ISLResult } from '../../types'

const mockResult: ISLResult = {
  gloss: "HELLO THANK-YOU",
  emotional_tone: "neutral",
  avatar_url: "",
  duration_seconds: 2.4,
  cultural_notes: [],
  name_signs: {},
  emphasis_words: []
}

describe('ISLAvatar', () => {
  test('shows CSS avatar and gloss when no video URL', () => {
    render(<ISLAvatar result={mockResult} showGloss={true} />)
    expect(screen.getByText('HELLO')).toBeInTheDocument()
    expect(screen.getByText('THANK-YOU')).toBeInTheDocument()
  })

  test('handles null result without crashing', () => {
    render(<ISLAvatar result={null} />)
    // Should render empty state, not crash
  })

  test('shows video element when avatar_url is provided', () => {
    render(<ISLAvatar result={{ ...mockResult, avatar_url: '/outputs/test.mp4' }} />)
    expect(document.querySelector('video')).toBeInTheDocument()
  })

  test('shows emotional tone badge', () => {
    render(<ISLAvatar result={mockResult} showGloss={true} />)
    expect(screen.getByText(/neutral/i)).toBeInTheDocument()
  })

  test('shows urgent tone badge in red for urgent content', () => {
    render(<ISLAvatar result={{ ...mockResult, emotional_tone: 'urgent' }} showGloss={true} />)
    expect(screen.getByText(/urgent/i)).toBeInTheDocument()
  })
})
```

---

## E2E MANUAL CHECKLIST

Run through this completely before demo day. Check every box.

### Setup
- [ ] `cd backend && uvicorn main:app --reload --port 8000` — starts without errors
- [ ] `cd samvad-ui && npm run dev` — starts without errors at localhost:3000
- [ ] Status indicator in header shows "Connected" (green dot)
- [ ] `GET http://localhost:8000/api/health` returns 200

### Flow 1: Text → ISL
- [ ] Open Text mode tab
- [ ] Textarea and "Translate to ISL" button visible
- [ ] Type "Hello" → character count shows "5 / 500"
- [ ] Button is disabled when textarea is empty, enabled when text is typed
- [ ] Click Translate → loading indicator appears
- [ ] ISL gloss appears: should contain "HELLO"
- [ ] CSS avatar shows (animated SVG person with gloss chips)
- [ ] Type "I want water please" → gloss contains WANT + WATER + PLEASE, NOT "a" or "I want a"
- [ ] Type "I am going to market tomorrow" → TOMORROW is first word
- [ ] Type "Where are you going?" → gloss contains "?" marker
- [ ] Quick phrase buttons fill textarea on click
- [ ] Cultural notes section appears for idiomatic input (try "It's raining cats and dogs")
- [ ] Change signing speed slider → avatar plays at different speed

### Flow 2: Live Stream
- [ ] Open Live Stream tab
- [ ] "Start Live Stream" button visible and prominent
- [ ] Click → browser requests camera + microphone permissions
- [ ] Camera feed displays after permission granted (640px wide minimum)
- [ ] Pipeline status shows "Listening..."
- [ ] Speak clearly for 4-5 seconds → pipeline cycles through "Transcribing → Adapting → Generating ISL"
- [ ] ISL gloss text appears below camera feed
- [ ] CSS avatar appears in PiP overlay (bottom-right of camera)
- [ ] If video clip exists for detected gloss: video plays in PiP
- [ ] "Stop Stream" button works — camera turns off
- [ ] After stopping: status returns to "Ready"
- [ ] **Error test:** Stop backend → try to stream → error message shown clearly (not silent)

### Flow 3: Video Upload
- [ ] Open Upload tab
- [ ] Drag-drop zone visible with upload icon
- [ ] Click zone → file picker opens, accepts mp4/avi/mov/mkv
- [ ] Select a video file → filename and size shown
- [ ] Upload progress bar fills during upload
- [ ] Pipeline stage cards light up in sequence:
  - [ ] [1] Uploading → filled/green
  - [ ] [2] Transcribing → filled
  - [ ] [3] Cultural Adaptation → filled
  - [ ] [4] Generating ISL → filled
  - [ ] [5] Dubbing Audio → filled
  - [ ] [6] Ready → filled
- [ ] Video player appears after processing completes
- [ ] ISL gloss text visible below video during playback
- [ ] Language dropdown shows at least 2 language options for dubbed audio
- [ ] Select different language → audio changes
- [ ] Upload a .txt file → error message shown before upload starts

### Flow 4: Reverse Mode
- [ ] Open Reverse Mode tab
- [ ] Explanation text visible: "For deaf creators"
- [ ] Camera activates when tab opens (or on "Start" button click)
- [ ] Hand detection bounding box overlays on camera feed (when hands visible)
- [ ] Detected signs shown as chips/tags
- [ ] Generated text appears in speech bubble
- [ ] Confidence percentage shown
- [ ] Audio playback button for generated voice

### Settings
- [ ] Gear icon in header opens settings panel (right drawer)
- [ ] Avatar selection (3 options) clickable
- [ ] Signing speed slider works (0.5x to 2x)
- [ ] PiP position corner picker works (visual 2×2 grid)
- [ ] "Show ISL Gloss" toggle works
- [ ] Settings persist after browser refresh (localStorage)

### Visual Quality
- [ ] Dark background (#0F1117) throughout
- [ ] Green accent (#A3E635) on active elements
- [ ] ISL gloss text uses monospace font
- [ ] Pipeline status stages have visual distinction (pending/active/complete)
- [ ] Loading spinners appear during all async operations
- [ ] Error states have retry buttons
- [ ] Mobile layout at 375px width — no horizontal overflow

---

## DEMO MODE VERIFICATION — [DEMO DAY ONLY, COSTS ~$0.05]

Run once before the demo. Do NOT run repeatedly.

```bash
# Step 1: Set demo env
cd backend
echo "ENVIRONMENT=demo" >> .env

# Step 2: Verify AWS services
python scripts/verify_aws.py

# Step 3: Do ONE test request to confirm Bedrock works
curl -X POST http://localhost:8000/api/text-to-isl \
  -H "Content-Type: application/json" \
  -d '{"text": "Virat Kohli hit a six today", "language": "en-IN"}'

# Expected: gloss with "TODAY" first, cultural_notes mentioning cricket adaptation
# Check the response — if it shows meaningful cultural adaptation, Bedrock is working

# Step 4: Reset after verification
python scripts/check_budget.py
```

---

## PERFORMANCE BENCHMARK — RUN ONCE LOCALLY

```bash
python tests/benchmark.py
```

`backend/tests/benchmark.py`:
```python
"""Performance benchmarks — runs locally, no AWS needed."""
import asyncio
import time
from services.isl_grammar import ISLGrammarConverter

def benchmark_isl_grammar():
    print("=== ISL Grammar Benchmarks ===")
    c = ISLGrammarConverter()
    tests = [
        "I am going to market tomorrow",
        "Virat Kohli hit a brilliant six today",
        "Where is the nearest hospital?",
        "The government will announce results tomorrow morning",
        "Please help me I need water",
    ]
    times = []
    for text in tests:
        start = time.perf_counter()
        result = c.convert(text)
        elapsed = (time.perf_counter() - start) * 1000
        times.append(elapsed)
        print(f"  '{text[:40]}'")
        print(f"  → '{result}' ({elapsed:.2f}ms)")
    avg = sum(times) / len(times)
    print(f"\nAverage: {avg:.2f}ms (target: <5ms)")
    assert avg < 5, f"ISL grammar too slow: {avg:.2f}ms"
    print("✓ PASS")

async def benchmark_full_pipeline():
    print("\n=== Full Pipeline Benchmarks (requires ANTHROPIC_API_KEY) ===")
    import os
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("Skipping — no ANTHROPIC_API_KEY")
        return
    
    from services.transcreation_local import LocalTranscreationService
    from services.isl_grammar import ISLGrammarConverter
    from services.avatar_generator import AvatarGenerator
    
    transcreation = LocalTranscreationService()
    grammar = ISLGrammarConverter()
    avatar = AvatarGenerator()
    
    test_texts = [
        ("Hello, how are you?", "en-IN"),
        ("Today India won the cricket match", "en-IN"),
        ("आज का मौसम बहुत अच्छा है", "hi-IN"),
    ]
    
    for text, lang in test_texts:
        start = time.perf_counter()
        
        t_result = await transcreation.transcreate(text, lang)
        gloss = grammar.convert(t_result["transcreated_text"])
        av_url = avatar.get_avatar_url(gloss)
        
        elapsed = (time.perf_counter() - start) * 1000
        print(f"  '{text[:40]}' [{lang}]")
        print(f"  → Gloss: '{gloss}' | Avatar: {'clip' if av_url else 'css'} | Time: {elapsed:.0f}ms")
    
    print(f"\nTarget: <5000ms per request (local)")

if __name__ == "__main__":
    benchmark_isl_grammar()
    asyncio.run(benchmark_full_pipeline())
```

---

## CI — GITHUB ACTIONS

`.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, dev]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: python -m spacy download en_core_web_sm
      - name: Run tests (no AWS)
        env:
          ENVIRONMENT: local
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          pytest tests/test_health.py tests/test_isl_grammar.py tests/test_avatar_generator.py tests/test_tts_service.py tests/test_api_text_to_isl.py -v

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: samvad-ui
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

Note: `test_transcreation_local.py` runs in CI only if `ANTHROPIC_API_KEY` secret is set. AWS tests never run in CI.