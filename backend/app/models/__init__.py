"""
ParkSmart Database Models

Models:
- AcademicTerm, AcademicWeek: Academic calendar terms and weeks
- ParkingLot, ParkingSnapshot: Lots and real-time occupancy data
- PermitType, LotPermitAccess: Permit types and lot access rules
- Building, Classroom: Campus locations for proximity calculations
- LotBuildingDistance: Precomputed walking distances from lots to buildings
- User, UserSchedule, ScheduleEvent: Users and their class schedules
- Feedback: Beta user feedback submissions
- ParkingForecast: Pre-computed Prophet predictions for lot availability

All models use UUID primary keys. See base.py for shared mixins.
"""

from app.models.academic import AcademicTerm, AcademicWeek
from app.models.base import Base
from app.models.building import Building
from app.models.classroom import Classroom
from app.models.feedback import Feedback
from app.models.forecast import ParkingForecast
from app.models.lot_building_distance import LotBuildingDistance
from app.models.parking_lot import ParkingLot
from app.models.permit import LotPermitAccess, PermitType
from app.models.schedule import ScheduleEvent, UserSchedule
from app.models.snapshot import ParkingSnapshot
from app.models.user import User

__all__ = [
    "AcademicTerm",
    "AcademicWeek",
    "Base",
    "Building",
    "Classroom",
    "Feedback",
    "LotBuildingDistance",
    "LotPermitAccess",
    "ParkingForecast",
    "ParkingLot",
    "ParkingSnapshot",
    "PermitType",
    "ScheduleEvent",
    "User",
    "UserSchedule",
]
