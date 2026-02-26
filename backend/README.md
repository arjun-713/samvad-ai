# Samvad AI Backend

FastAPI backend for sign language interpretation services.

## Setup

### 1. Create Virtual Environment

```bash
py -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your AWS credentials:

```bash
copy .env.example .env
```

Edit `.env` with your actual AWS credentials (never commit this file).

### 5. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

Or:

```bash
py main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint with API info
- `GET /api/health` - Health check endpoint
- `GET /api/status` - Detailed system status
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## Testing

Test the health endpoint:

```bash
curl http://localhost:8000/api/health
```

Or visit `http://localhost:8000/docs` for interactive testing.

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite alternate)
- `http://localhost:3000` (React default)

## AWS Services

This backend integrates with:
- AWS Transcribe (speech-to-text)
- AWS Polly (text-to-speech)
- AWS Bedrock (AI/ML models)
- AWS S3 (storage)

Make sure your IAM user has the necessary permissions.
