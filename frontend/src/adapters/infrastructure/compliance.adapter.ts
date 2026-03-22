import type { ComplianceBalanceSnapshot } from '@core/domain/compliance';
import type { CompliancePort } from '@core/ports/compliance.port';
import { httpClient } from './http-client';

export class ComplianceHttpAdapter implements CompliancePort {
  async getComplianceBalance(year: number): Promise<ComplianceBalanceSnapshot> {
    const { data } = await httpClient.get<ComplianceBalanceSnapshot>('/compliance/cb', {
      params: { year },
    });
    return data;
  }
}

export const complianceApi: CompliancePort = new ComplianceHttpAdapter();
