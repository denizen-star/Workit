'use client';

import { Suspense } from 'react';
import PerformanceDesk from '@/components/PerformanceDesk';
import YouPageShell from '@/components/YouPageShell';
import BodyWeightChart from '@/components/BodyWeightChart';
import { HomeFold } from '@/components/ScanCard';

export default function PerformancePage() {
  return (
    <YouPageShell title="Your performance">
      <Suspense fallback={<p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>}>
        <PerformanceDesk variant="page" />
      </Suspense>
      {/* Private: only you (and Kevin, in Admin) see this — never a house board. */}
      <div className="mt-6">
        <HomeFold title="Body weight" trailing="Only you and Kevin">
          <BodyWeightChart />
        </HomeFold>
      </div>
    </YouPageShell>
  );
}
