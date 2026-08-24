import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PermitTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None = None


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


class ParkingLotWithDistance(ParkingLotRead):
    travel_minutes: float | None = None  # driving or walking time to/from this lot


class HealthResponse(BaseModel):
    status: str


# Auth schemas
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


PermitSlug = Literal["gold", "gold-plus", "blue"]


class UpdatePreferencesRequest(BaseModel):
    parking_pass: PermitSlug | None = None
    arrival_buffer: int | None = Field(None, ge=0, le=30)
    walking_speed: int | None = Field(None, ge=1, le=3)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    supabase_id: uuid.UUID
    email: str
    display_name: str | None = None
    preferred_permit_id: uuid.UUID | None = None
    arrival_buffer: int | None = None
    walking_speed: int | None = None
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: AuthTokens


class LogoutResponse(BaseModel):
    message: str


class DeleteAccountResponse(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    access_token: str
    refresh_token: str
    new_password: str = Field(min_length=6)


class ResetPasswordResponse(BaseModel):
    message: str


# Building and Classroom schemas
class BuildingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    nickname: str
    latitude: Decimal
    longitude: Decimal
    created_at: datetime
    updated_at: datetime


class BuildingLotsResponse(BaseModel):
    building: BuildingRead
    lots: list[ParkingLotWithDistance]


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
    lots: list[ParkingLotWithDistance]


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


class ManualEventCreate(BaseModel):
    event_name: str
    building_id: uuid.UUID | None = None
    room_number: str | None = None
    start_time: time
    end_time: time
    days_of_week: list[int]  # 0=Mon..6=Sun
    valid_from: date | None = None
    valid_until: date | None = None


class ManualEventUpdate(BaseModel):
    event_name: str | None = None
    building_id: uuid.UUID | None = None
    room_number: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    days_of_week: list[int] | None = None
    valid_from: date | None = None
    valid_until: date | None = None


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


# Feedback schemas
class FeedbackCreate(BaseModel):
    category: Literal["bug", "feature", "accuracy", "general"]
    message: str = Field(min_length=10, max_length=2000)
    contact_email: EmailStr | None = None


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: Literal["bug", "feature", "accuracy", "general"]
    message: str
    contact_email: str | None = None
    created_at: datetime
