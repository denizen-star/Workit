import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { BELTS, getBelts, serializeBelt } from '@/lib/belts';
import { bonusCount, sessionIsBonus, weekBonusDone } from '@/lib/bonusDay';
import { sessionIsYourPick } from '@/lib/yourPick';
import { sessionOptionalLbs } from '@/lib/optionals';
import { checkAndAwardBadges } from '@/lib/badges';
import { updateDailyStats } from '@/lib/dailyStats';
import { queueWorkoutCompleteEmails } from '@/lib/emails/lifecycle';
import { trackServerEvent } from '@/lib/trackServerEvent';
import { parseExerciseModes, serializeExerciseModes } from '@/lib/exerciseModes';
import { parseExerciseAlts, serializeExerciseAlts } from '@/lib/exerciseAlts';
import { exerciseGroupNames } from '@/lib/exerciseKey';
import { applyExerciseMode } from '@/lib/workoutData';
import { resolveSessionDay } from '@/lib/resolveDay';
import { requiredCountForWeek } from '@/lib/scheduleDays';
import { lockedWeekCountFromTable, lockedWeekRecords, recordWeekLockIfNeeded } from '@/lib/lockedWeeks';
import { HYROX_WEEK_OFFSET, getHyroxWorkoutDay } from '@/lib/hyroxProgram';
import { normalizeWorkoutMode, type WorkoutMode } from '@/lib/workoutMode';
import { markDoneTooSoon, validateYourPickStart, type YourPickStart } from '@/lib/yourPickStart';
import { applyYourPickCredit } from '@/lib/yourPickCredit';

type OpenSessionRow = {
  id: number;
  completed_sets: number;
  optional_started: number;
};

/** Open copies of one day. The one with logged work comes first. */
async function listOpenSessions(userId: number, weekNumber: number, dayNumber: number, track: string) {
  const existing = await query(
    `SELECT ws.id,
            (SELECT COUNT(*) FROM exercise_sets es
              WHERE es.workout_session_id = ws.id AND es.is_completed = 1) AS completed_sets,
            (ws.warmup_started_at IS NOT NULL OR ws.cooldown_started_at IS NOT NULL) AS optional_started
     FROM workout_sessions ws
     WHERE ws.user_id = ?
       AND ws.week_number = ?
       AND ws.day_number = ?
       AND ws.program_track = ?
       AND (ws.is_completed = 0 OR ws.is_completed IS NULL)
     ORDER BY completed_sets DESC, optional_started DESC, ws.id ASC`,
    [userId, weekNumber, dayNumber, track]
  );
  return existing.rows as OpenSessionRow[];
}

async function reuseOpenSession(userId: number, weekNumber: number, dayNumber: number, track: string) {
  const rows = await listOpenSessions(userId, weekNumber, dayNumber, track);
  return rows.length > 0 ? Number(rows[0].id) : null;
}

/** Two creates in the same moment both insert. Keep the copy that has work and drop the blank twin. */
async function collapseEmptyTwins(userId: number, weekNumber: number, dayNumber: number, track: string) {
  const rows = await listOpenSessions(userId, weekNumber, dayNumber, track);
  if (rows.length === 0) return null;
  const keep = Number(rows[0].id);
  for (const row of rows) {
    const id = Number(row.id);
    if (id === keep) continue;
    if (Number(row.completed_sets) > 0 || Number(row.optional_started)) continue;
    await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [id]);
    await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [id, userId]);
  }
  return keep;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { weekNumber, scheduledDate, workoutMode, complete } = body;
    let { dayNumber, workoutType } = body;
    const mode = String(workoutMode || '').trim().toLowerCase() === 'travel' ? 'travel' : 'gym';
    // Derived from the week number, not trusted from the client — Hyrox weeks are
    // namespaced at 101+ (see lib/hyroxProgram.ts) specifically so this is authoritative.
    const track = Number(weekNumber) > HYROX_WEEK_OFFSET ? 'hyrox' : 'main';
    const markComplete = Boolean(complete);

    // Your pick (docs/plans/PLAN_YOUR_PICK.md): the server picks the day number and
    // workout type from the validated type, never the client's.
    let pick: YourPickStart | null = null;
    if (body.pickType != null) {
      if (track !== 'main' || markComplete) {
        return NextResponse.json({ error: 'Your pick is main program only' }, { status: 400 });
      }
      const checked = await validateYourPickStart(user.id, user.scheduleDaysPerWeek, {
        weekNumber,
        pickType: body.pickType,
        pickMode: body.pickMode,
        swapForDay: body.swapForDay,
      });
      if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
      pick = checked.start;
      dayNumber = pick.dayNumber;
      workoutType = pick.workoutType;
    }

    const openSessionId = markComplete
      ? null
      : await reuseOpenSession(user.id, Number(weekNumber), Number(dayNumber), track);
    if (openSessionId) {
      return NextResponse.json({ success: true, sessionId: openSessionId, alreadyOpen: true });
    }

    const result = await query(
      `INSERT INTO workout_sessions (user_id, week_number, day_number, workout_type, workout_mode, program_track, scheduled_date, started_at, is_completed, completed_at, ended_at, pick_type, pick_mode, swap_for_day)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ${markComplete ? 'NOW()' : 'NULL'}, ${markComplete ? 'NOW()' : 'NULL'}, ?, ?, ?)`,
      [
        user.id,
        weekNumber,
        dayNumber,
        workoutType,
        mode,
        track,
        scheduledDate,
        markComplete ? 1 : 0,
        pick?.pickType ?? null,
        pick?.pickMode ?? null,
        pick?.swapForDay ?? null,
      ]
    );

    if (markComplete) {
      const sessionId = Number(result.insertId);
      await updateDailyStats(sessionId, user.id);
      const awardedBadges = await checkAndAwardBadges(user.id);
      const all = await query(
        'SELECT week_number, is_completed FROM workout_sessions WHERE user_id = ?',
        [user.id]
      );
      const requiredForWeek = requiredCountForWeek(user.scheduleDaysPerWeek);
      const completedThisWeek = (all.rows as Array<{ week_number: number; is_completed: unknown }>).filter(
        (row) => Number(row.week_number) === Number(weekNumber) && Boolean(Number(row.is_completed))
      ).length;
      // Hyrox weeks (101+) have their own required-5 eligibility mechanism
      // (lib/hyroxState.ts) — never persist them into the normal program's
      // locked-weeks table, or they'd inflate the belt count.
      if (track === 'main') {
        await recordWeekLockIfNeeded(user.id, Number(weekNumber), completedThisWeek, requiredForWeek(Number(weekNumber)));
      }
      const locked = await lockedWeekCountFromTable(user.id);
      const thisWeekLocked = completedThisWeek >= requiredForWeek(Number(weekNumber));
      const earnedBelt = thisWeekLocked
        ? serializeBelt(getBelts(user.gender).find((item) => item.weeks === locked) || null, user.coachTone, user.name)
        : null;
      queueWorkoutCompleteEmails({
        userId: user.id,
        name: user.name,
        email: user.email,
        sessionId,
        weekNumber: Number(weekNumber),
        dayName: String(workoutType || ''),
        awarded: awardedBadges,
      });
      return NextResponse.json({
        success: true,
        sessionId,
        awardedBadges,
        bonus: true,
        earnedBelt,
      });
    }

    const inserted = Number(result.insertId);
    const kept =
      (await collapseEmptyTwins(user.id, Number(weekNumber), Number(dayNumber), track)) || inserted;
    return NextResponse.json({
      success: true,
      sessionId: kept,
      alreadyOpen: kept !== inserted,
    });
  } catch (error) {
    console.error('Error creating workout session:', error);
    return NextResponse.json({ error: 'Failed to create workout session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('weekNumber');
    const sessionId = searchParams.get('sessionId');
    const history = searchParams.get('history') === '1';

    if (history) {
      const sessionResult = await query(
        `SELECT id, week_number, day_number, workout_type, workout_mode,
                started_at, completed_at, ended_at, created_at,
                warmup_lbs, cooldown_lbs, optional_kicker_lbs,
                pick_type, pick_mode, swap_for_day, credit_lbs, session_hardness
         FROM workout_sessions
         WHERE user_id = ? AND is_completed = 1
         ORDER BY week_number, day_number, COALESCE(completed_at, created_at) DESC`,
        [user.id]
      );

      const sessions = sessionResult.rows as {
        id: number;
        week_number: number;
        day_number: number;
        workout_type: string;
        workout_mode: string | null;
        started_at: string | null;
        completed_at: string | null;
        ended_at: string | null;
        created_at: string | null;
        warmup_lbs?: number | null;
        cooldown_lbs?: number | null;
        optional_kicker_lbs?: number | null;
        pick_type?: string | null;
        pick_mode?: string | null;
        swap_for_day?: number | null;
        credit_lbs?: number | null;
        session_hardness?: number | null;
      }[];

      // The completed log's week-fold check (components/CompletedLog.tsx) needs the
      // same athlete-aware required-days + persisted-lock data WeekLock already gets
      // from the non-history branch below, or it always assumes the flat historical 4.
      const lockedWeeksDetail = await lockedWeekRecords(user.id);

      if (sessions.length === 0) {
        return NextResponse.json({ sessions: [], scheduleDays: user.scheduleDaysPerWeek, lockedWeeksDetail });
      }

      const ids = sessions.map((row) => row.id);
      const placeholders = ids.map(() => '?').join(', ');
      const setResult = await query(
        `SELECT workout_session_id, exercise_name, set_number, target_reps, actual_reps, weight_lbs
         FROM exercise_sets
         WHERE workout_session_id IN (${placeholders}) AND is_completed = 1
         ORDER BY workout_session_id, id, set_number`,
        ids
      );

      const setsBySession = new Map<number, typeof setResult.rows>();
      for (const row of setResult.rows as {
        workout_session_id: number;
        exercise_name: string;
        set_number: number;
        target_reps: string | null;
        actual_reps: number | null;
        weight_lbs: number | null;
      }[]) {
        const list = setsBySession.get(Number(row.workout_session_id)) || [];
        list.push(row);
        setsBySession.set(Number(row.workout_session_id), list);
      }

      return NextResponse.json({
        sessions: sessions.map((session) => ({
          ...session,
          sets: setsBySession.get(Number(session.id)) || [],
        })),
        scheduleDays: user.scheduleDaysPerWeek,
        lockedWeeksDetail,
      });
    }

    if (sessionId) {
      const sessionResult = await query(
        'SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?',
        [sessionId, user.id]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const exercises = await query(
        'SELECT * FROM exercise_sets WHERE workout_session_id = ? ORDER BY exercise_name, set_number',
        [sessionId]
      );

      return NextResponse.json({ session: sessionResult.rows[0], exercises: exercises.rows });
    }

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
    const [lockedWeeks, lockedWeeksDetail] = await Promise.all([
      lockedWeekCountFromTable(user.id),
      lockedWeekRecords(user.id),
    ]);
    return NextResponse.json({ sessions: result.rows, lockedWeeks, lockedWeeksDetail });
  } catch (error) {
    console.error('Error getting workout sessions:', error);
    return NextResponse.json({ error: 'Failed to get workout sessions' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { sessionId, isCompleted, notes, sessionHardness } = await request.json();

    const existing = await query(
      `SELECT id, week_number, day_number, workout_type, is_completed,
              warmup_lbs, cooldown_lbs, optional_kicker_lbs,
              pick_type, pick_mode, swap_for_day, started_at
       FROM workout_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, user.id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = existing.rows[0] as {
      id: number;
      week_number: number;
      day_number: number;
      workout_type: string;
      is_completed: number | boolean;
      warmup_lbs?: number | null;
      cooldown_lbs?: number | null;
      optional_kicker_lbs?: number | null;
      pick_type?: string | null;
      pick_mode?: string | null;
      swap_for_day?: number | null;
      started_at?: string | null;
    };
    const alreadyComplete = Boolean(Number(session.is_completed));
    let bonus = sessionIsBonus(session);
    // Your pick mark done needs 30 minutes of wall clock (docs/plans/PLAN_YOUR_PICK.md).
    if (isCompleted && !alreadyComplete && markDoneTooSoon(session)) {
      return NextResponse.json({ error: 'Mark done needs 30 minutes' }, { status: 400 });
    }
    const optionalLbs = sessionOptionalLbs(session);

    if (isCompleted) {
      await query(
        `DELETE FROM exercise_sets
         WHERE workout_session_id = ?
           AND (is_completed = 0 OR is_completed IS NULL)`,
        [sessionId]
      );
    }

    await query(
      `UPDATE workout_sessions 
       SET is_completed = ?, completed_at = ?, ended_at = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [isCompleted, isCompleted ? new Date() : null, isCompleted ? new Date() : null, notes, sessionId, user.id]
    );

    // Yoga/Core Your pick: store its credit before badges / daily stats read volume.
    if (isCompleted && !alreadyComplete) {
      await applyYourPickCredit(user.id, session, sessionHardness);
    }

    const awardedBadges = isCompleted && !alreadyComplete
      ? await checkAndAwardBadges(user.id)
      : [];

    if (isCompleted && !alreadyComplete) {
      void trackServerEvent({
        eventType: 'workout_complete',
        pageCategory: 'workout',
      });
      for (const badge of awardedBadges) {
        void trackServerEvent({
          eventType: 'badge_awarded',
          pageCategory: 'workout',
          articleSlug: badge.requirement_type,
          articleContext: badge.name,
        });
      }
      queueWorkoutCompleteEmails({
        userId: user.id,
        name: user.name,
        email: user.email,
        sessionId: Number(sessionId),
        weekNumber: Number(session.week_number),
        dayName: session.workout_type,
        awarded: awardedBadges,
      });
    }

    let uniqueBonusWeeks = 0;
    let earnedBelt = null;
    if (isCompleted) {
      await updateDailyStats(Number(sessionId), user.id);
      const all = await query(
        `SELECT week_number, day_number, workout_type, is_completed, pick_type, swap_for_day
         FROM workout_sessions WHERE user_id = ? AND program_track = ?`,
        [user.id, Number(session.week_number) > HYROX_WEEK_OFFSET ? 'hyrox' : 'main']
      );
      const rows = all.rows as Array<{
        week_number: number;
        day_number: number;
        workout_type: string;
        is_completed: number | boolean;
        pick_type: string | null;
        swap_for_day: number | null;
      }>;
      const requiredForWeek = requiredCountForWeek(user.scheduleDaysPerWeek);
      // Bonus = a retired bonus day, or a Your pick that took the week past its bar.
      uniqueBonusWeeks = bonusCount(rows, undefined, requiredForWeek);
      if (sessionIsYourPick(session)) {
        bonus = weekBonusDone(rows, Number(session.week_number), requiredForWeek(Number(session.week_number)));
      }
      const completedThisWeek = rows.filter(
        (row) => Number(row.week_number) === Number(session.week_number) && Boolean(Number(row.is_completed))
      ).length;
      const thisWeekLocked = completedThisWeek >= requiredForWeek(Number(session.week_number));
      // Same Hyrox exclusion as the POST path above.
      if (Number(session.week_number) <= HYROX_WEEK_OFFSET) {
        await recordWeekLockIfNeeded(
          user.id,
          Number(session.week_number),
          completedThisWeek,
          requiredForWeek(Number(session.week_number))
        );
      }
      if (!alreadyComplete && thisWeekLocked) {
        const locked = await lockedWeekCountFromTable(user.id);
        const belt = getBelts(user.gender).find((item) => item.weeks === locked);
        earnedBelt = serializeBelt(belt || null, user.coachTone, user.name);
      }
    }

    return NextResponse.json({
      success: true,
      awardedBadges,
      bonus,
      bonusCount: uniqueBonusWeeks,
      optionalLbs,
      kickerLbs: Number(session.optional_kicker_lbs || 0),
      earnedBelt,
    });
  } catch (error) {
    console.error('Error updating workout session:', error);
    return NextResponse.json({ error: 'Failed to update workout session' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const sessionId = Number(body.sessionId);
    const incomingModes = parseExerciseModes(body.exerciseModes ?? body.exercise_modes);
    const incomingAlts = parseExerciseAlts(body.exerciseAlts ?? body.exercise_alts);

    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const existing = await query(
      `SELECT id, week_number, day_number, workout_mode, is_completed, exercise_modes, exercise_alts
       FROM workout_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, user.id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = existing.rows[0] as {
      id: number;
      week_number: number;
      day_number: number;
      workout_mode: string | null;
      is_completed: number | boolean;
      exercise_modes?: unknown;
      exercise_alts?: unknown;
    };

    if (Boolean(Number(session.is_completed))) {
      return NextResponse.json({ error: 'Finished sessions cannot change exercise mode' }, { status: 400 });
    }

    const previousAlts = parseExerciseAlts(session.exercise_alts);
    const nextModes = { ...parseExerciseModes(session.exercise_modes), ...incomingModes };
    const nextAlts = { ...previousAlts, ...incomingAlts };

    await query('UPDATE workout_sessions SET exercise_modes = ?, exercise_alts = ? WHERE id = ? AND user_id = ?', [
      serializeExerciseModes(nextModes),
      serializeExerciseAlts(nextAlts),
      sessionId,
      user.id,
    ]);

    // Hyrox weeks (101+, see lib/hyroxProgram.ts) aren't in the normal program's static
    // array, so they need their own day lookup — same namespacing rule POST already uses.
    const day =
      Number(session.week_number) > HYROX_WEEK_OFFSET
        ? getHyroxWorkoutDay(Number(session.week_number), Number(session.day_number))
        : resolveSessionDay(Number(session.week_number), Number(session.day_number));
    const fallback = normalizeWorkoutMode(session.workout_mode);

    for (const exercise of day?.exercises || []) {
      // An Alt swap replaces the whole movement — it wins over Gym/Travel mode entirely.
      const altName = nextAlts[exercise.name];
      const mode = (nextModes[exercise.name] || fallback) as WorkoutMode;
      const displayName = altName || applyExerciseMode(exercise, mode).name;
      const previousAlt = previousAlts[exercise.name];
      const aliases = Array.from(
        new Set([...exerciseGroupNames(exercise.name), displayName, exercise.name, ...(previousAlt ? [previousAlt] : [])])
      );
      const placeholders = aliases.map(() => '?').join(', ');
      await query(
        `UPDATE exercise_sets
         SET exercise_name = ?
         WHERE workout_session_id = ?
           AND is_completed = 0
           AND exercise_name IN (${placeholders})`,
        [displayName, sessionId, ...aliases]
      );
    }

    return NextResponse.json({ success: true, exerciseModes: nextModes, exerciseAlts: nextAlts });
  } catch (error) {
    console.error('Error updating exercise modes:', error);
    return NextResponse.json({ error: 'Failed to update exercise modes' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const weekNumber = searchParams.get('weekNumber');
    const dayNumber = searchParams.get('dayNumber');
    const resetDay = searchParams.get('resetDay') === '1';

    if (resetDay && weekNumber && dayNumber) {
      const open = await query(
        `SELECT id FROM workout_sessions
         WHERE user_id = ?
           AND week_number = ?
           AND day_number = ?
           AND (is_completed = 0 OR is_completed IS NULL OR is_completed = FALSE)`,
        [user.id, weekNumber, dayNumber]
      );

      for (const row of open.rows as { id: number }[]) {
        await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [row.id]);
        await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [row.id, user.id]);
      }

      if (sessionId) {
        const owned = await query(
          'SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?',
          [sessionId, user.id]
        );
        if (owned.rows.length > 0) {
          await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [sessionId]);
          await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [sessionId, user.id]);
        }
      }

      return NextResponse.json({ success: true, deleted: open.rows.length });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const owned = await query(
      'SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?',
      [sessionId, user.id]
    );

    if (owned.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [sessionId]);
    await query('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [sessionId, user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout session:', error);
    return NextResponse.json({ error: 'Failed to delete workout session' }, { status: 500 });
  }
}
