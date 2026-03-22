import { checkCompliance } from '../core/application/compliance.js';
function seedRoutes(policy) {
    const y2025 = 2025;
    const y2024 = 2024;
    const ceiling2025 = policy.defaultCeilingGco2ePerMj(y2025);
    const ceiling2024 = policy.defaultCeilingGco2ePerMj(y2024);
    return [
        {
            id: 'route-1',
            vesselId: 'vessel-alfa',
            name: 'Rotterdam — Singapore',
            reportingYear: y2025,
            regulatoryCeilingGco2ePerMj: ceiling2025,
            lifts: [
                { energyMj: 5_000_000, ghgIntensityGco2ePerMj: 85 },
                { energyMj: 2_000_000, ghgIntensityGco2ePerMj: 88 },
            ],
        },
        {
            id: 'route-2',
            vesselId: 'vessel-beta',
            name: 'Hamburg — New York',
            reportingYear: y2025,
            lifts: [{ energyMj: 8_000_000, ghgIntensityGco2ePerMj: 92 }],
        },
        {
            id: 'route-2024-alfa',
            vesselId: 'vessel-alfa',
            name: '2024 Transatlantic',
            reportingYear: y2024,
            regulatoryCeilingGco2ePerMj: ceiling2024,
            lifts: [{ energyMj: 6_000_000, ghgIntensityGco2ePerMj: 86 }],
        },
        {
            id: 'route-2024-beta',
            vesselId: 'vessel-beta',
            name: '2024 Med loop',
            reportingYear: y2024,
            lifts: [{ energyMj: 5_000_000, ghgIntensityGco2ePerMj: 93 }],
        },
        /** Same vessel as route-2024-alfa: bank surplus on one leg, apply to deficit on the other. */
        {
            id: 'route-2024-alfa-deficit',
            vesselId: 'vessel-alfa',
            name: '2024 Alfa — high-carbon leg',
            reportingYear: y2024,
            lifts: [{ energyMj: 2_000_000, ghgIntensityGco2ePerMj: 95 }],
        },
    ];
}
export function createInMemoryRepositories(policy) {
    let routeRows = [];
    let bankingRows = [];
    let applyRows = [];
    let poolRows = [];
    const routes = {
        seed() {
            routeRows = seedRoutes(policy).map((r) => {
                const c = checkCompliance(r, policy);
                return { ...r, kpis: c.kpis };
            });
        },
        async findAll() {
            return [...routeRows];
        },
        async findById(id) {
            return routeRows.find((r) => r.id === id);
        },
        async save(route) {
            const i = routeRows.findIndex((r) => r.id === route.id);
            if (i >= 0)
                routeRows[i] = route;
            else
                routeRows.push(route);
        },
    };
    const banking = {
        async listEntries() {
            return [...bankingRows];
        },
        async append(entry) {
            bankingRows.push(entry);
        },
        async totalBankedForVesselYear(vesselId, year) {
            return bankingRows
                .filter((e) => e.vesselId === vesselId && e.reportingYear === year)
                .reduce((s, e) => s + e.bankedMjEquivalent, 0);
        },
        async listApplyEntries() {
            return [...applyRows];
        },
        async appendApply(entry) {
            applyRows.push(entry);
        },
        async totalAppliedForVesselYear(vesselId, year) {
            return applyRows
                .filter((e) => e.vesselId === vesselId && e.reportingYear === year)
                .reduce((s, e) => s + e.appliedMjEquivalent, 0);
        },
        async totalAppliedForRouteYear(routeId, year) {
            return applyRows
                .filter((e) => e.targetRouteId === routeId && e.reportingYear === year)
                .reduce((s, e) => s + e.appliedMjEquivalent, 0);
        },
    };
    const pools = {
        async findAll() {
            return [...poolRows];
        },
        async save(pool) {
            poolRows.push(pool);
        },
    };
    routes.seed();
    return { routes, banking, pools };
}
//# sourceMappingURL=in-memory-store.js.map