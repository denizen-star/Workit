'use client';

import AthletePerformance from '@/components/AthletePerformance';
import FlagStrip from '@/components/FlagStrip';
import YouPageShell from '@/components/YouPageShell';

export default function PerformancePage() {
  return (
    <YouPageShell title="Your performance">
      <div className="mb-6">
        <FlagStrip />
      </div>
      <AthletePerformance variant="page" />
    </YouPageShell>
  );
}
