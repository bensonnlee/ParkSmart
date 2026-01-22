import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PermitTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None


class ParkingSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lot_id: uuid.UUID
    free_spaces: int
    occupancy_pct: Optional[Decimal] = None
    collected_at: datetime


class ParkingLotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    address: Optional[str] = None
    total_spaces: Optional[int] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime


class ParkingLotWithAvailability(ParkingLotRead):
    free_spaces: Optional[int] = None
    occupancy_pct: Optional[Decimal] = None
    availability_updated_at: Optional[datetime] = None


class PaginatedSnapshots(BaseModel):
    items: list[ParkingSnapshotRead]
    total: int
    page: int
    per_page: int
    pages: int


class HealthResponse(BaseModel):
    status: str
    last_collection: Optional[datetime] = None


class CollectionResponse(BaseModel):
    status: str
    lots_updated: int
    snapshots_created: int
