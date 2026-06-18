from datetime import datetime
from sqlalchemy import String, Boolean, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SessionEvent(Base):
    """Session event tracking for continuous validation."""

    __tablename__ = "session_events"

    event_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    session_token: Mapped[str] = mapped_column(String(255), index=True)
    event_type: Mapped[str] = mapped_column(String(50))  # page_view, action, api_call
    city: Mapped[str] = mapped_column(String(100))
    ip_address: Mapped[str] = mapped_column(String(50))
    device_id: Mapped[str] = mapped_column(String(100))
    timestamp: Mapped[datetime] = mapped_column(server_default=func.now())
    risk_score: Mapped[int] = mapped_column(Integer, nullable=True)
    is_suspicious: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<SessionEvent {self.event_id} type={self.event_type}>"
