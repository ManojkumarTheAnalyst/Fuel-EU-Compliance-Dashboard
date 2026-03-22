export type RouteComparisonRow = {
  routeId: string;
  routeName: string;
  vesselId: string;
  reportingYear: number;
  /** Achieved well-to-wake GHG intensity (gCO₂e/MJ). */
  ghgIntensityGco2ePerMj: number;
};

export type RouteComparisonSnapshot = {
  targetGco2ePerMj: number;
  routes: RouteComparisonRow[];
};
