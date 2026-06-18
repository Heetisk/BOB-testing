from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ConsentCreateRequest(BaseModel):
    """Request schema for recording consent."""
    consent_type: str  # data_processing, marketing, third_party_sharing
    is_granted: bool
    ip_address: Optional[str] = None


class ConsentResponse(BaseModel):
    """Response schema for consent."""
    model_config = ConfigDict(from_attributes=True)

    consent_id: int
    user_id: int
    consent_type: str
    is_granted: bool
    granted_at: datetime
    revoked_at: Optional[datetime] = None


class ConsentListResponse(BaseModel):
    """Response schema for list of consents."""
    consents: list[ConsentResponse]
    total: int


class DataAccessLogResponse(BaseModel):
    """Response schema for data access log."""
    model_config = ConfigDict(from_attributes=True)

    log_id: int
    accessor_id: int
    target_user_id: int
    data_type: str
    access_type: str
    purpose: str
    accessed_at: datetime


class DataAccessLogListResponse(BaseModel):
    """Response schema for list of data access logs."""
    logs: list[DataAccessLogResponse]
    total: int


class MaskedUserResponse(BaseModel):
    """Response schema for masked user data."""
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    usual_city: Optional[str] = None


class AnonymizeResponse(BaseModel):
    """Response schema for anonymization."""
    message: str
    success: bool
