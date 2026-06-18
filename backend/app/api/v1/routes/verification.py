"""
Verification routes for Step-up Authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.verification import (
    VerificationRequestSchema,
    VerificationResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
    VerificationHistoryResponse,
    VerificationListResponse,
)
from app.services.verification_service import VerificationService
from app.models.user import User

router = APIRouter(prefix="/verification", tags=["Step-up Verification"])


@router.post("/request", response_model=VerificationResponse)
async def request_verification(
    request: VerificationRequestSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request a verification code (OTP)."""
    verification_service = VerificationService(db)

    verification, code = await verification_service.request_verification(
        user_id=current_user.user_id,
        verification_type=request.verification_type,
        device_id=request.device_id,
        city=request.city,
        ip_address=request.ip_address,
        risk_score=request.risk_score,
    )

    return VerificationResponse(
        verification_id=verification.verification_id,
        verification_type=verification.verification_type,
        message="Verification code sent",
        code=code,  # For demo, returned directly (in production, sent via SMS/email)
    )


@router.post("/verify", response_model=VerifyCodeResponse)
async def verify_code(
    request: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify a verification code."""
    verification_service = VerificationService(db)

    success, message = await verification_service.verify_code(
        user_id=current_user.user_id,
        code=request.code,
        verification_type=request.verification_type,
    )

    return VerifyCodeResponse(
        success=success,
        message=message,
    )


@router.get("/history", response_model=VerificationListResponse)
async def get_verification_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get verification history for current user."""
    verification_service = VerificationService(db)
    verifications = await verification_service.get_user_verifications(current_user.user_id)

    return VerificationListResponse(
        verifications=[
            VerificationHistoryResponse.model_validate(v) for v in verifications
        ],
        total=len(verifications),
    )
