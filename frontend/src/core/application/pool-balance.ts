import type { ComplianceRouteRow } from '../domain/compliance';

/** Sum of effective compliance balances (MJ-weighted) for the selected routes. */
export function sumSelectedPoolBalances(
  rows: ComplianceRouteRow[],
  selectedRouteIds: ReadonlySet<string>,
): number {
  let sum = 0;
  for (const r of rows) {
    if (selectedRouteIds.has(r.routeId)) {
      sum += r.complianceBalanceMjWeighted;
    }
  }
  return sum;
}
