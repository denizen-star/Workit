'use client';

import { Clock, Flag } from 'lucide-react';
import {
  bonusCompletedInWeek,
  bonusCount,
  weekHasBonus,
} from '@/lib/bonusDay';
import {
  optionalCountInWeek,
  optionalWeekCount,
} from '@/lib/optionals';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';
import type { WeekPlan } from '@/lib/workoutData';

/** Compact bonus + optional flags. Same data as the old Home cards, no glass cards. */
export default function FlagStrip({
  sessions,
  week,
}: {
  sessions: WorkoutSessionRow[];
  week: WeekPlan | null;
}) {
  const bonusDays = bonusCount(sessions);
  const hasBonus = weekHasBonus(week);
  const thisWeekBonus = week ? bonusCompletedInWeek(sessions, week.weekNumber) : false;
  const optionalWeeks = optionalWeekCount(sessions);
  const thisWeek = week
    ? optionalCountInWeek(sessions, week.weekNumber)
    : { warmups: 0, cooldowns: 0 };

  if (!hasBonus && bonusDays === 0 && thisWeek.warmups === 0 && thisWeek.cooldowns === 0 && optionalWeeks === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-3 text-base">
      {(hasBonus || bonusDays > 0) && (
        <p className="inline-flex items-start gap-2.5 text-[#f6f1e3]/80">
          <Flag className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c547]" />
          <span>
            {hasBonus && week ? (
              <span className="text-base font-black uppercase tracking-[0.14em] text-[#e8c547]">
                {thisWeekBonus ? `Bonus done · Week ${week.weekNumber}` : `Bonus still open · Week ${week.weekNumber}`}
              </span>
            ) : (
              <span className="text-base font-black uppercase tracking-[0.14em] text-[#e8c547]">Bonus</span>
            )}
            <span className="mt-1 block font-semibold text-white">
              {bonusDays} bonus {bonusDays === 1 ? 'day' : 'days'}
            </span>
          </span>
        </p>
      )}
      <p className="inline-flex items-start gap-2.5 text-[#f6f1e3]/80">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c547]" />
        <span>
          <span className="text-base font-black uppercase tracking-[0.14em] text-[#e8c547]">
            {week ? `Optional · Week ${week.weekNumber}` : 'Optional'}
          </span>
          <span className="mt-1 block font-semibold text-white">
            {thisWeek.warmups} warmup · {thisWeek.cooldowns} cooldown
          </span>
          <span className="block text-base text-[#f6f1e3]/60">
            {optionalWeeks} optional {optionalWeeks === 1 ? 'week' : 'weeks'}
          </span>
        </span>
      </p>
    </div>
  );
}
