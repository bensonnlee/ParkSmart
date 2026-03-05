"""Parking forecast model - pre-computed Prophet predictions for lot availability."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.models.parking_lot import ParkingLot


class ParkingForecast(Base, UUIDMixin):
    """Pre-computed forecast of lot availability at a future timeslot."""

    __tablename__ = "parking_forecasts"

    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_lots.id"), nullable=False
    )
    forecast_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    predicted_free_spaces: Mapped[int] = mapped_column(Integer, nullable=False)
    predicted_free_spaces_lower: Mapped[int] = mapped_column(Integer, nullable=False)
    predicted_occupancy_pct: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    model_version: Mapped[str] = mapped_column(String, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    lot: Mapped[ParkingLot] = relationship("ParkingLot", back_populates="forecasts")

    def __repr__(self) -> str:
        return (
            f"<ParkingForecast(lot_id={self.lot_id}, "
            f"forecast_time={self.forecast_time})>"
        )


Index(
    "idx_forecasts_lot_time",
    ParkingForecast.lot_id,
    ParkingForecast.forecast_time,
)
