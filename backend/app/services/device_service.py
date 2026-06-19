"""
Device service.

Handles device detection, trust management, and device history.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime

from app.models.device import Device


class DeviceService:
    """Service for device-related operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_device(self, user_id: int, device_id: str) -> Optional[Device]:
        """Get a specific device for a user."""
        result = await self.db.execute(
            select(Device).where(
                Device.user_id == user_id,
                Device.device_id == device_id,
            )
        )
        return result.scalar_one_or_none()

    async def is_new_device(self, user_id: int, device_id: str) -> bool:
        """Check if this is a new device for the user."""
        device = await self.get_device(user_id, device_id)
        return device is None

    async def is_trusted_device(self, user_id: int, device_id: str) -> bool:
        """Check if this device is trusted."""
        device = await self.get_device(user_id, device_id)
        if device is None:
            return False
        return device.is_trusted

    async def save_device(
        self,
        user_id: int,
        device_id: str,
        device_name: str,
        browser: str,
        os: str,
        is_trusted: bool = False,
    ) -> Device:
        """
        Save or update a device record.

        If the device already exists, update last_seen.
        If not, create a new record.
        """
        device = await self.get_device(user_id, device_id)

        if device:
            device.last_seen = datetime.utcnow()
            if is_trusted:
                device.is_trusted = True
        else:
            device = Device(
                device_id=device_id,
                user_id=user_id,
                device_name=device_name,
                browser=browser,
                os=os,
                is_trusted=is_trusted,
            )
            self.db.add(device)

        await self.db.flush()
        return device

    async def get_user_devices(self, user_id: int) -> list[Device]:
        """Get all devices for a user."""
        result = await self.db.execute(
            select(Device).where(Device.user_id == user_id)
        )
        return list(result.scalars().all())

    async def trust_device(self, user_id: int, device_id: str) -> Optional[Device]:
        """Mark a device as trusted."""
        device = await self.get_device(user_id, device_id)
        if device:
            device.is_trusted = True
            await self.db.flush()
        return device
