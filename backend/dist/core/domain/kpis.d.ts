/**
 * KPI dataset R001–R005 (Notion-aligned identifiers).
 * Values attach to routes, compliance snapshots, banking, and pools.
 */
export declare const KPI: {
    /** R001 — Regulatory GHG intensity ceiling for the period (gCO₂e/MJ, WtW). */
    readonly R001: "R001";
    /** R002 — Achieved well-to-wake GHG intensity (gCO₂e/MJ). */
    readonly R002: "R002";
    /** R003 — Intensity gap vs ceiling (gCO₂e/MJ); ≤0 means meeting/exceeding target. */
    readonly R003: "R003";
    /** R004 — Compliance balance in energy-weighted terms (MJ·(gCO₂e/MJ) gap vs ceiling). */
    readonly R004: "R004";
    /** R005 — Article 20 banking headroom (0–1), share of surplus still bankable under cap. */
    readonly R005: "R005";
};
export type KpiId = (typeof KPI)[keyof typeof KPI];
export type KpiReading = {
    id: KpiId;
    value: number;
    unit: string;
    asOfYear: number;
};
//# sourceMappingURL=kpis.d.ts.map