import type { Route } from '../domain/route.js';
import type { BankingApplyLedgerEntry } from '../domain/banking-ledger.js';
import type { BankingRepository, RegulatoryPolicyPort } from '../domain/ports.js';
export type ApplyBankingRequest = {
    routeId: string;
    appliedMjEquivalent: number;
};
export type ApplyBankingOutcome = {
    ok: true;
    entry: BankingApplyLedgerEntry;
    cbBefore: number;
    cbAfter: number;
    applied: number;
} | {
    ok: false;
    reason: string;
};
/**
 * Apply previously banked surplus to a deficit route (same vessel / reporting year).
 */
export declare function handleApplyBanked(route: Route | undefined, body: ApplyBankingRequest, banking: BankingRepository, policy: RegulatoryPolicyPort, allRoutes: Route[], scopeYear: number): Promise<ApplyBankingOutcome>;
//# sourceMappingURL=apply-banking.d.ts.map