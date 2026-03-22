import type { Route } from '../domain/route.js';
import type { BankingRepository, RegulatoryPolicyPort } from '../domain/ports.js';
import { checkCompliance } from './compliance.js';

/**
 * Sum of per-route compliance balance, with Article 20-style redemptions reducing
 * positive (deficit) balances only. `year` filters routes by reporting year.
 */
export async function aggregateEffectiveComplianceBalance(
  routes: Route[],
  banking: BankingRepository,
  policy: RegulatoryPolicyPort,
  year?: number,
): Promise<number> {
  const filtered = year != null ? routes.filter((r) => r.reportingYear === year) : routes;
  let sum = 0;
  for (const r of filtered) {
    const c = checkCompliance(r, policy);
    const raw = c.complianceBalanceMjWeighted;
    const redeemed = await banking.totalAppliedForRouteYear(r.id, r.reportingYear);
    const eff = raw > 0 ? Math.max(0, raw - redeemed) : raw;
    sum += eff;
  }
  return sum;
}
