import { useState } from 'react';
import { DashboardLayout, type DashboardTab } from './adapters/ui/DashboardLayout';
import { RoutesTab } from './adapters/ui/RoutesTab';
import { CompareTab } from './adapters/ui/components/CompareTab';
import { voyageRoutesApi } from './adapters/infrastructure/voyage-routes.adapter';
import { routeComparisonApi } from './adapters/infrastructure/route-comparison.adapter';
import { complianceApi } from './adapters/infrastructure/compliance.adapter';
import { bankingApi } from './adapters/infrastructure/banking.adapter';
import { BankingTab } from './adapters/ui/components/BankingTab';
import { PoolingTab } from './adapters/ui/components/PoolingTab';
import { poolingBalancesApi } from './adapters/infrastructure/pooling-balances.adapter';
import { poolManagementApi } from './adapters/infrastructure/pool-management.adapter';

export default function App() {
  const [tab, setTab] = useState<DashboardTab>('routes');

  return (
    <DashboardLayout active={tab} onTabChange={setTab}>
      <div className={tab === 'routes' ? 'block' : 'hidden'}>
        <RoutesTab routesPort={voyageRoutesApi} />
      </div>
      <div className={tab === 'compare' ? 'block' : 'hidden'}>
        <CompareTab comparisonPort={routeComparisonApi} />
      </div>
      <div className={tab === 'banking' ? 'block' : 'hidden'}>
        <BankingTab compliancePort={complianceApi} bankingPort={bankingApi} />
      </div>
      <div className={tab === 'pooling' ? 'block' : 'hidden'}>
        <PoolingTab
          balancesPort={poolingBalancesApi}
          routesPort={voyageRoutesApi}
          poolsPort={poolManagementApi}
        />
      </div>
    </DashboardLayout>
  );
}
