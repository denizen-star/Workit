import { workoutProgram, type WeekPlan, type WorkoutDay } from "@/lib/workoutData";

export interface WorkoutSessionRow {
  id: number;
  week_number: number;
  day_number: number;
  workout_type: string;
  is_completed: number | boolean;
  started_at?: string | null;
  created_at?: string | null;
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
    for (const day of week.days) {
      if (!completed.has(`${week.weekNumber}-${day.dayNumber}`)) {
        return { week, day };
      }
    }
  }

  return null;
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
