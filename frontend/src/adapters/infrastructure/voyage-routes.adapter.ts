import type { MaritimeRoute } from '@core/domain/route';
import type { SetBaselineResult, VoyageRoutesPort } from '@core/ports/voyage-routes.port';
import { httpClient } from './http-client';

type ListRoutesResponse = { routes: MaritimeRoute[] };

export class VoyageRoutesHttpAdapter implements VoyageRoutesPort {
  async listRoutes(): Promise<MaritimeRoute[]> {
    const { data } = await httpClient.get<ListRoutesResponse>('/routes');
    return data.routes;
  }

  async setBaseline(routeId: string, baselineGco2ePerMj: number): Promise<SetBaselineResult> {
    const { data } = await httpClient.post<SetBaselineResult>(`/routes/${routeId}/baseline`, {
      baselineGco2ePerMj,
    });
    return data;
  }
}

export const voyageRoutesApi: VoyageRoutesPort = new VoyageRoutesHttpAdapter();
