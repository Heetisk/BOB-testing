from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class AlertCreate(BaseModel):
    """Request schema for creating an alert."""
    user_id: int
    alert_type: str
    risk_level: str
    message: str


class AlertResponse(BaseModel):
    """Response schema for alert data."""
    model_config = ConfigDict(from_attributes=True)

    alert_id: int
    user_id: int
    alert_type: str
    risk_level: str
    message: str
    status: str
    created_at: datetime


class AlertUpdate(BaseModel):
    """Request schema for updating an alert."""
    status: str


class AlertListResponse(BaseModel):
    """Response schema for list of alerts."""
    alerts: list[AlertResponse]
    total: int
