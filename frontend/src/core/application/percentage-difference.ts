/**
 * Relative difference of `comparison` vs `baseline`, as a percentage.
 * Formula: ((comparison / baseline) - 1) * 100
 * — e.g. baseline = target intensity, comparison = achieved → positive means above target (worse).
 */
export function percentageDifferenceFromBaseline(
  comparison: number,
  baseline: number,
): number | null {
  if (!Number.isFinite(comparison) || !Number.isFinite(baseline) || baseline === 0) {
    return null;
  }
  return ((comparison / baseline) - 1) * 100;
}
