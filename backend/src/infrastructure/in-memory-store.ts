import type { Route } from '../core/domain/route.js';
import type { BankingApplyLedgerEntry, BankingLedgerEntry } from '../core/domain/banking-ledger.js';
import type { Pool } from '../core/domain/pool.js';
import type { BankingRepository, PoolRepository, RouteRepository } from '../core/domain/ports.js';
import { checkCompliance } from '../core/application/compliance.js';
import type { RegulatoryPolicyPort } from '../core/domain/ports.js';

function seedRoutes(policy: RegulatoryPolicyPort): Route[] {
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
      lifts: [{ energyMj: 8_000_000, ghgIntensityGco2ePerMj: 94 }],
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
      lifts: [{ energyMj: 5_000_000, ghgIntensityGco2ePerMj: 97 }],
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

export function createInMemoryRepositories(policy: RegulatoryPolicyPort): {
  routes: RouteRepository & { seed(): void };
  banking: BankingRepository;
  pools: PoolRepository;
} {
  let routeRows: Route[] = [];
  let bankingRows: BankingLedgerEntry[] = [];
  let applyRows: BankingApplyLedgerEntry[] = [];
  let poolRows: Pool[] = [];

  const routes: RouteRepository & { seed(): void } = {
    seed() {
      routeRows = seedRoutes(policy).map((r) => {
        const c = checkCompliance(r, policy);
        return { ...r, kpis: c.kpis };
      });
    },
    async findAll() {
      return [...routeRows];
    },
    async findById(id: string) {
      return routeRows.find((r) => r.id === id);
    },
    async save(route: Route) {
      const i = routeRows.findIndex((r) => r.id === route.id);
      if (i >= 0) routeRows[i] = route;
      else routeRows.push(route);
    },
  };

  const banking: BankingRepository = {
    async listEntries() {
      return [...bankingRows];
    },
    async append(entry: BankingLedgerEntry) {
      bankingRows.push(entry);
    },
    async totalBankedForVesselYear(vesselId: string, year: number) {
      return bankingRows
        .filter((e) => e.vesselId === vesselId && e.reportingYear === year)
        .reduce((s, e) => s + e.bankedMjEquivalent, 0);
    },
    async listApplyEntries() {
      return [...applyRows];
    },
    async appendApply(entry: BankingApplyLedgerEntry) {
      applyRows.push(entry);
    },
    async totalAppliedForVesselYear(vesselId: string, year: number) {
      return applyRows
        .filter((e) => e.vesselId === vesselId && e.reportingYear === year)
        .reduce((s, e) => s + e.appliedMjEquivalent, 0);
    },
    async totalAppliedForRouteYear(routeId: string, year: number) {
      return applyRows
        .filter((e) => e.targetRouteId === routeId && e.reportingYear === year)
        .reduce((s, e) => s + e.appliedMjEquivalent, 0);
    },
  };

  const pools: PoolRepository = {
    async findAll() {
      return [...poolRows];
    },
    async save(pool: Pool) {
      poolRows.push(pool);
    },
  };

  routes.seed();
  return { routes, banking, pools };
}
