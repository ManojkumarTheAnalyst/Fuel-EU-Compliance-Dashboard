import { calculateGHGIntensity } from '../../core/application/ghg-intensity.js';
import { checkCompliance } from '../../core/application/compliance.js';
import { handleBanking } from '../../core/application/banking.js';
import { handleApplyBanked } from '../../core/application/apply-banking.js';
import { aggregateEffectiveComplianceBalance } from '../../core/application/effective-compliance-balance.js';
import { createPoolWithValidation } from '../../core/application/pool.js';
export function registerApiRoutes(app, deps) {
    app.get('/routes', async (_req, res) => {
        const all = await deps.routes.findAll();
        res.json({ routes: all });
    });
    /** Comparison dataset for dashboards (Notion task): intensity vs fixed regulatory target. */
    app.get('/routes/comparison', async (_req, res) => {
        const all = await deps.routes.findAll();
        const targetGco2ePerMj = 89.3368;
        const routes = all.map((r) => ({
            routeId: r.id,
            routeName: r.name,
            vesselId: r.vesselId,
            reportingYear: r.reportingYear,
            ghgIntensityGco2ePerMj: calculateGHGIntensity(r),
        }));
        res.json({ targetGco2ePerMj, routes });
    });
    app.post('/routes/:id/baseline', async (req, res) => {
        const id = String(req.params.id);
        const baseline = Number(req.body?.baselineGco2ePerMj);
        if (!Number.isFinite(baseline) || baseline <= 0) {
            res.status(400).json({ error: 'baselineGco2ePerMj must be a positive number' });
            return;
        }
        const route = await deps.routes.findById(id);
        if (!route) {
            res.status(404).json({ error: 'Route not found' });
            return;
        }
        const updated = { ...route, baselineGco2ePerMj: baseline };
        const c = checkCompliance(updated, deps.policy);
        const withKpis = { ...updated, kpis: c.kpis };
        await deps.routes.save(withKpis);
        res.status(200).json({
            route: withKpis,
            achievedGco2ePerMj: calculateGHGIntensity(updated),
        });
    });
    app.get('/compliance/cb', async (req, res) => {
        const rawYear = req.query.year;
        const y = typeof rawYear === 'string' && rawYear !== ''
            ? Number(rawYear)
            : Array.isArray(rawYear) && typeof rawYear[0] === 'string'
                ? Number(rawYear[0])
                : undefined;
        const yearFilter = y != null && Number.isFinite(y) ? y : undefined;
        const all = await deps.routes.findAll();
        const filtered = yearFilter != null ? all.filter((r) => r.reportingYear === yearFilter) : all;
        const perRoute = await Promise.all(filtered.map(async (r) => {
            const c = checkCompliance(r, deps.policy);
            const raw = c.complianceBalanceMjWeighted;
            const redeemed = await deps.banking.totalAppliedForRouteYear(r.id, r.reportingYear);
            const effective = raw > 0 ? Math.max(0, raw - redeemed) : raw;
            return {
                routeId: c.routeId,
                vesselId: c.vesselId,
                complianceBalanceMjWeighted: effective,
                kpis: c.kpis,
            };
        }));
        const balance = perRoute.reduce((s, p) => s + p.complianceBalanceMjWeighted, 0);
        res.json({
            aggregateComplianceBalanceMjWeighted: balance,
            year: yearFilter ?? null,
            routes: perRoute,
        });
    });
    app.post('/banking/bank', async (req, res) => {
        const routeId = String(req.body?.routeId ?? '');
        const amountMjEquivalent = Number(req.body?.amountMjEquivalent);
        const bodyYear = Number(req.body?.year);
        if (!routeId) {
            res.status(400).json({ error: 'routeId required' });
            return;
        }
        if (!Number.isFinite(amountMjEquivalent)) {
            res.status(400).json({ error: 'amountMjEquivalent must be a number' });
            return;
        }
        const route = await deps.routes.findById(routeId);
        const allRoutes = await deps.routes.findAll();
        const yearScope = Number.isFinite(bodyYear) ? bodyYear : route?.reportingYear;
        if (yearScope == null || !Number.isFinite(yearScope)) {
            res.status(400).json({ error: 'year required (or valid route)' });
            return;
        }
        const cbBefore = await aggregateEffectiveComplianceBalance(allRoutes, deps.banking, deps.policy, yearScope);
        const outcome = await handleBanking(route, { routeId, amountMjEquivalent }, deps.banking, deps.policy);
        if (!outcome.ok) {
            res.status(400).json({ error: outcome.reason });
            return;
        }
        const cbAfter = await aggregateEffectiveComplianceBalance(allRoutes, deps.banking, deps.policy, yearScope);
        res.status(201).json({
            entry: outcome.entry,
            kpis: outcome.kpis,
            cb_before: cbBefore,
            cb_after: cbAfter,
            applied: outcome.entry.bankedMjEquivalent,
        });
    });
    app.post('/banking/apply', async (req, res) => {
        const routeId = String(req.body?.routeId ?? '');
        const appliedMjEquivalent = Number(req.body?.appliedMjEquivalent);
        const year = Number(req.body?.year);
        if (!routeId) {
            res.status(400).json({ error: 'routeId required' });
            return;
        }
        if (!Number.isFinite(appliedMjEquivalent)) {
            res.status(400).json({ error: 'appliedMjEquivalent must be a number' });
            return;
        }
        if (!Number.isFinite(year)) {
            res.status(400).json({ error: 'year must be a number' });
            return;
        }
        const route = await deps.routes.findById(routeId);
        const allRoutes = await deps.routes.findAll();
        const outcome = await handleApplyBanked(route, { routeId, appliedMjEquivalent }, deps.banking, deps.policy, allRoutes, year);
        if (!outcome.ok) {
            res.status(400).json({ error: outcome.reason });
            return;
        }
        res.status(201).json({
            entry: outcome.entry,
            cb_before: outcome.cbBefore,
            cb_after: outcome.cbAfter,
            applied: outcome.applied,
        });
    });
    app.post('/pools', async (req, res) => {
        const name = String(req.body?.name ?? '');
        const reportingYear = Number(req.body?.reportingYear);
        const memberRouteIds = req.body?.memberRouteIds;
        if (!name) {
            res.status(400).json({ error: 'name required' });
            return;
        }
        if (!Number.isFinite(reportingYear)) {
            res.status(400).json({ error: 'reportingYear must be a number' });
            return;
        }
        if (!Array.isArray(memberRouteIds) || memberRouteIds.some((x) => typeof x !== 'string')) {
            res.status(400).json({ error: 'memberRouteIds must be an array of strings' });
            return;
        }
        const created = await createPoolWithValidation({ name, reportingYear, memberRouteIds }, deps.routes, deps.policy);
        if (!created.ok) {
            res.status(400).json({ error: created.reason });
            return;
        }
        await deps.pools.save(created.pool);
        res.status(201).json({ pool: created.pool });
    });
}
//# sourceMappingURL=api.js.map