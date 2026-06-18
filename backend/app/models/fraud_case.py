from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FraudCase(Base):
    """Fraud case model for high-risk cases requiring admin review."""

    __tablename__ = "fraud_cases"

    case_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("alerts.alert_id"), unique=True)
    risk_score: Mapped[int] = mapped_column(Integer)
    case_status: Mapped[str] = mapped_column(String(50), default="open")  # open, investigating, resolved, false_positive
    admin_notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="fraud_cases")
    alert: Mapped["Alert"] = relationship(back_populates="fraud_case")

    def __repr__(self) -> str:
        return f"<FraudCase {self.case_id} status={self.case_status}>"
