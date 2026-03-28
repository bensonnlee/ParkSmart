"""Academic calendar models — terms and auto-generated weeks."""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class AcademicTerm(Base, UUIDMixin, TimestampMixin):
    """An academic quarter (fall, winter, or spring) with a Sunday start date."""

    __tablename__ = "academic_terms"
    __table_args__ = (
        CheckConstraint(
            "term_type IN ('fall', 'winter', 'spring')",
            name="ck_academic_terms_term_type",
        ),
        CheckConstraint(
            "EXTRACT(DOW FROM start_date) = 0",
            name="ck_academic_terms_start_date_sunday",
        ),
        # Note: the unique expression index on (term_type, EXTRACT(YEAR FROM start_date))
        # is created in the Alembic migration, not here, because SQLAlchemy doesn't natively
        # support expression indexes in __table_args__.
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    term_type: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    weeks: Mapped[list[AcademicWeek]] = relationship(
        "AcademicWeek",
        back_populates="term",
        cascade="all, delete-orphan",
        order_by="AcademicWeek.week_number",
    )

    def __repr__(self) -> str:
        return f"<AcademicTerm(name={self.name!r}, start_date={self.start_date})>"


class AcademicWeek(Base, UUIDMixin):
    """One Sunday-to-Saturday week within an academic term."""

    __tablename__ = "academic_weeks"
    __table_args__ = (
        UniqueConstraint("term_id", "week_number", name="uq_academic_weeks_term_week"),
        CheckConstraint(
            "week_number BETWEEN 1 AND 11",
            name="ck_academic_weeks_week_number",
        ),
        CheckConstraint(
            "end_date = start_date + 6",
            name="ck_academic_weeks_end_date",
        ),
        Index("idx_academic_weeks_dates", "start_date", "end_date"),
    )

    term_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_terms.id", ondelete="CASCADE"), nullable=False
    )
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    label: Mapped[str | None] = mapped_column(String, nullable=True)

    # Relationships
    term: Mapped[AcademicTerm] = relationship("AcademicTerm", back_populates="weeks")

    def __repr__(self) -> str:
        return f"<AcademicWeek(term_id={self.term_id}, week={self.week_number})>"
