import { isBonusDay, weekLocked } from "@/lib/bonusDay";
import { workoutProgram, type WeekPlan, type WorkoutDay } from "@/lib/workoutData";

export interface WorkoutSessionRow {
  id: number;
  week_number: number;
  day_number: number;
  workout_type: string;
  workout_mode?: string | null;
  is_completed: number | boolean;
  started_at?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  ended_at?: string | null;
  warmup_completed_at?: string | null;
  cooldown_completed_at?: string | null;
  warmup_lbs?: number | null;
  cooldown_lbs?: number | null;
  optional_kicker_lbs?: number | null;
}

export function isSessionComplete(session: { is_completed: unknown }): boolean {
  return Boolean(Number(session.is_completed));
}

export function findIncompleteSession(
  sessions: WorkoutSessionRow[],
  weekNumber?: number,
  dayNumber?: number
): WorkoutSessionRow | null {
  const open = sessions.filter((session) => !isSessionComplete(session));

  if (weekNumber != null && dayNumber != null) {
    return (
      open.find(
        (session) =>
          Number(session.week_number) === weekNumber &&
          Number(session.day_number) === dayNumber
      ) ?? null
    );
  }

  return (
    [...open].sort((a, b) => {
      const aTime = new Date(a.started_at || a.created_at || 0).getTime();
      const bTime = new Date(b.started_at || b.created_at || 0).getTime();
      return bTime - aTime;
    })[0] ?? null
  );
}

export function findLatestCompletedSession(
  sessions: WorkoutSessionRow[],
  weekNumber: number,
  dayNumber: number
): WorkoutSessionRow | null {
  return (
    sessions
      .filter(
        (session) =>
          isSessionComplete(session) &&
          Number(session.week_number) === weekNumber &&
          Number(session.day_number) === dayNumber
      )
      .sort((a, b) => {
        const aTime = new Date(a.completed_at || a.ended_at || a.started_at || a.created_at || 0).getTime();
        const bTime = new Date(b.completed_at || b.ended_at || b.started_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })[0] ?? null
  );
}

export function findNextProgramDay(
  sessions: WorkoutSessionRow[],
  program: WeekPlan[] = workoutProgram
): { week: WeekPlan; day: WorkoutDay } | null {
  const completed = new Set(
    sessions
      .filter(isSessionComplete)
      .map((session) => `${session.week_number}-${session.day_number}`)
  );

  for (const week of program) {
    if (weekLocked(sessions, week.weekNumber)) continue;
    for (const day of week.days) {
      if (isBonusDay(day)) continue;
      if (!completed.has(`${week.weekNumber}-${day.dayNumber}`)) {
        return { week, day };
      }
    }
  }

  return null;
}

/** Select Workout: resume week if one is open, else the next unlocked week. Locked weeks stay folded. */
export function defaultSelectWeek(
  sessions: WorkoutSessionRow[],
  program: WeekPlan[] = workoutProgram
): number | null {
  const resume = findIncompleteSession(sessions);
  if (resume) return Number(resume.week_number);
  return findNextProgramDay(sessions, program)?.week.weekNumber ?? null;
}

export function getTodayTarget(sessions: WorkoutSessionRow[]) {
  const resume = findIncompleteSession(sessions);
  if (resume) {
    const week = workoutProgram.find((item) => item.weekNumber === Number(resume.week_number));
    const day = week?.days.find((item) => item.dayNumber === Number(resume.day_number));
    if (week && day) {
      return { type: "resume" as const, session: resume, week, day };
    }
  }

  const next = findNextProgramDay(sessions);
  if (next) {
    return { type: "start" as const, session: null, week: next.week, day: next.day };
  }

  return { type: "done" as const, session: null, week: null, day: null };
}
