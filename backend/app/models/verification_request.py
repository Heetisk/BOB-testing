from datetime import datetime
from sqlalchemy import String, Boolean, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VerificationRequest(Base):
    """OTP/verification request tracking."""

    __tablename__ = "verification_requests"

    verification_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    verification_type: Mapped[str] = mapped_column(String(50))  # otp_sms, otp_email, security_question
    code_hash: Mapped[str] = mapped_column(String(255))
    device_id: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(100))
    ip_address: Mapped[str] = mapped_column(String(50))
    requested_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column()
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<VerificationRequest {self.verification_id} type={self.verification_type}>"
