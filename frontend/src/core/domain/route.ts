export type FuelLift = {
  energyMj: number;
  ghgIntensityGco2ePerMj: number;
};

export type KpiReading = {
  id: string;
  value: number;
  unit: string;
  asOfYear: number;
};

export type MaritimeRoute = {
  id: string;
  vesselId: string;
  name: string;
  reportingYear: number;
  lifts: FuelLift[];
  regulatoryCeilingGco2ePerMj?: number;
  baselineGco2ePerMj?: number;
  kpis?: KpiReading[];
};
