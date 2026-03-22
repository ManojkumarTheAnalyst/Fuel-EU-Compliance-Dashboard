import type { Route } from './route.js';
import type { BankingApplyLedgerEntry, BankingLedgerEntry } from './banking-ledger.js';
import type { Pool } from './pool.js';
export interface RouteRepository {
    findAll(): Promise<Route[]>;
    findById(id: string): Promise<Route | undefined>;
    save(route: Route): Promise<void>;
}
export interface BankingRepository {
    listEntries(): Promise<BankingLedgerEntry[]>;
    append(entry: BankingLedgerEntry): Promise<void>;
    totalBankedForVesselYear(vesselId: string, year: number): Promise<number>;
    listApplyEntries(): Promise<BankingApplyLedgerEntry[]>;
    appendApply(entry: BankingApplyLedgerEntry): Promise<void>;
    totalAppliedForVesselYear(vesselId: string, year: number): Promise<number>;
    totalAppliedForRouteYear(routeId: string, year: number): Promise<number>;
}
export interface PoolRepository {
    findAll(): Promise<Pool[]>;
    save(pool: Pool): Promise<void>;
}
export interface RegulatoryPolicyPort {
    defaultCeilingGco2ePerMj(year: number): number;
    /**
     * Article 20 (mock): max bankable surplus (gCO₂e) as a fraction of (energyMj × ceiling).
     * Matches units of (ceiling − achieved) × energyMj.
     */
    article20BankingCapFractionOfEnergyTimesCeiling(): number;
}
//# sourceMappingURL=ports.d.ts.map