from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class LoginRiskRequest(BaseModel):
    """Request schema for login risk analysis."""
    user_id: int
    device_id: str
    device_name: str
    browser: str
    os: str
    city: str
    ip_address: str
    login_time: Optional[datetime] = None


class RiskReason(BaseModel):
    """Individual risk reason."""
    factor: str
    points: int
    description: str


class LoginRiskResponse(BaseModel):
    """Response schema for login risk analysis."""
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str
    is_new_device: bool
    is_new_location: bool
    login_time: datetime
    ml_prediction: Optional[dict] = None


class TransactionRiskRequest(BaseModel):
    """Request schema for transaction risk analysis."""
    user_id: int
    amount: float
    beneficiary_id: str
    beneficiary_name: str
    city: str


class TransactionRiskResponse(BaseModel):
    """Response schema for transaction risk analysis."""
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    amount: float
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str
    is_high_amount: bool
    is_new_beneficiary: bool
