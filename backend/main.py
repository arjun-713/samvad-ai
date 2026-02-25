from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Samvad AI Backend",
    description="Sign language interpretation API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Samvad AI Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint for frontend connectivity test"""
    return {
        "status": "Samvad Backend is alive",
        "service": "healthy",
        "timestamp": "2026-02-25"
    }

@app.get("/api/status")
def get_status():
    """Get detailed system status"""
    return {
        "backend": "operational",
        "aws_configured": bool(os.getenv("AWS_ACCESS_KEY_ID")),
        "services": {
            "transcribe": "ready",
            "polly": "ready",
            "bedrock": "ready"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
