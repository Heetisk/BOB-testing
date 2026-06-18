"""
Location service.

Handles location analysis and impossible travel detection.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timedelta

from app.models.login_event import LoginEvent


class LocationService:
    """Service for location-related risk analysis."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def is_new_location(self, user_id: int, city: str) -> bool:
        """
        Check if this is a new location for the user.

        A location is considered new if the user hasn't logged in from this city before.
        """
        result = await self.db.execute(
            select(LoginEvent).where(
                LoginEvent.user_id == user_id,
                LoginEvent.city == city,
            ).limit(1)
        )
        return result.scalar_one_or_none() is None

    async def is_impossible_travel(
        self,
        user_id: int,
        current_city: str,
        current_time: datetime,
        max_hours_diff: float = 2.0,
    ) -> bool:
        """
        Detect impossible travel: same user in different cities within a short time.

        For demo purposes, we use a simplified check:
        - If user logged in from a different city within the last 2 hours
        - We consider it impossible travel

        Args:
            user_id: User ID
            current_city: Current login city
            current_time: Current login time
            max_hours_diff: Maximum hours to check for impossible travel

        Returns:
            True if impossible travel detected
        """
        time_threshold = current_time - timedelta(hours=max_hours_diff)

        result = await self.db.execute(
            select(LoginEvent).where(
                LoginEvent.user_id == user_id,
                LoginEvent.login_time >= time_threshold,
                LoginEvent.city != current_city,
                LoginEvent.is_successful == True,
            ).order_by(LoginEvent.login_time.desc()).limit(1)
        )

        previous_login = result.scalar_one_or_none()
        return previous_login is not None

    async def get_user_cities(self, user_id: int) -> list[str]:
        """Get all cities where the user has logged in from."""
        result = await self.db.execute(
            select(LoginEvent.city).where(
                LoginEvent.user_id == user_id,
                LoginEvent.is_successful == True,
            ).distinct()
        )
        return [row[0] for row in result.all()]

    async def get_last_login(self, user_id: int) -> Optional[LoginEvent]:
        """Get the most recent successful login for a user."""
        result = await self.db.execute(
            select(LoginEvent).where(
                LoginEvent.user_id == user_id,
                LoginEvent.is_successful == True,
            ).order_by(LoginEvent.login_time.desc()).limit(1)
        )
        return result.scalar_one_or_none()
