"""
Session routes for Continuous Validation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.session import (
    SessionTrackRequest,
    SessionEventResponse,
    SessionRiskResponse,
    SessionListResponse,
)
from app.services.session_service import SessionService
from app.models.user import User

router = APIRouter(prefix="/session", tags=["Session Validation"])


@router.post("/track", response_model=SessionEventResponse)
async def track_session_event(
    request: SessionTrackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Track a session event with risk analysis."""
    session_service = SessionService(db)

    event = await session_service.track_event(
        user_id=current_user.user_id,
        session_token=request.session_token,
        event_type=request.event_type,
        city=request.city,
        ip_address=request.ip_address,
        device_id=request.device_id,
    )

    return SessionEventResponse.model_validate(event)


@router.get("/user/{user_id}", response_model=SessionListResponse)
async def get_user_sessions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get session history for a user."""
    if current_user.role not in ["admin", "fraud_team"] and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' sessions",
        )

    session_service = SessionService(db)
    events = await session_service.get_user_sessions(user_id)

    return SessionListResponse(
        events=[SessionEventResponse.model_validate(e) for e in events],
        total=len(events),
    )


@router.post("/validate", response_model=SessionRiskResponse)
async def validate_session(
    session_token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Validate current session risk."""
    session_service = SessionService(db)
    result = await session_service.validate_session(session_token)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return SessionRiskResponse(
        risk_score=result.risk_score,
        risk_level=result.risk_level,
        risk_reasons=result.risk_reasons,
        is_suspicious=result.is_suspicious,
    )
