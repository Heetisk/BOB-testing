"""
Tests for transaction API.
"""

import pytest
from app.core.security import hash_password
from app.models.user import User


async def _create_test_user_and_login(c, db, email="tx@example.com"):
    """Helper to create user and get auth token."""
    user = User(
        name="Transaction Test User",
        email=email,
        password_hash=hash_password("testpass123"),
        role="customer",
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
async def test_create_transaction(client):
    """Test creating a new transaction."""
    c, db = client
    user, token = await _create_test_user_and_login(c, db)

    response = await c.post(
        "/api/v1/transactions/",
        json={
            "user_id": user.user_id,
            "amount": 5000,
            "beneficiary_id": "B001",
            "beneficiary_name": "Rajesh Kumar",
            "city": "Surat",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 5000
    assert data["beneficiary_id"] == "B001"
    assert "risk_score" in data
    assert "status" in data


@pytest.mark.asyncio
async def test_get_transactions(client):
    """Test getting user transactions."""
    c, db = client
    user, token = await _create_test_user_and_login(c, db)

    response = await c.get(
        "/api/v1/transactions/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "transactions" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_high_risk_transaction(client):
    """Test creating a high-risk transaction gets flagged."""
    c, db = client
    user, token = await _create_test_user_and_login(c, db)

    response = await c.post(
        "/api/v1/transactions/",
        json={
            "user_id": user.user_id,
            "amount": 95000,
            "beneficiary_id": "B099",
            "beneficiary_name": "Unknown Beneficiary",
            "city": "New York",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["blocked", "flagged"]
    assert data["risk_score"] > 30
