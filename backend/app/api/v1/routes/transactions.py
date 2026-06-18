"""
Transaction routes.

Handles transaction CRUD and risk analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionListResponse,
)
from app.services.transaction_service import TransactionService
from app.services.risk_service import RiskService
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=TransactionListResponse)
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transactions for the current user (or all for admin)."""
    transaction_service = TransactionService(db)

    # Admin sees all transactions, customers see only their own
    if current_user.role == "admin":
        transactions = await transaction_service.get_all_transactions()
    else:
        transactions = await transaction_service.get_user_transactions(current_user.user_id)

    return TransactionListResponse(
        transactions=[TransactionResponse.model_validate(t) for t in transactions],
        total=len(transactions),
    )


@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    request: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new transaction with risk analysis."""
    auth_service = AuthService(db)
    risk_service = RiskService(db)
    transaction_service = TransactionService(db)

    # Authorization: users can only create transactions for themselves
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create transactions for other users",
        )

    # Get user
    user = await auth_service.get_user_by_id(request.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Analyze transaction risk
    risk_result = await risk_service.analyze_transaction_risk(
        user=user,
        amount=request.amount,
        beneficiary_id=request.beneficiary_id,
        beneficiary_name=request.beneficiary_name,
        city=request.city,
    )

    # Determine status based on risk
    if risk_result.risk_level == "High":
        tx_status = "blocked"
    elif risk_result.risk_level == "Medium":
        tx_status = "flagged"
    else:
        tx_status = "approved"

    # Create transaction
    transaction = await transaction_service.create_transaction(
        user_id=request.user_id,
        amount=request.amount,
        beneficiary_id=request.beneficiary_id,
        beneficiary_name=request.beneficiary_name,
        city=request.city,
        transaction_type=request.transaction_type,
        is_new_beneficiary=risk_result.is_new_beneficiary,
        risk_score=risk_result.risk_score,
        status=tx_status,
    )

    return TransactionResponse.model_validate(transaction)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific transaction by ID."""
    transaction_service = TransactionService(db)
    transaction = await transaction_service.get_transaction(transaction_id)

    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    # Check authorization
    if current_user.role != "admin" and transaction.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transaction",
        )

    return TransactionResponse.model_validate(transaction)
