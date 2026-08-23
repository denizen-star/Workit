import { getWorkoutDay, workoutProgram, type WeekPlan, type WorkoutDay } from '@/lib/workoutData';

type SessionLike = {
  week_number: number;
  day_number: number;
  workout_type?: string | null;
  is_completed?: unknown;
  completed_at?: string | null;
  ended_at?: string | null;
  started_at?: string | null;
  created_at?: string | null;
};

function isComplete(session: { is_completed?: unknown }): boolean {
  return Boolean(Number(session.is_completed));
}

/** Four finished sessions lock a week. Bonus can be one of those four. */
export const REQUIRED_DAYS_TO_LOCK = 4;

export function isBonusDay(day: Pick<WorkoutDay, 'bonus' | 'name'>): boolean {
  if (day.bonus) return true;
  return isBonusWorkoutType(day.name);
}

export function isBonusWorkoutType(workoutType: string | null | undefined): boolean {
  return /\bbonus\b/i.test(String(workoutType || ''));
}

export function weekHasBonus(week: WeekPlan | null | undefined): boolean {
  return Boolean(week?.days.some((day) => isBonusDay(day)));
}

export function requiredDays(week: WeekPlan): WorkoutDay[] {
  return week.days.filter((day) => !isBonusDay(day));
}

/** Session is bonus if the type says so, or the program day is flagged. */
export function sessionIsBonus(
  session: Pick<SessionLike, 'week_number' | 'day_number' | 'workout_type'>,
  program: WeekPlan[] = workoutProgram
): boolean {
  if (isBonusWorkoutType(session.workout_type)) return true;
  const week = program.find((item) => item.weekNumber === Number(session.week_number));
  const day = week?.days.find((item) => item.dayNumber === Number(session.day_number));
  return Boolean(day && isBonusDay(day));
}

export function bonusTypeSql(alias = 'ws'): string {
  return `LOWER(COALESCE(${alias}.workout_type, '')) LIKE '%bonus%'`;
}

export function completedInWeek(sessions: SessionLike[], weekNumber: number): SessionLike[] {
  return sessions.filter(
    (session) => isComplete(session) && Number(session.week_number) === weekNumber
  );
}

export function weekLocked(sessions: SessionLike[], weekNumber: number): boolean {
  return completedInWeek(sessions, weekNumber).length >= REQUIRED_DAYS_TO_LOCK;
}

export function bonusCompletedInWeek(
  sessions: SessionLike[],
  weekNumber: number,
  program: WeekPlan[] = workoutProgram
): boolean {
  return completedInWeek(sessions, weekNumber).some((session) => sessionIsBonus(session, program));
}

/** Unique weeks with at least one finished bonus session. Do Again does not add another. */
export function bonusCount(sessions: SessionLike[], program: WeekPlan[] = workoutProgram): number {
  const weeks = new Set<number>();
  for (const session of sessions) {
    if (!isComplete(session) || !sessionIsBonus(session, program)) continue;
    weeks.add(Number(session.week_number));
  }
  return weeks.size;
}

export function weekProgress(
  sessions: SessionLike[],
  week: WeekPlan,
  program: WeekPlan[] = workoutProgram
): { requiredDone: number; requiredTotal: number; bonusDone: boolean } {
  const completed = new Set(
    sessions
      .filter(isComplete)
      .map((session) => `${session.week_number}-${session.day_number}`)
  );
  const required = requiredDays(week);
  return {
    requiredDone: required.filter((day) => completed.has(`${week.weekNumber}-${day.dayNumber}`)).length,
    requiredTotal: required.length,
    bonusDone: bonusCompletedInWeek(sessions, week.weekNumber, program),
  };
}

export function lastCompletedSession(sessions: SessionLike[]): SessionLike | null {
  return (
    [...sessions]
      .filter(isComplete)
      .sort((a, b) => {
        const aTime = new Date(a.completed_at || a.ended_at || a.started_at || a.created_at || 0).getTime();
        const bTime = new Date(b.completed_at || b.ended_at || b.started_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })[0] ?? null
  );
}

export function isUpperSession(
  session: Pick<SessionLike, 'week_number' | 'day_number' | 'workout_type'>,
  program: WeekPlan[] = workoutProgram
): boolean {
  if (sessionIsBonus(session, program)) return true;
  if (/\bupper\b/i.test(String(session.workout_type || ''))) return true;
  const day = getWorkoutDay(Number(session.week_number), Number(session.day_number));
  return Boolean(day && /\bupper\b/i.test(day.name));
}

/** Last finished session was an upper (A, B, or Bonus). Lower the next day is fine. */
export function shouldRestBetweenUppers(sessions: SessionLike[]): boolean {
  const last = lastCompletedSession(sessions);
  return Boolean(last && isUpperSession(last));
}

export function restBetweenUppersCopy(): string {
  return 'Leave a day between upper sessions. Lower the next day is fine.';
}

export function weekProgressLabel(progress: {
  requiredDone: number;
  requiredTotal: number;
  bonusDone: boolean;
}): string {
  const base = `${progress.requiredDone} / ${progress.requiredTotal} completed`;
  return progress.bonusDone ? `${base} + bonus` : base;
}
