"""Precomputed walking distances from parking lots to buildings."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.building import Building
    from app.models.parking_lot import ParkingLot


class LotBuildingDistance(Base, UUIDMixin, TimestampMixin):
    """Precomputed walking distance from a parking lot to a building.

    Since classrooms within a building share coordinates, distances are
    stored at the lot-to-building level rather than lot-to-classroom.
    """

    __tablename__ = "lot_building_distances"
    __table_args__ = (
        UniqueConstraint("lot_id", "building_id"),
    )

    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_lots.id", ondelete="CASCADE"), nullable=False
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False
    )
    distance_miles: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False)
    duration_minutes: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)

    # Relationships
    lot: Mapped["ParkingLot"] = relationship("ParkingLot")
    building: Mapped["Building"] = relationship("Building")

    def __repr__(self) -> str:
        return (
            f"<LotBuildingDistance(lot_id={self.lot_id}, building_id={self.building_id}, "
            f"{self.distance_miles}mi, {self.duration_minutes}min)>"
        )
