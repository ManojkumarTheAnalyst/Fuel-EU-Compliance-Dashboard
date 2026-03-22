export type BankingLedgerEntry = {
    id: string;
    vesselId: string;
    reportingYear: number;
    /** Banked surplus (same units as compliance balance magnitude: (gCO₂e/MJ gap) × MJ). */
    bankedMjEquivalent: number;
    createdAt: string;
};
export type BankingApplyLedgerEntry = {
    id: string;
    vesselId: string;
    reportingYear: number;
    targetRouteId: string;
    appliedMjEquivalent: number;
    createdAt: string;
};
export type BankingLedger = {
    vesselId: string;
    entries: BankingLedgerEntry[];
};
//# sourceMappingURL=banking-ledger.d.ts.map