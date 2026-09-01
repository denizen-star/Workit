'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Flag } from 'lucide-react';
import { type PerformanceFlags, type PerformancePeriod } from '@/lib/athletePerformanceTypes';
import { performanceFlagsForSessions } from '@/lib/performanceFlags';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';

function Flags({ flags }: { flags: PerformanceFlags }) {
  if (flags.bonusDays === 0 && flags.warmups === 0 && flags.cooldowns === 0 && flags.optionalWeeks === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap items-start gap-x-8 gap-y-3 text-base">
      {flags.bonusDays > 0 && (
        <p className="inline-flex items-start gap-2.5 text-[#f6f1e3]/80">
          <Flag className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c547]" />
          <span>
            <span className="text-base font-black uppercase tracking-[0.14em] text-[#6d8b6e]">
              Bonus done
            </span>
            <span className="mt-1 block font-semibold text-white">
              {flags.bonusDays} bonus {flags.bonusDays === 1 ? 'day' : 'days'}
            </span>
          </span>
        </p>
      )}
      <p className="inline-flex items-start gap-2.5 text-[#f6f1e3]/80">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c547]" />
        <span>
          <span className="text-base font-black uppercase tracking-[0.14em] text-[#e8c547]">
            Optional
          </span>
          <span className="mt-1 block font-semibold text-white">
            {flags.warmups} warmup · {flags.cooldowns} cooldown
          </span>
          <span className="block text-base text-[#f6f1e3]/60">
            {flags.optionalWeeks} optional {flags.optionalWeeks === 1 ? 'week' : 'weeks'}
          </span>
        </span>
      </p>
    </div>
  );
}

/** Bonus + optional flags. Lives at the bottom of Your performance. */
export default function FlagStrip({
  sessions: sessionsProp,
  period = 'all',
  flags: flagsProp,
}: {
  sessions?: WorkoutSessionRow[];
  period?: PerformancePeriod;
  flags?: PerformanceFlags | null;
}) {
  const [sessions, setSessions] = useState<WorkoutSessionRow[] | null>(sessionsProp || null);

  useEffect(() => {
    if (flagsProp) return;
    if (sessionsProp) {
      setSessions(sessionsProp);
      return;
    }
    let cancelled = false;
    fetch('/api/sessions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setSessions((data?.sessions || []) as WorkoutSessionRow[]);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [flagsProp, sessionsProp]);

  const flags = useMemo(() => {
    if (flagsProp) return flagsProp;
    if (!sessions) return null;
    return performanceFlagsForSessions(sessions, period);
  }, [flagsProp, period, sessions]);

  if (!flags) return null;
  return <Flags flags={flags} />;
}

