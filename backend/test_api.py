"""
Simple test script to verify backend endpoints
Run this after starting the server with: uvicorn main:app --reload
"""

import requests

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("Testing Samvad AI Backend Endpoints\n")
    print("=" * 50)
    
    # Test root endpoint
    print("\n1. Testing root endpoint (/)...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test health check
    print("\n2. Testing health check (/api/health)...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test status endpoint
    print("\n3. Testing status endpoint (/api/status)...")
    try:
        response = requests.get(f"{BASE_URL}/api/status")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "=" * 50)
    print("\nAll tests completed!")
    print(f"\nAPI Documentation available at: {BASE_URL}/docs")

if __name__ == "__main__":
    test_endpoints()
