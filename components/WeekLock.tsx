'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { requiredDays, weekProgress } from '@/lib/bonusDay';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';
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

const HELP: Record<string, string> = {
  header:
    'Four required days this week. Gold means paid. Now is the next one you still owe. Lock the week when all four are done.',
  done: 'Done. You finished this required day. It counts toward locking the week.',
  now: 'Now. This is the next unpaid required day. Start here.',
  open: 'Still open. You owe this day before the week locks.',
};

export default function WeekLock({
  week,
  sessions,
}: {
  week: WeekPlan | null;
  sessions: WorkoutSessionRow[];
}) {
  const [help, setHelp] = useState<string | null>(null);
  if (!week) return null;

  const required = requiredDays(week);
  const progress = weekProgress(sessions, week);
  const nextUnpaid = required.find((day) => !isDayDone(day, week, sessions));
  const slots = required.map((day) => ({
    day,
    state: isDayDone(day, week, sessions)
      ? 'done'
      : nextUnpaid?.dayNumber === day.dayNumber
        ? 'now'
        : 'open',
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-base">
        <button
          type="button"
          onClick={() => setHelp(HELP.header)}
          className="font-semibold text-white"
        >
          {progress.requiredDone} of {progress.requiredTotal} days
        </button>
        <button type="button" onClick={() => setHelp(HELP.header)} className="text-[#f6f1e3]/60">
          Lock the week
        </button>
      </div>
      <div className="mb-4 flex gap-1.5">
        {required.map((day, index) => {
          const filled = index < progress.requiredDone;
          return (
            <div
              key={day.dayNumber}
              className={`h-2.5 flex-1 rounded-full ${filled ? 'bg-[#e8c547]' : 'bg-white/10'}`}
            />
          );
        })}
      </div>
      <div className="flex gap-2">
        {slots.map(({ day, state }) => (
          <button
            type="button"
            key={day.dayNumber}
            onClick={() => setHelp(HELP[state])}
            className={`flex-1 rounded-2xl px-1.5 py-5 text-center ${
              state === 'done'
                ? 'border border-[#e8c547] bg-[#e8c547] text-[#1a1404]'
                : state === 'now'
                  ? 'border-2 border-[#e8c547] bg-[#e8c547]/10'
                  : 'border border-dashed border-white/15 bg-transparent'
            }`}
          >
            <p
              className={`text-base font-semibold ${
                state === 'done' ? 'text-[#1a1404]' : state === 'now' ? 'text-white' : 'text-[#f6f1e3]/50'
              }`}
            >
              {shortDayName(day.name)}
            </p>
            <p
              className={`mt-1 inline-flex items-center justify-center gap-1 text-base font-black ${
                state === 'done'
                  ? 'text-[#1a1404]'
                  : state === 'now'
                    ? 'text-[#e8c547]'
                    : 'text-[#f6f1e3]/40'
              }`}
            >
              {state === 'done' ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={3} />
                  Done
                </>
              ) : state === 'now' ? (
                'Now'
              ) : (
                '—'
              )}
            </p>
          </button>
        ))}
      </div>
      {help ? <p className="mt-3 text-sm text-[#f6f1e3]/70">{help}</p> : null}
    </div>
  );
}
