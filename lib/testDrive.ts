import { addEasternCalendarDays, easternMidnightUtc, easternWeekday, easternYmd } from '@/lib/analyticsTime';
import { parseDbTime } from '@/lib/optionals';
import { getWorkoutDay, type WeekPlan, type WorkoutDay } from '@/lib/workoutData';
import { FULL_BODY_PACKS } from '@/lib/yourPick';

/**
 * Test Drive (docs/plans/PLAN_TEST_DRIVE.md): an athlete whose first session isn't
 * on an Eastern Monday gets a few fixed workouts right away, and Week 1 starts the
 * Monday after. They count toward the athlete's own stats, never toward the board
 * (`SQL_NOT_TEST_DRIVE`), Week 1, locking or belts.
 *
 * Stored as ordinary `workout_sessions` rows on week 0: outside the program's 1-48
 * and Hyrox's 101+, so every week-keyed lock/belt/next-day lookup skips them as-is.
 * Nothing is persisted about the Test Drive itself — `testDriveState` derives it
 * from the account's created_at and its sessions.
 */
export const TEST_DRIVE_WEEK = 0;
export const TEST_DRIVE_NAME = 'Test Drive';

/** New joins only: accounts created before this Eastern date never get a Test Drive. */
export const TEST_DRIVE_SINCE = '2026-09-27';

/** Day numbers 30-32 — clear of the split (1-5), full-body (6-8), Your pick (20-24). */
const FULL_BODY_A = 30;
const UPPER_A = 31;
const FULL_BODY_B = 32;

/** Welcome + verify mail line (lib/emails/templates.ts). */
export const TEST_DRIVE_EMAIL_LINE =
  'Week 1 starts Monday. Joining mid-week? Take a Test Drive today: a few workouts to learn the app before the program begins.';

/** "Week 3 · Lower B", or just the day name for a Test Drive (it has no program week). */
export function sessionWhereLabel(weekNumber: number, dayName: string): string {
  return isTestDriveWeek(weekNumber) ? dayName : `Week ${weekNumber} · ${dayName}`;
}

/** Board-side filter: keeps Test Drive sessions off The house, podium, You vs and rank. */
export function sqlNotTestDrive(alias = 'ws'): string {
  return ` AND ${alias}.week_number <> ${TEST_DRIVE_WEEK}`;
}

/** Accounts created before `TEST_DRIVE_SINCE` never get one — lets the server skip the session read. */
export function accountGetsTestDrive(createdAt: string | Date | null | undefined): boolean {
  const created = parseDbTime(createdAt ?? null);
  return created != null && created >= easternMidnightUtc(TEST_DRIVE_SINCE).getTime();
}

export function isTestDriveWeek(weekNumber: unknown): boolean {
  return Number(weekNumber) === TEST_DRIVE_WEEK;
}

function testDriveDay(dayNumber: number, name: string, focus: string, exercises: WorkoutDay['exercises']): WorkoutDay {
  return { dayNumber, name: `${TEST_DRIVE_NAME} · ${name}`, focus, suggestedDay: '', exercises };
}

/** Re-derive a Test Drive day from a session row (week 0, day 30-32). */
export function resolveTestDriveDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  if (!isTestDriveWeek(weekNumber)) return undefined;
  if (dayNumber === FULL_BODY_A) return testDriveDay(FULL_BODY_A, 'Full Body A', 'Full body', FULL_BODY_PACKS[0]);
  if (dayNumber === FULL_BODY_B) return testDriveDay(FULL_BODY_B, 'Full Body B', 'Full body', FULL_BODY_PACKS[1]);
  if (dayNumber === UPPER_A) {
    // Week 1's own Upper Body A, so its history carries straight into the program.
    const upper = getWorkoutDay(1, 1);
    return upper ? testDriveDay(UPPER_A, 'Upper A', upper.focus, upper.exercises) : undefined;
  }
  return undefined;
}

/** Workouts allotted by the Eastern weekday of the first session: Tue 3 · Wed-Fri 2 · Sat/Sun 1 · Mon none. */
function allottedDayNumbers(weekday: number): number[] {
  if (weekday === 1) return [];
  if (weekday === 2) return [FULL_BODY_A, UPPER_A, FULL_BODY_B];
  if (weekday >= 3 && weekday <= 5) return [FULL_BODY_A, FULL_BODY_B];
  return [FULL_BODY_A];
}

/** Eastern Monday strictly after `ymd` — the day Week 1 starts. */
function nextMondayYmd(ymd: string): string {
  const weekday = easternWeekday(new Date(`${ymd}T12:00:00-05:00`));
  return addEasternCalendarDays(ymd, ((8 - weekday) % 7) || 7);
}

function calendarDaysBetween(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T12:00:00Z`).getTime();
  const to = new Date(`${toYmd}T12:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

type SessionLike = {
  week_number: number;
  day_number: number;
  is_completed?: unknown;
  started_at?: string | Date | null;
  created_at?: string | Date | null;
};

export type TestDriveState = {
  /** Before Week 1's Monday and Test Drive applies — the program itself waits. */
  active: boolean;
  /** Week 1's Monday (Eastern YMD). */
  firstMonday: string;
  /** Eastern calendar days until that Monday (1 on Sunday). */
  daysUntilMonday: number;
  days: WorkoutDay[];
  doneDayNumbers: number[];
  /** Next unfinished allotted day, or null once all are done. */
  nextDay: WorkoutDay | null;
  allDone: boolean;
};

/**
 * The athlete's Test Drive, or null when it doesn't apply: account created before
 * `TEST_DRIVE_SINCE`, first session was a program session, or first session (today,
 * if none yet) is a Monday. After the Monday it still returns `active: false` so the
 * caller can clean up and show the "Week 1 starts now" moment.
 */
export function testDriveState(
  createdAt: string | Date | null | undefined,
  sessions: SessionLike[],
  now = new Date()
): TestDriveState | null {
  if (!accountGetsTestDrive(createdAt)) return null;

  const stamp = (row: SessionLike) => parseDbTime(row.started_at ?? row.created_at ?? null) ?? Infinity;
  const first = [...sessions].sort((a, b) => stamp(a) - stamp(b))[0];
  if (first && !isTestDriveWeek(first.week_number)) return null;

  const startedAt = first && Number.isFinite(stamp(first)) ? new Date(stamp(first)) : now;
  const dayNumbers = allottedDayNumbers(easternWeekday(startedAt));
  if (!dayNumbers.length) return null;

  const firstMonday = nextMondayYmd(easternYmd(startedAt));
  const days = dayNumbers.map((n) => resolveTestDriveDay(TEST_DRIVE_WEEK, n)).filter((d): d is WorkoutDay => !!d);
  const doneDayNumbers = dayNumbers.filter((n) =>
    sessions.some(
      (row) => isTestDriveWeek(row.week_number) && Number(row.day_number) === n && Boolean(Number(row.is_completed))
    )
  );
  const nextDay = days.find((day) => !doneDayNumbers.includes(day.dayNumber)) ?? null;
  return {
    active: now.getTime() < easternMidnightUtc(firstMonday).getTime(),
    firstMonday,
    daysUntilMonday: Math.max(0, calendarDaysBetween(easternYmd(now), firstMonday)),
    days,
    doneDayNumbers,
    nextDay,
    allDone: nextDay == null,
  };
}

/** "Week 1 starts in 3 days", and "Week 1 starts Monday" on Sunday. */
export function testDriveCountdown(state: Pick<TestDriveState, 'daysUntilMonday'>): string {
  if (state.daysUntilMonday <= 1) return 'Week 1 starts Monday';
  return `Week 1 starts in ${state.daysUntilMonday} days`;
}

/**
 * Home's "today" while a Test Drive is on: resume the open one, else start the next
 * allotted day. Null when it's off or every day is done (Home shows the done hero),
 * so the caller falls back to `getTodayTarget`.
 */
export function testDriveTarget<S extends SessionLike>(state: TestDriveState | null | undefined, sessions: S[]) {
  if (!state?.active) return null;
  const week: WeekPlan = { weekNumber: TEST_DRIVE_WEEK, description: TEST_DRIVE_NAME, days: state.days };
  const open = sessions.find((row) => isTestDriveWeek(row.week_number) && !Number(row.is_completed));
  const openDay = open ? resolveTestDriveDay(TEST_DRIVE_WEEK, Number(open.day_number)) : undefined;
  if (open && openDay) return { type: 'resume' as const, session: open, week, day: openDay };
  if (state.nextDay) return { type: 'start' as const, session: null, week, day: state.nextDay };
  return null;
}
