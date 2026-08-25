'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/formatDuration';
import { getExerciseKind, setLogLabel } from '@/lib/exerciseKind';
import { workoutModeLabel, normalizeWorkoutMode } from '@/lib/workoutMode';
import { sessionDateLabel, sessionDurationSeconds } from '@/lib/sessionLog';

export type HistorySet = {
  workout_session_id: number;
  exercise_name: string;
  set_number: number;
  target_reps: string | null;
  actual_reps: number | null;
  weight_lbs: number | null;
};

export type HistorySession = {
  id: number;
  week_number: number;
  day_number: number;
  workout_type: string;
  workout_mode: string | null;
  started_at: string | null;
  completed_at: string | null;
  ended_at: string | null;
  created_at: string | null;
  sets: HistorySet[];
};

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function groupSets(sets: HistorySet[]) {
  const groups: { name: string; sets: HistorySet[] }[] = [];
  for (const set of sets) {
    const last = groups[groups.length - 1];
    if (last && last.name === set.exercise_name) {
      last.sets.push(set);
    } else {
      groups.push({ name: set.exercise_name, sets: [set] });
    }
  }
  return groups;
}

export default function CompletedSessionCard({
  session,
  focus,
  headerAction,
  defaultOpen = false,
  bestDay = false,
}: {
  session: HistorySession;
  focus?: string | null;
  headerAction?: ReactNode;
  defaultOpen?: boolean;
  bestDay?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  const duration = sessionDurationSeconds(session);
  const finishedOn = sessionDateLabel(session);
  const groups = groupSets(session.sets || []);

  return (
    <div className="rounded-2xl border border-[#e8c547]/20 bg-white/5 p-4">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <div className="mb-1 flex items-center gap-2">
            <h4 className="text-lg font-black text-white">{session.workout_type}</h4>
            <CheckCircle className="h-5 w-5 text-[#e8c547]" />
          </div>
          {focus && <p className="text-sm text-[#f6f1e3]/65">{focus}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#f6f1e3]/70">
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
              {workoutModeLabel(normalizeWorkoutMode(session.workout_mode))}
            </span>
            {finishedOn && (
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                {finishedOn}
              </span>
            )}
            {duration != null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1">
                <Clock className="h-3 w-3" />
                {formatDuration(duration)}
              </span>
            )}
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
              {session.sets?.length || 0} sets
            </span>
            {bestDay ? (
              <span className="rounded-full bg-[#e8c547] px-3 py-1 text-xs font-black text-[#1a1404]">
                Best day
              </span>
            ) : null}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {headerAction}
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="rounded-lg p-1 text-[#e8c547]"
            aria-label={open ? 'Hide sets' : 'Show sets'}
            aria-expanded={open}
          >
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {groups.length === 0 && (
            <p className="text-sm text-[#f6f1e3]/55">No completed sets logged for this session.</p>
          )}
          {groups.map((group) => {
            const kind = getExerciseKind(group.name, group.sets[0]?.target_reps || '');
            return (
              <div key={`${session.id}-${group.name}`}>
                <h5 className="text-base font-black text-white">{group.name}</h5>
                <ul className="mt-2 space-y-2">
                  {group.sets.map((set) => (
                    <li
                      key={`${set.workout_session_id}-${set.exercise_name}-${set.set_number}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2"
                    >
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                        Set {set.set_number}
                      </span>
                      <span className="text-sm font-semibold text-[#f6f1e3]/85">
                        {setLogLabel(kind, asNumber(set.weight_lbs), asNumber(set.actual_reps))}
                        {set.target_reps ? (
                          <span className="ml-2 text-xs font-medium text-white/40">
                            target {set.target_reps}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
