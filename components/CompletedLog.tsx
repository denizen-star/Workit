'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { weekProgress, weekProgressLabel } from '@/lib/bonusDay';
import { workoutProgram } from '@/lib/workoutData';
import { setVolume } from '@/lib/exerciseKind';
import CompletedSessionCard, {
  type HistorySession,
} from '@/components/CompletedSessionCard';

export type { HistorySession, HistorySet } from '@/components/CompletedSessionCard';

export default function CompletedLog({
  focusWeek = null,
  focusDay = null,
}: {
  focusWeek?: number | null;
  focusDay?: number | null;
}) {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(focusWeek);
  const [openSessionId, setOpenSessionId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sessions?history=1')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.sessions) ? (data.sessions as HistorySession[]) : [];
        setSessions(rows);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!focusWeek) return;
    setExpandedWeek(focusWeek);
    if (!focusDay) return;
    const match = sessions.find(
      (session) => Number(session.week_number) === focusWeek && Number(session.day_number) === focusDay
    );
    if (match) setOpenSessionId(Number(match.id));
  }, [focusWeek, focusDay, sessions]);

  const byWeek = useMemo(() => {
    const map = new Map<number, HistorySession[]>();
    for (const session of sessions) {
      const week = Number(session.week_number);
      const list = map.get(week) || [];
      list.push(session);
      map.set(week, list);
    }
    return map;
  }, [sessions]);

  const bestSessionId = useMemo(() => {
    let bestId: number | null = null;
    let bestVolume = 0;
    for (const session of sessions) {
      const volume = (session.sets || []).reduce(
        (sum, set) =>
          sum + setVolume(set.exercise_name, set.target_reps, set.weight_lbs, set.actual_reps),
        0
      );
      if (volume > bestVolume) {
        bestVolume = volume;
        bestId = Number(session.id);
      }
    }
    return bestId;
  }, [sessions]);

  return (
    <div className="space-y-4">
      {loading && <p className="text-center text-lg font-black text-[#e8c547]">Loading...</p>}

      {!loading && sessions.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
          <p className="text-lg font-black text-white">No finished workouts yet.</p>
          <p className="mt-2 text-sm text-[#f6f1e3]/65">
            Complete a day and it will land here with every set you logged.
          </p>
          <Link
            href="/workout"
            className="mt-5 inline-flex min-h-12 items-center rounded-2xl bg-[#e8c547] px-5 font-black text-[#1a1404]"
          >
            Select Workout
          </Link>
        </div>
      )}

      {!loading &&
        workoutProgram.map((week) => {
          const weekSessions = byWeek.get(week.weekNumber) || [];
          const progress = weekProgress(
            weekSessions.map((session) => ({ ...session, is_completed: 1 })),
            week
          );
          const open = expandedWeek === week.weekNumber;

          return (
            <div key={week.weekNumber} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <button
                type="button"
                onClick={() => setExpandedWeek(open ? null : week.weekNumber)}
                className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/5"
                aria-expanded={open}
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-white">Week {week.weekNumber}</h3>
                  <span className="text-sm text-[#f6f1e3]/65">
                    {weekProgressLabel(progress)}
                  </span>
                </div>
                {open ? (
                  <ChevronUp className="h-6 w-6 text-[#e8c547]" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-[#e8c547]" />
                )}
              </button>

              {open && (
                <div className="space-y-3 px-5 pb-5">
                  {week.days.map((day) => {
                    const daySessions = weekSessions.filter(
                      (session) => Number(session.day_number) === day.dayNumber
                    );
                    if (daySessions.length === 0) {
                      return (
                        <div
                          key={day.dayNumber}
                          className="rounded-2xl border border-white/10 bg-black/25 p-4"
                        >
                          <h4 className="text-lg font-black text-white/50">{day.name}</h4>
                          <p className="mt-1 text-sm text-[#f6f1e3]/45">Not finished yet</p>
                        </div>
                      );
                    }

                    return daySessions.map((session) => (
                      <CompletedSessionCard
                        key={session.id}
                        session={session}
                        focus={day.focus}
                        defaultOpen={openSessionId === Number(session.id)}
                        bestDay={bestSessionId === Number(session.id)}
                      />
                    ));
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
