import type { ApplyBankedResult, BankSurplusResult } from '@core/domain/banking-actions';
import type { ApplyBankedParams, BankSurplusParams, BankingPort } from '@core/ports/banking.port';
import { httpClient } from './http-client';

export class BankingHttpAdapter implements BankingPort {
  async bankSurplus(params: BankSurplusParams): Promise<BankSurplusResult> {
    const { data } = await httpClient.post<BankSurplusResult>('/banking/bank', {
      routeId: params.routeId,
      amountMjEquivalent: params.amountMjEquivalent,
      year: params.year,
    });
    return data;
  }

  async applyBanked(params: ApplyBankedParams): Promise<ApplyBankedResult> {
    const { data } = await httpClient.post<ApplyBankedResult>('/banking/apply', {
      routeId: params.routeId,
      appliedMjEquivalent: params.appliedMjEquivalent,
      year: params.year,
    });
    return data;
  }
}

export const bankingApi: BankingPort = new BankingHttpAdapter();
