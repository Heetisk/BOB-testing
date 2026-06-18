from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditLog(Base):
    """Audit log for tracking admin and privileged actions."""

    __tablename__ = "audit_logs"

    log_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    action: Mapped[str] = mapped_column(String(100))  # login, logout, export_data, modify_user, etc.
    resource_type: Mapped[str] = mapped_column(String(50))  # user, transaction, system
    resource_id: Mapped[str] = mapped_column(String(100), nullable=True)
    details: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    ip_address: Mapped[str] = mapped_column(String(50))
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<AuditLog {self.log_id} action={self.action}>"
