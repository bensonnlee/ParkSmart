from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from .snapshot import ParkingSnapshot
    from .permit import LotPermitAccess


class ParkingLot(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "parking_lots"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_spaces: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)

    # Relationships
    snapshots: Mapped[list["ParkingSnapshot"]] = relationship(
        "ParkingSnapshot", back_populates="lot", cascade="all, delete-orphan"
    )
    permit_access: Mapped[list["LotPermitAccess"]] = relationship(
        "LotPermitAccess", back_populates="lot", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ParkingLot(name={self.name!r})>"
