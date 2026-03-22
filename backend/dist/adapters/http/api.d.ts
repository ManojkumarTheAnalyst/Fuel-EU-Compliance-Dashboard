import type { Express } from 'express';
import type { RegulatoryPolicyPort } from '../../core/domain/ports.js';
import type { RouteRepository, BankingRepository, PoolRepository } from '../../core/domain/ports.js';
export declare function registerApiRoutes(app: Express, deps: {
    routes: RouteRepository;
    banking: BankingRepository;
    pools: PoolRepository;
    policy: RegulatoryPolicyPort;
}): void;
//# sourceMappingURL=api.d.ts.map