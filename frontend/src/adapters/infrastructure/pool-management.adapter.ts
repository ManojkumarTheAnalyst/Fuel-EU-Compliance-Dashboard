import type { CreatePoolInput, CreatePoolResult, PoolManagementPort } from '@core/ports/pool-management.port';
import { httpClient } from './http-client';

export class PoolManagementHttpAdapter implements PoolManagementPort {
  async createPool(input: CreatePoolInput): Promise<CreatePoolResult> {
    const { data } = await httpClient.post<CreatePoolResult>('/pools', {
      name: input.name,
      reportingYear: input.reportingYear,
      memberRouteIds: input.memberRouteIds,
    });
    return data;
  }
}

export const poolManagementApi: PoolManagementPort = new PoolManagementHttpAdapter();
