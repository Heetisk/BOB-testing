from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class KycVerification(Base):
    """KYC verification model for tracking onboarding attempts."""

    __tablename__ = "kyc_verifications"

    kyc_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    document_type: Mapped[str] = mapped_column(String(50))  # Aadhaar, PAN, Passport
    document_number_hash: Mapped[str] = mapped_column(String(255))  # Hashed for privacy
    submission_ip: Mapped[str] = mapped_column(String(50))
    submission_city: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, approved, rejected, suspicious
    risk_score: Mapped[int] = mapped_column(Integer, nullable=True)
    rejection_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="kyc_verifications")

    def __repr__(self) -> str:
        return f"<KycVerification {self.kyc_id} status={self.status}>"
