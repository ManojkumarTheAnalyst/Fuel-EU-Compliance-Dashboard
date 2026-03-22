import type { Route } from '../domain/route.js';
import type { BankingRepository, RegulatoryPolicyPort } from '../domain/ports.js';
/**
 * Sum of per-route compliance balance, with Article 20-style redemptions reducing
 * positive (deficit) balances only. `year` filters routes by reporting year.
 */
export declare function aggregateEffectiveComplianceBalance(routes: Route[], banking: BankingRepository, policy: RegulatoryPolicyPort, year?: number): Promise<number>;
//# sourceMappingURL=effective-compliance-balance.d.ts.map