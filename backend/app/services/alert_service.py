"""
Alert service.

Handles alert generation and management.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.models.alert import Alert


class AlertService:
    """Service for alert-related operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_alert(
        self,
        user_id: int,
        alert_type: str,
        risk_level: str,
        message: str,
        status: str = "open",
    ) -> Alert:
        """Create a new alert."""
        alert = Alert(
            user_id=user_id,
            alert_type=alert_type,
            risk_level=risk_level,
            message=message,
            status=status,
        )
        self.db.add(alert)
        await self.db.flush()
        return alert

    async def get_alert(self, alert_id: int) -> Optional[Alert]:
        """Get an alert by ID."""
        result = await self.db.execute(
            select(Alert).where(Alert.alert_id == alert_id)
        )
        return result.scalar_one_or_none()

    async def get_user_alerts(self, user_id: int, limit: int = 50) -> list[Alert]:
        """Get alerts for a specific user."""
        result = await self.db.execute(
            select(Alert)
            .where(Alert.user_id == user_id)
            .order_by(Alert.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_alerts(self, limit: int = 100) -> list[Alert]:
        """Get all alerts (admin use)."""
        result = await self.db.execute(
            select(Alert).order_by(Alert.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def update_alert_status(
        self, alert_id: int, status: str
    ) -> Optional[Alert]:
        """Update alert status."""
        alert = await self.get_alert(alert_id)
        if alert:
            alert.status = status
            await self.db.flush()
        return alert

    async def get_alert_counts(self) -> dict:
        """Get count of alerts by status."""
        result = await self.db.execute(
            select(Alert.status, func.count(Alert.alert_id))
            .group_by(Alert.status)
        )
        return {row[0]: row[1] for row in result.all()}

    async def get_risk_level_counts(self) -> dict:
        """Get count of alerts by risk level."""
        result = await self.db.execute(
            select(Alert.risk_level, func.count(Alert.alert_id))
            .group_by(Alert.risk_level)
        )
        return {row[0]: row[1] for row in result.all()}
