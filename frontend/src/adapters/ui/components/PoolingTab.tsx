import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PoolingBalancesPort } from '@core/ports/pooling-balances.port';
import type { PoolManagementPort } from '@core/ports/pool-management.port';
import type { VoyageRoutesPort } from '@core/ports/voyage-routes.port';
import type { ComplianceBalanceSnapshot } from '@core/domain/compliance';
import { sumSelectedPoolBalances } from '@core/application/pool-balance';
import { getApiErrorMessage } from '@shared/api-error';

type Props = {
  balancesPort: PoolingBalancesPort;
  routesPort: VoyageRoutesPort;
  poolsPort: PoolManagementPort;
};

const DEFAULT_YEAR = 2024;
const YEAR_OPTIONS = [2024, 2025] as const;

function formatBalance(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PoolingTab({ balancesPort, routesPort, poolsPort }: Props) {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [snapshot, setSnapshot] = useState<ComplianceBalanceSnapshot | null>(null);
  const [routeNames, setRouteNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [poolName, setPoolName] = useState('Article 21 pool');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const [bal, routes] = await Promise.all([
        balancesPort.fetchByYear(year),
        routesPort.listRoutes(),
      ]);
      setSnapshot(bal);
      const names = new Map<string, string>();
      for (const r of routes) {
        if (r.reportingYear === year) {
          names.set(r.id, r.name);
        }
      }
      setRouteNames(names);
      setSelected(new Set());
    } catch (e) {
      setError(getApiErrorMessage(e));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [balancesPort, routesPort, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (routeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const totalPoolBalance = useMemo(
    () => (snapshot ? sumSelectedPoolBalances(snapshot.routes, selected) : 0),
    [snapshot, selected],
  );

  const totalNegative = totalPoolBalance < 0;
  const totalNonNegative = totalPoolBalance >= 0;
  const canCreate = totalNonNegative && selected.size > 0 && !submitting;

  async function verifyAndCreate() {
    setSubmitError(null);
    setSuccessMessage(null);
    if (!canCreate) return;
    setSubmitting(true);
    try {
      const res = await poolsPort.createPool({
        name: poolName.trim() || 'Pool',
        reportingYear: year,
        memberRouteIds: [...selected],
      });
      setSuccessMessage(`Pool saved: ${res.pool.id} (${res.pool.members.length} members).`);
      setSelected(new Set());
      await load();
    } catch (e) {
      setSubmitError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const individualRows = snapshot?.routes.filter((r) => selected.has(r.routeId)) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Article 21 — Pooling</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Load routes via{' '}
            <span className="text-varuna-teal-400/90">GET /compliance/cb?year=</span>, select voyages to
            pool, and persist with <span className="text-varuna-cyan-400/90">POST /pools</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="pool-year" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Year
            </label>
            <select
              id="pool-year"
              className="mt-1 rounded-lg border border-varuna-navy-700 bg-varuna-navy-900/90 px-3 py-2 text-sm text-slate-100 outline-none ring-varuna-teal-500/40 focus:ring-2"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-varuna-cyan-500/40 bg-varuna-cyan-500/10 px-4 py-2 text-sm font-medium text-varuna-cyan-300 transition hover:bg-varuna-cyan-500/20"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-400" role="status">
          Loading routes and balances…
        </p>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      )}

      {!loading && snapshot && (
        <>
          <div
            className={`rounded-2xl border px-5 py-4 shadow-varuna-glow ${
              totalNegative
                ? 'border-red-500/40 bg-red-950/20'
                : 'border-varuna-teal-500/35 bg-varuna-teal-500/5'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total pool balance (live)
            </p>
            <p
              className={`mt-1 font-mono text-3xl font-semibold tracking-tight ${
                totalNegative ? 'text-red-400' : 'text-varuna-teal-400'
              }`}
            >
              {formatBalance(totalPoolBalance)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {totalNegative ? (
                <span className="text-red-300/90">Sum &lt; 0 — deficit (red). Pool creation locked.</span>
              ) : (
                <span className="text-varuna-teal-300/90">
                  Sum ≥ 0 — surplus or balanced (teal). You can verify &amp; create.
                </span>
              )}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30 p-5">
              <h3 className="text-sm font-semibold text-varuna-teal-300">Individual balance</h3>
              <p className="mt-1 text-xs text-slate-500">Sum of selected route CBs (MJ-weighted)</p>
              <p
                className={`mt-3 font-mono text-2xl ${totalNegative ? 'text-red-400' : 'text-varuna-teal-400'}`}
              >
                {selected.size === 0 ? '—' : formatBalance(totalPoolBalance)}
              </p>
              {individualRows.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-varuna-navy-800 pt-4 text-sm">
                  {individualRows.map((r) => (
                    <li
                      key={r.routeId}
                      className="flex justify-between gap-2 text-slate-300"
                    >
                      <span className="truncate">
                        <span className="text-slate-500">{r.vesselId}</span>{' '}
                        <span className="text-white">{routeNames.get(r.routeId) ?? r.routeId}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs">{formatBalance(r.complianceBalanceMjWeighted)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30 p-5">
              <h3 className="text-sm font-semibold text-varuna-cyan-300">After pooling balance</h3>
              <p className="mt-1 text-xs text-slate-500">
                Under a uniform ceiling for {year}, the pooled MJ-weighted gap equals the sum of members —
                Article 21 compliance is enforced separately via pooled intensity on save.
              </p>
              <p
                className={`mt-3 font-mono text-2xl ${totalNegative ? 'text-red-400' : 'text-varuna-teal-400'}`}
              >
                {selected.size === 0 ? '—' : formatBalance(totalPoolBalance)}
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30 p-5 shadow-varuna-glow">
            <h3 className="text-sm font-semibold text-white">Select routes</h3>
            <p className="mt-1 text-xs text-slate-500">Multi-select voyages for the pool ({year})</p>
            <ul className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {snapshot.routes.map((r) => {
                const checked = selected.has(r.routeId);
                return (
                  <li key={r.routeId}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-varuna-navy-800 bg-varuna-navy-950/40 px-3 py-2.5 transition hover:border-varuna-teal-500/30 hover:bg-varuna-navy-800/40">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-varuna-navy-600 bg-varuna-navy-900 text-varuna-teal-500 focus:ring-varuna-teal-500/50"
                        checked={checked}
                        onChange={() => toggle(r.routeId)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white">{routeNames.get(r.routeId) ?? r.routeId}</div>
                        <div className="text-xs text-slate-500">
                          {r.routeId} · {r.vesselId}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-sm ${
                          r.complianceBalanceMjWeighted < 0 ? 'text-varuna-teal-400' : 'text-red-400'
                        }`}
                      >
                        {formatBalance(r.complianceBalanceMjWeighted)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="pool-name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pool name
              </label>
              <input
                id="pool-name"
                type="text"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-varuna-navy-700 bg-varuna-navy-950 px-3 py-2 text-sm text-white outline-none ring-varuna-teal-500/40 focus:ring-2"
              />
            </div>
            <button
              type="button"
              disabled={!canCreate}
              onClick={() => void verifyAndCreate()}
              className="rounded-lg bg-gradient-to-r from-varuna-teal-500/90 to-varuna-cyan-500/85 px-6 py-2.5 text-sm font-semibold text-varuna-navy-950 shadow-md transition enabled:hover:from-varuna-teal-400 enabled:hover:to-varuna-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Saving…' : 'Verify & create pool'}
            </button>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
              {submitError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-varuna-teal-500/40 bg-varuna-navy-900/80 px-4 py-3 text-sm text-varuna-teal-200" role="status">
              {successMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}
