import type { ComplianceBalanceSnapshot } from '../domain/compliance';

export interface CompliancePort {
  /** @param year e.g. 2024 — forwards to GET /compliance/cb?year= */
  getComplianceBalance(year: number): Promise<ComplianceBalanceSnapshot>;
}
