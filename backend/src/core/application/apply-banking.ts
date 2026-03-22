import type { Route } from '../domain/route.js';
import type { BankingApplyLedgerEntry } from '../domain/banking-ledger.js';
import type { BankingRepository, RegulatoryPolicyPort } from '../domain/ports.js';
import { checkCompliance } from './compliance.js';
import { aggregateEffectiveComplianceBalance } from './effective-compliance-balance.js';

export type ApplyBankingRequest = {
  routeId: string;
  appliedMjEquivalent: number;
};

export type ApplyBankingOutcome =
  | {
      ok: true;
      entry: BankingApplyLedgerEntry;
      cbBefore: number;
      cbAfter: number;
      applied: number;
    }
  | { ok: false; reason: string };

/**
 * Apply previously banked surplus to a deficit route (same vessel / reporting year).
 */
export async function handleApplyBanked(
  route: Route | undefined,
  body: ApplyBankingRequest,
  banking: BankingRepository,
  policy: RegulatoryPolicyPort,
  allRoutes: Route[],
  scopeYear: number,
): Promise<ApplyBankingOutcome> {
  if (!route) return { ok: false, reason: 'Route not found' };
  if (body.appliedMjEquivalent <= 0) {
    return { ok: false, reason: 'Amount must be positive' };
  }
  if (route.reportingYear !== scopeYear) {
    return { ok: false, reason: 'Route reporting year does not match selected year' };
  }

  const c = checkCompliance(route, policy);
  const rawDeficit = c.complianceBalanceMjWeighted;
  if (rawDeficit <= 0) {
    return { ok: false, reason: 'Route has no compliance deficit to offset' };
  }

  const alreadyRedeemed = await banking.totalAppliedForRouteYear(route.id, route.reportingYear);
  const remainingDeficit = Math.max(0, rawDeficit - alreadyRedeemed);
  if (remainingDeficit <= 0) {
    return { ok: false, reason: 'Deficit on this route is already fully covered' };
  }

  const totalBanked = await banking.totalBankedForVesselYear(route.vesselId, route.reportingYear);
  const totalApplied = await banking.totalAppliedForVesselYear(route.vesselId, route.reportingYear);
  const netBanked = totalBanked - totalApplied;
  if (netBanked <= 0) {
    return { ok: false, reason: 'No banked surplus available for this vessel/year' };
  }

  const applyAmount = Math.min(
    body.appliedMjEquivalent,
    remainingDeficit,
    netBanked,
  );
  if (applyAmount <= 0) {
    return { ok: false, reason: 'Nothing to apply after limits' };
  }

  const cbBefore = await aggregateEffectiveComplianceBalance(allRoutes, banking, policy, scopeYear);

  const entry: BankingApplyLedgerEntry = {
    id: `apply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    vesselId: route.vesselId,
    reportingYear: route.reportingYear,
    targetRouteId: route.id,
    appliedMjEquivalent: applyAmount,
    createdAt: new Date().toISOString(),
  };

  await banking.appendApply(entry);

  const cbAfter = await aggregateEffectiveComplianceBalance(allRoutes, banking, policy, scopeYear);

  return {
    ok: true,
    entry,
    cbBefore,
    cbAfter,
    applied: applyAmount,
  };
}
