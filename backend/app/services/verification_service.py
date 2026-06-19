"""
Verification Service for Step-up Authentication.

Handles OTP generation, verification, and trusted device management.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import secrets

from app.models.verification_request import VerificationRequest


class VerificationService:
    """Service for step-up verification."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_otp(self) -> str:
        """Generate a 6-digit OTP."""
        return f"{secrets.randbelow(1000000):06d}"

    def _hash_code(self, code: str) -> str:
        """Hash the verification code."""
        return hashlib.sha256(code.encode()).hexdigest()

    async def request_verification(
        self,
        user_id: int,
        verification_type: str,
        device_id: str,
        city: str,
        ip_address: str,
        risk_score: int = 0,
    ) -> tuple[VerificationRequest, str]:
        """
        Request a verification code.

        Returns the verification record and the plaintext code.
        In production, the code would be sent via SMS/email.
        """
        # Generate code
        code = self._generate_otp()
        code_hash = self._hash_code(code)

        # Create verification request
        verification = VerificationRequest(
            user_id=user_id,
            verification_type=verification_type,
            code_hash=code_hash,
            device_id=device_id,
            city=city,
            ip_address=ip_address,
            expires_at=datetime.utcnow() + timedelta(minutes=5),
            risk_score=risk_score,
        )
        self.db.add(verification)
        await self.db.flush()

        return verification, code

    async def verify_code(
        self,
        user_id: int,
        code: str,
        verification_type: str,
    ) -> tuple[bool, str]:
        """
        Verify a verification code.

        Returns (success, message).
        """
        # Find the latest unverified request
        result = await self.db.execute(
            select(VerificationRequest).where(
                VerificationRequest.user_id == user_id,
                VerificationRequest.verification_type == verification_type,
                VerificationRequest.is_verified == False,
            ).order_by(VerificationRequest.requested_at.desc()).limit(1)
        )
        verification = result.scalar_one_or_none()

        if verification is None:
            return False, "No pending verification found"

        # Check expiration
        if datetime.utcnow() > verification.expires_at:
            return False, "Verification code expired"

        # Check max attempts
        if verification.attempts >= 3:
            return False, "Maximum attempts exceeded"

        # Increment attempts
        verification.attempts += 1

        # Verify code
        code_hash = self._hash_code(code)
        if verification.code_hash == code_hash:
            verification.is_verified = True
            await self.db.flush()
            return True, "Verification successful"

        await self.db.flush()
        return False, "Invalid verification code"

    async def get_user_verifications(self, user_id: int, limit: int = 20) -> list[VerificationRequest]:
        """Get verification history for a user."""
        result = await self.db.execute(
            select(VerificationRequest)
            .where(VerificationRequest.user_id == user_id)
            .order_by(VerificationRequest.requested_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_pending_verification(self, user_id: int) -> Optional[VerificationRequest]:
        """Get the latest pending verification for a user."""
        result = await self.db.execute(
            select(VerificationRequest).where(
                VerificationRequest.user_id == user_id,
                VerificationRequest.is_verified == False,
            ).order_by(VerificationRequest.requested_at.desc()).limit(1)
        )
        return result.scalar_one_or_none()
