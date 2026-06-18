"""
Transaction service.

Handles transaction creation and risk analysis.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.models.transaction import Transaction


class TransactionService:
    """Service for transaction-related operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_transaction(
        self,
        user_id: int,
        amount: float,
        beneficiary_id: str,
        beneficiary_name: str,
        city: str,
        transaction_type: str = "transfer",
        is_new_beneficiary: bool = False,
        risk_score: Optional[int] = None,
        status: str = "pending",
    ) -> Transaction:
        """Create a new transaction."""
        transaction = Transaction(
            user_id=user_id,
            amount=amount,
            beneficiary_id=beneficiary_id,
            beneficiary_name=beneficiary_name,
            transaction_type=transaction_type,
            city=city,
            is_new_beneficiary=is_new_beneficiary,
            risk_score=risk_score,
            status=status,
        )
        self.db.add(transaction)
        await self.db.flush()
        return transaction

    async def get_transaction(self, transaction_id: int) -> Optional[Transaction]:
        """Get a transaction by ID."""
        result = await self.db.execute(
            select(Transaction).where(Transaction.transaction_id == transaction_id)
        )
        return result.scalar_one_or_none()

    async def get_user_transactions(self, user_id: int, limit: int = 50) -> list[Transaction]:
        """Get recent transactions for a user."""
        result = await self.db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.transaction_time.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_transaction_stats(self, user_id: int) -> dict:
        """Get transaction statistics for a user."""
        result = await self.db.execute(
            select(
                func.count(Transaction.transaction_id).label("count"),
                func.avg(Transaction.amount).label("avg_amount"),
                func.max(Transaction.amount).label("max_amount"),
            ).where(Transaction.user_id == user_id)
        )
        stats = result.one()

        return {
            "count": stats.count or 0,
            "avg_amount": float(stats.avg_amount) if stats.avg_amount else 0.0,
            "max_amount": float(stats.max_amount) if stats.max_amount else 0.0,
        }

    async def is_new_beneficiary(self, user_id: int, beneficiary_id: str) -> bool:
        """Check if this is a new beneficiary for the user."""
        result = await self.db.execute(
            select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.beneficiary_id == beneficiary_id,
            ).limit(1)
        )
        return result.scalar_one_or_none() is None

    async def is_high_amount(self, user_id: int, amount: float, threshold: float = 50000) -> bool:
        """Check if transaction amount is unusually high."""
        stats = await self.get_user_transaction_stats(user_id)

        # If user has no transaction history, use absolute threshold
        if stats["count"] == 0:
            return amount > threshold

        # Otherwise, check if amount is significantly higher than average
        return amount > stats["avg_amount"] * 3 or amount > threshold

    async def get_all_transactions(self, limit: int = 100) -> list[Transaction]:
        """Get all transactions (admin use)."""
        result = await self.db.execute(
            select(Transaction).order_by(Transaction.transaction_time.desc()).limit(limit)
        )
        return list(result.scalars().all())
