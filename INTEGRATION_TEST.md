# Frontend-Backend Integration Test Guide

## Prerequisites
- Backend running at `http://localhost:8000`
- Frontend running at `http://localhost:5173`

## Test Checklist

### 1. Backend Health Check ✓
**Test:** Verify backend is running
```bash
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "Samvad Backend is alive",
  "service": "healthy",
  "timestamp": "2026-02-25"
}
```

### 2. CORS Configuration ✓
**Test:** Verify CORS headers allow frontend requests

**Expected:** No CORS errors in browser console when frontend makes requests

### 3. Frontend Connection Test
**Test:** Click "Connect Live Stream" button on Live Session page

**Steps:**
1. Open `http://localhost:5173` in browser
2. Navigate to Live Session Mode (default page)
3. Click "Connect Live Stream" button
4. Check browser console (F12)

**Expected Behavior:**
- Button shows "Connecting..." with spinner
- Console logs show:
  - `Health Check Response: {status: "Samvad Backend is alive", ...}`
  - `Status Response: {backend: "operational", ...}`
- Button changes to "Connected!" with green checkmark
- Success message appears: "✓ Samvad Backend is alive"
- After 3 seconds, button returns to normal state

**If Connection Fails:**
- Button shows "Connection Failed" with red X
- Error message appears: "✗ Backend connection failed. Is the server running?"
- Check that backend is running on port 8000

### 4. Backend Status Indicator
**Test:** Check the backend status indicator in header

**Location:** Top right of header, next to dark mode toggle

**Expected:**
- Green dot with "Backend Online" if backend is running
- Red dot with "Backend Offline" if backend is not running
- Click to manually refresh status
- Auto-refreshes every 30 seconds

### 5. API Documentation
**Test:** Access interactive API docs

**URL:** `http://localhost:8000/docs`

**Expected:**
- Swagger UI interface loads
- Shows all available endpoints
- Can test endpoints directly from browser

### 6. Browser Console Verification
**Test:** Check for errors in browser console

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Connect Live Stream"

**Expected:**
- No CORS errors
- No 404 errors
- Successful API responses logged

## Common Issues & Solutions

### Issue: CORS Error
**Symptom:** Browser console shows CORS policy error

**Solution:**
1. Verify backend is running
2. Check CORS configuration in `backend/main.py`
3. Ensure frontend URL is in `allow_origins` list

### Issue: Connection Refused
**Symptom:** "Connection Failed" message appears

**Solution:**
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Verify port 8000 is not blocked by firewall
3. Check backend logs for errors

### Issue: 404 Not Found
**Symptom:** API endpoints return 404

**Solution:**
1. Verify endpoint URLs in `samvad-ui/src/services/api.ts`
2. Check backend routes in `backend/main.py`
3. Ensure API_BASE_URL is correct

## Success Criteria
✅ Backend responds to health checks
✅ Frontend can connect to backend without CORS errors
✅ "Connect Live Stream" button works correctly
✅ Backend status indicator shows correct status
✅ Console logs show successful API responses
✅ No errors in browser console

## Next Steps After Integration
1. Implement AWS service integrations
2. Add authentication/authorization
3. Implement real-time streaming with WebSockets
4. Add error handling and retry logic
5. Implement loading states for all API calls
