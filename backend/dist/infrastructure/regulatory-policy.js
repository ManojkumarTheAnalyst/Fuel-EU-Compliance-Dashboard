/** Mock declining intensity ceiling (gCO₂e/MJ) — illustrative only. */
const YEAR_CEILING = {
    2024: 91.16,
    2025: 89.34,
    2026: 87.52,
};
export class MockRegulatoryPolicy {
    defaultCeilingGco2ePerMj(year) {
        return YEAR_CEILING[year] ?? 91.16;
    }
    article20BankingCapFractionOfEnergyTimesCeiling() {
        return 0.05;
    }
}
//# sourceMappingURL=regulatory-policy.js.map