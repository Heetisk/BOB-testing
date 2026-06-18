"""
Risk analysis routes.

Handles login and transaction risk analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.risk import (
    LoginRiskRequest,
    LoginRiskResponse,
    TransactionRiskRequest,
    TransactionRiskResponse,
)
from app.services.risk_service import RiskService
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/risk", tags=["Risk Analysis"])


@router.post("/analyze-login", response_model=LoginRiskResponse)
async def analyze_login_risk(
    request: LoginRiskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze login risk for a user.

    Combines rule-based and ML analysis to produce a risk score.
    Users can only analyze their own risk, admins can analyze any user.
    """
    # Authorization check: users can only analyze their own risk
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to analyze other users' risk",
        )

    auth_service = AuthService(db)
    risk_service = RiskService(db)

    # Get user
    user = await auth_service.get_user_by_id(request.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Perform risk analysis
    result = await risk_service.analyze_login_risk(
        user=user,
        device_id=request.device_id,
        device_name=request.device_name,
        browser=request.browser,
        os=request.os,
        city=request.city,
        ip_address=request.ip_address,
        login_time=request.login_time or datetime.now(timezone.utc),
    )

    return LoginRiskResponse(
        user_id=user.user_id,
        risk_score=result.risk_score,
        risk_level=result.risk_level,
        risk_reasons=result.risk_reasons,
        recommended_action=result.recommended_action,
        is_new_device=result.is_new_device,
        is_new_location=result.is_new_location,
        login_time=result.login_time,
        ml_prediction=result.ml_prediction,
    )


@router.post("/analyze-transaction", response_model=TransactionRiskResponse)
async def analyze_transaction_risk(
    request: TransactionRiskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze transaction risk for a user.

    Checks amount, beneficiary, and location factors.
    """
    # Authorization check
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to analyze other users' transactions",
        )

    auth_service = AuthService(db)
    risk_service = RiskService(db)

    # Get user
    user = await auth_service.get_user_by_id(request.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Perform risk analysis
    result = await risk_service.analyze_transaction_risk(
        user=user,
        amount=request.amount,
        beneficiary_id=request.beneficiary_id,
        beneficiary_name=request.beneficiary_name,
        city=request.city,
    )

    return TransactionRiskResponse(
        user_id=user.user_id,
        amount=request.amount,
        risk_score=result.risk_score,
        risk_level=result.risk_level,
        risk_reasons=result.risk_reasons,
        recommended_action=result.recommended_action,
        is_high_amount=result.is_high_amount,
        is_new_beneficiary=result.is_new_beneficiary,
    )
