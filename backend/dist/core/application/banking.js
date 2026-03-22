import { KPI } from '../domain/kpis.js';
import { checkCompliance } from './compliance.js';
import { totalEnergyMj } from './ghg-intensity.js';
/**
 * Article 20 (simplified): bank only from intensity surplus; cap banked volume
 * as a fraction of total voyage energy (MJ); no banking on deficit.
 */
export async function handleBanking(route, body, banking, policy) {
    if (!route)
        return { ok: false, reason: 'Route not found' };
    if (body.amountMjEquivalent <= 0) {
        return { ok: false, reason: 'Amount must be positive' };
    }
    const c = checkCompliance(route, policy);
    const energy = totalEnergyMj(route);
    if (energy <= 0)
        return { ok: false, reason: 'No energy on route' };
    // Surplus in MJ-equivalent: negative balance means under ceiling
    const surplusMjEq = -c.complianceBalanceMjWeighted;
    if (surplusMjEq <= 0) {
        return { ok: false, reason: 'No surplus to bank (non-compliant or exactly on target)' };
    }
    const capGco2e = policy.article20BankingCapFractionOfEnergyTimesCeiling() * energy * c.ceilingGco2ePerMj;
    const already = await banking.totalBankedForVesselYear(route.vesselId, route.reportingYear);
    const remainingCap = Math.max(0, capGco2e - already);
    if (remainingCap <= 0) {
        return { ok: false, reason: 'Article 20 banking cap reached for vessel/year' };
    }
    const bankable = Math.min(surplusMjEq, remainingCap, body.amountMjEquivalent);
    if (bankable <= 0) {
        return { ok: false, reason: 'Nothing bankable after cap and surplus checks' };
    }
    const entry = {
        id: `bank-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        vesselId: route.vesselId,
        reportingYear: route.reportingYear,
        bankedMjEquivalent: bankable,
        createdAt: new Date().toISOString(),
    };
    const headroomAfter = remainingCap - bankable;
    const kpiR005 = capGco2e > 0 ? headroomAfter / capGco2e : 0;
    const kpis = [
        ...c.kpis,
        {
            id: KPI.R005,
            value: Number.isFinite(kpiR005) ? kpiR005 : 0,
            unit: 'ratio',
            asOfYear: route.reportingYear,
        },
    ];
    await banking.append(entry);
    return { ok: true, entry, kpis };
}
//# sourceMappingURL=banking.js.map