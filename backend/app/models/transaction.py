from datetime import datetime
from sqlalchemy import String, Integer, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Transaction(Base):
    """Transaction model to track financial transactions and detect anomalies."""

    __tablename__ = "transactions"

    transaction_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    beneficiary_id: Mapped[str] = mapped_column(String(100))
    beneficiary_name: Mapped[str] = mapped_column(String(100))
    transaction_type: Mapped[str] = mapped_column(String(50), default="transfer")
    city: Mapped[str] = mapped_column(String(100))
    transaction_time: Mapped[datetime] = mapped_column(server_default=func.now())
    risk_score: Mapped[int] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, approved, blocked, flagged
    is_new_beneficiary: Mapped[bool] = mapped_column(default=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction {self.transaction_id} amount={self.amount}>"
