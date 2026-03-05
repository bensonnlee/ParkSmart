# How Often Should We Scrape UCR Parking Data?

A data-driven analysis of whether 5-minute collection intervals are necessary, and a recommended schedule that reduces server load by 44% with negligible accuracy loss.

---

## Background

### What does the scraper do?

Our scraper collects real-time occupancy data from 8 UCR parking lots. Every time it runs, it records how many spaces are available in each lot. Over time, this builds a picture of parking patterns — when lots fill up, when they empty out, and which lots are busiest.

### Current collection schedule

| Time of day | How often we scrape |
|---|---|
| 7:00 am – 6:00 pm ("school hours") | Every 5 minutes |
| 6:00 pm – 7:00 am (evenings and overnight) | Once per hour |

This schedule runs every day, including weekends.

### The question

**Are we collecting more data than we need during school hours?**

Every scrape sends a request to UCR's parking system. Collecting every 5 minutes means about 1,160 requests per day across all 8 lots. If parking occupancy barely changes between consecutive readings, many of those requests are redundant — we're storing nearly identical numbers over and over. This analysis asks: can we collect less often while still capturing meaningful changes?

---

## How We Analyzed This

We examined **17,308 snapshots** from 8 UCR parking lots collected between **January 22 and February 12, 2026** (about 3 weeks of data). The 8 lots and their capacities are:

| Lot | Total spaces |
|---|---|
| Lot 30 | 2,143 |
| Big Springs 2 | 1,058 |
| Big Springs 1 | 490 |
| Lot 26 | 436 |
| Lot 50 | 413 |
| Lot 24 | 406 |
| Lot 6 | 387 |
| Lot 32 | 258 |

Our analysis had three parts:

1. **Measured actual change** — For each pair of consecutive 5-minute readings, we calculated how much occupancy actually changed (in "percentage points" — that is, the literal difference in occupancy percentage, so going from 60% full to 62% full is a change of 2 percentage points).

2. **Broke it down by time and day** — We looked at how change varies by hour of day and weekday vs. weekend.

3. **Simulated less-frequent collection** — We asked: if we had only collected every 15, 30, or 60 minutes instead of every 5, how far off would our data be from the actual values?

---

## How much does occupancy actually change in 5 minutes?

**Short answer: usually very little.** Across most lots, consecutive 5-minute readings are nearly identical.

The table below shows, for each lot, how often the occupancy change between two consecutive 5-minute snapshots fell within various thresholds. "Percentage points" means the raw difference in occupancy percentage — if a lot was 60% full and the next reading says 61%, that's a change of 1 percentage point.

| Lot | Readings | Mean change | Zero change | Less than 1 percentage point | Less than 2 percentage points |
|---|---|---|---|---|---|
| Big Springs 1 | 1,999 | 0.25 pp | 31.4% | 98.9% | 99.9% |
| Big Springs 2 | 957 | 0.78 pp | 5.2% | 72.4% | 97.1% |
| Lot 24 | 1,999 | 0.99 pp | 10.1% | 65.8% | 88.8% |
| Lot 26 | 1,999 | 0.96 pp | 15.0% | 65.5% | 88.6% |
| Lot 30 | 1,999 | 1.03 pp | 9.3% | 61.2% | 82.6% |
| Lot 32 | 1,999 | 1.35 pp | 19.4% | 50.6% | 77.3% |
| Lot 50 | 1,999 | 0.69 pp | 18.9% | 78.8% | 95.8% |
| Lot 6 | 1,999 | 1.21 pp | 13.7% | 49.4% | 78.2% |

*(pp = percentage points throughout this document)*

**What this means in plain language:**

- **Big Springs 1** is the most stable lot: if it was 60% full at 10:00 am, there's a 99% chance the 10:05 am reading will be between 59% and 61%. Nearly a third of the time, there's literally zero change.

- **Lot 32** and **Lot 6** are the most volatile — but even for these lots, about half of all 5-minute readings show less than 1 percentage point of change.

- Across all lots, the **average change over 5 minutes is less than 1.4 percentage points**. The vast majority of readings are effectively redundant.

---

## Does the rate of change vary by time of day?

Yes. The morning rush has 2–3 times more movement than midday.

The table below combines all lots and shows how occupancy changes hour by hour during school hours. Each row summarizes all 5-minute intervals that started in that hour.

| Hour | Mean change | Median change | Readings with more than 2 percentage point change | Readings with zero change | Readings |
|---|---|---|---|---|---|
| 7:00 am | 1.14 pp | 0.74 pp | 19.2% | 17.1% | 1,177 |
| 8:00 am | 1.47 pp | 1.21 pp | 25.9% | 9.3% | 1,349 |
| 9:00 am | 1.43 pp | 1.22 pp | 26.0% | 11.9% | 1,364 |
| 10:00 am | 0.98 pp | 0.77 pp | 11.6% | 13.1% | 1,356 |
| 11:00 am | 0.54 pp | 0.42 pp | 1.6% | 20.6% | 1,362 |
| 12:00 pm | 0.51 pp | 0.38 pp | 2.2% | 22.8% | 1,349 |
| 1:00 pm | 0.55 pp | 0.39 pp | 3.2% | 21.3% | 1,391 |
| 2:00 pm | 0.69 pp | 0.46 pp | 7.3% | 15.0% | 1,279 |
| 3:00 pm | 0.91 pp | 0.69 pp | 10.2% | 12.1% | 1,359 |
| 4:00 pm | 0.73 pp | 0.48 pp | 7.7% | 17.1% | 1,434 |
| 5:00 pm | 1.13 pp | 0.74 pp | 18.5% | 16.0% | 1,407 |

**The pattern:**

- **7:00–9:00 am (morning rush):** This is when students arrive and lots fill up quickly. About a quarter of all 5-minute readings show changes of more than 2 percentage points. This is when frequent collection matters most.

- **11:00 am–1:00 pm (midday):** Lots are stable — most people are already parked and classes are in session. Only 1.6–3.2% of readings show meaningful movement (more than 2 percentage points), and over 20% of readings show zero change at all.

- **2:00–5:00 pm (afternoon):** Moderate activity as some students leave and others arrive for afternoon classes. Less volatile than the morning rush but more active than midday.

A summary view:

| Period | Mean change | Zero-change readings | Readings |
|---|---|---|---|
| Morning rush (7–10 am) | 1.26 pp | 12.7% | 5,246 |
| Midday (11 am–1 pm) | 0.54 pp | 21.6% | 4,102 |
| Afternoon (2–5 pm) | 0.87 pp | 15.1% | 5,486 |

---

## Are weekends different from weekdays?

**Yes — weekends are nearly flat.** Parking lots barely change on weekends, so collecting every 5 minutes is especially wasteful.

| Metric | Weekdays (13,893 readings) | Weekends (1,043 readings) |
|---|---|---|
| Mean change | 0.96 pp | 0.26 pp |
| Median change | 0.69 pp | 0.10 pp |
| Readings with zero change | 13.8% | 45.1% |
| Readings with more than 2 percentage point change | 12.8% | 1.2% |

**What this means:** On weekends, 45% of 5-minute readings show literally zero change, and only 1.2% show what we'd consider meaningful movement (more than 2 percentage points). The median change is just 0.10 percentage points — essentially noise.

Here's the hour-by-hour breakdown for weekends:

| Hour | Mean change | Zero-change readings | Readings |
|---|---|---|---|
| 7:00 am | 0.32 pp | 45.5% | 77 |
| 8:00 am | 0.35 pp | 38.1% | 84 |
| 9:00 am | 0.29 pp | 40.5% | 84 |
| 10:00 am | 0.31 pp | 38.1% | 84 |
| 11:00 am | 0.29 pp | 38.1% | 84 |
| 12:00 pm | 0.28 pp | 47.1% | 70 |
| 1:00 pm | 0.29 pp | 42.9% | 56 |
| 4:00 pm | 0.18 pp | 48.1% | 231 |
| 5:00 pm | 0.22 pp | 50.4% | 252 |

**Every single hour on weekends** has a mean change well under 0.5 percentage points. There's no weekend "rush" equivalent — collecting once an hour is more than sufficient.

---

## What would we lose by collecting less often?

To answer this, we ran a simulation. We took our full 5-minute dataset and "downsampled" it — meaning we kept only every 3rd reading (to simulate 15-minute collection), every 6th reading (30 minutes), or every 12th (60 minutes). Then we compared the downsampled data to the originals to measure how much information we'd lose.

Think of it like this: if we had a photo taken every 5 minutes, downsampling to 15 minutes means keeping every 3rd photo and discarding the rest. The "error" is how different the parking situation might be in the gaps between the photos we kept.

### Simulated error by collection frequency (all hours, all days)

| Lot | Every 15 min: mean error | Every 15 min: 90th percentile | Every 15 min: worst case | Every 60 min: mean error | Every 60 min: worst case |
|---|---|---|---|---|---|
| Big Springs 1 | 0.14 pp | 0.41 pp | 13.67 pp | 0.41 pp | 13.88 pp |
| Big Springs 2 | 0.50 pp | 1.25 pp | 25.61 pp | 2.18 pp | 29.02 pp |
| Lot 24 | 0.55 pp | 1.72 pp | 5.42 pp | 2.29 pp | 19.95 pp |
| Lot 26 | 0.53 pp | 1.60 pp | 10.09 pp | 1.89 pp | 16.52 pp |
| Lot 30 | 0.59 pp | 1.96 pp | 5.92 pp | 2.62 pp | 19.08 pp |
| Lot 32 | 0.77 pp | 2.33 pp | 8.91 pp | 3.28 pp | 24.42 pp |
| Lot 50 | 0.40 pp | 1.21 pp | 6.05 pp | 1.62 pp | 15.01 pp |
| Lot 6 | 0.69 pp | 2.07 pp | 8.01 pp | 2.89 pp | 18.60 pp |

**Key takeaway:** At 15-minute intervals, the mean error for every lot is less than 1 percentage point. For most lots, it's well under 0.6 percentage points. The worst-case errors look large, but these are rare single-reading spikes — 90% of the time, the error is under 2 percentage points.

### But does it matter *when* we use 15-minute intervals?

Yes. Here's the simulated error from 15-minute collection broken down by time of day (weekdays only):

| Lot | Morning rush (7–9 am) mean error | Morning rush 90th percentile | Midday (11 am–1 pm) mean error | Midday 90th percentile | Afternoon (2–5 pm) mean error | Afternoon 90th percentile |
|---|---|---|---|---|---|---|
| Big Springs 1 | 0.15 pp | 0.21 pp | 0.15 pp | 0.41 pp | 0.17 pp | 0.41 pp |
| Big Springs 2 | 1.02 pp | 1.70 pp | 0.25 pp | 0.66 pp | 0.44 pp | 1.14 pp |
| Lot 24 | 0.99 pp | 2.47 pp | 0.38 pp | 0.99 pp | 0.61 pp | 1.72 pp |
| Lot 26 | 0.80 pp | 2.06 pp | 0.42 pp | 1.15 pp | 0.65 pp | 1.83 pp |
| Lot 30 | 1.20 pp | 2.95 pp | 0.27 pp | 0.84 pp | 0.64 pp | 1.82 pp |
| Lot 32 | 1.39 pp | 3.87 pp | 0.52 pp | 1.55 pp | 0.91 pp | 2.33 pp |
| Lot 50 | 0.65 pp | 1.70 pp | 0.33 pp | 0.97 pp | 0.43 pp | 1.21 pp |
| Lot 6 | 1.20 pp | 3.10 pp | 0.40 pp | 1.04 pp | 0.83 pp | 2.33 pp |

**The numbers confirm the intuition:**

- **During the morning rush,** switching to 15-minute intervals would introduce noticeable error — up to 1.39 percentage points on average for Lot 32, with the 90th percentile hitting nearly 4 percentage points. This is where 5-minute collection earns its keep.

- **At midday,** 15-minute intervals introduce less than 0.52 percentage points of error on average for every lot — well within normal fluctuation. You'd barely notice the difference.

- **In the afternoon,** the error is moderate — somewhere between the rush and midday.

---

## How redundant are 5-minute readings?

Another way to measure redundancy is "autocorrelation" — a statistical measure of how similar each reading is to the one before it. A value of 1.000 means readings are perfectly identical; a value of 0.000 means they're completely unrelated.

Think of it this way: if you know a lot is 60% full right now, can you predict what it will be in 5 minutes? In 15 minutes? In an hour? The autocorrelation tells you how good your prediction would be.

| Lot | 5-minute gap | 10-minute gap | 15-minute gap | 30-minute gap | 60-minute gap |
|---|---|---|---|---|---|
| Big Springs 1 | 0.999 | 0.999 | 0.998 | 0.997 | 0.993 |
| Big Springs 2 | 0.999 | 0.997 | 0.995 | 0.988 | 0.968 |
| Lot 24 | 0.998 | 0.996 | 0.993 | 0.983 | 0.953 |
| Lot 26 | 0.998 | 0.995 | 0.991 | 0.980 | 0.952 |
| Lot 30 | 0.999 | 0.997 | 0.995 | 0.985 | 0.957 |
| Lot 32 | 0.999 | 0.997 | 0.995 | 0.984 | 0.952 |
| Lot 50 | 0.999 | 0.997 | 0.995 | 0.987 | 0.962 |
| Lot 6 | 0.999 | 0.997 | 0.995 | 0.985 | 0.951 |

**What this means:** At a 5-minute gap, every lot shows 0.998 or 0.999 correlation. Consecutive 5-minute readings are nearly identical — you could predict the next one almost perfectly from the current one. Even at a 15-minute gap, correlations remain above 0.991 for all lots. The readings only start to meaningfully diverge at 60-minute gaps, and even then the correlation stays above 0.95.

This confirms that 5-minute collection is far more frequent than needed for most of the day.

---

## Recommended Schedule

Based on all findings above, we recommend a **three-tier schedule** that matches collection frequency to actual volatility:

| When | How often | Why |
|---|---|---|
| 7:00–10:00 am weekdays | Every 5 minutes | Morning rush — lots fill quickly; 26% of intervals show more than 2 percentage points of change |
| 10:00 am–6:00 pm weekdays | Every 15 minutes | Lots are stable enough; less than 1 percentage point mean error at this frequency |
| Evenings, overnight, and weekends | Every 60 minutes | Near-zero change; 45% of weekend readings show no change at all |

### Impact on request volume

| Schedule | Daily scrapes (all 8 lots) | Change |
|---|---|---|
| **Current** (5-min all school hours) | 1,160 | — |
| **Recommended** (three-tier) | 648 | 44% fewer requests |

**How we calculated this:**

- Current: 11 hours x 12 scrapes/hour x 8 lots = 1,056, plus 13 off-hours x 1 x 8 = 104. Total: **1,160/day**.
- Recommended: 3 rush hours x 12/hr x 8 = 288, plus 8 stable hours x 4/hr x 8 = 256, plus 13 off-hours x 1 x 8 = 104. Total: **648/day**.

### What about the historical 5-minute data?

The 5-minute data we've already collected isn't wasted. It can always be aggregated (averaged or sampled) into 15-minute or hourly summaries for analysis. In fact, having the high-resolution historical data is valuable — it's what made this analysis possible in the first place.

---

## Data Source and Limitations

- **Dataset:** 17,308 snapshots from 8 UCR parking lots, collected January 22 – February 12, 2026
- **Coverage:** 3 weeks of regular academic activity during Winter quarter

### What this analysis does *not* cover:

- **Exam periods** — parking patterns may be more volatile during midterms and finals
- **Start/end of term** — the first and last weeks of a quarter may have different patterns as students adjust schedules
- **Holidays and campus events** — special events or holiday breaks could create unusual spikes
- **Summer session** — likely much less volatile than the regular academic year

### Recommendation for the future

As we collect more data across different academic periods, this analysis should be revisited. If exam weeks or start-of-term periods show significantly higher volatility, the schedule could be temporarily adjusted to use 5-minute intervals during those periods.
