import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Integer, Numeric, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, UUIDMixin

if TYPE_CHECKING:
    from .parking_lot import ParkingLot


class ParkingSnapshot(Base, UUIDMixin):
    __tablename__ = "parking_snapshots"

    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_lots.id"), nullable=False
    )
    free_spaces: Mapped[int] = mapped_column(Integer, nullable=False)
    occupancy_pct: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    lot: Mapped["ParkingLot"] = relationship("ParkingLot", back_populates="snapshots")

    def __repr__(self) -> str:
        return f"<ParkingSnapshot(lot_id={self.lot_id}, collected_at={self.collected_at})>"


# Index created after class definition to reference column properly
Index("idx_snapshots_lot_time", ParkingSnapshot.lot_id, ParkingSnapshot.collected_at.desc())
