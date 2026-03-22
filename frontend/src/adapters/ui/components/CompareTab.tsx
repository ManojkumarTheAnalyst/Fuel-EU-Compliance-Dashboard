import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RouteComparisonPort } from '@core/ports/route-comparison.port';
import type { RouteComparisonSnapshot } from '@core/domain/route-comparison';
import { percentageDifferenceFromBaseline } from '@core/application/percentage-difference';
import { TARGET_INTENSITY_GCO2E_PER_MJ } from '@shared/constants';

type Props = {
  comparisonPort: RouteComparisonPort;
};

type ChartRow = {
  label: string;
  routeId: string;
  routeName: string;
  intensity: number;
  target: number;
  pctDifference: number | null;
  compliant: boolean;
};

/** Varuna teal-500 — compliant bars */
const CHART_TEAL = '#2dd4bf';
const CHART_RED = '#ef4444';
const CHART_TARGET_LINE = '#22d3ee';
const CHART_GRID = 'rgba(148, 163, 184, 0.15)';

function shortLabel(routeId: string): string {
  return routeId.replace(/^route-/, 'R');
}

export function CompareTab({ comparisonPort }: Props) {
  const [snapshot, setSnapshot] = useState<RouteComparisonSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await comparisonPort.getRouteComparison();
      setSnapshot(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }, [comparisonPort]);

  useEffect(() => {
    void load();
  }, [load]);

  const target = snapshot?.targetGco2ePerMj ?? TARGET_INTENSITY_GCO2E_PER_MJ;

  const chartData: ChartRow[] = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.routes.map((r) => {
      const intensity = r.ghgIntensityGco2ePerMj;
      const baseline = snapshot.targetGco2ePerMj;
      const pctDifference = percentageDifferenceFromBaseline(intensity, baseline);
      const compliant = intensity <= baseline;
      return {
        label: shortLabel(r.routeId),
        routeId: r.routeId,
        routeName: r.routeName,
        intensity,
        target: baseline,
        pctDifference,
        compliant,
      };
    });
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Compare intensity vs target</h2>
          <p className="mt-1 text-sm text-slate-400">
            GHG intensity from <span className="text-varuna-teal-400/90">GET /routes/comparison</span> vs
            target{' '}
            <span className="font-mono text-varuna-cyan-300">{target}</span> gCO₂e/MJ. Bars:{' '}
            <span className="text-varuna-teal-400">teal</span> when compliant,{' '}
            <span className="text-red-400">red</span> when in breach.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="self-start rounded-lg border border-varuna-cyan-500/40 bg-varuna-cyan-500/10 px-4 py-2 text-sm font-medium text-varuna-cyan-300 transition hover:bg-varuna-cyan-500/20"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-sm text-slate-400" role="status">
          Loading comparison…
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

      {!loading && !error && snapshot && (
        <>
          <div className="rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30 p-4 shadow-varuna-glow sm:p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500">
              GHG intensity vs target (bar chart)
            </p>
            <div className="h-[320px] w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: CHART_GRID }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: 'gCO₂e/MJ',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#64748b',
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine
                    y={target}
                    stroke={CHART_TARGET_LINE}
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    label={{
                      value: `Target ${target}`,
                      fill: CHART_TARGET_LINE,
                      fontSize: 11,
                      position: 'insideTopRight',
                    }}
                  />
                  <Tooltip
                    content={<CompareTooltip baselineTarget={target} />}
                    cursor={{ fill: 'rgba(45, 212, 191, 0.06)' }}
                  />
                  <Bar dataKey="intensity" name="GHG intensity" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {chartData.map((entry) => (
                      <Cell key={entry.routeId} fill={entry.compliant ? CHART_TEAL : CHART_RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-varuna-navy-700/80 bg-varuna-navy-950/60 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium text-right">Intensity</th>
                  <th className="px-4 py-3 font-medium text-right">% difference</th>
                  <th className="px-4 py-3 font-medium">Compliance status</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr
                    key={row.routeId}
                    className="border-b border-varuna-navy-800/60 hover:bg-varuna-navy-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{row.routeName}</div>
                      <div className="font-mono text-xs text-slate-500">{row.routeId}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">
                      {row.intensity.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {row.pctDifference != null
                        ? `${row.pctDifference >= 0 ? '+' : ''}${row.pctDifference.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.compliant ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-varuna-teal-400">
                          <span aria-hidden>✅</span> Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-red-400">
                          <span aria-hidden>❌</span> Breach
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  baselineTarget: number;
};

function CompareTooltip({ active, payload, baselineTarget }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const pct = percentageDifferenceFromBaseline(row.intensity, baselineTarget);

  return (
    <div className="rounded-lg border border-varuna-navy-600 bg-varuna-navy-950/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="font-semibold text-white">{row.routeName}</p>
      <p className="text-slate-500">{row.routeId}</p>
      <p className="mt-1 text-varuna-teal-300">
        Intensity: <span className="font-mono">{row.intensity.toFixed(4)}</span> gCO₂e/MJ
      </p>
      <p className="text-slate-400">
        Target: <span className="font-mono">{baselineTarget}</span>
      </p>
      {pct != null && (
        <p className="mt-1 text-slate-300">
          % difference:{' '}
          <span className="font-mono">
            {pct >= 0 ? '+' : ''}
            {pct.toFixed(2)}%
          </span>
        </p>
      )}
      <p className="mt-1">{row.compliant ? '✅ Compliant' : '❌ Breach'}</p>
    </div>
  );
}
