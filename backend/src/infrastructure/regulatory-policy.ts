import type { RegulatoryPolicyPort } from '../core/domain/ports.js';

/** Mock declining intensity ceiling (gCO₂e/MJ) — illustrative only. */
const YEAR_CEILING: Record<number, number> = {
  2024: 91.16,
  2025: 89.34,
  2026: 87.52,
};

export class MockRegulatoryPolicy implements RegulatoryPolicyPort {
  defaultCeilingGco2ePerMj(year: number): number {
    return YEAR_CEILING[year] ?? 91.16;
  }

  article20BankingCapFractionOfEnergyTimesCeiling(): number {
    return 0.05;
  }
}
