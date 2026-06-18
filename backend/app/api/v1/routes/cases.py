"""
Fraud case routes.

Handles fraud case management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.schemas.case import (
    CaseCreate,
    CaseResponse,
    CaseUpdate,
    CaseListResponse,
)
from app.services.case_service import CaseService
from app.models.user import User

router = APIRouter(prefix="/cases", tags=["Fraud Cases"])


@router.get("/", response_model=CaseListResponse)
async def get_cases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get fraud cases for the current user (or all for admin)."""
    case_service = CaseService(db)

    if current_user.role == "admin":
        cases = await case_service.get_all_cases()
    else:
        cases = await case_service.get_user_cases(current_user.user_id)

    return CaseListResponse(
        cases=[CaseResponse.model_validate(c) for c in cases],
        total=len(cases),
    )


@router.post("/", response_model=CaseResponse)
async def create_case(
    request: CaseCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new fraud case (admin only)."""
    case_service = CaseService(db)

    case = await case_service.create_case(
        user_id=request.user_id,
        alert_id=request.alert_id,
        risk_score=request.risk_score,
        admin_notes=request.admin_notes,
    )

    return CaseResponse.model_validate(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: int,
    request: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update fraud case status (admin only)."""
    case_service = CaseService(db)

    case = await case_service.update_case_status(
        case_id=case_id,
        case_status=request.case_status,
        admin_notes=request.admin_notes,
    )

    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )

    return CaseResponse.model_validate(case)
