# Forecasting Roadmap

## Current: prophet-v1 (with break filtering)

- Prophet trained on all snapshots that fall within `academic_weeks` date ranges
- Break and summer data excluded from training
- Weekly + daily seasonality only (no term-level distinction)
- Forecasts skipped when current date is outside any academic term

## Future: prophet-v2 (per-term seasonality)

### Prerequisite
At least one full academic year of data (fall + winter + spring). As of Winter 2026
we only have data from week 3 onwards, so this is not yet viable.

### What to change
Add one-hot regressors to Prophet so it can learn that parking patterns differ
between terms (e.g., fall Mondays vs spring Mondays):

1. For each training snapshot, look up its term type via:
   `snapshot.collected_at` -> `academic_week` -> `academic_term.term_type`
2. Add three binary columns to the training DataFrame: `is_fall`, `is_winter`, `is_spring`
3. Register them as regressors:
   ```python
   model.add_regressor("is_fall")
   model.add_regressor("is_winter")
   model.add_regressor("is_spring")
   ```
4. When predicting future times, determine which term the forecast falls in and
   set the same regressor columns accordingly
5. Bump MODEL_VERSION to "prophet-v2"

### Why this works without backfilling
The `academic_weeks` table already tags every week with its parent term's `term_type`.
All historical snapshots collected during a term are implicitly labeled through this
relationship. No data migration or re-labeling is needed — just query the join.

### When to activate
Once you have collected data across all three term types (likely after Fall 2026),
compare prophet-v1 vs prophet-v2 accuracy on a holdout set before switching.
