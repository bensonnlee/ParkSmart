"""Forecast endpoint — returns pre-computed Prophet predictions for a lot."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ParkingForecast, ParkingLot
from app.schemas import ForecastResponse, ParkingForecastRead

router = APIRouter(prefix="/api/lots", tags=["forecasts"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/{lot_id}/forecast", response_model=ForecastResponse)
async def get_forecast(lot_id: uuid.UUID, db: DbSession) -> ForecastResponse:
    """Get pre-computed 7-day forecast for a parking lot."""
    # Verify lot exists
    lot_result = await db.execute(
        select(ParkingLot).where(ParkingLot.id == lot_id)
    )
    lot = lot_result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")

    # Fetch future forecasts ordered by time
    stmt = (
        select(ParkingForecast)
        .where(
            ParkingForecast.lot_id == lot_id,
            ParkingForecast.forecast_time >= func.now(),
        )
        .order_by(ParkingForecast.forecast_time)
    )
    result = await db.execute(stmt)
    forecasts = result.scalars().all()

    generated_at = forecasts[0].generated_at if forecasts else None

    return ForecastResponse(
        lot_id=lot.id,
        lot_name=lot.name,
        generated_at=generated_at,
        forecasts=[ParkingForecastRead.model_validate(f) for f in forecasts],
    )
