from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Device(Base):
    """Device model to track user devices for new device detection."""

    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[str] = mapped_column(String(100), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    device_name: Mapped[str] = mapped_column(String(100))
    browser: Mapped[str] = mapped_column(String(50))
    os: Mapped[str] = mapped_column(String(50))
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=False)
    first_seen: Mapped[datetime] = mapped_column(server_default=func.now())
    last_seen: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="devices")

    def __repr__(self) -> str:
        return f"<Device {self.device_id} for user {self.user_id}>"
