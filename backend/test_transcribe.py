"""
Test script for transcribe endpoint
Can be run with or without AWS credentials (mock mode)
"""
import requests
import os

API_BASE_URL = "http://localhost:8000"

def test_transcribe_endpoint():
    """Test the /api/transcribe endpoint"""
    
    print("Testing /api/transcribe endpoint...")
    print("=" * 50)
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE_URL}/api/health")
        print(f"✓ Backend is running: {response.json()['status']}")
    except requests.exceptions.ConnectionError:
        print("✗ Backend is not running. Start it with: uvicorn main:app --reload")
        return
    
    # Check AWS configuration
    status_response = requests.get(f"{API_BASE_URL}/api/status")
    aws_configured = status_response.json()['aws_configured']
    
    if aws_configured:
        print("✓ AWS credentials are configured")
        print("\nTo test with real audio file:")
        print("  curl -X POST http://localhost:8000/api/transcribe \\")
        print("    -F 'audio=@test_audio.mp3' \\")
        print("    -F 'language_code=hi-IN'")
    else:
        print("⚠ AWS credentials not configured")
        print("\nTo configure AWS:")
        print("  1. Copy .env.example to .env")
        print("  2. Add your AWS credentials")
        print("  3. Restart the backend")
    
    print("\n" + "=" * 50)
    print("Endpoint ready at: POST /api/transcribe")
    print("API Documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    test_transcribe_endpoint()
