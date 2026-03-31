"""
Visualize forecast benchmark results.

Reads predictions.csv and metrics.csv, generates charts showing
how each approach compares to actual parking data.

Usage:
    cd backend
    python -m benchmark.visualize
"""

from pathlib import Path

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

RESULTS_DIR = Path(__file__).parent / "results"
COLORS = {
    "actual": "#1a1a2e",
    "pred_A": "#e74c3c",
    "pred_B": "#e67e22",
    "pred_C": "#9b59b6",
    "pred_D": "#2ecc71",
}
LABELS = {
    "pred_A": "A) Production (logistic+UTC)",
    "pred_B": "B) Unfiltered",
    "pred_C": "C) Pacific+logistic",
    "pred_D": "D) flat+Pacific (proposed)",
}


def load_data():
    preds = pd.read_csv(RESULTS_DIR / "predictions.csv")
    preds["time_pacific"] = pd.to_datetime(preds["time_pacific"].str.replace(r" P[DS]T$", "", regex=True))
    metrics = pd.read_csv(RESULTS_DIR / "metrics.csv")
    return preds, metrics


def plot_timeseries_per_lot(preds: pd.DataFrame):
    """One figure per lot: actual vs all 4 approaches over the holdout period."""
    lots = [l for l in preds["lot"].unique() if l != "Lot 50"]  # skip broken-sensor lot

    fig, axes = plt.subplots(len(lots), 1, figsize=(16, 4.5 * len(lots)), sharex=False)
    if len(lots) == 1:
        axes = [axes]

    for ax, lot_name in zip(axes, lots):
        df = preds[preds["lot"] == lot_name].copy()
        t = df["time_pacific"]
        cap = df["capacity"].iloc[0]

        ax.fill_between(t, 0, df["actual"], alpha=0.12, color=COLORS["actual"], label="_nolegend_")
        ax.plot(t, df["actual"], color=COLORS["actual"], linewidth=2.2, label="Actual", zorder=5)

        for col in ["pred_A", "pred_D"]:
            ax.plot(t, df[col], color=COLORS[col], linewidth=1.5, alpha=0.85,
                    label=LABELS[col], linestyle="--" if col != "pred_D" else "-")

        ax.axhline(cap, color="#bbb", linewidth=0.8, linestyle=":", label=f"Capacity ({cap})")
        ax.set_ylabel("Free Spaces")
        ax.set_title(lot_name, fontsize=13, fontweight="bold", loc="left")
        ax.legend(loc="upper right", fontsize=8)
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%a %H:%M"))
        ax.tick_params(axis="x", rotation=30)
        ax.set_ylim(bottom=0)

    fig.suptitle("Forecast vs Actual — Production (A) vs Proposed Fix (D)", fontsize=15, fontweight="bold", y=1.01)
    fig.tight_layout()
    out = RESULTS_DIR / "timeseries_per_lot.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved {out}")


def plot_aggregate_bars(metrics: pd.DataFrame):
    """Bar chart comparing MAE across approaches and time buckets."""
    agg = metrics[metrics["lot"] == "_AGGREGATE_"].copy()

    approaches = list(LABELS.keys())
    approach_labels = [LABELS[a.replace("pred_", "")] if a.replace("pred_", "") in LABELS
                       else LABELS.get(a, a) for a in approaches]
    # Map approach column values to pred keys
    approach_map = {v: k for k, v in LABELS.items()}
    # Remap approach names in metrics to our keys
    agg["akey"] = agg["approach"].map({
        "UTC+filtered (production)": "pred_A",
        "UTC+unfiltered (no calendar)": "pred_B",
        "Pacific+filtered": "pred_C",
        "flat+Pacific+filtered": "pred_D",
    })

    buckets = ["rush", "midday", "off-peak", "ALL"]
    bucket_labels = ["Rush (6-11am)", "Midday (11am-6pm)", "Off-peak", "Overall"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

    # MAE bar chart
    x = np.arange(len(buckets))
    width = 0.18
    for i, akey in enumerate(["pred_A", "pred_B", "pred_C", "pred_D"]):
        vals = []
        for b in buckets:
            row = agg[(agg["akey"] == akey) & (agg["bucket"] == b)]
            vals.append(row["mae"].values[0] if len(row) > 0 else 0)
        bars = ax1.bar(x + i * width, vals, width, label=LABELS[akey], color=COLORS[akey], alpha=0.85)
        # Add value labels on the "ALL" bars
        if True:
            for j, v in enumerate(vals):
                if j == len(buckets) - 1:  # Overall only
                    ax1.text(x[j] + i * width, v + 3, f"{v:.0f}", ha="center", va="bottom", fontsize=8)

    ax1.set_xticks(x + 1.5 * width)
    ax1.set_xticklabels(bucket_labels)
    ax1.set_ylabel("Mean Absolute Error (free spaces)")
    ax1.set_title("MAE by Time Bucket", fontweight="bold")
    ax1.legend(fontsize=8)

    # Bias bar chart
    for i, akey in enumerate(["pred_A", "pred_B", "pred_C", "pred_D"]):
        vals = []
        for b in buckets:
            row = agg[(agg["akey"] == akey) & (agg["bucket"] == b)]
            vals.append(row["bias"].values[0] if len(row) > 0 else 0)
        ax2.bar(x + i * width, vals, width, label=LABELS[akey], color=COLORS[akey], alpha=0.85)

    ax2.axhline(0, color="black", linewidth=0.8)
    ax2.set_xticks(x + 1.5 * width)
    ax2.set_xticklabels(bucket_labels)
    ax2.set_ylabel("Bias (+ = predicts too many free spaces)")
    ax2.set_title("Prediction Bias by Time Bucket", fontweight="bold")
    ax2.legend(fontsize=8)

    fig.suptitle("Aggregate Accuracy — All Lots Combined", fontsize=15, fontweight="bold")
    fig.tight_layout()
    out = RESULTS_DIR / "aggregate_comparison.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved {out}")


def plot_per_lot_mae(metrics: pd.DataFrame):
    """Horizontal bar chart: per-lot MAE for production vs proposed fix."""
    lot_metrics = metrics[(metrics["lot"] != "_AGGREGATE_") & (metrics["bucket"] == "ALL")].copy()
    lot_metrics["akey"] = lot_metrics["approach"].map({
        "UTC+filtered (production)": "pred_A",
        "flat+Pacific+filtered": "pred_D",
    })
    lot_metrics = lot_metrics[lot_metrics["akey"].isin(["pred_A", "pred_D"])]

    lots = sorted(lot_metrics["lot"].unique())
    fig, ax = plt.subplots(figsize=(12, 5))

    y = np.arange(len(lots))
    height = 0.35

    for i, (akey, label) in enumerate([("pred_A", "Production"), ("pred_D", "Proposed Fix")]):
        vals = []
        for lot in lots:
            row = lot_metrics[(lot_metrics["lot"] == lot) & (lot_metrics["akey"] == akey)]
            vals.append(row["mae"].values[0] if len(row) > 0 else 0)
        bars = ax.barh(y + i * height, vals, height, label=label, color=COLORS[akey], alpha=0.85)
        for j, v in enumerate(vals):
            ax.text(v + 2, y[j] + i * height, f"{v:.0f}", va="center", fontsize=9)

    ax.set_yticks(y + height / 2)
    ax.set_yticklabels(lots)
    ax.set_xlabel("Mean Absolute Error (free spaces)")
    ax.set_title("Per-Lot MAE: Production vs Proposed Fix", fontweight="bold", fontsize=13)
    ax.legend(loc="lower right")
    ax.invert_yaxis()
    fig.tight_layout()
    out = RESULTS_DIR / "per_lot_comparison.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved {out}")


def plot_error_distribution(preds: pd.DataFrame):
    """Box plots of signed error for production vs proposed fix."""
    df = preds[preds["lot"] != "Lot 50"].copy()  # exclude broken sensor

    fig, axes = plt.subplots(1, 2, figsize=(14, 5), sharey=True)

    for ax, col, label, color in [
        (axes[0], "error_A", "Production (logistic+UTC)", COLORS["pred_A"]),
        (axes[1], "error_D", "Proposed Fix (flat+Pacific)", COLORS["pred_D"]),
    ]:
        data = [df.loc[df["bucket"] == b, col].values for b in ["rush", "midday", "off-peak"]]
        bp = ax.boxplot(data, labels=["Rush", "Midday", "Off-peak"], patch_artist=True,
                        medianprops=dict(color="black", linewidth=1.5))
        for patch in bp["boxes"]:
            patch.set_facecolor(color)
            patch.set_alpha(0.5)
        ax.axhline(0, color="black", linewidth=0.8, linestyle="--")
        ax.set_ylabel("Error (predicted - actual)")
        ax.set_title(label, fontweight="bold")

    fig.suptitle("Error Distribution by Time Bucket", fontsize=14, fontweight="bold")
    fig.tight_layout()
    out = RESULTS_DIR / "error_distribution.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved {out}")


def main():
    preds, metrics = load_data()
    print(f"Loaded {len(preds)} predictions, {len(metrics)} metric rows\n")

    plot_timeseries_per_lot(preds)
    plot_aggregate_bars(metrics)
    plot_per_lot_mae(metrics)
    plot_error_distribution(preds)

    print(f"\nAll charts saved to {RESULTS_DIR}/")


if __name__ == "__main__":
    main()
