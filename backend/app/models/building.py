"""Building model - campus buildings with GPS coordinates for proximity calculations."""

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.classroom import Classroom
    from app.models.lot_building_distance import LotBuildingDistance


class Building(Base, UUIDMixin, TimestampMixin):
    """A campus building with GPS coordinates. Contains classrooms."""

    __tablename__ = "buildings"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    nickname: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)

    # Relationships
    classrooms: Mapped[list["Classroom"]] = relationship(
        "Classroom", back_populates="building"
    )
    distances: Mapped[list["LotBuildingDistance"]] = relationship(
        "LotBuildingDistance", back_populates="building", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Building(name={self.name!r}, nickname={self.nickname!r}, lat={self.latitude}, lng={self.longitude})>"
