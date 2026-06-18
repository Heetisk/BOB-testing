"""
Audit Service for Privileged Access Monitoring.

Tracks admin actions and detects suspicious behavior.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timedelta, timezone
import json

from app.models.audit_log import AuditLog
from app.ml.risk_rules import is_unusual_hour


class AuditService:
    """Service for audit logging and monitoring."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_action(
        self,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: str = "",
        city: Optional[str] = None,
        risk_score: Optional[int] = None,
    ) -> AuditLog:
        """Log an auditable action."""
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            city=city,
            risk_score=risk_score,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_all_logs(self, limit: int = 100) -> list[AuditLog]:
        """Get all audit logs (admin use)."""
        result = await self.db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_logs(self, user_id: int, limit: int = 50) -> list[AuditLog]:
        """Get audit logs for a specific user."""
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_suspicious_actions(self, min_risk_score: int = 70, limit: int = 50) -> list[AuditLog]:
        """Get actions with high risk scores."""
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.risk_score >= min_risk_score)
            .order_by(AuditLog.risk_score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def analyze_action_risk(
        self,
        user_id: int,
        action: str,
        resource_type: str,
        ip_address: str,
        city: Optional[str] = None,
    ) -> int:
        """Calculate risk score for an audit action."""
        score = 0

        # High-risk actions
        high_risk_actions = {
            "bulk_data_export": 35,
            "user_account_modify": 25,
            "privilege_escalation": 40,
            "system_config_change": 35,
            "failed_admin_login": 20,
        }
        if action in high_risk_actions:
            score += high_risk_actions[action]

        # Check for unusual hours (10 PM - 5 AM)
        current_hour = datetime.now(timezone.utc).hour
        if is_unusual_hour(current_hour):
            score += 15

        # Check for rapid actions
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
        result = await self.db.execute(
            select(func.count(AuditLog.log_id)).where(
                AuditLog.user_id == user_id,
                AuditLog.created_at >= cutoff,
            )
        )
        recent_actions = result.scalar() or 0
        if recent_actions > 10:
            score += 20

        return min(score, 100)
