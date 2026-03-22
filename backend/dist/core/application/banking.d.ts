import { type KpiReading } from '../domain/kpis.js';
import type { Route } from '../domain/route.js';
import type { BankingLedgerEntry } from '../domain/banking-ledger.js';
import type { BankingRepository, RegulatoryPolicyPort } from '../domain/ports.js';
export type BankingRequest = {
    routeId: string;
    /** Requested amount to bank (MJ-equivalent surplus). */
    amountMjEquivalent: number;
};
export type BankingOutcome = {
    ok: true;
    entry: BankingLedgerEntry;
    kpis: KpiReading[];
} | {
    ok: false;
    reason: string;
};
/**
 * Article 20 (simplified): bank only from intensity surplus; cap banked volume
 * as a fraction of total voyage energy (MJ); no banking on deficit.
 */
export declare function handleBanking(route: Route | undefined, body: BankingRequest, banking: BankingRepository, policy: RegulatoryPolicyPort): Promise<BankingOutcome>;
//# sourceMappingURL=banking.d.ts.map