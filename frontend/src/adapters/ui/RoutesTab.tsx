import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MaritimeRoute } from '@core/domain/route';
import { kpiValue, totalEnergyMj, weightedIntensityGco2ePerMj } from '@core/application/ghg';
import type { VoyageRoutesPort } from '@core/ports/voyage-routes.port';
import { TARGET_INTENSITY_GCO2E_PER_MJ } from '@shared/constants';

type Props = {
  routesPort: VoyageRoutesPort;
};

function formatMj(mj: number): string {
  if (mj >= 1_000_000) return `${(mj / 1_000_000).toFixed(2)}M`;
  if (mj >= 1_000) return `${(mj / 1_000).toFixed(1)}k`;
  return mj.toFixed(0);
}

function liftFuelLabel(intensity: number): string {
  return `${intensity} gCO₂e/MJ`;
}

export function RoutesTab({ routesPort }: Props) {
  const [routes, setRoutes] = useState<MaritimeRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vessel, setVessel] = useState<string>('');
  const [fuelIntensity, setFuelIntensity] = useState<string>('');
  const [year, setYear] = useState<string>('');

  const [baselineRoute, setBaselineRoute] = useState<MaritimeRoute | null>(null);
  const [baselineInput, setBaselineInput] = useState('');
  const [baselineSaving, setBaselineSaving] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routesPort.listRoutes();
      setRoutes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, [routesPort]);

  useEffect(() => {
    void load();
  }, [load]);

  const vesselOptions = useMemo(() => {
    const s = new Set(routes.map((r) => r.vesselId));
    return [...s].sort();
  }, [routes]);

  const yearOptions = useMemo(() => {
    const s = new Set(routes.map((r) => r.reportingYear));
    return [...s].sort((a, b) => b - a);
  }, [routes]);

  const fuelOptions = useMemo(() => {
    const s = new Set<number>();
    for (const r of routes) {
      for (const l of r.lifts) {
        s.add(l.ghgIntensityGco2ePerMj);
      }
    }
    return [...s].sort((a, b) => a - b);
  }, [routes]);

  const filtered = useMemo(() => {
    return routes.filter((r) => {
      if (vessel && r.vesselId !== vessel) return false;
      if (year && String(r.reportingYear) !== year) return false;
      if (fuelIntensity) {
        const v = Number(fuelIntensity);
        if (!r.lifts.some((l) => l.ghgIntensityGco2ePerMj === v)) return false;
      }
      return true;
    });
  }, [routes, vessel, year, fuelIntensity]);

  async function submitBaseline() {
    if (!baselineRoute) return;
    const v = Number(baselineInput);
    if (!Number.isFinite(v) || v <= 0) {
      setBaselineError('Enter a positive baseline (gCO₂e/MJ)');
      return;
    }
    setBaselineSaving(true);
    setBaselineError(null);
    try {
      await routesPort.setBaseline(baselineRoute.id, v);
      setBaselineRoute(null);
      setBaselineInput('');
      await load();
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String((e as { response?: { data?: { error?: string } } }).response?.data?.error)
          : null;
      setBaselineError(msg || (e instanceof Error ? e.message : 'Baseline update failed'));
    } finally {
      setBaselineSaving(false);
    }
  }

  const selectClass =
    'rounded-lg border border-varuna-navy-700 bg-varuna-navy-900/90 px-3 py-2 text-sm text-slate-100 outline-none ring-varuna-teal-500/40 focus:ring-2';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/40 p-4 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-1 flex-col gap-1 min-w-[140px]">
          <label htmlFor="filter-vessel" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Vessel
          </label>
          <select
            id="filter-vessel"
            className={selectClass}
            value={vessel}
            onChange={(e) => setVessel(e.target.value)}
          >
            <option value="">All vessels</option>
            {vesselOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-[160px]">
          <label htmlFor="filter-fuel" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Fuel (lift intensity)
          </label>
          <select
            id="filter-fuel"
            className={selectClass}
            value={fuelIntensity}
            onChange={(e) => setFuelIntensity(e.target.value)}
          >
            <option value="">All fuels</option>
            {fuelOptions.map((f) => (
              <option key={f} value={String(f)}>
                {liftFuelLabel(f)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-[120px]">
          <label htmlFor="filter-year" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Year
          </label>
          <select
            id="filter-year"
            className={selectClass}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All years</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
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

      {loading && (
        <p className="text-sm text-slate-400" role="status">
          Loading routes…
        </p>
      )}
      {error && (
        <div
          className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30 shadow-varuna-glow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-varuna-navy-700/80 bg-varuna-navy-950/60 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Vessel</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Energy (MJ)</th>
                  <th className="px-4 py-3 font-medium">WtW intensity</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">R003 gap</th>
                  <th className="px-4 py-3 font-medium">Baseline</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const achieved = kpiValue(r, 'R002') ?? weightedIntensityGco2ePerMj(r);
                  const gap = kpiValue(r, 'R003');
                  const overTarget = achieved > TARGET_INTENSITY_GCO2E_PER_MJ;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-varuna-navy-800/60 transition hover:bg-varuna-navy-800/30"
                    >
                      <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                      <td className="px-4 py-3 text-slate-300">{r.vesselId}</td>
                      <td className="px-4 py-3 text-slate-400">{r.reportingYear}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{formatMj(totalEnergyMj(r))}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono ${overTarget ? 'text-amber-300' : 'text-varuna-teal-300'}`}
                        >
                          {achieved.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {TARGET_INTENSITY_GCO2E_PER_MJ}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {gap !== undefined ? gap.toFixed(4) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {r.baselineGco2ePerMj?.toFixed(4) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setBaselineRoute(r);
                            setBaselineInput(
                              r.baselineGco2ePerMj != null
                                ? String(r.baselineGco2ePerMj)
                                : achieved.toFixed(4),
                            );
                            setBaselineError(null);
                          }}
                          className="rounded-lg bg-gradient-to-r from-varuna-teal-500/90 to-varuna-cyan-500/85 px-3 py-1.5 text-xs font-semibold text-varuna-navy-950 shadow-md transition hover:from-varuna-teal-400 hover:to-varuna-cyan-400"
                        >
                          Set baseline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No routes match the filters.</p>
          )}
        </div>
      )}

      {baselineRoute && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="baseline-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-varuna-navy-600 bg-varuna-navy-900 p-6 shadow-varuna-glow">
            <h2 id="baseline-title" className="text-lg font-semibold text-white">
              Set baseline
            </h2>
            <p className="mt-1 text-sm text-slate-400">{baselineRoute.name}</p>
            <label htmlFor="baseline-value" className="mt-4 block text-xs font-medium text-slate-500">
              Baseline intensity (gCO₂e/MJ)
            </label>
            <input
              id="baseline-value"
              type="number"
              step="0.0001"
              value={baselineInput}
              onChange={(e) => setBaselineInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-varuna-navy-700 bg-varuna-navy-950 px-3 py-2 font-mono text-sm text-white outline-none ring-varuna-teal-500/40 focus:ring-2"
            />
            {baselineError && (
              <p className="mt-2 text-sm text-red-300" role="alert">
                {baselineError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBaselineRoute(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-varuna-navy-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={baselineSaving}
                onClick={() => void submitBaseline()}
                className="rounded-lg bg-varuna-teal-500 px-4 py-2 text-sm font-semibold text-varuna-navy-950 disabled:opacity-50"
              >
                {baselineSaving ? 'Saving…' : 'Save baseline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
