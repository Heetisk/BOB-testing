from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """Request schema for user login."""
    email: str
    password: str
    device_id: str
    device_name: str
    browser: str
    os: str
    city: str
    ip_address: str


class LoginResponse(BaseModel):
    """Response schema for successful login."""
    model_config = ConfigDict(from_attributes=True)

    message: str
    user: "UserResponse"
    token: str
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str


class UserResponse(BaseModel):
    """Response schema for user data."""
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    usual_city: Optional[str] = None
    created_at: datetime


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    usual_city: Optional[str] = None


class RegisterResponse(BaseModel):
    """Response schema for successful registration."""
    model_config = ConfigDict(from_attributes=True)

    message: str
    user: "UserResponse"
    token: str



