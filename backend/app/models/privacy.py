from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ConsentRecord(Base):
    """User consent tracking for privacy compliance."""

    __tablename__ = "consent_records"

    consent_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    consent_type: Mapped[str] = mapped_column(String(100))  # data_processing, marketing, third_party_sharing
    is_granted: Mapped[bool] = mapped_column(Boolean, default=True)
    granted_at: Mapped[datetime] = mapped_column(server_default=func.now())
    revoked_at: Mapped[datetime] = mapped_column(nullable=True)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<ConsentRecord {self.consent_id} type={self.consent_type}>"


class DataAccessLog(Base):
    """Data access audit trail for privacy compliance."""

    __tablename__ = "data_access_logs"

    log_id: Mapped[int] = mapped_column(primary_key=True)
    accessor_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    target_user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    data_type: Mapped[str] = mapped_column(String(50))  # phone, email, transaction, kyc
    access_type: Mapped[str] = mapped_column(String(50))  # view, export, mask
    purpose: Mapped[str] = mapped_column(String(100))  # fraud_check, compliance, customer_service
    accessed_at: Mapped[datetime] = mapped_column(server_default=func.now())
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)

    # Relationships
    accessor: Mapped["User"] = relationship(foreign_keys=[accessor_id])
    target_user: Mapped["User"] = relationship(foreign_keys=[target_user_id])

    def __repr__(self) -> str:
        return f"<DataAccessLog {self.log_id} type={self.data_type}>"
