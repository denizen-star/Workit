import type { SessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { loadFocusInfo } from '@/lib/focusState';
import { lockedWeekRecords, type LockedWeekRecord } from '@/lib/lockedWeeks';
import { mainResumeFloor } from '@/lib/overloadState';
import { isTestDriveWeek } from '@/lib/testDrive';
import { deleteOpenTestDriveSessions, loadTestDriveState, testDriveSummary } from '@/lib/testDriveServer';
import { hasSeenWeekTakeover, markWeekTakeoverSeen } from '@/lib/weekPodium';

/**
 * The athlete's sessions (GET /api/sessions without `history` / `sessionId`, and Home's
 * part of GET /api/home): every row with its completed-set count, Test Drive state, the
 * locked weeks and the main program's resume floor. `home` also hands out the one-time
 * Home items (Test Drive summary, "Week 1 starts now"). `lockedRecords` skips the
 * locked-weeks read when the caller already has it.
 */
export async function sessionsPayload(
  user: SessionUser,
  opts: {
    weekNumber?: string | null;
    home: boolean;
    /** Already read or in flight (GET /api/home starts it before this part). */
    lockedRecords?: LockedWeekRecord[] | Promise<LockedWeekRecord[]>;
  }
) {
  const { weekNumber, home } = opts;
  let sql = `SELECT ws.*,
          (SELECT COUNT(*) FROM exercise_sets es
            WHERE es.workout_session_id = ws.id AND es.is_completed = 1) AS completed_set_count
       FROM workout_sessions ws WHERE ws.user_id = ?`;
  const params: any[] = [user.id];

  if (weekNumber) {
    sql += ' AND ws.week_number = ?';
    params.push(weekNumber);
  }

  sql += ' ORDER BY ws.week_number, ws.day_number';

  const result = await query(sql, params);
  let rows = result.rows as Array<{ week_number: number; day_number: number; is_completed: number | boolean; started_at: string | null; created_at: string | null }>;
  // Test Drive needs every session, so only the unfiltered list carries it. Once
  // Week 1's Monday arrives, an open Test Drive session is thrown away.
  let testDrive = weekNumber ? null : await loadTestDriveState(user, rows);
  if (testDrive && !testDrive.active) {
    const openTestDrive = (row: (typeof rows)[number]) =>
      isTestDriveWeek(row.week_number) && !Number(row.is_completed);
    if (rows.some(openTestDrive) && (await deleteOpenTestDriveSessions(user.id))) {
      rows = rows.filter((row) => !openTestDrive(row));
      testDrive = await loadTestDriveState(user, rows);
    }
  }
  // Home only (`?home=1`), so another page's session read never uses these up:
  // the done hero's summary, and the one-time "Week 1 starts now" takeover.
  const summary = home && testDrive?.active && testDrive.allDone ? await testDriveSummary(user.id) : null;
  let week1Start = false;
  if (home && testDrive && !testDrive.active) {
    week1Start = !(await hasSeenWeekTakeover(user.id, testDrive.firstMonday, 'week1_start'));
    if (week1Start) await markWeekTakeoverSeen(user.id, testDrive.firstMonday, 'week1_start');
  }
  const [lockedWeeksDetail, resumeFloor, focusInfo] = await Promise.all([
    opts.lockedRecords ?? lockedWeekRecords(user.id),
    mainResumeFloor(user.id),
    loadFocusInfo(user.id),
  ]);
  return {
    sessions: rows,
    lockedWeeks: lockedWeeksDetail.length,
    // Where the main program resumes after an ended Hyrox / Overload run
    // (lib/nextWorkout.ts `mainProgramTarget`).
    resumeFloor,
    lockedWeeksDetail,
    // Default focus + per-week overrides: shapes each week's days (lib/focusRotation.ts).
    focusInfo,
    testDrive: testDrive ? { ...testDrive, summary } : null,
    week1Start,
  };
}
