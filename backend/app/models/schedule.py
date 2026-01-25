import uuid
from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import ARRAY, Date, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.classroom import Classroom
    from app.models.user import User


class UserSchedule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_schedules"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    name: Mapped[str | None] = mapped_column(String, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="schedule")
    events: Mapped[list["ScheduleEvent"]] = relationship(
        "ScheduleEvent",
        back_populates="schedule",
        cascade="all, delete-orphan",
        order_by="ScheduleEvent.start_time",
    )

    def __repr__(self) -> str:
        return f"<UserSchedule(user_id={self.user_id!r}, name={self.name!r})>"


class ScheduleEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "schedule_events"

    schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_schedules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_name: Mapped[str] = mapped_column(String, nullable=False)
    classroom_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classrooms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    days_of_week: Mapped[list[int] | None] = mapped_column(
        ARRAY(Integer), nullable=True
    )
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    schedule: Mapped["UserSchedule"] = relationship(
        "UserSchedule", back_populates="events"
    )
    classroom: Mapped["Classroom | None"] = relationship(
        "Classroom", back_populates="schedule_events"
    )

    def __repr__(self) -> str:
        return f"<ScheduleEvent(event_name={self.event_name!r}, start_time={self.start_time!r})>"
