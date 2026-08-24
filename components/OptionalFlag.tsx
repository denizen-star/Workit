'use client';

import { Clock } from 'lucide-react';
import {
  optionalCountInWeek,
  optionalWeekCount,
} from '@/lib/optionals';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';
import type { WeekPlan } from '@/lib/workoutData';

export default function OptionalFlag({
  sessions,
  week,
}: {
  sessions: WorkoutSessionRow[];
  week: WeekPlan | null;
}) {
  const weeks = optionalWeekCount(sessions);
  const thisWeek = week ? optionalCountInWeek(sessions, week.weekNumber) : { warmups: 0, cooldowns: 0 };

  return (
    <div className="glass-card mb-8 p-5">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c547]" />
        <div>
          {week ? (
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">
              Optional · Week {week.weekNumber}
            </p>
          ) : (
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">Optional</p>
          )}
          <p className="mt-1 text-lg font-black text-white">
            {thisWeek.warmups} warmup · {thisWeek.cooldowns} cooldown
          </p>
          <p className="mt-1 text-sm text-[#f6f1e3]/65">
            {weeks} optional {weeks === 1 ? 'week' : 'weeks'}
          </p>
        </div>
      </div>
    </div>
  );
}
