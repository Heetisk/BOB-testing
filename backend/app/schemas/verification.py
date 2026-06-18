from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class VerificationRequestSchema(BaseModel):
    """Request schema for verification."""
    verification_type: str  # otp_sms, otp_email
    device_id: str
    city: str
    ip_address: str
    risk_score: int = 0


class VerificationResponse(BaseModel):
    """Response schema for verification request."""
    verification_id: int
    verification_type: str
    message: str
    # For demo, include the code (in production, sent via SMS/email)
    code: Optional[str] = None


class VerifyCodeRequest(BaseModel):
    """Request schema for verifying code."""
    code: str
    verification_type: str


class VerifyCodeResponse(BaseModel):
    """Response schema for code verification."""
    success: bool
    message: str


class VerificationHistoryResponse(BaseModel):
    """Response schema for verification history."""
    model_config = ConfigDict(from_attributes=True)

    verification_id: int
    verification_type: str
    requested_at: datetime
    is_verified: bool
    attempts: int
    risk_score: Optional[int] = None


class VerificationListResponse(BaseModel):
    """Response schema for list of verifications."""
    verifications: list[VerificationHistoryResponse]
    total: int
