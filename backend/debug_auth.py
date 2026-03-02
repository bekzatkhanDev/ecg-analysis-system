#!/usr/bin/env python3
"""
Debug script to check authentication endpoint issues.
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.main import app

def debug_auth_endpoints():
    """Debug authentication endpoints step by step."""
    print("Debugging authentication endpoints...")
    
    client = TestClient(app)
    
    # Test registration
    register_data = {
        "email": "debuguser@example.com",
        "password": "debugpassword123",
        "full_name": "Debug User"
    }
    
    print("Testing registration...")
    response = client.post("/api/auth/register", json=register_data)
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✓ Registration successful")
        user_data = response.json()
        print(f"User data: {user_data}")
    else:
        print("✗ Registration failed")
    
    # Test login
    login_data = {
        "email": "debuguser@example.com",
        "password": "debugpassword123"
    }
    
    print("\nTesting login...")
    response = client.post("/api/auth/login", json=login_data)
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✓ Login successful")
        token_data = response.json()
        print(f"Token data: {token_data}")
    else:
        print("✗ Login failed")

if __name__ == "__main__":
    debug_auth_endpoints()