"""
Alert routes.

Handles alert CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.schemas.alert import (
    AlertCreate,
    AlertResponse,
    AlertUpdate,
    AlertListResponse,
)
from app.services.alert_service import AlertService
from app.models.user import User

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=AlertListResponse)
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get alerts for the current user (or all for admin)."""
    alert_service = AlertService(db)

    if current_user.role == "admin":
        alerts = await alert_service.get_all_alerts()
    else:
        alerts = await alert_service.get_user_alerts(current_user.user_id)

    return AlertListResponse(
        alerts=[AlertResponse.model_validate(a) for a in alerts],
        total=len(alerts),
    )


@router.post("/", response_model=AlertResponse)
async def create_alert(
    request: AlertCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new alert (admin only)."""
    alert_service = AlertService(db)

    alert = await alert_service.create_alert(
        user_id=request.user_id,
        alert_type=request.alert_type,
        risk_level=request.risk_level,
        message=request.message,
    )

    return AlertResponse.model_validate(alert)


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    request: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update alert status (admin only)."""
    alert_service = AlertService(db)

    alert = await alert_service.update_alert_status(alert_id, request.status)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    return AlertResponse.model_validate(alert)
