import type { ComplianceBalanceSnapshot } from '@core/domain/compliance';
import type { PoolingBalancesPort } from '@core/ports/pooling-balances.port';
import { httpClient } from './http-client';

export class PoolingBalancesHttpAdapter implements PoolingBalancesPort {
  async fetchByYear(year: number): Promise<ComplianceBalanceSnapshot> {
    const { data } = await httpClient.get<ComplianceBalanceSnapshot>('/compliance/cb', {
      params: { year },
    });
    return data;
  }
}

export const poolingBalancesApi: PoolingBalancesPort = new PoolingBalancesHttpAdapter();
