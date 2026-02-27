# FRONTEND.md — Samvad AI Frontend Developer Guide
## Role: React/TypeScript Frontend Agent

Read `INSTRUCTIONS.md` first for full project context.

---

## YOUR MISSION

Build the complete React/TypeScript frontend in `samvad-ui/`. Every screen must be functional — no placeholder UI. The app must connect to the FastAPI backend at `http://localhost:8000`.

---

## SETUP COMMANDS

```bash
cd samvad-ui
npm install
npm run dev   # Starts on http://localhost:3000
```

If `samvad-ui` doesn't exist yet or needs to be recreated:
```bash
npm create vite@latest samvad-ui -- --template react-ts
cd samvad-ui
npm install tailwindcss @tailwindcss/vite
npm install axios socket.io-client react-webcam react-player
npm install lucide-react
```

**`vite.config.ts`** — Add proxy to avoid CORS issues:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true }
    }
  }
})
```

---

## TYPESCRIPT TYPES — `src/types/index.ts`

Define ALL types here first:

```typescript
export interface ISLResult {
  gloss: string;           // "TOMORROW MARKET I-GO VEGETABLES BUY"
  emotional_tone: string;  // "neutral" | "happy" | "sad" | "urgent" | "sarcastic"
  avatar_url: string;      // URL to ISL video clip or "" for CSS avatar
  duration_seconds: number;
  cultural_notes: string[];
  name_signs: Record<string, string>;
  emphasis_words: string[];
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

export interface ProcessedVideo {
  original_url: string;
  isl_overlay_url: string;
  subtitles: SubtitleEntry[];
  dubbed_audio: DubbedAudio[];
  processing_time_ms: number;
}

export interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
  isl_gloss: string;
}

export interface DubbedAudio {
  language: string;
  language_code: string;
  url: string;
}

export interface PipelineStatus {
  stage: 'idle' | 'transcribing' | 'transcreating' | 'generating_avatar' | 'dubbing' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

export interface StreamChunk {
  audio_base64: string;
  timestamp: number;
  sequence: number;
}

export interface ReverseModeResult {
  detected_signs: string[];
  generated_text: string;
  audio_url: string;
  confidence: number;
}

export interface AppSettings {
  avatar_gender: 'female' | 'male' | 'neutral';
  signing_speed: 0.5 | 1.0 | 1.5 | 2.0;
  pip_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  pip_size: 'small' | 'medium' | 'large';
  target_languages: string[];
  show_isl_gloss: boolean;
  reverse_mode: boolean;
}
```

---

## API CLIENT — `src/api/client.ts`

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,
})

// Add request interceptor for loading states
api.interceptors.request.use((config) => {
  return config
})

export const islApi = {
  // Flow 1: Text to ISL
  textToISL: (text: string, language: string = 'hi-IN') =>
    api.post<ISLResult>('/api/text-to-isl', { text, language }),

  // Flow 2: Process uploaded video
  processVideo: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData()
    formData.append('video', file)
    return api.post<ProcessedVideo>('/api/process-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round(e.loaded / e.total * 100))
      }
    })
  },

  // Get supported languages
  getLanguages: () => api.get<{code: string, name: string}[]>('/api/languages'),

  // Health check
  health: () => api.get('/api/health'),
}

export default api
```

---

## WEBSOCKET HOOK — `src/hooks/useWebSocket.ts`

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ISLResult, ReverseModeResult, PipelineStatus } from '../types'

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [latestISL, setLatestISL] = useState<ISLResult | null>(null)
  const [reverseResult, setReverseResult] = useState<ReverseModeResult | null>(null)
  const [status, setStatus] = useState<PipelineStatus>({ stage: 'idle', message: '', progress: 0 })

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))
    
    // Listen for ISL results from live stream processing
    socket.on('isl_result', (data: ISLResult) => setLatestISL(data))
    
    // Listen for reverse mode results
    socket.on('reverse_result', (data: ReverseModeResult) => setReverseResult(data))
    
    // Listen for pipeline status updates
    socket.on('pipeline_status', (data: PipelineStatus) => setStatus(data))

    return () => { socket.disconnect() }
  }, [])

  const sendAudioChunk = useCallback((audioBase64: string, sequence: number) => {
    socketRef.current?.emit('audio_chunk', { audio_base64: audioBase64, sequence, timestamp: Date.now() })
  }, [])

  const sendVideoFrame = useCallback((frameBase64: string) => {
    socketRef.current?.emit('video_frame', { frame_base64: frameBase64, timestamp: Date.now() })
  }, [])

  const startLiveStream = useCallback((settings: { language: string }) => {
    socketRef.current?.emit('start_stream', settings)
  }, [])

  const stopLiveStream = useCallback(() => {
    socketRef.current?.emit('stop_stream')
  }, [])

  return { isConnected, latestISL, reverseResult, status, sendAudioChunk, sendVideoFrame, startLiveStream, stopLiveStream }
}
```

---

## COMPONENT SPECIFICATIONS

### `src/App.tsx` — Main Layout

The app has a dark theme (`#0F1117` background, green accent `#A3E635`). Structure:

```
┌─────────────────────────────────────────────────────┐
│  SAMVAD AI  [logo]      [Status: Live] [Settings ⚙] │
├─────────────┬───────────────────────────────────────┤
│             │                                         │
│  SIDEBAR    │   MAIN CONTENT AREA                    │
│  ─────────  │                                         │
│  📹 Live    │   (switches based on active tab)       │
│  📁 Upload  │                                         │
│  ✏️ Text    │                                         │
│  🔄 Reverse │                                         │
│             │                                         │
└─────────────┴───────────────────────────────────────┘
```

The sidebar has 4 mode buttons. Active mode determines what the main content shows. Use `useState` for active mode.

### `src/components/LiveStream.tsx` — Flow 2

**What it must do:**
1. Show a "Start Live Stream" button prominently
2. On click: request webcam via `react-webcam`, show live camera feed (640x480 minimum)
3. Show language selector (default: Hindi)
4. Show ISL avatar PiP overlay in bottom-right of camera feed
5. Show real-time ISL gloss text below the camera
6. Show pipeline status indicator ("Transcribing... | Transcreating... | Generating Avatar...")
7. Show "Stop Stream" button while active

**Implementation notes:**
- Use `react-webcam` ref to capture frames
- Capture audio using `MediaRecorder` API every 3 seconds
- Convert audio blob to base64 and send via WebSocket `sendAudioChunk`
- When `latestISL` updates, show the new avatar in the PiP

```typescript
// Audio capture pattern:
const mediaRecorder = useRef<MediaRecorder | null>(null)
const audioChunks = useRef<Blob[]>([])

const startAudioCapture = (stream: MediaStream) => {
  const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
  recorder.ondataavailable = (e) => audioChunks.current.push(e.data)
  recorder.onstop = async () => {
    const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
    const base64 = await blobToBase64(blob)
    sendAudioChunk(base64, sequenceRef.current++)
    audioChunks.current = []
    recorder.start()
    setTimeout(() => recorder.stop(), 3000)
  }
  recorder.start()
  setTimeout(() => recorder.stop(), 3000)
  mediaRecorder.current = recorder
}

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((res) => {
  const reader = new FileReader()
  reader.onloadend = () => res((reader.result as string).split(',')[1])
  reader.readAsDataURL(blob)
})
```

### `src/components/VideoUpload.tsx` — Flow 3

**What it must do:**
1. Drag-and-drop zone + file picker button (accepts `.mp4, .avi, .mov, .mkv`)
2. Show file name + size after selection
3. Show upload progress bar during upload
4. Show pipeline progress stages as cards that light up:
   - [1] Uploading → [2] Transcribing → [3] Cultural Adaptation → [4] Generating ISL → [5] Dubbing Audio → [6] Ready
5. After processing: show video player with ISL avatar overlay + language selector dropdown for dubbed audio
6. Show ISL gloss text synchronized with playback (use subtitle timestamps)

**Video player with overlay:**
```tsx
<div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
  {/* Main video */}
  <ReactPlayer url={processedVideo.original_url} width="100%" height="100%" controls />
  
  {/* ISL Avatar PiP - positioned bottom-right */}
  <ISLAvatar
    className="absolute bottom-4 right-4 w-1/4 rounded-xl border-2 border-green-400"
    result={currentISLSegment}
  />
  
  {/* ISL Gloss subtitle */}
  <div className="absolute bottom-16 left-0 right-0 text-center">
    <span className="bg-black/70 text-green-400 font-mono text-sm px-3 py-1 rounded">
      {currentGloss}
    </span>
  </div>
</div>
```

### `src/components/TextToISL.tsx` — Flow 1

**What it must do:**
1. Large textarea with placeholder "Type what you want the AI assistant to sign..." (max 500 chars with counter)
2. Language selector (Hindi, English, Tamil, Telugu, Bengali, etc.)
3. "Translate to ISL" button
4. Show ISL avatar playing the result
5. Show ISL gloss below the avatar
6. Show "cultural notes" if any (collapsible)
7. Quick phrase buttons: "How can I help you today?" | "Where is the nearest station?" | "Thank you" | "Please wait"
8. Signing speed control slider (0.5x, 1x, 1.5x, 2x)

### `src/components/ISLAvatar.tsx` — Reusable Avatar Player

This is used in ALL modes as the PiP overlay. Props:
```typescript
interface ISLAvatarProps {
  result: ISLResult | null;
  speed?: number;
  className?: string;
  showGloss?: boolean;
}
```

**Behavior:**
- If `result.avatar_url` is a valid URL: play the MP4 video in a loop
- If `result.avatar_url` is empty: show the CSS animated fallback avatar
- CSS fallback avatar: a simple SVG person silhouette with animated hand positions + the ISL gloss words displayed prominently
- Always show `result.gloss` text if `showGloss` is true
- Show `result.emotional_tone` as a colored badge (green=neutral, yellow=happy, red=urgent, etc.)

**CSS animated fallback avatar (always works):**
```tsx
const CSSAvatar = ({ gloss, tone }: { gloss: string; tone: string }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-900 rounded-xl p-4">
    {/* Simple SVG avatar */}
    <svg viewBox="0 0 100 150" className="w-20 h-28 mb-2">
      {/* Head */}
      <circle cx="50" cy="25" r="18" fill="#D4A574" />
      {/* Body */}
      <rect x="35" y="43" width="30" height="40" rx="4" fill="#1e3a5f" />
      {/* Arms - animated based on tone */}
      <line x1="35" y1="50" x2="15" y2="70" stroke="#D4A574" strokeWidth="6" strokeLinecap="round"
        className={tone === 'urgent' ? 'animate-bounce' : ''} />
      <line x1="65" y1="50" x2="85" y2="70" stroke="#D4A574" strokeWidth="6" strokeLinecap="round" />
      {/* Hands */}
      <circle cx="15" cy="72" r="6" fill="#D4A574" />
      <circle cx="85" cy="72" r="6" fill="#D4A574" />
    </svg>
    {/* Gloss words - highlight current word */}
    <div className="text-center">
      {gloss.split(' ').map((word, i) => (
        <span key={i} className="inline-block mx-1 px-2 py-0.5 rounded bg-green-900 text-green-300 text-xs font-mono mb-1">
          {word}
        </span>
      ))}
    </div>
  </div>
)
```

### `src/components/ReverseMode.tsx` — Flow 4

**What it must do:**
1. Show "Reverse Mode" header with explanation: "For deaf creators — sign into camera to generate voice"
2. Show webcam feed
3. Show hand detection overlay (draw green bounding box around detected hands)
4. Show detected signs in real-time as chips/tags
5. Show generated text in a speech bubble
6. Show audio playback controls for the generated voice
7. Show confidence percentage

### `src/components/StatusPanel.tsx` — Pipeline Status

Reusable component showing pipeline stages. Each stage glows when active:
```
[●] Listening  →  [●] Transcribing  →  [●] Adapting  →  [●] Signing  →  [●] Done
```
Use green for complete, yellow for in-progress (pulsing animation), gray for pending.

### `src/components/LanguageSelector.tsx`

Dropdown with flags and language names for all 22 supported Indian languages. Selected language = target for audio dubbing.

---

## SETTINGS PANEL

Accessible from the gear icon. Show as a right sidebar drawer with:
1. **Avatar selection:** 3 avatar options (female/male/neutral) shown as thumbnails
2. **Signing speed:** Slider (0.5x to 2x)
3. **Avatar size:** Small/Medium/Large
4. **Avatar position:** PiP corner selector (visual 2x2 grid to click)
5. **Show ISL Gloss:** Toggle
6. **Target languages:** Multi-select checkboxes for dubbing languages
7. **Accessibility:** Toggle high contrast, large text

Persist settings to `localStorage`.

---

## VISUAL DESIGN REQUIREMENTS

Match the Samvad AI design from the PPT:
- Background: `#0F1117` (very dark navy)
- Primary accent: `#A3E635` (lime green — used in the hackathon branding)
- Secondary accent: `#7C3AED` (purple)
- Card backgrounds: `#1A1F2E`
- Borders: `#2D3748`
- Text primary: `#F7FAFC`
- Text secondary: `#A0AEC0`
- Error: `#FC8181`
- Success: `#68D391`

Font: Use `Inter` from Google Fonts for UI, `JetBrains Mono` for ISL gloss text.

The UI should look like a **professional broadcast tool**, not a generic React app.

---

## ERROR HANDLING

Every API call must have:
1. Loading state (spinner or skeleton)
2. Error state (red card with error message and "Retry" button)
3. Empty state (if no result yet)

Use a custom hook `useISLPipeline`:
```typescript
// src/hooks/useISLPipeline.ts
export function useISLPipeline() {
  const [status, setStatus] = useState<PipelineStatus>({ stage: 'idle', message: 'Ready', progress: 0 })
  const [result, setResult] = useState<ISLResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const processText = async (text: string, language: string) => {
    setLoading(true)
    setError(null)
    setStatus({ stage: 'transcreating', message: 'Adapting cultural context...', progress: 30 })
    try {
      const res = await islApi.textToISL(text, language)
      setResult(res.data)
      setStatus({ stage: 'complete', message: 'Done!', progress: 100 })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Something went wrong. Is the backend running?')
      setStatus({ stage: 'error', message: 'Pipeline failed', progress: 0 })
    } finally {
      setLoading(false)
    }
  }

  return { status, result, error, loading, processText }
}
```

---

## WHAT TO CHECK BEFORE CONSIDERING FRONTEND DONE

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without TypeScript errors
- [ ] Health check call to backend shows connection status in header
- [ ] Text-to-ISL: type text, click button, avatar appears within 5 seconds
- [ ] Video Upload: upload a video file, see all 6 pipeline stages light up, video plays with overlay
- [ ] Live Stream: click start, camera activates, ISL results appear every 3-5 seconds
- [ ] Reverse Mode: camera activates, hands detected with bounding box
- [ ] Settings panel opens, changes persist on page refresh
- [ ] All error states display correctly (test by stopping backend)
- [ ] Mobile-responsive layout (test at 375px width)
- [ ] No `console.error` warnings during normal operation