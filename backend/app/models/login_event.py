from datetime import datetime
from sqlalchemy import String, Boolean, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LoginEvent(Base):
    """Login event model to track all login attempts for risk analysis."""

    __tablename__ = "login_events"

    login_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    ip_address: Mapped[str] = mapped_column(String(50))
    city: Mapped[str] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), default="India")
    device_id: Mapped[str] = mapped_column(String(100))
    browser: Mapped[str] = mapped_column(String(50))
    os: Mapped[str] = mapped_column(String(50))
    login_time: Mapped[datetime] = mapped_column(server_default=func.now())
    is_successful: Mapped[bool] = mapped_column(Boolean, default=True)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=True)  # Low, Medium, High
    action_taken: Mapped[str] = mapped_column(String(50), nullable=True)  # Allow, Block, Step-up
    is_new_device: Mapped[bool] = mapped_column(Boolean, default=False)
    is_new_location: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="login_events")

    def __repr__(self) -> str:
        return f"<LoginEvent {self.login_id} for user {self.user_id}>"
