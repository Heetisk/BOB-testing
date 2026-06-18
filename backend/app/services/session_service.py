"""
Session Service for Continuous Validation.

Monitors session behavior and detects anomalies.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass

from app.models.session_event import SessionEvent
from app.ml.risk_rules import get_risk_level


@dataclass
class SessionRiskResult:
    """Result of session risk analysis."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    is_suspicious: bool


class SessionService:
    """Service for session monitoring and validation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def track_event(
        self,
        user_id: int,
        session_token: str,
        event_type: str,
        city: str,
        ip_address: str,
        device_id: str,
    ) -> SessionEvent:
        """Track a session event with risk analysis."""
        # Analyze risk
        risk_result = await self.analyze_session_risk(
            user_id=user_id,
            session_token=session_token,
            city=city,
            ip_address=ip_address,
        )

        event = SessionEvent(
            user_id=user_id,
            session_token=session_token,
            event_type=event_type,
            city=city,
            ip_address=ip_address,
            device_id=device_id,
            risk_score=risk_result.risk_score,
            is_suspicious=risk_result.is_suspicious,
        )
        self.db.add(event)
        await self.db.flush()
        return event

    async def analyze_session_risk(
        self,
        user_id: int,
        session_token: str,
        city: str,
        ip_address: str,
    ) -> SessionRiskResult:
        """Analyze session for suspicious behavior."""
        score = 0
        reasons = []

        # Check for location change
        location_change = await self._detect_location_change(user_id, session_token, city)
        if location_change:
            score += 30
            reasons.append("Location changed during session")

        # Check for velocity anomaly
        velocity = await self._check_velocity(user_id, session_token)
        if velocity > 50:
            score += 25
            reasons.append("Unusual activity velocity")

        # Check for multiple concurrent sessions
        concurrent = await self._check_concurrent_sessions(user_id)
        if concurrent > 3:
            score += 20
            reasons.append(f"{concurrent} concurrent sessions detected")

        # Check for session hijacking indicators
        hijack_risk = await self._check_hijacking_indicators(user_id, session_token, ip_address)
        if hijack_risk:
            score += 35
            reasons.append("Potential session hijacking detected")

        score = min(score, 100)
        risk_level = get_risk_level(score)

        return SessionRiskResult(
            risk_score=score,
            risk_level=risk_level,
            risk_reasons=reasons,
            is_suspicious=score > 50,
        )

    async def _detect_location_change(
        self, user_id: int, session_token: str, current_city: str
    ) -> bool:
        """Detect if location changed during the session."""
        result = await self.db.execute(
            select(SessionEvent).where(
                SessionEvent.user_id == user_id,
                SessionEvent.session_token == session_token,
                SessionEvent.city != current_city,
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def _check_velocity(self, user_id: int, session_token: str) -> int:
        """Check action velocity in the session."""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
        result = await self.db.execute(
            select(func.count(SessionEvent.event_id)).where(
                SessionEvent.user_id == user_id,
                SessionEvent.session_token == session_token,
                SessionEvent.timestamp >= cutoff,
            )
        )
        return result.scalar() or 0

    async def _check_concurrent_sessions(self, user_id: int) -> int:
        """Count concurrent sessions for a user."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
        result = await self.db.execute(
            select(func.count(func.distinct(SessionEvent.session_token))).where(
                SessionEvent.user_id == user_id,
                SessionEvent.timestamp >= cutoff,
            )
        )
        return result.scalar() or 0

    async def _check_hijacking_indicators(
        self, user_id: int, session_token: str, ip_address: str
    ) -> bool:
        """Check for session hijacking indicators."""
        # Check if IP changed significantly during session
        result = await self.db.execute(
            select(SessionEvent).where(
                SessionEvent.user_id == user_id,
                SessionEvent.session_token == session_token,
                SessionEvent.ip_address != ip_address,
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def get_user_sessions(self, user_id: int, limit: int = 50) -> list[SessionEvent]:
        """Get session events for a user."""
        result = await self.db.execute(
            select(SessionEvent)
            .where(SessionEvent.user_id == user_id)
            .order_by(SessionEvent.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def validate_session(self, session_token: str) -> Optional[SessionRiskResult]:
        """Validate the current session risk."""
        result = await self.db.execute(
            select(SessionEvent).where(
                SessionEvent.session_token == session_token
            ).order_by(SessionEvent.timestamp.desc()).limit(1)
        )
        latest_event = result.scalar_one_or_none()
        if latest_event is None:
            return None

        return await self.analyze_session_risk(
            user_id=latest_event.user_id,
            session_token=session_token,
            city=latest_event.city,
            ip_address=latest_event.ip_address,
        )
