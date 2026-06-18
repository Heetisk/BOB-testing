from datetime import datetime
from sqlalchemy import String, Boolean, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PasswordReset(Base):
    """Password reset attempt tracking for risk analysis."""

    __tablename__ = "password_resets"

    reset_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    reset_token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    device_id: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(100))
    ip_address: Mapped[str] = mapped_column(String(50))
    requested_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column()
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<PasswordReset {self.reset_id} risk={self.risk_level}>"
