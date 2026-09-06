'use client';

import { formatCompact } from '@/lib/athletePerformanceTypes';

/** Sticky live totals under the workout header. Today vs all-time. Volume and Effective. */
export default function SessionTotalsBar({
  sessionLbs,
  sessionEffort,
  sessionReps,
  allTimeVolume,
  allTimeEffective,
}: {
  sessionLbs: number;
  sessionEffort: number;
  sessionReps: number;
  allTimeVolume: number;
  allTimeEffective: number;
}) {
  return (
    <div className="border-t border-white/10 bg-black/35">
      <div className="container mx-auto space-y-0.5 px-4 py-1.5 text-sm">
        <p className="flex flex-wrap items-baseline justify-center gap-x-3">
          <span className="font-semibold text-[#f6f1e3]/55">Today</span>
          <span>
            <span className="font-semibold" style={{ color: '#2f8f8a' }}>
              Volume
            </span>{' '}
            <span className="font-black text-white">{formatCompact(sessionLbs)}</span>
          </span>
          <span>
            <span className="font-semibold" style={{ color: '#c45d7a' }}>
              Effective
            </span>{' '}
            <span className="font-black text-white">{formatCompact(sessionEffort)}</span>
          </span>
          {sessionReps > 0 ? (
            <span className="text-[#f6f1e3]/70">{formatCompact(sessionReps)} reps</span>
          ) : null}
        </p>
        <p className="flex flex-wrap items-baseline justify-center gap-x-3 text-[#f6f1e3]/70">
          <span className="font-semibold text-[#f6f1e3]/55">All-time</span>
          <span>
            Volume <span className="font-black text-white">{formatCompact(allTimeVolume)}</span>
          </span>
          <span>
            Effective <span className="font-black text-white">{formatCompact(allTimeEffective)}</span>
          </span>
        </p>
      </div>
    </div>
  );
}
