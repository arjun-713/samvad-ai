# FRONTEND_CONTEXT.md — Existing UI Reference

> Read this before touching any file in `samvad-ui/`. Your job is to wire up what exists, not redesign it.

---

## The Golden Rule

The UI is already built and looks polished. **You are not a designer here.** Do not change:
- Colors (primary orange: `#E8531A`, background cream, dark navy accents)
- Font sizes, weights, or families
- Component dimensions or border radii
- Tab names or tab order
- Spacing, padding, or margins on existing elements
- Any existing animation or transition

If you need to add a new UI element (e.g. a button), match the existing style exactly. Look at what's already there and copy the pattern.

---

## App Structure

The app is a **single-page React app** with 4 tabs in the top navigation bar:

| Tab | Name | Purpose |
|---|---|---|
| 1 | Live Session Mode | Text-to-ISL (Phase 1) + Reverse Mode toggle (Phase 4) |
| 2 | Streaming | Video upload and PiP playback (Phase 2) |
| 3 | Assistive | Video upload reverse mode (Phase 4 variant) |
| 4 | Replay | Reserved — do not touch |

---

## Tab 1: Live Session Mode (Primary Tab)

This is the main tab. It has a **split layout**:

### Left Side — Video Area
- Large video area with a dark cinematic overlay
- **"LIVE STREAM" badge** in top-left corner of the video area
- **Signer PiP card** — positioned top-right inside the video area
  - Currently shows a static 3D avatar illustration
  - Has a label "Signer" at the bottom with a green dot
  - **Phase 1 work: replace the static image with a real `<video>` element that plays ISL clips**
  - Do not change the card's size, position, border, or background
- **"Connect Live Stream" button** — below the video area, left-aligned
  - Currently pings backend health endpoint
  - Do not change its behavior — it stays as-is
- **Reverse Mode toggle** — to the right of the Connect button
  - When toggled ON: switches the left panel to webcam mode (Phase 4)
  - When toggled OFF: returns to video area mode
- **Language selector** — shows "English" dropdown to the right of Reverse Mode toggle

### Right Side — Translation Deck
- Header: "Translation Deck" with a "Signing..." status pill (top right, orange text)
- **Textarea** — placeholder: "Enter text to translate..."
  - This is the primary input for Phase 1
  - Do not change its size or styling
  - Wire up its value for the API call
- Below the textarea: two small utility buttons
  - "Interpret Tone" (with icon)
  - "Summarize Key Points" (with icon)
  - These buttons are UI placeholders — do not implement them in Phase 1
- **Assistant Persona selector** — labeled "ASSISTANT PERSONA"
  - Three circular avatar thumbnails: Maya (selected, orange ring), Arjun, Priya
  - Clicking selects a persona — send the selected persona name with the API call
  - Do not change the thumbnails or the selection styling
- **Signing Speed slider** — labeled "SIGNING SPEED" with "1.2x" on the right
  - Range: 0.5x to 2.0x
  - Wire up its value and send with the API call
  - Use the value as `video.playbackRate` when playing clips
- Accessibility note at the bottom — do not touch

### What to ADD in Phase 1 (Live Session Mode only)
1. A **"Translate to ISL" button** — place it directly below the textarea, above the Interpret Tone row
   - Style: same orange filled button style as "Start Session" button in the top-right header
   - Text: "Translate to ISL"
   - States: disabled (textarea empty), loading ("Translating..."), default
2. A **gloss sequence display** — below the Translate button or below the Signer PiP card
   - Shows the ISL tokens as small grey pill chips (e.g. `MORNING` `GOOD` `HOW` `YOU`)
   - Highlight the currently-signing token in orange
   - Only visible after a successful translation

---

## Tab 2: Streaming

Currently empty/placeholder. **Phase 2 owns this tab entirely.**

When building Phase 2, add to this tab:
- Drag-and-drop video upload zone
- Language selector
- "Process Video" button
- Upload progress bar
- Processing status indicator
- Video player with ISL PiP overlay (after processing completes)

Match the orange/cream color scheme. Do not add a header or nav — the tab itself is the container.

---

## Tab 3: Assistive

Currently empty/placeholder. **Phase 4 (video upload variant of reverse mode) owns this tab.**

---

## Tab 4: Replay

Do not touch. Reserved for future use.

---

## Color Reference

| Token | Value | Used For |
|---|---|---|
| Primary orange | `#E8531A` | Buttons, highlights, active states, borders |
| Dark navy | `#1A1A2E` | Headers, text, dark backgrounds |
| Cream/off-white | `#FAF8F5` | App background |
| Light grey | `#F5F5F5` | Card backgrounds, inactive states |
| Green dot | `#22C55E` | Online/active indicator |
| Text dark | `#333333` | Body text |
| Text muted | `#888888` | Placeholders, secondary text |

---

## Existing Backend Connection

The frontend already has a backend connection check. The "Backend Offline" / "Backend Online" indicator in the top-right header pings `/api/health`. This already works — do not change it.

The existing backend has:
- `GET /api/health` — returns `{ status: "ok" }`
- `GET /api/status` — returns AWS credential status
- `POST /api/transcribe` — accepts audio file, uses Transcribe (already implemented)

**Phase 1 adds:** `POST /api/text-to-isl`
**Phase 2 adds:** `POST /api/upload-video`, `GET /api/video-status/{job_id}`
**Phase 3 adds:** `WS /ws/stream-isl`
**Phase 4 adds:** `POST /api/reverse-mode/text-to-speech`, `POST /api/reverse-mode/video-to-speech`

---

## File Naming Conventions (Frontend)

Follow what already exists:
- Components: `PascalCase.tsx`
- Hooks: `use{Name}.ts` in `src/hooks/`
- Services: `{name}Service.ts` in `src/services/`
- Types/interfaces: `{name}.types.ts` or inline in the file that uses them
- Static data: `src/data/{name}.json`

---

## What You Must Never Do to the Frontend

- Do not install new UI libraries (no MUI, no Chakra, no Ant Design)
- Do not add React Router if it does not already exist
- Do not add Redux or Zustand unless already present
- Do not change `index.html`, `vite.config.ts`, or `tailwind.config.*` unless a phase doc explicitly requires it
- Do not add new pages — everything lives within the 4 existing tabs
- Do not change the top navigation bar component at all