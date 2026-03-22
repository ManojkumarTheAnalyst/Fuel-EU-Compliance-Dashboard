import { type KpiReading } from '../domain/kpis.js';
import type { Route } from '../domain/route.js';
import type { RegulatoryPolicyPort } from '../domain/ports.js';
export type ComplianceResult = {
    routeId: string;
    vesselId: string;
    reportingYear: number;
    ceilingGco2ePerMj: number;
    achievedGco2ePerMj: number;
    /** Negative or zero => compliant surplus; positive => deficit vs ceiling. */
    intensityGapGco2ePerMj: number;
    /** MJ-weighted gap: (achieved - ceiling) * energy; negative => net surplus in intensity terms. */
    complianceBalanceMjWeighted: number;
    kpis: KpiReading[];
};
export declare function checkCompliance(route: Route, policy: RegulatoryPolicyPort): ComplianceResult;
/** Aggregate compliance balance across all routes (CB). */
export declare function aggregateComplianceBalance(routes: Route[], policy: RegulatoryPolicyPort): number;
//# sourceMappingURL=compliance.d.ts.map