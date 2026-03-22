import type { ComplianceBalanceSnapshot } from '../domain/compliance';

/** Article 21 UI: route-level balances from compliance API. */
export interface PoolingBalancesPort {
  /** GET /compliance/cb?year= */
  fetchByYear(year: number): Promise<ComplianceBalanceSnapshot>;
}
