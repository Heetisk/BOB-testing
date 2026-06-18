from datetime import datetime
from sqlalchemy import String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Alert(Base):
    """Alert model for suspicious activity notifications."""

    __tablename__ = "alerts"

    alert_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    alert_type: Mapped[str] = mapped_column(String(100))  # new_device, unusual_location, high_risk_login, suspicious_transaction
    risk_level: Mapped[str] = mapped_column(String(20))  # Low, Medium, High, Critical
    message: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(50), default="open")  # open, reviewing, resolved, false_positive
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="alerts")
    fraud_case: Mapped["FraudCase"] = relationship(back_populates="alert", uselist=False)

    def __repr__(self) -> str:
        return f"<Alert {self.alert_id} type={self.alert_type}>"
