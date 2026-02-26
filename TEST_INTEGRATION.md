# Quick Integration Test

## Visual Test Checklist

### 1. Check Both Servers Are Running

**Backend:**
```bash
# Should see: INFO: Uvicorn running on http://127.0.0.1:8000
```

**Frontend:**
```bash
# Should see: Local: http://localhost:5173/
```

### 2. Open Browser
Navigate to: `http://localhost:5173`

### 3. Visual Checks

#### Header (Top of Page)
- [ ] "Samvad AI" logo visible
- [ ] Navigation tabs: Live Session Mode, Streaming, Assistive, Replay
- [ ] Backend status indicator showing "Backend Online" (green dot)
- [ ] Dark mode toggle button
- [ ] "Start Session" button

#### Live Session Page
- [ ] Video player with PIP signer view
- [ ] "LIVE STREAM" badge with pulsing red dot
- [ ] "Connect Live Stream" button (gradient style)
- [ ] Reverse Mode toggle
- [ ] Language selector showing "English"
- [ ] Live Context panel with tags
- [ ] Translation Deck on the right
- [ ] Avatar selection (Maya, Arjun, Priya)
- [ ] Signing Speed slider

### 4. Test Backend Connection

**Click "Connect Live Stream" button:**

1. Button should change to "Connecting..." with spinner
2. After ~1 second, button shows "Connected!" with green checkmark
3. Success message appears below button
4. After 3 seconds, button returns to normal

**Open Browser Console (F12):**
- Should see: `Health Check Response: {status: "Samvad Backend is alive", ...}`
- Should see: `Status Response: {backend: "operational", ...}`
- No red error messages

### 5. Test Backend Status Indicator

**In the header:**
- Green dot with "Backend Online" should be visible
- Click it to manually refresh
- Should update immediately

### 6. Test Dark Mode

**Click dark mode toggle:**
- Background should change to dark
- Text should change to light
- All components should adapt to dark theme
- Backend status indicator should remain visible

### 7. Test Language Selector

**Click language dropdown:**
- Should show 22 Indian languages
- Each with English and native script names
- Click any language to select it
- Dropdown should close

### 8. Test Other Pages

**Click "Streaming" tab:**
- Should show Streaming Mode page
- Feature cards visible
- "Start Streaming" button present

**Click "Assistive" tab:**
- Should show Assistive Mode page
- Voice to Sign and Sign to Voice cards
- Action buttons visible

**Click "Replay" tab:**
- Should show Replay Library
- Sample recordings listed
- Search bar present

## Success Criteria

✅ All visual elements render correctly
✅ Backend status shows "Online"
✅ "Connect Live Stream" button works
✅ Console shows successful API responses
✅ No CORS errors
✅ Dark mode works
✅ Language selector works
✅ All pages navigate correctly

## If Something Fails

### Backend Status Shows "Offline"
1. Check backend terminal - is it running?
2. Try: `curl http://localhost:8000/api/health`
3. Restart backend if needed

### "Connect Live Stream" Shows Error
1. Check browser console for error details
2. Verify backend is running on port 8000
3. Check CORS configuration in backend/main.py

### Page Doesn't Load
1. Check frontend terminal - is Vite running?
2. Try refreshing the page
3. Clear browser cache
4. Restart frontend if needed

## Quick Commands

**Restart Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Restart Frontend:**
```bash
cd samvad-ui
npm run dev
```

**Test Backend Directly:**
```bash
curl http://localhost:8000/api/health
```
