from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""
    email: str
    device_id: str
    device_name: str
    browser: str
    os: str
    city: str
    ip_address: str


class ForgotPasswordResponse(BaseModel):
    """Response schema for forgot password."""
    message: str
    reset_token: str  # For demo purposes, returned directly
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str


class ResetPasswordRequest(BaseModel):
    """Request schema for reset password."""
    reset_token: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    """Response schema for reset password."""
    message: str
    success: bool


class PasswordResetResponse(BaseModel):
    """Response schema for password reset history."""
    model_config = ConfigDict(from_attributes=True)

    reset_id: int
    user_id: int
    device_id: str
    city: str
    ip_address: str
    requested_at: datetime
    is_used: bool
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None


class ResetHistoryResponse(BaseModel):
    """Response schema for reset history list."""
    resets: list[PasswordResetResponse]
    total: int
