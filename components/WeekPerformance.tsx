'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { AthletePerformanceBoard } from '@/lib/athletePerformanceTypes';
import { weekPerformanceCounts, weekPerformanceKpis, type WeekKpi } from '@/lib/weekPerformance';
import type { WeekPlan } from '@/lib/workoutData';

const EMPTY = weekPerformanceKpis({
  compared: 0,
  loadUp: 0,
  repsUp: 0,
  loadDown: 0,
  repsDown: 0,
});

function KpiTile({ kpi }: { kpi: WeekKpi }) {
  return (
    <div
      className={`flex-1 rounded-2xl px-1.5 py-5 text-center ${
        kpi.state === 'done'
          ? 'border border-[#e8c547] bg-[#e8c547] text-[#1a1404]'
          : kpi.state === 'now'
            ? 'border-2 border-[#e8c547] bg-[#e8c547]/10'
            : 'border border-dashed border-white/15 bg-transparent'
      }`}
    >
      <p
        className={`text-base font-semibold ${
          kpi.state === 'done' ? 'text-[#1a1404]' : kpi.state === 'now' ? 'text-white' : 'text-[#f6f1e3]/50'
        }`}
      >
        {kpi.label}
      </p>
      <p
        className={`mt-1 inline-flex items-center justify-center gap-1 text-base font-black ${
          kpi.state === 'done'
            ? 'text-[#1a1404]'
            : kpi.state === 'now'
              ? 'text-[#e8c547]'
              : 'text-[#f6f1e3]/40'
        }`}
      >
        {kpi.state === 'done' ? (
          <>
            <Check className="h-4 w-4" strokeWidth={3} />
            {kpi.status}
          </>
        ) : (
          kpi.status
        )}
      </p>
    </div>
  );
}

/** Four cues for this program week vs last time. Same chrome as the week lock. */
export default function WeekPerformance({ week }: { week: WeekPlan | null }) {
  const [board, setBoard] = useState<AthletePerformanceBoard | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/athlete-performance?period=15')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && !data.hidden) {
          setBoard(data as AthletePerformanceBoard);
        }
      })
      .catch(() => {
        if (!cancelled) setBoard(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    if (!week || !board) return null;
    return weekPerformanceCounts(board.workouts || [], week.weekNumber);
  }, [board, week]);

  const kpis = counts ? weekPerformanceKpis(counts) : EMPTY;
  const compared = counts?.compared ?? 0;
  const filled = kpis.filter((kpi) => kpi.state === 'done').length;

  if (!week) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between text-base">
        <p className="font-semibold text-white">
          {compared === 0
            ? 'No lift vs last time yet'
            : `${compared} lift${compared === 1 ? '' : 's'} vs last time`}
        </p>
        <p className="text-[#f6f1e3]/60">More load. Fewer drops.</p>
      </div>
      <div className="mb-4 flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-2.5 flex-1 rounded-full ${index < filled ? 'bg-[#e8c547]' : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        {kpis.map((kpi) => (
          <KpiTile key={kpi.key} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}
