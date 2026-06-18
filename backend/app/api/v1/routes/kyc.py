"""
KYC Fraud Detection routes.

Handles KYC submission, status checks, and suspicious attempt listing.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import hashlib

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.schemas.kyc import (
    KycSubmitRequest,
    KycResponse,
    KycRiskResponse,
    KycUpdateRequest,
    KycListResponse,
)
from app.services.kyc_service import KycService
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/kyc", tags=["KYC Verification"])


def _hash_document(doc_number: str) -> str:
    """Hash document number for privacy."""
    return hashlib.sha256(doc_number.encode()).hexdigest()


@router.post("/submit", response_model=KycResponse)
async def submit_kyc(
    request: KycSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit KYC for verification with fraud detection."""
    # Authorization check
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit KYC for other users",
        )

    auth_service = AuthService(db)
    kyc_service = KycService(db)

    # Get user
    user = await auth_service.get_user_by_id(request.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Hash document number
    doc_hash = _hash_document(request.document_number)

    # Submit KYC with risk analysis
    kyc = await kyc_service.submit_kyc(
        user=user,
        document_type=request.document_type,
        document_number_hash=doc_hash,
        submission_ip=request.submission_ip,
        submission_city=request.submission_city,
    )

    return KycResponse.model_validate(kyc)


@router.get("/user/{user_id}", response_model=KycResponse)
async def get_user_kyc(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get KYC status for a user."""
    # Authorization check
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' KYC",
        )

    kyc_service = KycService(db)
    kyc = await kyc_service.get_user_kyc(user_id)

    if kyc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No KYC verification found",
        )

    return KycResponse.model_validate(kyc)


@router.get("/suspicious", response_model=KycListResponse)
async def get_suspicious_kyc(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List suspicious KYC attempts (admin only)."""
    kyc_service = KycService(db)
    verifications = await kyc_service.get_suspicious_kyc()

    return KycListResponse(
        verifications=[KycResponse.model_validate(v) for v in verifications],
        total=len(verifications),
    )


@router.patch("/{kyc_id}", response_model=KycResponse)
async def update_kyc_status(
    kyc_id: int,
    request: KycUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update KYC verification status (admin only)."""
    kyc_service = KycService(db)
    kyc = await kyc_service.update_kyc_status(
        kyc_id=kyc_id,
        status=request.status,
        rejection_reason=request.rejection_reason,
    )

    if kyc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="KYC verification not found",
        )

    return KycResponse.model_validate(kyc)
