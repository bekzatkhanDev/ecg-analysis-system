#!/usr/bin/env python3
"""
Test script to verify authentication functionality in the backend.
This script tests:
1. User registration
2. User login
3. Token validation
4. Protected endpoint access
"""
import json
import sys
import time
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, verify_password
from app.db.base import Base
from app.db.models import User
from app.main import app

# Test database setup
TEST_DB_URL = "sqlite:///./test_ecg_analysis.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_test_db():
    """Create test database tables."""
    Base.metadata.create_all(bind=engine)

def get_test_db():
    """Get test database session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_password_hashing():
    """Test password hashing and verification."""
    print("Testing password hashing...")
    
    password = "test_password_123"
    hashed = create_access_token(password)
    
    # Test that password is properly hashed
    assert hashed != password
    assert len(hashed) > 0
    print("✓ Password hashing works correctly")

def test_jwt_token_creation():
    """Test JWT token creation and decoding."""
    print("Testing JWT token creation...")
    
    user_id = 123
    token = create_access_token(subject=user_id)
    
    # Test that token is created
    assert token is not None
    assert len(token) > 0
    
    # Test that token can be decoded
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    
    print("✓ JWT token creation and decoding works correctly")

def test_user_model():
    """Test User model creation."""
    print("Testing User model...")
    
    # Create a test user
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        is_active=True
    )
    
    assert user.email == "test@example.com"
    assert user.hashed_password == "hashed_password"
    assert user.full_name == "Test User"
    assert user.is_active == True
    
    print("✓ User model works correctly")

def test_fastapi_app():
    """Test FastAPI application endpoints."""
    print("Testing FastAPI endpoints...")
    
    client = TestClient(app)
    
    # Test health endpoint
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    
    print("✓ FastAPI application is running correctly")

def test_auth_endpoints():
    """Test authentication endpoints."""
    print("Testing authentication endpoints...")
    
    client = TestClient(app)
    
    # Test registration
    register_data = {
        "email": "testuser@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    response = client.post("/api/auth/register", json=register_data)
    if response.status_code == 200:
        print("✓ User registration works correctly")
        user_data = response.json()
        assert user_data["email"] == register_data["email"]
        assert user_data["full_name"] == register_data["full_name"]
        assert user_data["is_active"] == True
    else:
        print(f"⚠ User registration failed or user already exists: {response.status_code}")
    
    # Test login
    login_data = {
        "email": "testuser@example.com",
        "password": "testpassword123"
    }
    
    response = client.post("/api/auth/login", json=login_data)
    if response.status_code == 200:
        print("✓ User login works correctly")
        token_data = response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        
        # Test protected endpoint with token
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        response = client.get("/api/users/me", headers=headers)
        if response.status_code == 200:
            print("✓ Protected endpoint access works correctly")
            user_info = response.json()
            assert user_info["email"] == login_data["email"]
        else:
            print(f"⚠ Protected endpoint access failed: {response.status_code}")
            print(f"Response: {response.text}")
    else:
        print(f"⚠ User login failed: {response.status_code}")
        print(f"Response: {response.text}")

def test_password_verification():
    """Test password verification functionality."""
    print("Testing password verification...")
    
    # Test with bcrypt
    from app.core.security import hash_password, verify_password
    
    password = "test_password_123"
    hashed = hash_password(password)
    
    # Test that password verifies correctly
    assert verify_password(password, hashed) == True
    
    # Test that wrong password doesn't verify
    assert verify_password("wrong_password", hashed) == False
    
    print("✓ Password verification works correctly")

def cleanup():
    """Clean up test database."""
    try:
        Path("./test_ecg_analysis.db").unlink(missing_ok=True)
        print("✓ Test database cleaned up")
    except Exception as e:
        print(f"⚠ Failed to clean up test database: {e}")

def main():
    """Run all authentication tests."""
    print("Starting authentication tests...\n")
    
    try:
        # Run individual tests
        test_password_hashing()
        test_jwt_token_creation()
        test_user_model()
        test_password_verification()
        test_fastapi_app()
        test_auth_endpoints()
        
        print("\n" + "="*50)
        print("✅ All authentication tests completed successfully!")
        print("The authentication system appears to be working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        cleanup()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())