import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.building import Building
    from app.models.schedule import ScheduleEvent


class Classroom(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "classrooms"

    location_string: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    building_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("buildings.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    building: Mapped["Building | None"] = relationship(
        "Building", back_populates="classrooms"
    )
    schedule_events: Mapped[list["ScheduleEvent"]] = relationship(
        "ScheduleEvent", back_populates="classroom"
    )

    def __repr__(self) -> str:
        return f"<Classroom(location_string={self.location_string!r}, building_id={self.building_id})>"
