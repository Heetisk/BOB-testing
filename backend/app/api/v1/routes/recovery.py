"""
Account Recovery routes.

Handles password reset request, completion, and history.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.core.security import hash_password
from app.schemas.recovery import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    PasswordResetResponse,
    ResetHistoryResponse,
)
from app.services.recovery_service import RecoveryService
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Account Recovery"])


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Request a password reset.

    Performs risk analysis and returns a reset token.
    In production, this would send an email/SMS with the token.
    """
    auth_service = AuthService(db)
    recovery_service = RecoveryService(db)

    # Find user by email
    user = await auth_service.get_user_by_email(request.email)
    if user is None:
        # Don't reveal if user exists (security best practice)
        return ForgotPasswordResponse(
            message="If the email exists, a reset link has been sent",
            reset_token="",
            risk_score=0,
            risk_level="Low",
            risk_reasons=[],
            recommended_action="Send reset token",
        )

    # Analyze risk and create reset request
    reset = await recovery_service.request_password_reset(
        user=user,
        device_id=request.device_id,
        city=request.city,
        ip_address=request.ip_address,
    )

    return ForgotPasswordResponse(
        message="Password reset requested",
        reset_token=reset.reset_token,  # For demo, returned directly
        risk_score=reset.risk_score,
        risk_level=reset.risk_level,
        risk_reasons=[],
        recommended_action="Send reset token" if reset.risk_level == "Low" else "Additional verification required",
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Complete password reset with the token.
    """
    recovery_service = RecoveryService(db)

    # Hash new password
    new_password_hash = hash_password(request.new_password)

    # Complete reset
    success = await recovery_service.complete_password_reset(
        reset_token=request.reset_token,
        new_password_hash=new_password_hash,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    return ResetPasswordResponse(
        message="Password reset successful",
        success=True,
    )


@router.get("/reset-history/{user_id}", response_model=ResetHistoryResponse)
async def get_reset_history(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get password reset history for a user (admin or self only)."""
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' reset history",
        )

    recovery_service = RecoveryService(db)
    resets = await recovery_service.get_user_reset_history(user_id)

    return ResetHistoryResponse(
        resets=[PasswordResetResponse.model_validate(r) for r in resets],
        total=len(resets),
    )
