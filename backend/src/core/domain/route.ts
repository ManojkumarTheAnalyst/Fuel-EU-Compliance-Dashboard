import type { KpiReading } from './kpis.js';

/** Single fuel lift contributing to voyage energy and GHG. */
export type FuelLift = {
  energyMj: number;
  /** Well-to-wake GHG intensity (gCO₂e/MJ). */
  ghgIntensityGco2ePerMj: number;
};

export type Route = {
  id: string;
  vesselId: string;
  name: string;
  reportingYear: number;
  lifts: FuelLift[];
  /** Optional regulatory ceiling override (gCO₂e/MJ); defaults from mock policy if absent. */
  regulatoryCeilingGco2ePerMj?: number;
  /** Stored baseline intensity for the route (gCO₂e/MJ), set via POST baseline. */
  baselineGco2ePerMj?: number;
  /** Latest computed KPI bundle for the route. */
  kpis?: KpiReading[];
};
