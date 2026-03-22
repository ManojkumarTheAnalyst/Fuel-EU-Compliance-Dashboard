import type { ReactNode } from 'react';

export type DashboardTab = 'routes' | 'compare' | 'banking' | 'pooling';

const tabs: { id: DashboardTab; label: string }[] = [
  { id: 'routes', label: 'Routes' },
  { id: 'compare', label: 'Compare' },
  { id: 'banking', label: 'Banking' },
  { id: 'pooling', label: 'Pooling' },
];

type Props = {
  active: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: ReactNode;
};

export function DashboardLayout({ active, onTabChange, children }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col gap-6 border-b border-varuna-navy-700/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-varuna-teal-400/90">
            Varuna Marine
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Fuel EU Compliance
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Monitor routes, intensity against the regulatory target, banking, and pooling — wired to
            your compliance API.
          </p>
        </div>
        <div
          className="inline-flex rounded-xl border border-varuna-navy-700/80 bg-varuna-navy-900/80 p-1 shadow-varuna-glow backdrop-blur-sm"
          role="tablist"
          aria-label="Dashboard sections"
        >
          {tabs.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-varuna-teal-500/20 to-varuna-cyan-500/15 text-varuna-teal-300 shadow-inner ring-1 ring-varuna-teal-500/30'
                    : 'text-slate-400 hover:bg-varuna-navy-800/50 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t border-varuna-navy-800/80 pt-6 text-center text-xs text-slate-500">
        Varuna Marine · Fuel EU Maritime dashboard
      </footer>
    </div>
  );
}
