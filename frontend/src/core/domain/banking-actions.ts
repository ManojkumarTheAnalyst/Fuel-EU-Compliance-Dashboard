import type { KpiReading } from './route';

export type BankingLedgerEntryDto = {
  id: string;
  vesselId: string;
  reportingYear: number;
  bankedMjEquivalent: number;
  createdAt: string;
};

export type ApplyLedgerEntryDto = {
  id: string;
  vesselId: string;
  reportingYear: number;
  targetRouteId: string;
  appliedMjEquivalent: number;
  createdAt: string;
};

export type BankSurplusResult = {
  entry: BankingLedgerEntryDto;
  kpis: KpiReading[];
  cb_before: number;
  cb_after: number;
  applied: number;
};

export type ApplyBankedResult = {
  entry: ApplyLedgerEntryDto;
  cb_before: number;
  cb_after: number;
  applied: number;
};
