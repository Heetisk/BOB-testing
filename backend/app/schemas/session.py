from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SessionTrackRequest(BaseModel):
    """Request schema for tracking session event."""
    session_token: str
    event_type: str
    city: str
    ip_address: str
    device_id: str


class SessionEventResponse(BaseModel):
    """Response schema for session event."""
    model_config = ConfigDict(from_attributes=True)

    event_id: int
    user_id: int
    session_token: str
    event_type: str
    city: str
    ip_address: str
    device_id: str
    timestamp: datetime
    risk_score: Optional[int] = None
    is_suspicious: bool


class SessionRiskResponse(BaseModel):
    """Response schema for session risk validation."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    is_suspicious: bool


class SessionListResponse(BaseModel):
    """Response schema for session events list."""
    events: list[SessionEventResponse]
    total: int
