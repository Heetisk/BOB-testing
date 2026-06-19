"""
KYC Fraud Detection Service.

Detects suspicious onboarding attempts including:
- Duplicate documents across multiple users
- Same phone/email in multiple accounts
- Multiple failed verification attempts
- Unusual submission patterns
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from dataclasses import dataclass
from datetime import datetime

from app.models.kyc_verification import KycVerification
from app.models.user import User
from app.ml.risk_rules import get_risk_level_and_action, is_unusual_hour


@dataclass
class KycRiskResult:
    """Result of KYC risk analysis."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str


class KycService:
    """Service for KYC fraud detection."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_duplicate_document(self, document_number_hash: str) -> bool:
        """Check if this document has been used by another user."""
        result = await self.db.execute(
            select(KycVerification).where(
                KycVerification.document_number_hash == document_number_hash,
                KycVerification.status != "rejected",
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def check_duplicate_identity(
        self, user_id: int, email: str, phone: Optional[str]
    ) -> dict:
        """Check if email or phone is linked to multiple accounts."""
        checks = {"email_duplicates": 0, "phone_duplicates": 0}

        # Check email duplicates
        email_result = await self.db.execute(
            select(func.count(User.user_id)).where(User.email == email)
        )
        checks["email_duplicates"] = email_result.scalar() or 0

        # Check phone duplicates
        if phone:
            phone_result = await self.db.execute(
                select(func.count(User.user_id)).where(User.phone == phone)
            )
            checks["phone_duplicates"] = phone_result.scalar() or 0

        return checks

    async def get_failed_kyc_attempts(self, user_id: int, hours: int = 24) -> int:
        """Count failed KYC attempts in the last N hours."""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        result = await self.db.execute(
            select(func.count(KycVerification.kyc_id)).where(
                KycVerification.user_id == user_id,
                KycVerification.status == "rejected",
                KycVerification.created_at >= cutoff,
            )
        )
        return result.scalar() or 0

    async def analyze_kyc_risk(
        self,
        user: User,
        document_type: str,
        document_number_hash: str,
        submission_ip: str,
        submission_city: str,
    ) -> KycRiskResult:
        """
        Analyze KYC submission risk.

        Returns risk score and recommended action.
        """
        score = 0
        reasons = []

        # Check for duplicate document
        is_duplicate_doc = await self.check_duplicate_document(document_number_hash)
        if is_duplicate_doc:
            score += 35
            reasons.append("Document already used by another user")

        # Check for duplicate identity fields
        identity_checks = await self.check_duplicate_identity(
            user.user_id, user.email, user.phone
        )
        if identity_checks["email_duplicates"] > 1:
            score += 30
            reasons.append("Email linked to multiple accounts")
        if identity_checks["phone_duplicates"] > 1:
            score += 25
            reasons.append("Phone linked to multiple accounts")

        # Check for multiple failed attempts
        failed_attempts = await self.get_failed_kyc_attempts(user.user_id)
        if failed_attempts > 0:
            score += min(failed_attempts * 10, 30)
            reasons.append(f"{failed_attempts} previous failed KYC attempt(s)")

        # Night submission (10 PM - 5 AM)
        current_hour = datetime.utcnow().hour
        if is_unusual_hour(current_hour):
            score += 10
            reasons.append("KYC submitted during unusual hours")

        # Cap score at 100
        score = min(score, 100)

        # Determine risk level
        risk_level, action = get_risk_level_and_action(score)

        return KycRiskResult(
            risk_score=score,
            risk_level=risk_level,
            risk_reasons=reasons,
            recommended_action=action,
        )

    async def submit_kyc(
        self,
        user: User,
        document_type: str,
        document_number_hash: str,
        submission_ip: str,
        submission_city: str,
    ) -> KycVerification:
        """
        Submit KYC for verification with risk analysis.
        """
        # Analyze risk
        risk_result = await self.analyze_kyc_risk(
            user=user,
            document_type=document_type,
            document_number_hash=document_number_hash,
            submission_ip=submission_ip,
            submission_city=submission_city,
        )

        # Determine status based on risk
        if risk_result.risk_level == "Low":
            status = "approved"
        elif risk_result.risk_level == "Medium":
            status = "pending"
        else:
            status = "suspicious"

        # Create KYC record
        kyc = KycVerification(
            user_id=user.user_id,
            document_type=document_type,
            document_number_hash=document_number_hash,
            submission_ip=submission_ip,
            submission_city=submission_city,
            status=status,
            risk_score=risk_result.risk_score,
            rejection_reason=", ".join(risk_result.risk_reasons) if risk_result.risk_reasons else None,
        )
        self.db.add(kyc)
        await self.db.flush()
        return kyc

    async def get_user_kyc(self, user_id: int) -> Optional[KycVerification]:
        """Get the latest KYC verification for a user."""
        result = await self.db.execute(
            select(KycVerification)
            .where(KycVerification.user_id == user_id)
            .order_by(KycVerification.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_suspicious_kyc(self, limit: int = 50) -> list[KycVerification]:
        """Get all suspicious KYC attempts (admin use)."""
        result = await self.db.execute(
            select(KycVerification)
            .where(KycVerification.status == "suspicious")
            .order_by(KycVerification.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_kyc_status(
        self, kyc_id: int, status: str, rejection_reason: Optional[str] = None
    ) -> Optional[KycVerification]:
        """Update KYC verification status."""
        result = await self.db.execute(
            select(KycVerification).where(KycVerification.kyc_id == kyc_id)
        )
        kyc = result.scalar_one_or_none()
        if kyc:
            kyc.status = status
            if rejection_reason:
                kyc.rejection_reason = rejection_reason
            await self.db.flush()
        return kyc
