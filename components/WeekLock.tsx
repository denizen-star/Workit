'use client';

import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HelpTip } from '@/components/HelpSheet';
import { HOME_WEEK_LOCK_HELP } from '@/lib/helpCopy';
import { bonusCompletedInWeek, requiredDays, weekProgress } from '@/lib/bonusDay';
import type { AthletePerformanceBoard } from '@/lib/athletePerformanceTypes';
import { formatCompact } from '@/lib/athletePerformanceTypes';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';
import { optionalCountInWeek, sessionOptionalLbs } from '@/lib/optionals';
import { dayPctLabel, dayVolumeStats, weekDoneVolume } from '@/lib/weekLockStats';
import type { WeekPlan, WorkoutDay } from '@/lib/workoutData';

function shortDayName(name: string) {
  return name.replace(' Body ', ' ');
}

function isDayDone(day: WorkoutDay, week: WeekPlan, sessions: WorkoutSessionRow[]) {
  return sessions.some(
    (session) =>
      Boolean(Number(session.is_completed)) &&
      Number(session.week_number) === week.weekNumber &&
      Number(session.day_number) === day.dayNumber
  );
}

const LEGEND = 'Gold = start here. Green = done. Dashed = still open.';

const HELP: Record<string, string> = {
  header: `Four required days this week. ${LEGEND} Lock the week when all four are green.`,
  done: 'Green. You finished this required day. Volume is this session. % is vs last time that day ran.',
  now: 'Gold. This is the next unpaid required day. Last is the last time you ran that day.',
  open: 'Dashed. You still owe this day before the week locks. Last is the last time you ran that day.',
};

export default function WeekLock({
  week,
  sessions,
}: {
  week: WeekPlan | null;
  sessions: WorkoutSessionRow[];
}) {
  const [help, setHelp] = useState<string | null>(null);
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

  if (!week) return null;

  const required = requiredDays(week);
  const progress = weekProgress(sessions, week);
  const nextUnpaid = required.find((day) => !isDayDone(day, week, sessions));
  const workouts = board?.workouts || [];
  const weekVolume = weekDoneVolume(
    workouts,
    week.weekNumber,
    required.filter((day) => isDayDone(day, week, sessions)).map((day) => day.name)
  );
  const optionals = optionalCountInWeek(sessions, week.weekNumber);
  const optionalLbs = sessions
    .filter((session) => Number(session.week_number) === week.weekNumber)
    .reduce((sum, session) => sum + sessionOptionalLbs(session), 0);
  const bonusDone = bonusCompletedInWeek(sessions, week.weekNumber);
  const slots = required.map((day) => ({
    day,
    state: isDayDone(day, week, sessions)
      ? 'done'
      : nextUnpaid?.dayNumber === day.dayNumber
        ? 'now'
        : 'open',
    stats: dayVolumeStats(workouts, week.weekNumber, day.name, isDayDone(day, week, sessions)),
  }));

  return (
    <div>
      <div className="mb-3 flex items-center gap-1 text-base">
        <button
          type="button"
          onClick={() => setHelp(HELP.header)}
          className="font-semibold text-white"
        >
          {progress.requiredDone} of {progress.requiredTotal} days
          {weekVolume ? ` · ${weekVolume}` : ''}
        </button>
        <HelpTip
          label={HOME_WEEK_LOCK_HELP.title}
          title={HOME_WEEK_LOCK_HELP.title}
          lead={HOME_WEEK_LOCK_HELP.lead}
          bullets={HOME_WEEK_LOCK_HELP.bullets}
        />
        <button
          type="button"
          onClick={() => setHelp(HELP.header)}
          className="ml-auto text-[#f6f1e3]/60"
        >
          Lock the week
        </button>
      </div>
      <div className="mb-4 flex gap-1.5">
        {required.map((day, index) => {
          const filled = index < progress.requiredDone;
          return (
            <div
              key={day.dayNumber}
              className={`h-2.5 flex-1 rounded-full ${filled ? 'bg-[#6d8b6e]' : 'bg-white/10'}`}
            />
          );
        })}
      </div>
      <div className="flex gap-2">
        {slots.map(({ day, state, stats }) => {
          const done = state === 'done';
          const now = state === 'now';
          const pct = dayPctLabel(stats.pct);
          return (
            <button
              type="button"
              key={day.dayNumber}
              onClick={() => setHelp(HELP[state])}
              className={`flex-1 rounded-2xl px-1.5 py-3 text-center ${
                done
                  ? 'border border-[#6d8b6e] bg-[#6d8b6e] text-[#1a1404]'
                  : now
                    ? 'border-2 border-[#e8c547] bg-[#e8c547]/10'
                    : 'border border-dashed border-white/15 bg-transparent'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  done ? 'text-[#1a1404]' : now ? 'text-white' : 'text-[#f6f1e3]/50'
                }`}
              >
                {shortDayName(day.name)}
              </p>
              <p
                className={`mt-1 inline-flex items-center justify-center gap-1 text-base font-black ${
                  done ? 'text-[#1a1404]' : now ? 'text-[#e8c547]' : 'text-[#f6f1e3]/40'
                }`}
              >
                {done ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3} />
                    Done
                  </>
                ) : now ? (
                  'Now'
                ) : (
                  '—'
                )}
              </p>
              <p className={`mt-1 text-sm font-black ${done ? 'text-[#1a1404]' : 'text-[#f6f1e3]/70'}`}>
                {done ? stats.volumeLabel : stats.lastLabel}
              </p>
              {done && pct ? (
                <p className="mt-0.5 text-xs font-semibold text-[#1a1404]">{pct}</p>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-[#f6f1e3]/70">
        Optionals {optionals.total} / 8 · {optionalLbs ? `+${formatCompact(optionalLbs)}` : '0'} · Bonus{' '}
        {bonusDone ? 1 : 0}
      </p>
      <p className="mt-1 text-sm text-[#f6f1e3]/70">{help || LEGEND}</p>
    </div>
  );
}
