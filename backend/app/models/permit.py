import uuid
from datetime import time
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, ForeignKey, Time, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, UUIDMixin

if TYPE_CHECKING:
    from .parking_lot import ParkingLot


class PermitType(Base, UUIDMixin):
    __tablename__ = "permit_types"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    lot_access: Mapped[list["LotPermitAccess"]] = relationship(
        "LotPermitAccess", back_populates="permit", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<PermitType(name={self.name!r})>"


class LotPermitAccess(Base, UUIDMixin):
    __tablename__ = "lot_permit_access"
    __table_args__ = (
        UniqueConstraint(
            "lot_id", "permit_id", "days_of_week", "access_start",
            name="uq_lot_permit_days_start"
        ),
    )

    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_lots.id"), nullable=False
    )
    permit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("permit_types.id"), nullable=False
    )
    # {0-4}=Mon-Fri, {5,6}=Sat-Sun, NULL=all days
    days_of_week: Mapped[Optional[list[int]]] = mapped_column(
        ARRAY(INTEGER), nullable=True
    )
    access_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    access_end: Mapped[Optional[time]] = mapped_column(Time, nullable=True)

    # Relationships
    lot: Mapped["ParkingLot"] = relationship("ParkingLot", back_populates="permit_access")
    permit: Mapped["PermitType"] = relationship("PermitType", back_populates="lot_access")

    def __repr__(self) -> str:
        return f"<LotPermitAccess(lot_id={self.lot_id}, permit_id={self.permit_id})>"
