import type { BankingRepository, PoolRepository, RouteRepository } from '../core/domain/ports.js';
import type { RegulatoryPolicyPort } from '../core/domain/ports.js';
export declare function createInMemoryRepositories(policy: RegulatoryPolicyPort): {
    routes: RouteRepository & {
        seed(): void;
    };
    banking: BankingRepository;
    pools: PoolRepository;
};
//# sourceMappingURL=in-memory-store.d.ts.map