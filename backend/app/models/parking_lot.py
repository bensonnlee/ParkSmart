"""Parking lot model with location, capacity, and GPS coordinates."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.permit import LotPermitAccess
    from app.models.snapshot import ParkingSnapshot


class ParkingLot(Base, UUIDMixin, TimestampMixin):
    """A campus parking lot. Links to snapshots (occupancy) and permit_access (rules)."""

    __tablename__ = "parking_lots"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    total_spaces: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)

    # Relationships
    snapshots: Mapped[list[ParkingSnapshot]] = relationship(
        "ParkingSnapshot", back_populates="lot", cascade="all, delete-orphan"
    )
    permit_access: Mapped[list[LotPermitAccess]] = relationship(
        "LotPermitAccess", back_populates="lot", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ParkingLot(name={self.name!r})>"
