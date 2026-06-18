"""
Audit routes for Privileged Access Monitoring.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin
from app.schemas.audit import (
    AuditLogCreate,
    AuditLogResponse,
    AuditLogListResponse,
)
from app.services.audit_service import AuditService
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["Audit Logging"])


@router.get("/logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get all audit logs (admin only)."""
    audit_service = AuditService(db)
    logs = await audit_service.get_all_logs()

    return AuditLogListResponse(
        logs=[AuditLogResponse.model_validate(log) for log in logs],
        total=len(logs),
    )


@router.get("/user/{user_id}", response_model=AuditLogListResponse)
async def get_user_audit_logs(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get audit logs for a specific user."""
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' audit logs",
        )

    audit_service = AuditService(db)
    logs = await audit_service.get_user_logs(user_id)

    return AuditLogListResponse(
        logs=[AuditLogResponse.model_validate(log) for log in logs],
        total=len(logs),
    )


@router.post("/log", response_model=AuditLogResponse)
async def create_audit_log(
    request: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an audit log entry."""
    audit_service = AuditService(db)

    # Calculate risk score
    risk_score = await audit_service.analyze_action_risk(
        user_id=current_user.user_id,
        action=request.action,
        resource_type=request.resource_type,
        ip_address=request.ip_address,
        city=request.city,
    )

    log = await audit_service.log_action(
        user_id=current_user.user_id,
        action=request.action,
        resource_type=request.resource_type,
        resource_id=request.resource_id,
        details=request.details,
        ip_address=request.ip_address,
        city=request.city,
        risk_score=risk_score,
    )

    return AuditLogResponse.model_validate(log)


@router.get("/suspicious", response_model=AuditLogListResponse)
async def get_suspicious_actions(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List suspicious admin actions (admin only)."""
    audit_service = AuditService(db)
    logs = await audit_service.get_suspicious_actions()

    return AuditLogListResponse(
        logs=[AuditLogResponse.model_validate(log) for log in logs],
        total=len(logs),
    )
