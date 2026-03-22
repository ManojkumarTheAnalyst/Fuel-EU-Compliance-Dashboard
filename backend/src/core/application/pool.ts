import type { Pool, PoolMemberRef } from '../domain/pool.js';
import type { Route } from '../domain/route.js';
import type { RegulatoryPolicyPort, RouteRepository } from '../domain/ports.js';
import { calculateGHGIntensity, totalEnergyMj } from './ghg-intensity.js';

export type PoolCreateInput = {
  name: string;
  reportingYear: number;
  memberRouteIds: string[];
};

export type PoolValidationResult =
  | { ok: true; poolIntensityGco2ePerMj: number; ceilingGco2ePerMj: number; totalEnergyMj: number }
  | { ok: false; reason: string };

/**
 * Article 21 (simplified): pool meets target if pooled weighted intensity ≤ regulatory ceiling
 * for the reporting year; all members must exist and match the pool year.
 */
export function validatePoolArticle21(
  members: PoolMemberRef[],
  routesById: Map<string, Route>,
  reportingYear: number,
  policy: RegulatoryPolicyPort,
): PoolValidationResult {
  if (members.length === 0) {
    return { ok: false, reason: 'Pool requires at least one member route' };
  }

  let totalE = 0;
  let weighted = 0;
  const ceiling = policy.defaultCeilingGco2ePerMj(reportingYear);

  for (const m of members) {
    const r = routesById.get(m.routeId);
    if (!r) return { ok: false, reason: `Unknown route: ${m.routeId}` };
    if (r.reportingYear !== reportingYear) {
      return { ok: false, reason: `Route ${m.routeId} reporting year mismatch` };
    }
    const e = totalEnergyMj(r);
    if (e <= 0) return { ok: false, reason: `Route ${m.routeId} has no energy` };
    totalE += e;
    weighted += e * calculateGHGIntensity(r);
  }

  const poolIntensity = weighted / totalE;
  if (poolIntensity > ceiling) {
    return {
      ok: false,
      reason: `Pooled intensity ${poolIntensity.toFixed(4)} exceeds ceiling ${ceiling}`,
    };
  }

  return {
    ok: true,
    poolIntensityGco2ePerMj: poolIntensity,
    ceilingGco2ePerMj: ceiling,
    totalEnergyMj: totalE,
  };
}

export async function createPoolWithValidation(
  input: PoolCreateInput,
  routes: RouteRepository,
  policy: RegulatoryPolicyPort,
): Promise<{ ok: true; pool: Pool } | { ok: false; reason: string }> {
  const all = await routes.findAll();
  const map = new Map(all.map((r) => [r.id, r]));
  const members: PoolMemberRef[] = input.memberRouteIds.map((routeId) => ({ routeId }));

  const v = validatePoolArticle21(members, map, input.reportingYear, policy);
  if (!v.ok) return v;

  const pool: Pool = {
    id: `pool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: input.name,
    reportingYear: input.reportingYear,
    members,
    createdAt: new Date().toISOString(),
  };

  return { ok: true, pool };
}
