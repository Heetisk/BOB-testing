from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CaseCreate(BaseModel):
    """Request schema for creating a fraud case."""
    user_id: int
    alert_id: int
    risk_score: int
    admin_notes: Optional[str] = None


class CaseResponse(BaseModel):
    """Response schema for fraud case data."""
    model_config = ConfigDict(from_attributes=True)

    case_id: int
    user_id: int
    alert_id: int
    risk_score: int
    case_status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CaseUpdate(BaseModel):
    """Request schema for updating a fraud case."""
    case_status: str
    admin_notes: Optional[str] = None


class CaseListResponse(BaseModel):
    """Response schema for list of fraud cases."""
    cases: list[CaseResponse]
    total: int
