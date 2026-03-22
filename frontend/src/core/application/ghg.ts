import type { MaritimeRoute } from '../domain/route';

export function totalEnergyMj(route: MaritimeRoute): number {
  return route.lifts.reduce((s, l) => s + l.energyMj, 0);
}

export function weightedIntensityGco2ePerMj(route: MaritimeRoute): number {
  const e = totalEnergyMj(route);
  if (e <= 0) return 0;
  return route.lifts.reduce((s, l) => s + l.energyMj * l.ghgIntensityGco2ePerMj, 0) / e;
}

export function kpiValue(route: MaritimeRoute, id: string): number | undefined {
  return route.kpis?.find((k) => k.id === id)?.value;
}
