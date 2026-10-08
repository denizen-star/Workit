import { addEasternCalendarDays, easternYmd, isEasternWeekend } from "@/lib/analyticsTime";
import { coveredDayNumbers, isSessionComplete, weekLocked } from "@/lib/bonusDay";

export { isSessionComplete };
import { workoutProgram, type WeekPlan, type WorkoutDay } from "@/lib/workoutData";
import { resolveSessionDay } from "@/lib/resolveDay";
import { programTrackForWeek } from "@/lib/programTrack";
import { daysForWeekFn } from "@/lib/scheduleDays";

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
  warmup_started_at?: string | null;
  warmup_completed_at?: string | null;
  cooldown_started_at?: string | null;
  cooldown_completed_at?: string | null;
  warmup_lbs?: number | null;
  cooldown_lbs?: number | null;
  optional_kicker_lbs?: number | null;
  /** Completed sets on this session. Used to resume the copy that has work. */
  completed_set_count?: number | null;
  /** Your pick (docs/plans/PLAN_YOUR_PICK.md): type, mode, swapped program day, credit. */
  pick_type?: string | null;
  pick_mode?: string | null;
  swap_for_day?: number | null;
  credit_lbs?: number | null;
  session_hardness?: number | null;
}

export function findIncompleteSession(
  sessions: WorkoutSessionRow[],
  weekNumber?: number,
  dayNumber?: number
): WorkoutSessionRow | null {
  const open = sessions.filter((session) => !isSessionComplete(session));

  if (weekNumber != null && dayNumber != null) {
    return pickRichestOpen(
      open.filter(
        (session) =>
          Number(session.week_number) === weekNumber && Number(session.day_number) === dayNumber
      )
    );
  }

  const winners = richestPerDay(open);
  return (
    [...winners].sort(
      (a, b) => sessionStarted(b) - sessionStarted(a) || Number(b.id) - Number(a.id)
    )[0] ?? null
  );
}

/** Logged sets beat an empty twin of the same day, so a double start cannot resume the blank copy. */
function sessionProgress(session: WorkoutSessionRow) {
  return (
    Number(session.completed_set_count || 0) +
    (session.warmup_started_at ? 1 : 0) +
    (session.cooldown_started_at ? 1 : 0)
  );
}

function sessionStarted(session: WorkoutSessionRow) {
  return new Date(session.started_at || session.created_at || 0).getTime();
}

function pickRichestOpen(rows: WorkoutSessionRow[]): WorkoutSessionRow | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const progress = sessionProgress(b) - sessionProgress(a);
    if (progress !== 0) return progress;
    return sessionStarted(b) - sessionStarted(a) || Number(b.id) - Number(a.id);
  })[0];
}

/** One open session per day: the copy that already has work, when a duplicate exists. */
function richestPerDay(open: WorkoutSessionRow[]) {
  const byDay = new Map<string, WorkoutSessionRow[]>();
  for (const session of open) {
    const key = `${Number(session.week_number)}-${Number(session.day_number)}`;
    const list = byDay.get(key) || [];
    list.push(session);
    byDay.set(key, list);
  }
  return [...byDay.values()].map((rows) => pickRichestOpen(rows)!);
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

export function findLatestCompletedAny(sessions: WorkoutSessionRow[]): WorkoutSessionRow | null {
  return (
    sessions
      .filter(isSessionComplete)
      .sort((a, b) => {
        const aTime = new Date(a.completed_at || a.ended_at || a.started_at || a.created_at || 0).getTime();
        const bTime = new Date(b.completed_at || b.ended_at || b.started_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })[0] ?? null
  );
}

function sessionEasternDay(session: WorkoutSessionRow) {
  const raw = session.completed_at || session.ended_at || session.started_at || session.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : easternYmd(date);
}

/** Home Your performance: last session the day after a finish or when the week is locked; else the next day. */
export function homePerformanceFocus(
  today: ReturnType<typeof getTodayTarget>,
  sessions: WorkoutSessionRow[]
): { kind: 'next' | 'latest'; workoutType: string | null } {
  const latest = findLatestCompletedAny(sessions);
  const latestType = latest?.workout_type || null;
  const yesterday = addEasternCalendarDays(easternYmd(new Date()), -1);
  const trainedYesterday = latest != null && sessionEasternDay(latest) === yesterday;

  if (today.type === 'hold' || today.type === 'done' || trainedYesterday) {
    return { kind: 'latest', workoutType: latestType };
  }
  if (today.day?.name) {
    return { kind: 'next', workoutType: today.day.name };
  }
  return { kind: 'latest', workoutType: latestType };
}

export function findNextProgramDay(
  sessions: WorkoutSessionRow[],
  program: WeekPlan[],
  /** Weeks below this are skipped outright, even if never completed. Used to resume
   * the 48-week program past weeks "spent" on a completed/abandoned Hyrox track. */
  minWeek: number,
  /** Which days count toward this week for this athlete, and how many are required
   * to lock it: `daysForWeekFn(scheduleDays)` (`lib/scheduleDays.ts`), which asks the
   * week's own track (Hyrox's fixed 5, Overload's built split, main's reshaped week). */
  daysForWeek: (week: WeekPlan) => WorkoutDay[]
): { week: WeekPlan; day: WorkoutDay } | null {
  for (const week of program) {
    if (week.weekNumber < minWeek) continue;
    const days = daysForWeek(week);
    if (weekLocked(sessions, week.weekNumber, days.length)) continue;
    // Swapped days and a filled Your pick slot count as done (coveredDayNumbers).
    // An open Your pick slot can come back as the target — callers open the Your
    // pick picker for it (`isYourPickSlot`) instead of starting it directly.
    const covered = coveredDayNumbers(sessions, week.weekNumber, days);
    for (const day of days) {
      if (!covered.has(day.dayNumber)) {
        return { week, day };
      }
    }
  }

  return null;
}

/** Select Workout: resume week if one is open, else the next unlocked week. Locked weeks stay folded. */
export function defaultSelectWeek(
  sessions: WorkoutSessionRow[],
  program: WeekPlan[],
  minWeek: number,
  daysForWeek: (week: WeekPlan) => WorkoutDay[]
): number | null {
  const resume = findIncompleteSession(sessions);
  if (resume) return Number(resume.week_number);
  return findNextProgramDay(sessions, program, minWeek, daysForWeek)?.week.weekNumber ?? null;
}

/** minWeek resumes the 48-week program past weeks "spent" on a Hyrox track (see findNextProgramDay).
 * daysForWeek threads the athlete's `schedule_days_per_week` into the week-lock/next-day decision. */
export function getTodayTarget(
  sessions: WorkoutSessionRow[],
  minWeek: number,
  daysForWeek: (week: WeekPlan) => WorkoutDay[]
) {
  const resume = findIncompleteSession(sessions);
  if (resume) {
    const week = workoutProgram.find((item) => item.weekNumber === Number(resume.week_number));
    // Shared resolver (lib/resolveDay.ts), so an open full-body / Your pick / retired
    // day resumes instead of falling through to a fresh "start" target.
    const day = week ? resolveSessionDay(Number(resume.week_number), Number(resume.day_number)) : undefined;
    if (week && day) {
      return { type: "resume" as const, session: resume, week, day };
    }
  }

  const next = findNextProgramDay(sessions, workoutProgram, minWeek, daysForWeek);
  if (next && isEasternWeekend()) {
    const prior = workoutProgram.find((item) => item.weekNumber === next.week.weekNumber - 1);
    const nextTouched = sessions.some(
      (session) => Number(session.week_number) === next.week.weekNumber
    );
    if (prior && weekLocked(sessions, prior.weekNumber, daysForWeek(prior).length) && !nextTouched) {
      return { type: "hold" as const, session: null, week: prior, day: null };
    }
  }
  if (next) {
    return { type: "start" as const, session: null, week: next.week, day: next.day };
  }

  return { type: "done" as const, session: null, week: null, day: null };
}

/**
 * Where the athlete is in the main 48-week program — the one rule Home's "today",
 * the nudge mail, reminder pushes, the recap email's "next" line and the Hyrox /
 * Overload start snapshots all share. Main-track rows only, past the resume floor an
 * ended Hyrox / Overload run left (lib/overloadState.ts `mainResumeFloor`), with the
 * athlete's own day count and `getTodayTarget`'s weekend hold. Test Drive sits on top
 * of this where it applies (Home `testDriveTarget`, nudge `testDriveState`).
 */
export function mainProgramTarget(sessions: WorkoutSessionRow[], resumeFloor: number, scheduleDays: number) {
  const main = sessions.filter((session) => programTrackForWeek(Number(session.week_number)) === "main");
  return getTodayTarget(main, resumeFloor, daysForWeekFn(scheduleDays));
}

/** The next unfinished main-program day under the same rule (no resume, no weekend hold). */
export function mainProgramNextDay(sessions: WorkoutSessionRow[], resumeFloor: number, scheduleDays: number) {
  const main = sessions.filter((session) => programTrackForWeek(Number(session.week_number)) === "main");
  return findNextProgramDay(main, workoutProgram, resumeFloor, daysForWeekFn(scheduleDays));
}
