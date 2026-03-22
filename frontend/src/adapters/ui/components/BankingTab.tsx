import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CompliancePort } from '@core/ports/compliance.port';
import type { BankingPort } from '@core/ports/banking.port';
import type { ComplianceBalanceSnapshot } from '@core/domain/compliance';
import { getApiErrorMessage } from '@shared/api-error';

type Props = {
  compliancePort: CompliancePort;
  bankingPort: BankingPort;
};

type KpiStrip = {
  cb_before: number;
  applied: number;
  cb_after: number;
};

const YEAR_OPTIONS = [2024, 2025] as const;

export function BankingTab({ compliancePort, bankingPort }: Props) {
  const [year, setYear] = useState<number>(2024);
  const [snapshot, setSnapshot] = useState<ComplianceBalanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [kpiStrip, setKpiStrip] = useState<KpiStrip | null>(null);

  const [bankRouteId, setBankRouteId] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [applyRouteId, setApplyRouteId] = useState('');
  const [applyAmount, setApplyAmount] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [bankPending, setBankPending] = useState(false);
  const [applyPending, setApplyPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await compliancePort.getComplianceBalance(year);
      setSnapshot(data);
    } catch (e) {
      setFetchError(getApiErrorMessage(e));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [compliancePort, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const aggregateCb = snapshot?.aggregateComplianceBalanceMjWeighted ?? 0;

  const surplusRoutes = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.routes.filter((r) => r.complianceBalanceMjWeighted < 0);
  }, [snapshot]);

  const deficitRoutes = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.routes.filter((r) => r.complianceBalanceMjWeighted > 0);
  }, [snapshot]);

  const actionsDisabled = aggregateCb <= 0;

  async function onBankSurplus() {
    setActionError(null);
    if (!bankRouteId) {
      setActionError('Choose a route with surplus to bank.');
      return;
    }
    const amount = Number(bankAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a positive amount to bank.');
      return;
    }
    setBankPending(true);
    try {
      const res = await bankingPort.bankSurplus({
        routeId: bankRouteId,
        amountMjEquivalent: amount,
        year,
      });
      setKpiStrip({
        cb_before: res.cb_before,
        applied: res.applied,
        cb_after: res.cb_after,
      });
      await load();
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setBankPending(false);
    }
  }

  async function onApplyBanked() {
    setActionError(null);
    if (!applyRouteId) {
      setActionError('Choose a deficit route to apply banked surplus to.');
      return;
    }
    const amount = Number(applyAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a positive amount to apply.');
      return;
    }
    setApplyPending(true);
    try {
      const res = await bankingPort.applyBanked({
        routeId: applyRouteId,
        appliedMjEquivalent: amount,
        year,
      });
      setKpiStrip({
        cb_before: res.cb_before,
        applied: res.applied,
        cb_after: res.cb_after,
      });
      await load();
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setApplyPending(false);
    }
  }

  function formatCb(n: number): string {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Article 20 — Banking</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Compliance balance uses GET <span className="text-varuna-teal-400/90">/compliance/cb?year=</span>.
            Bank surplus on compliant routes; apply banked amounts to deficit routes on the same vessel/year.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="banking-year" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Year
            </label>
            <select
              id="banking-year"
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
            Refresh CB
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-400" role="status">
          Loading compliance balance…
        </p>
      )}
      {fetchError && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
          {fetchError}
        </div>
      )}

      {!loading && snapshot && (
        <>
          <div className="rounded-xl border border-varuna-navy-700/80 bg-varuna-navy-900/40 px-4 py-3 text-sm text-slate-300">
            <span className="text-slate-500">Effective aggregate CB ({year}): </span>
            <span className="font-mono text-varuna-teal-300">{formatCb(aggregateCb)}</span>
            <span className="text-slate-500"> · </span>
            <span className="text-slate-500">
              Positive = net deficit; banking/apply actions are disabled when aggregate ≤ 0.
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="cb_before"
              value={kpiStrip != null ? formatCb(kpiStrip.cb_before) : '—'}
              hint="Before last bank/apply"
            />
            <KpiCard
              title="applied"
              value={kpiStrip != null ? formatCb(kpiStrip.applied) : '—'}
              hint="Amount banked or applied"
            />
            <KpiCard
              title="cb_after"
              value={kpiStrip != null ? formatCb(kpiStrip.cb_after) : '—'}
              hint="After last bank/apply"
            />
          </div>

          {actionError && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100" role="alert">
              {actionError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30 p-5 shadow-varuna-glow">
              <h3 className="text-sm font-semibold text-varuna-teal-300">Bank surplus</h3>
              <p className="mt-1 text-xs text-slate-500">POST /banking/bank</p>
              <div className="mt-4 space-y-3">
                <label className="block text-xs text-slate-500">Route (surplus)</label>
                <select
                  className="w-full rounded-lg border border-varuna-navy-700 bg-varuna-navy-950 px-3 py-2 text-sm text-slate-100 outline-none ring-varuna-teal-500/40 focus:ring-2"
                  value={bankRouteId}
                  onChange={(e) => setBankRouteId(e.target.value)}
                  disabled={actionsDisabled}
                >
                  <option value="">Select route…</option>
                  {surplusRoutes.map((r) => (
                    <option key={r.routeId} value={r.routeId}>
                      {r.routeId} ({r.vesselId}) · CB {formatCb(r.complianceBalanceMjWeighted)}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-slate-500">Amount (MJ-equivalent)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="w-full rounded-lg border border-varuna-navy-700 bg-varuna-navy-950 px-3 py-2 font-mono text-sm text-white outline-none ring-varuna-teal-500/40 focus:ring-2"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  disabled={actionsDisabled}
                  placeholder="e.g. 1e6"
                />
              </div>
              <button
                type="button"
                disabled={actionsDisabled || bankPending}
                onClick={() => void onBankSurplus()}
                className="mt-5 w-full rounded-lg bg-gradient-to-r from-varuna-teal-500/90 to-varuna-cyan-500/85 py-2.5 text-sm font-semibold text-varuna-navy-950 shadow-md transition enabled:hover:from-varuna-teal-400 enabled:hover:to-varuna-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bankPending ? 'Banking…' : 'Bank surplus'}
              </button>
            </section>

            <section className="rounded-2xl border border-varuna-navy-700/80 bg-varuna-navy-900/30 p-5 shadow-varuna-glow">
              <h3 className="text-sm font-semibold text-varuna-cyan-300">Apply banked</h3>
              <p className="mt-1 text-xs text-slate-500">POST /banking/apply · same vessel & year as the banked credits</p>
              <div className="mt-4 space-y-3">
                <label className="block text-xs text-slate-500">Route (deficit)</label>
                <select
                  className="w-full rounded-lg border border-varuna-navy-700 bg-varuna-navy-950 px-3 py-2 text-sm text-slate-100 outline-none ring-varuna-teal-500/40 focus:ring-2"
                  value={applyRouteId}
                  onChange={(e) => setApplyRouteId(e.target.value)}
                  disabled={actionsDisabled}
                >
                  <option value="">Select route…</option>
                  {deficitRoutes.map((r) => (
                    <option key={r.routeId} value={r.routeId}>
                      {r.routeId} ({r.vesselId}) · CB {formatCb(r.complianceBalanceMjWeighted)}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-slate-500">Amount to apply</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="w-full rounded-lg border border-varuna-navy-700 bg-varuna-navy-950 px-3 py-2 font-mono text-sm text-white outline-none ring-varuna-teal-500/40 focus:ring-2"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  disabled={actionsDisabled}
                  placeholder="e.g. 1e6"
                />
              </div>
              <button
                type="button"
                disabled={actionsDisabled || applyPending}
                onClick={() => void onApplyBanked()}
                className="mt-5 w-full rounded-lg border border-varuna-cyan-500/50 bg-varuna-cyan-500/10 py-2.5 text-sm font-semibold text-varuna-cyan-200 transition enabled:hover:bg-varuna-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {applyPending ? 'Applying…' : 'Apply banked'}
              </button>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-varuna-navy-700/80 bg-varuna-navy-950/50 px-4 py-4">
      <p className="font-mono text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 font-mono text-xl text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
