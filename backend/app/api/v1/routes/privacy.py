"""
Privacy routes for Data Protection.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.schemas.privacy import (
    ConsentCreateRequest,
    ConsentResponse,
    ConsentListResponse,
    DataAccessLogResponse,
    DataAccessLogListResponse,
    MaskedUserResponse,
    AnonymizeResponse,
)
from app.services.privacy_service import PrivacyService
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/privacy", tags=["Privacy & Data Protection"])


@router.post("/consent", response_model=ConsentResponse)
async def record_consent(
    request: ConsentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record user consent."""
    privacy_service = PrivacyService(db)

    consent = await privacy_service.record_consent(
        user_id=current_user.user_id,
        consent_type=request.consent_type,
        is_granted=request.is_granted,
        ip_address=request.ip_address,
    )

    return ConsentResponse.model_validate(consent)


@router.get("/consent/{user_id}", response_model=ConsentListResponse)
async def get_user_consents(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user consents."""
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' consents",
        )

    privacy_service = PrivacyService(db)
    consents = await privacy_service.get_user_consents(user_id)

    return ConsentListResponse(
        consents=[ConsentResponse.model_validate(c) for c in consents],
        total=len(consents),
    )


@router.get("/access-log", response_model=DataAccessLogListResponse)
async def get_data_access_logs(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get data access logs (admin only)."""
    privacy_service = PrivacyService(db)
    logs = await privacy_service.get_data_access_logs()

    return DataAccessLogListResponse(
        logs=[DataAccessLogResponse.model_validate(log) for log in logs],
        total=len(logs),
    )


@router.get("/mask/{user_id}", response_model=MaskedUserResponse)
async def get_masked_user_data(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get masked user data for privacy."""
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' data",
        )

    auth_service = AuthService(db)
    privacy_service = PrivacyService(db)

    user = await auth_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Log the data access
    await privacy_service.log_data_access(
        accessor_id=current_user.user_id,
        target_user_id=user_id,
        data_type="profile",
        access_type="view",
        purpose="mask_view",
    )

    masked_data = await privacy_service.get_masked_user_data(user)
    return MaskedUserResponse(**masked_data)


@router.post("/anonymize/{user_id}", response_model=AnonymizeResponse)
async def anonymize_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Anonymize user data (right to be forgotten)."""
    privacy_service = PrivacyService(db)

    success = await privacy_service.anonymize_user(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return AnonymizeResponse(
        message="User data anonymized successfully",
        success=True,
    )
