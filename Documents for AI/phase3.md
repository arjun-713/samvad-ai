# PHASE3.md — Chrome Extension (Livestream ISL Overlay)

> **Status: Start only after PHASE2.md checklist is fully complete.**
> Read CLAUDE.md and FRONTEND_CONTEXT.md before starting.

---

## Goal

A Chrome extension that overlays an ISL avatar on any video playing in the browser — YouTube, Instagram Reels, Netflix, any website. User enables it via a popup toggle. The extension captures tab audio, streams it to the Samvad backend, gets ISL clips back in real time, and shows them in a floating overlay over the video.

---

## Before You Start — Expose the Backend

The Chrome extension cannot talk to `localhost` from other websites. For the demo, use ngrok:

```bash
# In a separate terminal, while backend is running:
ngrok http 8000
# Copy the https URL e.g. https://abc123.ngrok-free.app
```

Put this URL in `samvad-extension/config.js` (see Section 3).

---

## Backend — New Files Only

```
backend/services/transcribe_streaming.py
backend/routes/stream_isl.py
```

Add the WebSocket route to `main.py`. Do not touch any Phase 1 or Phase 2 files.

---

## backend/services/transcribe_streaming.py

```python
import asyncio
import boto3
import os
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent

class ISLTranscriptHandler(TranscriptResultStreamHandler):
    def __init__(self, stream, on_final_result):
        super().__init__(stream)
        self.on_final_result = on_final_result

    async def handle_transcript_event(self, transcript_event: TranscriptEvent):
        for result in transcript_event.transcript.results:
            if not result.is_partial:
                text = result.alternatives[0].transcript
                await self.on_final_result(text)

async def stream_transcribe(audio_queue: asyncio.Queue, on_text, language_code: str = "hi-IN"):
    """
    Reads PCM audio chunks from audio_queue, streams to Transcribe,
    calls on_text(text) for each final transcript result.
    """
    client = TranscribeStreamingClient(region=os.getenv("AWS_REGION", "ap-south-1"))

    stream = await client.start_stream_transcription(
        language_code=language_code,
        media_sample_rate_hz=16000,
        media_encoding="pcm",
        enable_partial_results_stabilization=True,
        partial_results_stability="high",
    )

    async def send_audio():
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                break
            await stream.input_stream.send_audio_event(audio_chunk=chunk)
        await stream.input_stream.end_stream()

    handler = ISLTranscriptHandler(stream.output_stream, on_text)
    await asyncio.gather(send_audio(), handler.handle_events())
```

Install required package — add to `backend/requirements.txt`:
```
amazon-transcribe>=0.6.0
```

---

## backend/routes/stream_isl.py

```python
import asyncio
import base64
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.transcribe_streaming import stream_transcribe
from services.isl_grammar import convert_to_isl_gloss
from services.isl_lookup import resolve_clips
import os

router = APIRouter()

@router.websocket("/ws/stream-isl")
async def stream_isl(websocket: WebSocket):
    await websocket.accept()
    audio_queue: asyncio.Queue = asyncio.Queue()
    language = "hi-IN"

    async def on_final_text(text: str):
        gloss = convert_to_isl_gloss(text)
        if not gloss:
            return
        mode = os.getenv("ISL_CLIPS_MODE", "local")
        clips = resolve_clips(gloss, mode)
        await websocket.send_text(json.dumps({
            "type": "clips",
            "gloss": gloss,
            "clips": clips,
        }))
        await websocket.send_text(json.dumps({
            "type": "transcript",
            "text": text,
        }))

    transcribe_task = asyncio.create_task(
        stream_transcribe(audio_queue, on_final_text, language)
    )

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg["type"] == "audio_chunk":
                pcm_bytes = base64.b64decode(msg["data"])
                await audio_queue.put(pcm_bytes)
                if "language" in msg:
                    language = msg["language"]

            elif msg["type"] == "stop":
                await audio_queue.put(None)
                break

    except WebSocketDisconnect:
        await audio_queue.put(None)
    finally:
        transcribe_task.cancel()
```

---

## backend/main.py — Add Only

```python
from routes.stream_isl import router as stream_isl_router
app.include_router(stream_isl_router)
```

---

## Extension File Structure

Create `samvad-extension/` at the repo root (same level as `samvad-ui/` and `backend/`):

```
samvad-extension/
  manifest.json
  config.js           ← BACKEND_URL lives here only
  background.js       ← Service worker: audio capture + WebSocket
  content.js          ← Injected into webpages: video detect + overlay
  popup.html          ← Extension popup UI
  popup.js            ← Popup logic
  overlay.css         ← ISL overlay styles
  icons/
    icon16.png
    icon48.png
    icon128.png
```

Create simple orange square PNG icons for now — they just need to exist for the extension to load.

---

## samvad-extension/manifest.json

```json
{
  "manifest_version": 3,
  "name": "Samvad AI — ISL Accessibility",
  "version": "1.0.0",
  "description": "Real-time Indian Sign Language overlay for any video",
  "permissions": ["tabCapture", "activeTab", "scripting", "storage"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["overlay.css"],
    "run_at": "document_idle"
  }],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

---

## samvad-extension/config.js

```javascript
// THE ONLY PLACE the backend URL is defined.
// Change this when deploying or using ngrok.
const BACKEND_URL = 'https://your-ngrok-url.ngrok-free.app';
// For local dev: run `ngrok http 8000` and paste the https URL above
export { BACKEND_URL };
```

---

## samvad-extension/content.js

```javascript
// Runs on every webpage. Detects videos and manages the ISL overlay.

let overlayEl = null;
let islVideoEl = null;
let currentClips = [];
let currentClipIndex = 0;

// --- Video Detection ---
function findPlayingVideo() {
  return [...document.querySelectorAll('video')].find(v => !v.paused && v.readyState >= 2);
}

function onVideoDetected() {
  chrome.runtime.sendMessage({ type: 'video_detected' });
}

function onVideoStopped() {
  chrome.runtime.sendMessage({ type: 'video_stopped' });
  hideOverlay();
}

// Watch for dynamically added videos (Instagram, YouTube)
const observer = new MutationObserver(() => {
  const video = findPlayingVideo();
  if (video) onVideoDetected();
});
observer.observe(document.body, { childList: true, subtree: true });

// Also catch videos that start playing after page load
document.addEventListener('play', (e) => {
  if (e.target.tagName === 'VIDEO') onVideoDetected();
}, true);

document.addEventListener('pause', (e) => {
  if (e.target.tagName === 'VIDEO') onVideoStopped();
}, true);

// --- Overlay ---
function createOverlay() {
  if (overlayEl) return;
  overlayEl = document.createElement('div');
  overlayEl.id = 'samvad-overlay';

  islVideoEl = document.createElement('video');
  islVideoEl.playsInline = true;
  islVideoEl.muted = false;
  islVideoEl.style.width = '100%';
  islVideoEl.style.height = '100%';
  islVideoEl.style.objectFit = 'cover';

  const label = document.createElement('div');
  label.id = 'samvad-word-label';
  label.style.cssText = 'position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:11px;color:white;background:rgba(0,0,0,0.5);padding:2px;';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'samvad-close';
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position:absolute;top:4px;right:6px;background:none;border:none;color:white;font-size:16px;cursor:pointer;z-index:10;';
  closeBtn.onclick = () => { overlayEl.style.display = 'none'; };

  overlayEl.appendChild(islVideoEl);
  overlayEl.appendChild(label);
  overlayEl.appendChild(closeBtn);
  document.body.appendChild(overlayEl);
  makeDraggable(overlayEl);
}

function positionOverlay() {
  const video = findPlayingVideo();
  if (!video || !overlayEl) return;
  const rect = video.getBoundingClientRect();
  overlayEl.style.left = `${rect.right - 240}px`;
  overlayEl.style.top = `${rect.bottom - 150}px`;
  overlayEl.style.display = 'block';
}

function hideOverlay() {
  if (overlayEl) overlayEl.style.display = 'none';
}

function makeDraggable(el) {
  let startX, startY, startLeft, startTop;
  el.addEventListener('mousedown', (e) => {
    if (e.target.id === 'samvad-close') return;
    startX = e.clientX; startY = e.clientY;
    startLeft = parseInt(el.style.left) || 0;
    startTop = parseInt(el.style.top) || 0;
    document.onmousemove = (e2) => {
      el.style.left = `${startLeft + e2.clientX - startX}px`;
      el.style.top = `${startTop + e2.clientY - startY}px`;
    };
    document.onmouseup = () => { document.onmousemove = null; };
  });
}

function playClips(clips) {
  currentClips = clips;
  currentClipIndex = 0;
  createOverlay();
  positionOverlay();
  playNext();
}

function playNext() {
  if (currentClipIndex >= currentClips.length || !islVideoEl) return;
  const clip = currentClips[currentClipIndex];
  islVideoEl.src = clip.url;
  islVideoEl.play().catch(() => {});
  const label = document.getElementById('samvad-word-label');
  if (label) label.textContent = clip.word;
  islVideoEl.onended = () => {
    currentClipIndex++;
    playNext();
  };
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'show_clips') {
    playClips(msg.clips);
  }
});
```

---

## samvad-extension/overlay.css

```css
#samvad-overlay {
  position: fixed;
  z-index: 2147483647;
  width: 220px;
  height: 140px;
  background: #1A1A2E;
  border-radius: 12px;
  border: 2px solid #E8531A;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  overflow: hidden;
  cursor: move;
  display: none;
}
```

---

## samvad-extension/background.js

```javascript
import { BACKEND_URL } from './config.js';

let ws = null;
let audioContext = null;
let mediaStream = null;
let isEnabled = false;
let currentLanguage = 'hi-IN';
let activeTabId = null;

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'video_detected' && isEnabled) {
    activeTabId = sender.tab.id;
    startCapture(sender.tab.id);
  }
  if (msg.type === 'video_stopped') {
    stopCapture();
  }
  if (msg.type === 'toggle') {
    isEnabled = msg.enabled;
    if (!isEnabled) stopCapture();
  }
  if (msg.type === 'language') {
    currentLanguage = msg.value;
  }
});

function startCapture(tabId) {
  if (ws && ws.readyState === WebSocket.OPEN) return; // already running

  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (!stream) return;
    mediaStream = stream;

    audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(1600, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
      }
      const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
      ws.send(JSON.stringify({ type: 'audio_chunk', data: base64, language: currentLanguage }));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    openWebSocket(tabId);
  });
}

function openWebSocket(tabId) {
  const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  ws = new WebSocket(`${wsUrl}/ws/stream-isl`);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'clips' && msg.clips.length > 0) {
      chrome.tabs.sendMessage(tabId, { type: 'show_clips', clips: msg.clips });
    }
  };

  ws.onerror = () => console.error('Samvad WS error');
  ws.onclose = () => {
    // Retry after 3 seconds if still enabled
    if (isEnabled) setTimeout(() => openWebSocket(tabId), 3000);
  };
}

function stopCapture() {
  if (ws) { ws.send(JSON.stringify({ type: 'stop' })); ws.close(); ws = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
}
```

---

## samvad-extension/popup.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 280px; padding: 16px; font-family: Arial, sans-serif; background: #FAF8F5; margin: 0; }
    h2 { color: #1A1A2E; font-size: 16px; margin: 0 0 12px; }
    .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    label { font-size: 13px; color: #333; }
    select { border: 1px solid #ddd; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
    .toggle { width: 40px; height: 22px; background: #ddd; border-radius: 11px; cursor: pointer; position: relative; transition: background 0.2s; }
    .toggle.on { background: #E8531A; }
    .toggle::after { content: ''; position: absolute; width: 18px; height: 18px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: left 0.2s; }
    .toggle.on::after { left: 20px; }
    .status { font-size: 11px; color: #888; }
    .status.active { color: #E8531A; }
    a { color: #E8531A; font-size: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <h2>🤟 Samvad AI</h2>
  <div class="row">
    <label>Enable ISL Overlay</label>
    <div class="toggle" id="toggle"></div>
  </div>
  <div class="row">
    <label>Language</label>
    <select id="language">
      <option value="hi-IN">Hindi</option>
      <option value="en-IN">English (India)</option>
      <option value="ta-IN">Tamil</option>
      <option value="te-IN">Telugu</option>
    </select>
  </div>
  <div class="row">
    <span class="status" id="status">Idle</span>
    <a href="http://localhost:5173" target="_blank">Open Samvad AI</a>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

---

## samvad-extension/popup.js

```javascript
const toggle = document.getElementById('toggle');
const langSelect = document.getElementById('language');
const statusEl = document.getElementById('status');

// Load saved state
chrome.storage.local.get(['enabled', 'language'], (data) => {
  if (data.enabled) toggle.classList.add('on');
  if (data.language) langSelect.value = data.language;
});

toggle.addEventListener('click', () => {
  const isOn = toggle.classList.toggle('on');
  chrome.storage.local.set({ enabled: isOn });
  chrome.runtime.sendMessage({ type: 'toggle', enabled: isOn });
  statusEl.textContent = isOn ? 'Listening...' : 'Idle';
  statusEl.className = isOn ? 'status active' : 'status';
});

langSelect.addEventListener('change', () => {
  chrome.storage.local.set({ language: langSelect.value });
  chrome.runtime.sendMessage({ type: 'language', value: langSelect.value });
});
```

---

## Loading the Extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `samvad-extension/` folder
5. Pin the extension to the toolbar

To reload after code changes: click the ↺ icon on the extension card.

---

## Testing Checklist

- [ ] Extension loads in Chrome with no manifest errors (check chrome://extensions)
- [ ] Go to YouTube → play a Hindi/English video → enable ISL in popup → overlay appears within 3 seconds
- [ ] ISL clips appear and correspond to spoken words
- [ ] Click × on overlay → dismisses cleanly
- [ ] Drag overlay to new position → stays there
- [ ] Disable ISL in popup → overlay disappears, audio capture stops
- [ ] Go to Instagram → scroll Reels → overlay follows each new reel

---

## Definition of Done

- [ ] Extension loads without errors in Chrome Developer Mode
- [ ] Works on YouTube — ISL overlay appears when video plays and extension is enabled
- [ ] Works on Instagram Reels — overlay follows as user scrolls
- [ ] Overlay is draggable and dismissable
- [ ] Disabling via popup fully stops audio capture
- [ ] WebSocket backend endpoint handles connections without crashing
- [ ] No Phase 1 or Phase 2 functionality broken

**Only after all boxes are checked: open PHASE4.md**