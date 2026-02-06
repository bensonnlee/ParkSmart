import uuid
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PermitTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None = None


class ParkingSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lot_id: uuid.UUID
    free_spaces: int
    occupancy_pct: Decimal | None = None
    collected_at: datetime


class ParkingLotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    address: str | None = None
    total_spaces: int | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class ParkingLotWithAvailability(ParkingLotRead):
    free_spaces: int | None = None
    occupancy_pct: Decimal | None = None
    availability_updated_at: datetime | None = None


class PaginatedSnapshots(BaseModel):
    items: list[ParkingSnapshotRead]
    total: int
    page: int
    per_page: int
    pages: int


class HealthResponse(BaseModel):
    status: str
    last_collection: datetime | None = None


class CollectionResponse(BaseModel):
    status: str
    lots_updated: int
    snapshots_created: int


# Auth schemas
class SignUpRequest(BaseModel):
    email: str
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    supabase_id: uuid.UUID
    email: str
    display_name: str | None = None
    preferred_permit_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: AuthTokens


class LogoutResponse(BaseModel):
    message: str


# Building and Classroom schemas
class BuildingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    latitude: Decimal
    longitude: Decimal
    created_at: datetime
    updated_at: datetime


class ClassroomRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    location_string: str
    building_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class ClassroomWithBuilding(ClassroomRead):
    building: BuildingRead | None = None


class ClassroomLotsResponse(BaseModel):
    classroom: ClassroomWithBuilding
    lots: list[ParkingLotRead]


# Schedule schemas
class ScheduleEventCreate(BaseModel):
    event_name: str
    classroom_id: uuid.UUID | None = None
    start_time: time
    end_time: time
    days_of_week: list[int] | None = None
    valid_from: date | None = None
    valid_until: date | None = None


class ScheduleEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    schedule_id: uuid.UUID
    event_name: str
    classroom_id: uuid.UUID | None = None
    start_time: time
    end_time: time
    days_of_week: list[int] | None = None
    valid_from: date | None = None
    valid_until: date | None = None
    created_at: datetime
    updated_at: datetime


class UserScheduleCreate(BaseModel):
    name: str | None = None
    events: list[ScheduleEventCreate] = []


class UserScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str | None = None
    events: list[ScheduleEventRead] = []
    created_at: datetime
    updated_at: datetime
