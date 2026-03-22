import type { RouteComparisonSnapshot } from '@core/domain/route-comparison';
import type { RouteComparisonPort } from '@core/ports/route-comparison.port';
import { httpClient } from './http-client';

export class RouteComparisonHttpAdapter implements RouteComparisonPort {
  async getRouteComparison(): Promise<RouteComparisonSnapshot> {
    const { data } = await httpClient.get<RouteComparisonSnapshot>('/routes/comparison');
    return data;
  }
}

export const routeComparisonApi: RouteComparisonPort = new RouteComparisonHttpAdapter();
