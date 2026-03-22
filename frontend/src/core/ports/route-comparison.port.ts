import type { RouteComparisonSnapshot } from '../domain/route-comparison';

export interface RouteComparisonPort {
  getRouteComparison(): Promise<RouteComparisonSnapshot>;
}
