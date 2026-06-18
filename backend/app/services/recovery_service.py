"""
Account Recovery Service.

Handles password reset risk analysis including:
- New device/location detection during reset
- Rate limiting for reset attempts
- Reset after failed login detection
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets

from app.models.password_reset import PasswordReset
from app.models.user import User
from app.models.login_event import LoginEvent
from app.ml.risk_rules import get_risk_level_and_action, is_unusual_hour


@dataclass
class RecoveryRiskResult:
    """Result of password reset risk analysis."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str


class RecoveryService:
    """Service for account recovery risk analysis."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_recent_resets(self, user_id: int, hours: int = 24) -> int:
        """Count recent password reset attempts."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        result = await self.db.execute(
            select(func.count(PasswordReset.reset_id)).where(
                PasswordReset.user_id == user_id,
                PasswordReset.requested_at >= cutoff,
            )
        )
        return result.scalar() or 0

    async def _has_recent_failed_logins(self, user_id: int, hours: int = 1) -> bool:
        """Check if there were failed logins recently before reset request."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        result = await self.db.execute(
            select(func.count(LoginEvent.login_id)).where(
                LoginEvent.user_id == user_id,
                LoginEvent.is_successful == False,
                LoginEvent.login_time >= cutoff,
            )
        )
        return (result.scalar() or 0) > 0

    async def _is_new_device_for_reset(self, user_id: int, device_id: str) -> bool:
        """Check if this device is new for password reset context."""
        from app.services.device_service import DeviceService
        device_service = DeviceService(self.db)
        return await device_service.is_new_device(user_id, device_id)

    async def _is_new_location_for_reset(self, user_id: int, city: str) -> bool:
        """Check if this location is new for password reset context."""
        from app.services.location_service import LocationService
        location_service = LocationService(self.db)
        return await location_service.is_new_location(user_id, city)

    async def analyze_reset_risk(
        self,
        user: User,
        device_id: str,
        city: str,
        ip_address: str,
    ) -> RecoveryRiskResult:
        """
        Analyze password reset request risk.
        """
        score = 0
        reasons = []

        # Check for new device
        is_new_device = await self._is_new_device_for_reset(user.user_id, device_id)
        if is_new_device:
            score += 25
            reasons.append("Reset requested from new device")

        # Check for new location
        is_new_location = await self._is_new_location_for_reset(user.user_id, city)
        if is_new_location:
            score += 20
            reasons.append("Reset requested from unusual location")

        # Check for multiple reset attempts
        recent_resets = await self._get_recent_resets(user.user_id)
        if recent_resets > 0:
            score += min(recent_resets * 10, 30)
            reasons.append(f"{recent_resets} recent reset attempt(s)")

        # Check for failed logins before reset (account takeover pattern)
        has_failed_logins = await self._has_recent_failed_logins(user.user_id)
        if has_failed_logins:
            score += 20
            reasons.append("Reset requested after failed login attempts")

        # Night reset (10 PM - 5 AM)
        current_hour = datetime.now(timezone.utc).hour
        if is_unusual_hour(current_hour):
            score += 10
            reasons.append("Reset requested during unusual hours")

        # Cap score
        score = min(score, 100)

        # Determine risk level
        risk_level, action = get_risk_level_and_action(score)

        return RecoveryRiskResult(
            risk_score=score,
            risk_level=risk_level,
            risk_reasons=reasons,
            recommended_action=action,
        )

    async def request_password_reset(
        self,
        user: User,
        device_id: str,
        city: str,
        ip_address: str,
    ) -> PasswordReset:
        """
        Request a password reset with risk analysis.
        """
        # Analyze risk
        risk_result = await self.analyze_reset_risk(
            user=user,
            device_id=device_id,
            city=city,
            ip_address=ip_address,
        )

        # Generate secure token
        reset_token = secrets.token_urlsafe(32)

        # Create reset record
        reset = PasswordReset(
            user_id=user.user_id,
            reset_token=reset_token,
            device_id=device_id,
            city=city,
            ip_address=ip_address,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            risk_score=risk_result.risk_score,
            risk_level=risk_result.risk_level,
        )
        self.db.add(reset)
        await self.db.flush()

        return reset

    async def verify_reset_token(self, reset_token: str) -> Optional[PasswordReset]:
        """Verify a reset token is valid and not expired."""
        result = await self.db.execute(
            select(PasswordReset).where(
                PasswordReset.reset_token == reset_token,
                PasswordReset.is_used == False,
            )
        )
        reset = result.scalar_one_or_none()

        if reset is None:
            return None

        # Check expiration
        if datetime.now(timezone.utc) > reset.expires_at:
            return None

        return reset

    async def complete_password_reset(
        self,
        reset_token: str,
        new_password_hash: str,
    ) -> bool:
        """Complete the password reset process."""
        reset = await self.verify_reset_token(reset_token)
        if reset is None:
            return False

        # Update user password
        from sqlalchemy import update
        await self.db.execute(
            update(User)
            .where(User.user_id == reset.user_id)
            .values(password_hash=new_password_hash)
        )

        # Mark token as used
        reset.is_used = True
        await self.db.flush()

        return True

    async def get_user_reset_history(self, user_id: int) -> list[PasswordReset]:
        """Get password reset history for a user."""
        result = await self.db.execute(
            select(PasswordReset)
            .where(PasswordReset.user_id == user_id)
            .order_by(PasswordReset.requested_at.desc())
            .limit(20)
        )
        return list(result.scalars().all())
