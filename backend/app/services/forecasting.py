"""
Pre-compute parking forecasts using Prophet and store results in the database.

Generates forecasts for the next 7 days using the same 3-tiered schedule
as the data collectors:
  - Rush (6am-11am PST, weekdays): every 5 min
  - Midday (11am-6pm PST, weekdays): every 15 min
  - Off-peak (6pm-6am PST + weekends): every 60 min

Run daily as a cron job — see render.yaml.
"""

import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from prophet import Prophet
from sqlalchemy import delete, insert, select

from app.database import async_session_maker
from app.models import ParkingForecast, ParkingLot, ParkingSnapshot

logger = logging.getLogger(__name__)

PACIFIC = ZoneInfo("America/Los_Angeles")
MODEL_VERSION = "prophet-v1"
FORECAST_DAYS = 7
MIN_SNAPSHOTS = 50


def generate_forecast_times(start: datetime, days: int = FORECAST_DAYS) -> list[datetime]:
    """
    Build a list of future timeslots in UTC matching the 3-tiered collection schedule.

    All time-of-day logic is done in Pacific time (handles DST correctly),
    then each slot is converted to UTC for storage.
    """
    # Start from the next full hour in Pacific time
    start_pac = start.astimezone(PACIFIC).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    end_pac = start_pac + timedelta(days=days)

    times: list[datetime] = []
    current = start_pac

    while current < end_pac:
        hour = current.hour
        weekday = current.weekday()  # 0=Mon, 6=Sun
        is_weekday = weekday < 5

        if is_weekday and 6 <= hour < 11:
            # Rush: every 5 minutes
            slot_end_hour = 11
            while current.hour < slot_end_hour and current < end_pac:
                times.append(current.astimezone(UTC))
                current += timedelta(minutes=5)
        elif is_weekday and 11 <= hour < 18:
            # Midday: every 15 minutes
            slot_end_hour = 18
            while current.hour < slot_end_hour and current < end_pac:
                times.append(current.astimezone(UTC))
                current += timedelta(minutes=15)
        else:
            # Off-peak: every 60 minutes (nights + weekends)
            times.append(current.astimezone(UTC))
            current += timedelta(minutes=60)

    return times


def _train_and_predict(
    history_df: pd.DataFrame,
    future_times: list[datetime],
    capacity: int,
) -> pd.DataFrame:
    """
    Train a Prophet model on historical snapshots and predict future free_spaces.

    Uses logistic growth capped at the lot's capacity. Returns a DataFrame with
    columns: forecast_time, predicted_free, predicted_free_lower (all clamped
    to [0, capacity]).
    """
    prophet_df = history_df[["collected_at", "free_spaces"]].rename(
        columns={"collected_at": "ds", "free_spaces": "y"}
    )
    prophet_df["ds"] = pd.to_datetime(prophet_df["ds"]).dt.tz_localize(None)
    prophet_df["cap"] = capacity
    prophet_df["floor"] = 0

    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=True,
        daily_seasonality=True,
        growth="logistic",
        changepoint_prior_scale=0.1,
        seasonality_prior_scale=5,
    )
    model.fit(prophet_df)

    future = pd.DataFrame({"ds": [t.replace(tzinfo=None) for t in future_times]})
    future["cap"] = capacity
    future["floor"] = 0

    forecast = model.predict(future)

    # Clamp predictions to [0, capacity] and rename to domain terms
    result = pd.DataFrame({
        "forecast_time": forecast["ds"],
        "predicted_free": np.clip(forecast["yhat"], 0, capacity).round().astype(int),
        "predicted_free_lower": np.clip(forecast["yhat_lower"], 0, capacity).round().astype(int),
    })

    return result


async def generate_forecasts() -> int:
    """
    Main entry point for the forecast cron job.

    For each lot with enough history, trains Prophet and stores 7-day forecasts.
    Returns the total number of forecast rows inserted.
    """
    total_inserted = 0
    now = datetime.now(UTC)
    future_times = generate_forecast_times(now)

    logger.info(
        "Starting forecast generation: %d timeslots over %d days",
        len(future_times),
        FORECAST_DAYS,
    )

    async with async_session_maker() as session:
        # Fetch all lots with their capacity
        lots_result = await session.execute(select(ParkingLot))
        lots = lots_result.scalars().all()

        for lot in lots:
            # Load all historical snapshots for training
            snap_stmt = (
                select(ParkingSnapshot.collected_at, ParkingSnapshot.free_spaces)
                .where(ParkingSnapshot.lot_id == lot.id)
                .order_by(ParkingSnapshot.collected_at)
            )
            snap_result = await session.execute(snap_stmt)
            rows = snap_result.all()

            if len(rows) < MIN_SNAPSHOTS:
                logger.info(
                    "Skipping %s: only %d snapshots (need %d)",
                    lot.name,
                    len(rows),
                    MIN_SNAPSHOTS,
                )
                continue

            capacity = lot.total_spaces or max(r.free_spaces for r in rows)
            history_df = pd.DataFrame(rows, columns=["collected_at", "free_spaces"])

            try:
                forecast_df = _train_and_predict(history_df, future_times, capacity)
            except Exception:
                logger.exception("Prophet failed for lot %s, skipping", lot.name)
                continue

            # Delete old forecasts for this lot
            await session.execute(
                delete(ParkingForecast).where(ParkingForecast.lot_id == lot.id)
            )

            # Build rows for bulk insert
            forecast_rows = []
            for ft, pf, pl in zip(
                forecast_df["forecast_time"],
                forecast_df["predicted_free"],
                forecast_df["predicted_free_lower"],
            ):
                pf_int = int(pf)
                occupancy_pct = (
                    Decimal(str(round((capacity - pf_int) / capacity * 100, 2)))
                    if capacity > 0 else None
                )
                forecast_rows.append({
                    "lot_id": lot.id,
                    "forecast_time": ft.to_pydatetime().replace(tzinfo=UTC),
                    "predicted_free_spaces": pf_int,
                    "predicted_free_spaces_lower": int(pl),
                    "predicted_occupancy_pct": occupancy_pct,
                    "model_version": MODEL_VERSION,
                    "generated_at": now,
                })

            await session.execute(insert(ParkingForecast), forecast_rows)
            total_inserted += len(forecast_rows)

            # Commit per lot so a failure on one lot doesn't lose another's forecasts
            await session.commit()

            logger.info("Generated %d forecasts for %s", len(forecast_rows), lot.name)

    logger.info("Forecast generation complete: %d total rows inserted", total_inserted)
    return total_inserted
