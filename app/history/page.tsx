'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CompletedLog from '@/components/CompletedLog';
import YouPageShell from '@/components/YouPageShell';

function HistoryPageInner() {
  const searchParams = useSearchParams();
  const focusWeek = Number(searchParams.get('week') || '') || null;
  const focusDay = Number(searchParams.get('day') || '') || null;

  return (
    <YouPageShell title="Completed">
      <CompletedLog focusWeek={focusWeek} focusDay={focusDay} />
    </YouPageShell>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-2xl font-black text-[#e8c547]">
          Loading...
        </div>
      }
    >
      <HistoryPageInner />
    </Suspense>
  );
}
