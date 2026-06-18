from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class KycSubmitRequest(BaseModel):
    """Request schema for KYC submission."""
    user_id: int
    document_type: str  # Aadhaar, PAN, Passport
    document_number: str  # Will be hashed server-side
    submission_ip: str
    submission_city: str


class KycResponse(BaseModel):
    """Response schema for KYC data."""
    model_config = ConfigDict(from_attributes=True)

    kyc_id: int
    user_id: int
    document_type: str
    status: str
    risk_score: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime


class KycRiskResponse(BaseModel):
    """Response schema for KYC risk analysis."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str


class KycUpdateRequest(BaseModel):
    """Request schema for updating KYC status (admin)."""
    status: str  # approved, rejected
    rejection_reason: Optional[str] = None


class KycListResponse(BaseModel):
    """Response schema for list of KYC verifications."""
    verifications: list[KycResponse]
    total: int
