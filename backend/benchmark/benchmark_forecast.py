"""
Forecast accuracy benchmark.

Backtests Prophet predictions against actual collected parking data.
Holds out the most recent HOLDOUT_DAYS of snapshots as ground truth,
trains on everything before, predicts for the holdout timestamps,
and compares predicted vs actual free_spaces.

Compares THREE approaches:
  A) Current production (UTC + academic filtering)
  B) UTC without academic filtering (all historical data)
  C) Pacific timezone + academic filtering

Saves results to backend/benchmark/results/:
  - predictions.csv:  every prediction row with actual, all 3 predicted values, bucket, lot
  - metrics.csv:      per-lot + per-bucket + aggregate metrics for each approach
  - diagnostics.json: data counts, date ranges, distribution stats per lot

Usage:
    cd backend
    python -m benchmark.benchmark_forecast
"""

import asyncio
import json
import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from prophet import Prophet
from sqlalchemy import or_, select

from app.database import async_session_maker
from app.models import AcademicWeek, ParkingLot, ParkingSnapshot

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

PACIFIC = ZoneInfo("America/Los_Angeles")
HOLDOUT_DAYS = 2
MIN_SNAPSHOTS = 50
RESULTS_DIR = Path(__file__).parent / "results"

APPROACHES = [
    ("pred_A", "UTC+filtered (production)"),
    ("pred_B", "UTC+unfiltered (no calendar)"),
    ("pred_C", "Pacific+filtered"),
    ("pred_D", "flat+Pacific+filtered"),
]


# ── Prophet training ──────────────────────────────────────────────────────────

def _fit_prophet_logistic(ds_series: pd.Series, y_series: pd.Series, capacity: int) -> Prophet:
    prophet_df = pd.DataFrame({"ds": ds_series, "y": y_series})
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
    return model


def _fit_prophet_flat(ds_series: pd.Series, y_series: pd.Series) -> Prophet:
    prophet_df = pd.DataFrame({"ds": ds_series, "y": y_series})
    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=True,
        daily_seasonality=True,
        growth="flat",
        seasonality_prior_scale=5,
    )
    model.fit(prophet_df)
    return model


def _predict_logistic(model: Prophet, ds_values: list, capacity: int) -> np.ndarray:
    future = pd.DataFrame({"ds": ds_values, "cap": capacity, "floor": 0})
    forecast = model.predict(future)
    return np.clip(forecast["yhat"], 0, capacity).round().astype(int).values


def _predict_flat(model: Prophet, ds_values: list, capacity: int) -> np.ndarray:
    future = pd.DataFrame({"ds": ds_values})
    forecast = model.predict(future)
    return np.clip(forecast["yhat"], 0, capacity).round().astype(int).values


def train_predict_utc(train_df: pd.DataFrame, test_times: list[datetime], capacity: int) -> np.ndarray:
    """A) Current production: logistic growth, UTC."""
    ds = pd.to_datetime(train_df["collected_at"]).dt.tz_localize(None)
    model = _fit_prophet_logistic(ds, train_df["free_spaces"], capacity)
    return _predict_logistic(model, [t.replace(tzinfo=None) for t in test_times], capacity)


def train_predict_utc_unfiltered(train_df: pd.DataFrame, test_times: list[datetime], capacity: int) -> np.ndarray:
    """B) Logistic growth, UTC, no academic filtering."""
    return train_predict_utc(train_df, test_times, capacity)


def train_predict_pacific(train_df: pd.DataFrame, test_times: list[datetime], capacity: int) -> np.ndarray:
    """C) Logistic growth, Pacific time."""
    ds = pd.to_datetime(train_df["collected_at"], utc=True).dt.tz_convert(PACIFIC).dt.tz_localize(None)
    model = _fit_prophet_logistic(ds, train_df["free_spaces"], capacity)
    return _predict_logistic(model, [t.astimezone(PACIFIC).replace(tzinfo=None) for t in test_times], capacity)


def train_predict_flat_pacific(train_df: pd.DataFrame, test_times: list[datetime], capacity: int) -> np.ndarray:
    """D) Flat growth (no trend), Pacific time, filtered."""
    ds = pd.to_datetime(train_df["collected_at"], utc=True).dt.tz_convert(PACIFIC).dt.tz_localize(None)
    model = _fit_prophet_flat(ds, train_df["free_spaces"])
    return _predict_flat(model, [t.astimezone(PACIFIC).replace(tzinfo=None) for t in test_times], capacity)


# ── Helpers ───────────────────────────────────────────────────────────────────

def time_bucket(ts: datetime) -> str:
    pac = ts.astimezone(PACIFIC) if ts.tzinfo else ts.replace(tzinfo=UTC).astimezone(PACIFIC)
    h, wd = pac.hour, pac.weekday()
    if wd < 5 and 6 <= h < 11:
        return "rush"
    if wd < 5 and 11 <= h < 18:
        return "midday"
    return "off-peak"


def compute_metrics(actual: np.ndarray, predicted: np.ndarray) -> dict:
    errors = predicted - actual
    abs_errors = np.abs(errors)
    with np.errstate(divide="ignore", invalid="ignore"):
        pct_errors = np.where(actual > 0, abs_errors / actual * 100, np.nan)
    return {
        "n": int(len(actual)),
        "mae": round(float(np.mean(abs_errors)), 2),
        "rmse": round(float(np.sqrt(np.mean(errors ** 2))), 2),
        "mape": round(float(np.nanmean(pct_errors)), 2),
        "bias": round(float(np.mean(errors)), 2),
        "max_abs_error": int(np.max(abs_errors)),
    }


def dist_stats(series: pd.Series) -> dict:
    return {
        "n": int(len(series)),
        "mean": round(float(series.mean()), 1),
        "median": round(float(series.median()), 1),
        "std": round(float(series.std()), 1),
        "min": int(series.min()),
        "max": int(series.max()),
    }


# ── Main benchmark ────────────────────────────────────────────────────────────

async def run_benchmark() -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    async with async_session_maker() as session:
        # ── Load academic week UTC ranges ─────────────────────────────────
        weeks_result = await session.execute(
            select(AcademicWeek.start_date, AcademicWeek.end_date)
        )
        week_rows = weeks_result.all()
        term_utc_ranges: list[tuple[datetime, datetime]] = []
        for w_start, w_end in week_rows:
            utc_start = datetime(w_start.year, w_start.month, w_start.day, tzinfo=PACIFIC).astimezone(UTC)
            utc_end = datetime(w_end.year, w_end.month, w_end.day, 23, 59, 59, tzinfo=PACIFIC).astimezone(UTC)
            term_utc_ranges.append((utc_start, utc_end))

        logger.info("Academic calendar: %d weeks defined", len(term_utc_ranges))
        if term_utc_ranges:
            earliest = min(s for s, _ in term_utc_ranges)
            latest = max(e for _, e in term_utc_ranges)
            logger.info("  Range: %s  to  %s", earliest.date(), latest.date())

        # ── Fetch all lots ────────────────────────────────────────────────
        lots_result = await session.execute(select(ParkingLot))
        lots = lots_result.scalars().all()
        logger.info("Found %d lots\n", len(lots))

        all_predictions: list[pd.DataFrame] = []
        all_metrics: list[dict] = []
        diagnostics: dict[str, dict] = {}

        for lot in lots:
            lot_name = lot.name

            # ── Load ALL snapshots (unfiltered) ───────────────────────────
            all_snap_result = await session.execute(
                select(ParkingSnapshot.collected_at, ParkingSnapshot.free_spaces)
                .where(ParkingSnapshot.lot_id == lot.id)
                .order_by(ParkingSnapshot.collected_at)
            )
            all_rows = all_snap_result.all()
            if len(all_rows) < MIN_SNAPSHOTS:
                logger.info("%-30s  SKIP (%d total snapshots)", lot_name, len(all_rows))
                continue

            all_df = pd.DataFrame(all_rows, columns=["collected_at", "free_spaces"])

            # ── Filtered snapshots ────────────────────────────────────────
            if term_utc_ranges:
                filt_snap_result = await session.execute(
                    select(ParkingSnapshot.collected_at, ParkingSnapshot.free_spaces)
                    .where(ParkingSnapshot.lot_id == lot.id)
                    .where(or_(*(
                        ParkingSnapshot.collected_at.between(s, e)
                        for s, e in term_utc_ranges
                    )))
                    .order_by(ParkingSnapshot.collected_at)
                )
                filt_df = pd.DataFrame(filt_snap_result.all(), columns=["collected_at", "free_spaces"])
            else:
                filt_df = all_df

            capacity = lot.total_spaces or int(all_df["free_spaces"].max())

            # ── Train/test split ──────────────────────────────────────────
            cutoff = all_df["collected_at"].max() - timedelta(days=HOLDOUT_DAYS)
            test_df = all_df[all_df["collected_at"] > cutoff].copy()
            if len(test_df) < 10:
                logger.info("%-30s  SKIP (%d test points)", lot_name, len(test_df))
                continue

            train_filtered = filt_df[filt_df["collected_at"] <= cutoff].copy()
            train_unfiltered = all_df[all_df["collected_at"] <= cutoff].copy()

            if len(train_filtered) < MIN_SNAPSHOTS or len(train_unfiltered) < MIN_SNAPSHOTS:
                logger.info("%-30s  SKIP (insufficient training data)", lot_name)
                continue

            test_times = list(test_df["collected_at"])
            actual = test_df["free_spaces"].values

            # ── Diagnostics ───────────────────────────────────────────────
            diagnostics[lot_name] = {
                "capacity": capacity,
                "total_snapshots": len(all_df),
                "filtered_snapshots": len(filt_df),
                "filtered_pct": round(len(filt_df) / len(all_df) * 100, 1),
                "train_filtered_count": len(train_filtered),
                "train_unfiltered_count": len(train_unfiltered),
                "test_count": len(test_df),
                "date_range": {
                    "train_filtered": {
                        "start": train_filtered["collected_at"].min().isoformat(),
                        "end": train_filtered["collected_at"].max().isoformat(),
                    },
                    "train_unfiltered": {
                        "start": train_unfiltered["collected_at"].min().isoformat(),
                        "end": train_unfiltered["collected_at"].max().isoformat(),
                    },
                    "test": {
                        "start": test_df["collected_at"].min().isoformat(),
                        "end": test_df["collected_at"].max().isoformat(),
                    },
                },
                "free_spaces_distribution": {
                    "train_filtered": dist_stats(train_filtered["free_spaces"]),
                    "train_unfiltered": dist_stats(train_unfiltered["free_spaces"]),
                    "test": dist_stats(test_df["free_spaces"]),
                },
            }

            logger.info("%-30s  train_f=%d  train_u=%d  test=%d  cap=%d",
                        lot_name, len(train_filtered), len(train_unfiltered), len(test_df), capacity)

            # ── Run three approaches ──────────────────────────────────────
            preds: dict[str, np.ndarray] = {}

            try:
                preds["pred_A"] = train_predict_utc(train_filtered, test_times, capacity)
            except Exception as e:
                logger.info("  [A] FAILED: %s", e)
                continue
            try:
                preds["pred_B"] = train_predict_utc(train_unfiltered, test_times, capacity)
            except Exception as e:
                logger.info("  [B] FAILED: %s", e)
                continue
            try:
                preds["pred_C"] = train_predict_pacific(train_filtered, test_times, capacity)
            except Exception as e:
                logger.info("  [C] FAILED: %s", e)
                continue
            try:
                preds["pred_D"] = train_predict_flat_pacific(train_filtered, test_times, capacity)
            except Exception as e:
                logger.info("  [D] FAILED: %s", e)
                continue

            # ── Build prediction rows ─────────────────────────────────────
            buckets = [time_bucket(t) for t in test_times]
            pacific_times = [t.astimezone(PACIFIC) for t in test_times]

            pred_df = pd.DataFrame({
                "lot": lot_name,
                "time_utc": [t.isoformat() for t in test_times],
                "time_pacific": [t.strftime("%Y-%m-%d %H:%M %Z") for t in pacific_times],
                "weekday": [t.strftime("%A") for t in pacific_times],
                "hour_pacific": [t.hour for t in pacific_times],
                "bucket": buckets,
                "capacity": capacity,
                "actual": actual,
                "pred_A": preds["pred_A"],
                "pred_B": preds["pred_B"],
                "pred_C": preds["pred_C"],
                "pred_D": preds["pred_D"],
                "error_A": preds["pred_A"] - actual,
                "error_B": preds["pred_B"] - actual,
                "error_C": preds["pred_C"] - actual,
                "error_D": preds["pred_D"] - actual,
            })
            all_predictions.append(pred_df)

            # ── Compute metrics per bucket ────────────────────────────────
            for tag, label in APPROACHES:
                for bucket in ["rush", "midday", "off-peak", "ALL"]:
                    if bucket == "ALL":
                        mask = np.ones(len(pred_df), dtype=bool)
                    else:
                        mask = pred_df["bucket"].values == bucket
                    if mask.sum() == 0:
                        continue
                    m = compute_metrics(actual[mask], preds[tag][mask])
                    m.update({"lot": lot_name, "approach": label, "bucket": bucket})
                    all_metrics.append(m)

            logger.info("  done")

        # ── Save files ────────────────────────────────────────────────────
        if not all_predictions:
            logger.info("No lots had enough data.")
            return

        # predictions.csv — every individual prediction
        predictions_df = pd.concat(all_predictions, ignore_index=True)
        predictions_path = RESULTS_DIR / "predictions.csv"
        predictions_df.to_csv(predictions_path, index=False)
        logger.info("\nSaved %d prediction rows to %s", len(predictions_df), predictions_path)

        # metrics.csv — per-lot, per-bucket, per-approach
        metrics_df = pd.DataFrame(all_metrics)
        # Add aggregate rows
        combined_actual = predictions_df["actual"].values
        for tag, label in APPROACHES:
            combined_pred = predictions_df[tag].values
            for bucket in ["rush", "midday", "off-peak", "ALL"]:
                if bucket == "ALL":
                    mask = np.ones(len(predictions_df), dtype=bool)
                else:
                    mask = predictions_df["bucket"].values == bucket
                if mask.sum() == 0:
                    continue
                m = compute_metrics(combined_actual[mask], combined_pred[mask])
                m.update({"lot": "_AGGREGATE_", "approach": label, "bucket": bucket})
                metrics_df = pd.concat([metrics_df, pd.DataFrame([m])], ignore_index=True)

        metrics_path = RESULTS_DIR / "metrics.csv"
        metrics_df.to_csv(metrics_path, index=False)
        logger.info("Saved %d metric rows to %s", len(metrics_df), metrics_path)

        # diagnostics.json — data counts, ranges, distributions
        diag_path = RESULTS_DIR / "diagnostics.json"
        diag_path.write_text(json.dumps(diagnostics, indent=2, default=str))
        logger.info("Saved diagnostics for %d lots to %s", len(diagnostics), diag_path)

        # ── Print aggregate summary to console ────────────────────────────
        logger.info("\n" + "=" * 72)
        logger.info("AGGREGATE SUMMARY")
        logger.info("=" * 72)
        agg = metrics_df[metrics_df["lot"] == "_AGGREGATE_"]
        for _, row in agg.iterrows():
            logger.info(
                "  %-35s  %-10s  MAE=%6.1f  RMSE=%6.1f  bias=%+7.1f",
                row["approach"], row["bucket"], row["mae"], row["rmse"], row["bias"],
            )

        logger.info("\nResults saved to %s/", RESULTS_DIR)


def main() -> None:
    logging.getLogger("prophet").setLevel(logging.WARNING)
    logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

    logger.info("Forecast Accuracy Benchmark  (v2)")
    logger.info("Holdout: last %d days  |  Output: %s/", HOLDOUT_DAYS, RESULTS_DIR)
    logger.info("-" * 72)

    asyncio.run(run_benchmark())


if __name__ == "__main__":
    main()
