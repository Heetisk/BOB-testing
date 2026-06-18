from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class TransactionCreate(BaseModel):
    """Request schema for creating a transaction."""
    user_id: int
    amount: float
    beneficiary_id: str
    beneficiary_name: str
    city: str
    transaction_type: str = "transfer"


class TransactionResponse(BaseModel):
    """Response schema for transaction data."""
    model_config = ConfigDict(from_attributes=True)

    transaction_id: int
    user_id: int
    amount: float
    beneficiary_id: str
    beneficiary_name: str
    transaction_type: str
    city: str
    transaction_time: datetime
    risk_score: Optional[int] = None
    status: str
    is_new_beneficiary: bool


class TransactionListResponse(BaseModel):
    """Response schema for list of transactions."""
    transactions: list[TransactionResponse]
    total: int
