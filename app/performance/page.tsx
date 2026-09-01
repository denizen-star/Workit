'use client';

import AthletePerformance from '@/components/AthletePerformance';
import YouPageShell from '@/components/YouPageShell';

export default function PerformancePage() {
  return (
    <YouPageShell title="Your performance">
      <AthletePerformance variant="page" />
    </YouPageShell>
  );
}
