"""
Privacy Service for Data Protection.

Handles consent management, data masking, and access logging.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from datetime import datetime

from app.models.privacy import ConsentRecord, DataAccessLog
from app.models.user import User


class PrivacyService:
    """Service for privacy compliance."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # Data masking functions
    @staticmethod
    def mask_phone(phone: str) -> str:
        """Mask phone number: +91 XXXXX 67890"""
        if not phone or len(phone) < 10:
            return "XXX"
        return f"{phone[:5]}XXXXX{phone[-4:]}"

    @staticmethod
    def mask_email(email: str) -> str:
        """Mask email: j***@example.com"""
        if not email or "@" not in email:
            return "***"
        local, domain = email.split("@", 1)
        if len(local) <= 1:
            return f"*@{domain}"
        return f"{local[0]}***@{domain}"

    @staticmethod
    def mask_aadhaar(aadhaar: str) -> str:
        """Mask Aadhaar: XXXX XXXX 1234"""
        clean = aadhaar.replace(" ", "")
        if len(clean) != 12:
            return "XXXX XXXX XXXX"
        return f"XXXX XXXX {clean[-4:]}"

    @staticmethod
    def mask_name(name: str) -> str:
        """Mask name: J*** P***"""
        parts = name.split()
        masked = []
        for part in parts:
            if len(part) <= 1:
                masked.append("*")
            else:
                masked.append(f"{part[0]}***")
        return " ".join(masked)

    async def record_consent(
        self,
        user_id: int,
        consent_type: str,
        is_granted: bool,
        ip_address: Optional[str] = None,
    ) -> ConsentRecord:
        """Record user consent."""
        consent = ConsentRecord(
            user_id=user_id,
            consent_type=consent_type,
            is_granted=is_granted,
            ip_address=ip_address,
        )
        self.db.add(consent)
        await self.db.flush()
        return consent

    async def revoke_consent(self, user_id: int, consent_type: str) -> bool:
        """Revoke a consent."""
        result = await self.db.execute(
            select(ConsentRecord).where(
                ConsentRecord.user_id == user_id,
                ConsentRecord.consent_type == consent_type,
                ConsentRecord.is_granted == True,
            )
        )
        consent = result.scalar_one_or_none()
        if consent:
            consent.is_granted = False
            consent.revoked_at = datetime.utcnow()
            await self.db.flush()
            return True
        return False

    async def get_user_consents(self, user_id: int) -> list[ConsentRecord]:
        """Get all consents for a user."""
        result = await self.db.execute(
            select(ConsentRecord)
            .where(ConsentRecord.user_id == user_id)
            .order_by(ConsentRecord.granted_at.desc())
        )
        return list(result.scalars().all())

    async def log_data_access(
        self,
        accessor_id: int,
        target_user_id: int,
        data_type: str,
        access_type: str,
        purpose: str,
        ip_address: Optional[str] = None,
    ) -> DataAccessLog:
        """Log data access for audit trail."""
        log = DataAccessLog(
            accessor_id=accessor_id,
            target_user_id=target_user_id,
            data_type=data_type,
            access_type=access_type,
            purpose=purpose,
            ip_address=ip_address,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_data_access_logs(self, limit: int = 100) -> list[DataAccessLog]:
        """Get all data access logs."""
        result = await self.db.execute(
            select(DataAccessLog).order_by(DataAccessLog.accessed_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_masked_user_data(self, user: User) -> dict:
        """Get user data with sensitive fields masked."""
        return {
            "user_id": user.user_id,
            "name": self.mask_name(user.name),
            "email": self.mask_email(user.email),
            "phone": self.mask_phone(user.phone) if user.phone else None,
            "role": user.role,
            "usual_city": user.usual_city,
        }

    async def anonymize_user(self, user_id: int) -> bool:
        """Anonymize user data (right to be forgotten)."""
        result = await self.db.execute(
            update(User)
            .where(User.user_id == user_id)
            .values(
                name="ANONYMOUS",
                email=f"deleted_{user_id}@anonymous.local",
                phone=None,
                usual_city=None,
                usual_device=None,
            )
        )
        await self.db.flush()
        return result.rowcount > 0
