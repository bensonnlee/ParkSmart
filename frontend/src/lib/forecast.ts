import { closestIndexTo } from 'date-fns';

/**
 * Find the predicted number of free spaces at the forecast time closest
 * to `arrivalTime`. Returns null when no forecast data is available.
 */
export function getPredictedSpots(
  arrivalTime: Date | null,
  forecasts: { forecast_time: string; predicted_free_spaces: number }[] | undefined,
): number | null {
  if (!arrivalTime || !forecasts?.length) return null;
  const idx = closestIndexTo(arrivalTime, forecasts.map(f => new Date(f.forecast_time)));
  if (idx == null) return null;
  return forecasts[idx].predicted_free_spaces;
}
