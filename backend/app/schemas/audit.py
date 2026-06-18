from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class AuditLogCreate(BaseModel):
    """Request schema for creating audit log."""
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: str
    city: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Response schema for audit log."""
    model_config = ConfigDict(from_attributes=True)

    log_id: int
    user_id: int
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: str
    city: Optional[str] = None
    risk_score: Optional[int] = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    """Response schema for list of audit logs."""
    logs: list[AuditLogResponse]
    total: int
