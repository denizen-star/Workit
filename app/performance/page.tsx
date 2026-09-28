'use client';

import { Suspense } from 'react';
import PerformanceDesk from '@/components/PerformanceDesk';
import YouPageShell from '@/components/YouPageShell';
import BodyWeightHistory from '@/components/BodyWeightHistory';
import { HomeFold } from '@/components/ScanCard';

export default function PerformancePage() {
  return (
    <YouPageShell title="Your performance">
      {/* Top of the page so weigh-ins are easy to find. Private: only you (and Kevin,
          in Admin) see this — never a house board. */}
      <div className="mb-6">
        <HomeFold title="Body weight" trailing="Weigh-ins & graph">
          <BodyWeightHistory />
        </HomeFold>
      </div>
      <Suspense fallback={<p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>}>
        <PerformanceDesk variant="page" />
      </Suspense>
    </YouPageShell>
  );
}
