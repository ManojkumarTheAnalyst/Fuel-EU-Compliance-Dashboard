import type { Pool, PoolMemberRef } from '../domain/pool.js';
import type { Route } from '../domain/route.js';
import type { RegulatoryPolicyPort, RouteRepository } from '../domain/ports.js';
export type PoolCreateInput = {
    name: string;
    reportingYear: number;
    memberRouteIds: string[];
};
export type PoolValidationResult = {
    ok: true;
    poolIntensityGco2ePerMj: number;
    ceilingGco2ePerMj: number;
    totalEnergyMj: number;
} | {
    ok: false;
    reason: string;
};
/**
 * Article 21 (simplified): pool meets target if pooled weighted intensity ≤ regulatory ceiling
 * for the reporting year; all members must exist and match the pool year.
 */
export declare function validatePoolArticle21(members: PoolMemberRef[], routesById: Map<string, Route>, reportingYear: number, policy: RegulatoryPolicyPort): PoolValidationResult;
export declare function createPoolWithValidation(input: PoolCreateInput, routes: RouteRepository, policy: RegulatoryPolicyPort): Promise<{
    ok: true;
    pool: Pool;
} | {
    ok: false;
    reason: string;
}>;
//# sourceMappingURL=pool.d.ts.map