"""
Tests for risk analysis API.
"""

import pytest
from app.core.security import hash_password
from app.models.user import User


async def _create_user_and_get_token(c, db, email="risk@example.com", role="customer"):
    """Helper to create user and get auth token."""
    user = User(
        name="Risk Test User",
        email=email,
        password_hash=hash_password("testpass123"),
        role=role,
        usual_city="Surat",
        usual_device="Android_Pixel_7",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    login_response = await c.post(
        "/api/v1/auth/login",
        json={
            "email": email,
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
    return user, token


@pytest.mark.asyncio
async def test_analyze_login_risk_low(client):
    """Test login risk analysis - low risk scenario."""
    c, db = client
    user, token = await _create_user_and_get_token(c, db)

    response = await c.post(
        "/api/v1/risk/analyze-login",
        json={
            "user_id": user.user_id,
            "device_id": "device_1_0",
            "device_name": "Android_Pixel_7",
            "browser": "Chrome",
            "os": "Android",
            "city": "Surat",
            "ip_address": "192.168.1.100",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user.user_id
    assert "risk_score" in data
    assert "risk_level" in data
    assert "risk_reasons" in data
    assert "recommended_action" in data


@pytest.mark.asyncio
async def test_analyze_login_risk_high(client):
    """Test login risk analysis - high risk scenario."""
    c, db = client
    user, token = await _create_user_and_get_token(c, db)

    response = await c.post(
        "/api/v1/risk/analyze-login",
        json={
            "user_id": user.user_id,
            "device_id": "device_unknown_999",
            "device_name": "Unknown Device",
            "browser": "Unknown",
            "os": "Unknown",
            "city": "New York",
            "ip_address": "45.67.89.123",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] > 30


@pytest.mark.asyncio
async def test_analyze_login_risk_nonexistent_user(client):
    """Test login risk analysis for another user by customer returns 403."""
    c, db = client
    _, token = await _create_user_and_get_token(c, db)

    # Customer trying to analyze a different user_id should be forbidden
    response = await c.post(
        "/api/v1/risk/analyze-login",
        json={
            "user_id": 99999,
            "device_id": "device_test",
            "device_name": "Test Device",
            "browser": "Chrome",
            "os": "Windows",
            "city": "Surat",
            "ip_address": "192.168.1.100",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # Customer can only analyze their own risk
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_analyze_login_risk_admin_can_analyze_others(client):
    """Test admin can analyze any user's risk."""
    c, db = client
    # Create a regular user
    regular_user = User(
        name="Regular User",
        email="regular@example.com",
        password_hash=hash_password("testpass123"),
        role="customer",
        usual_city="Surat",
    )
    db.add(regular_user)
    await db.commit()
    await db.refresh(regular_user)

    # Create admin and get token
    admin_user = User(
        name="Admin User",
        email="admin_risk@example.com",
        password_hash=hash_password("admin123"),
        role="admin",
        usual_city="Bangalore",
    )
    db.add(admin_user)
    await db.commit()
    await db.refresh(admin_user)

    login_response = await c.post(
        "/api/v1/auth/login",
        json={
            "email": "admin_risk@example.com",
            "password": "admin123",
            "device_id": "device_admin_0",
            "device_name": "Windows_Chrome",
            "browser": "Chrome",
            "os": "Windows",
            "city": "Bangalore",
            "ip_address": "10.0.0.1",
        },
    )
    admin_token = login_response.json()["token"]

    # Admin can analyze any user
    response = await c.post(
        "/api/v1/risk/analyze-login",
        json={
            "user_id": regular_user.user_id,
            "device_id": "device_unknown_999",
            "device_name": "Unknown Device",
            "browser": "Unknown",
            "os": "Unknown",
            "city": "New York",
            "ip_address": "45.67.89.123",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == regular_user.user_id


@pytest.mark.asyncio
async def test_analyze_login_risk_unauthorized(client):
    """Test that risk analysis requires authentication."""
    c, _ = client

    response = await c.post(
        "/api/v1/risk/analyze-login",
        json={
            "user_id": 1,
            "device_id": "device_test",
            "device_name": "Test Device",
            "browser": "Chrome",
            "os": "Windows",
            "city": "Surat",
            "ip_address": "192.168.1.100",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_analyze_transaction_risk(client):
    """Test transaction risk analysis."""
    c, db = client
    user, token = await _create_user_and_get_token(c, db)

    response = await c.post(
        "/api/v1/risk/analyze-transaction",
        json={
            "user_id": user.user_id,
            "amount": 50000,
            "beneficiary_id": "B001",
            "beneficiary_name": "Rajesh Kumar",
            "city": "Mumbai",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user.user_id
    assert data["amount"] == 50000
    assert "risk_score" in data
    assert "risk_level" in data
