import type { ApplyBankedResult, BankSurplusResult } from '../domain/banking-actions';

export type BankSurplusParams = {
  routeId: string;
  amountMjEquivalent: number;
  year: number;
};

export type ApplyBankedParams = {
  routeId: string;
  appliedMjEquivalent: number;
  year: number;
};

export interface BankingPort {
  bankSurplus(params: BankSurplusParams): Promise<BankSurplusResult>;
  applyBanked(params: ApplyBankedParams): Promise<ApplyBankedResult>;
}
