import { KPI, type KpiReading } from '../domain/kpis.js';
import type { Route } from '../domain/route.js';
import type { RegulatoryPolicyPort } from '../domain/ports.js';
import { calculateGHGIntensity, totalEnergyMj } from './ghg-intensity.js';

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

export function checkCompliance(
  route: Route,
  policy: RegulatoryPolicyPort,
): ComplianceResult {
  const energy = totalEnergyMj(route);
  const ceiling =
    route.regulatoryCeilingGco2ePerMj ??
    policy.defaultCeilingGco2ePerMj(route.reportingYear);
  const achieved = calculateGHGIntensity(route);
  const gap = achieved - ceiling;
  const complianceBalanceMjWeighted = gap * energy;

  const kpis: KpiReading[] = [
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
export function aggregateComplianceBalance(routes: Route[], policy: RegulatoryPolicyPort): number {
  return routes.reduce((sum, r) => sum + checkCompliance(r, policy).complianceBalanceMjWeighted, 0);
}
