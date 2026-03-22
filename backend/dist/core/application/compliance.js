import { KPI } from '../domain/kpis.js';
import { calculateGHGIntensity, totalEnergyMj } from './ghg-intensity.js';
export function checkCompliance(route, policy) {
    const energy = totalEnergyMj(route);
    const ceiling = route.regulatoryCeilingGco2ePerMj ??
        policy.defaultCeilingGco2ePerMj(route.reportingYear);
    const achieved = calculateGHGIntensity(route);
    const gap = achieved - ceiling;
    const complianceBalanceMjWeighted = gap * energy;
    const kpis = [
        { id: KPI.R001, value: ceiling, unit: 'gCO2e/MJ', asOfYear: route.reportingYear },
        { id: KPI.R002, value: achieved, unit: 'gCO2e/MJ', asOfYear: route.reportingYear },
        { id: KPI.R003, value: gap, unit: 'gCO2e/MJ', asOfYear: route.reportingYear },
        { id: KPI.R004, value: complianceBalanceMjWeighted, unit: 'MJ·gap', asOfYear: route.reportingYear },
    ];
    return {
        routeId: route.id,
        vesselId: route.vesselId,
        reportingYear: route.reportingYear,
        ceilingGco2ePerMj: ceiling,
        achievedGco2ePerMj: achieved,
        intensityGapGco2ePerMj: gap,
        complianceBalanceMjWeighted,
        kpis,
    };
}
/** Aggregate compliance balance across all routes (CB). */
export function aggregateComplianceBalance(routes, policy) {
    return routes.reduce((sum, r) => sum + checkCompliance(r, policy).complianceBalanceMjWeighted, 0);
}
//# sourceMappingURL=compliance.js.map