"""User model - links to Supabase auth, stores permit preference."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.schedule import UserSchedule


class User(Base, UUIDMixin, TimestampMixin):
    """App user linked to Supabase auth. Has optional schedule and permit preference."""

    __tablename__ = "users"

    # Links to Supabase auth.users
    supabase_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False, index=True
    )
    # Denormalized for convenience
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    # Future preference
    preferred_permit_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("permit_types.id"), nullable=True
    )

    # Relationships
    schedule: Mapped["UserSchedule | None"] = relationship(
        "UserSchedule", back_populates="user", uselist=False
    )

    def __repr__(self) -> str:
        return f"<User(email={self.email!r})>"
