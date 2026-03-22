import type { KpiReading } from './route';

export type ComplianceRouteRow = {
  routeId: string;
  vesselId: string;
  complianceBalanceMjWeighted: number;
  kpis: KpiReading[];
};

export type ComplianceBalanceSnapshot = {
  aggregateComplianceBalanceMjWeighted: number;
  /** Reporting year filter from query, or null if all years. */
  year: number | null;
  routes: ComplianceRouteRow[];
};
