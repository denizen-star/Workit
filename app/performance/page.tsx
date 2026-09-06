'use client';

import { Suspense } from 'react';
import PerformanceDesk from '@/components/PerformanceDesk';
import YouPageShell from '@/components/YouPageShell';

export default function PerformancePage() {
  return (
    <YouPageShell title="Your performance">
      <Suspense fallback={<p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>}>
        <PerformanceDesk variant="page" />
      </Suspense>
    </YouPageShell>
  );
}
