import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.classroom import Classroom


class Building(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "buildings"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)

    # Relationships
    classrooms: Mapped[list["Classroom"]] = relationship(
        "Classroom", back_populates="building"
    )

    def __repr__(self) -> str:
        return f"<Building(name={self.name!r}, lat={self.latitude}, lng={self.longitude})>"
