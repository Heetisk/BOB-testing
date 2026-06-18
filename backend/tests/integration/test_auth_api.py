"""
Tests for authentication API.
"""

import pytest
from app.core.security import hash_password
from app.models.user import User


@pytest.mark.asyncio
async def test_login_success(client):
    """Test successful login."""
    c, db = client

    # Create test user
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=hash_password("testpass123"),
        phone="+91 12345 67890",
        role="customer",
        usual_city="Surat",
        usual_device="Android_Pixel_7",
    )
    db.add(user)
    await db.commit()

    response = await c.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "device_id": "device_test_0",
            "device_name": "Android_Pixel_7",
            "browser": "Chrome",
            "os": "Android",
            "city": "Surat",
            "ip_address": "192.168.1.100",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Login successful"
    assert data["user"]["email"] == "test@example.com"
    assert "token" in data
    assert "risk_score" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    """Test login with wrong password."""
    c, db = client

    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=hash_password("testpass123"),
        role="customer",
        usual_city="Surat",
    )
    db.add(user)
    await db.commit()

    response = await c.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword",
            "device_id": "device_test_0",
            "device_name": "Android_Pixel_7",
            "browser": "Chrome",
            "os": "Android",
            "city": "Surat",
            "ip_address": "192.168.1.100",
        },
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client):
    """Test login with nonexistent user."""
    c, _ = client

    response = await c.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password",
            "device_id": "device_test_0",
            "device_name": "Android_Pixel_7",
            "browser": "Chrome",
            "os": "Android",
            "city": "Surat",
            "ip_address": "192.168.1.100",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client):
    """Test getting current user info."""
    c, db = client

    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=hash_password("testpass123"),
        role="customer",
        usual_city="Surat",
    )
    db.add(user)
    await db.commit()

    # First login to get token
    login_response = await c.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "device_id": "device_test_0",
            "device_name": "Android_Pixel_7",
            "browser": "Chrome",
            "os": "Android",
            "city": "Surat",
            "ip_address": "192.168.1.100",
        },
    )
    token = login_response.json()["token"]

    # Get current user
    response = await c.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
