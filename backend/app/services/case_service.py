"""
Case service.

Handles fraud case management.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone

from app.models.fraud_case import FraudCase


class CaseService:
    """Service for fraud case operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_case(
        self,
        user_id: int,
        alert_id: int,
        risk_score: int,
        case_status: str = "open",
        admin_notes: Optional[str] = None,
    ) -> FraudCase:
        """Create a new fraud case."""
        case = FraudCase(
            user_id=user_id,
            alert_id=alert_id,
            risk_score=risk_score,
            case_status=case_status,
            admin_notes=admin_notes,
        )
        self.db.add(case)
        await self.db.flush()
        return case

    async def get_case(self, case_id: int) -> Optional[FraudCase]:
        """Get a case by ID."""
        result = await self.db.execute(
            select(FraudCase).where(FraudCase.case_id == case_id)
        )
        return result.scalar_one_or_none()

    async def get_user_cases(self, user_id: int) -> list[FraudCase]:
        """Get all cases for a user."""
        result = await self.db.execute(
            select(FraudCase)
            .where(FraudCase.user_id == user_id)
            .order_by(FraudCase.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all_cases(self, limit: int = 100) -> list[FraudCase]:
        """Get all fraud cases (admin use)."""
        result = await self.db.execute(
            select(FraudCase).order_by(FraudCase.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def update_case_status(
        self,
        case_id: int,
        case_status: str,
        admin_notes: Optional[str] = None,
    ) -> Optional[FraudCase]:
        """Update case status and optional admin notes."""
        case = await self.get_case(case_id)
        if case:
            case.case_status = case_status
            case.updated_at = datetime.now(timezone.utc)
            if admin_notes:
                case.admin_notes = admin_notes
            await self.db.flush()
        return case

    async def get_case_counts(self) -> dict:
        """Get count of cases by status."""
        from sqlalchemy import func
        result = await self.db.execute(
            select(FraudCase.case_status, func.count(FraudCase.case_id))
            .group_by(FraudCase.case_status)
        )
        return {row[0]: row[1] for row in result.all()}
