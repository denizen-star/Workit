'use client';

import { Flag } from 'lucide-react';
import {
  bonusCompletedInWeek,
  bonusCount,
  weekHasBonus,
} from '@/lib/bonusDay';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';
import type { WeekPlan } from '@/lib/workoutData';

export default function BonusFlag({
  sessions,
  week,
}: {
  sessions: WorkoutSessionRow[];
  week: WeekPlan | null;
}) {
  const count = bonusCount(sessions);
  const hasBonus = weekHasBonus(week);
  if (!hasBonus && count === 0) return null;

  const thisWeekDone = week ? bonusCompletedInWeek(sessions, week.weekNumber) : false;

  return (
    <div className="glass-card mb-8 p-5">
      <div className="flex items-start gap-3">
        <Flag className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c547]" />
        <div>
          {hasBonus && week ? (
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">
              {thisWeekDone ? `Bonus done · Week ${week.weekNumber}` : `Bonus still open · Week ${week.weekNumber}`}
            </p>
          ) : null}
          <p className="mt-1 text-lg font-black text-white">
            {count} bonus {count === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
    </div>
  );
}