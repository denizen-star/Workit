import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { updateDailyStats } from '@/lib/dailyStats';
import {
  OPTIONAL_SECONDS,
  OPTIONAL_SLOT_LBS,
  awardOptionalKicker,
  isGuidedOptionalTrack,
  isOptionalLevel,
  isOptionalSlot,
  isOptionalTrack,
  optionalElapsedSeconds,
  parseOptionalLevel,
  sessionOptionalLbs,
  type OptionalLevel,
  type OptionalSlot,
} from '@/lib/optionals';
import { checkAndAwardBadges } from '@/lib/badges';

type SessionOptional = {
  id: number;
  warmup_track: string | null;
  warmup_level: string | null;
  warmup_started_at: string | Date | null;
  warmup_completed_at: string | Date | null;
  warmup_lbs: number | null;
  cooldown_track: string | null;
  cooldown_level: string | null;
  cooldown_started_at: string | Date | null;
  cooldown_completed_at: string | Date | null;
  cooldown_lbs: number | null;
  optional_kicker_lbs: number | null;
  optional_kicker_at: string | Date | null;
};

function slotColumns(slot: OptionalSlot) {
  if (slot === 'warmup') {
    return {
      track: 'warmup_track',
      level: 'warmup_level',
      started: 'warmup_started_at',
      completed: 'warmup_completed_at',
      lbs: 'warmup_lbs',
    } as const;
  }
  return {
    track: 'cooldown_track',
    level: 'cooldown_level',
    started: 'cooldown_started_at',
    completed: 'cooldown_completed_at',
    lbs: 'cooldown_lbs',
  } as const;
}

function readLevel(track: string | null, raw: string | null) {
  if (!isGuidedOptionalTrack(track)) return null;
  return parseOptionalLevel(raw);
}

function readSlot(session: SessionOptional, slot: OptionalSlot) {
  if (slot === 'warmup') {
    return {
      track: session.warmup_track,
      level: readLevel(session.warmup_track, session.warmup_level),
      startedAt: session.warmup_started_at,
      completedAt: session.warmup_completed_at,
      lbs: Number(session.warmup_lbs || 0),
    };
  }
  return {
    track: session.cooldown_track,
    level: readLevel(session.cooldown_track, session.cooldown_level),
    startedAt: session.cooldown_started_at,
    completedAt: session.cooldown_completed_at,
    lbs: Number(session.cooldown_lbs || 0),
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const sessionId = Number(body.sessionId);
    const slot = body.slot;
    const action = String(body.action || 'start');
    const track = body.track;

    if (!sessionId || !isOptionalSlot(slot)) {
      return NextResponse.json({ error: 'Session and slot required' }, { status: 400 });
    }

    const owned = await query(
      `SELECT id, warmup_track, warmup_level, warmup_started_at, warmup_completed_at, warmup_lbs,
              cooldown_track, cooldown_level, cooldown_started_at, cooldown_completed_at, cooldown_lbs,
              optional_kicker_lbs, optional_kicker_at
       FROM workout_sessions
       WHERE id = ? AND user_id = ?`,
      [sessionId, user.id]
    );
    if (owned.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = owned.rows[0] as SessionOptional;
    const current = readSlot(session, slot);
    const columns = slotColumns(slot);

    if (action === 'start') {
      if (current.completedAt) {
        return NextResponse.json({
          success: true,
          alreadyComplete: true,
          slot,
          track: current.track,
          level: current.level,
          startedAt: current.startedAt,
          completedAt: current.completedAt,
          lbs: current.lbs,
          kickerLbs: Number(session.optional_kicker_lbs || 0),
          optionalLbs: sessionOptionalLbs(session),
        });
      }

      if (!isOptionalTrack(track)) {
        return NextResponse.json({ error: 'Pick a track' }, { status: 400 });
      }

      const level: OptionalLevel | null = isGuidedOptionalTrack(track)
        ? isOptionalLevel(body.level)
          ? body.level
          : null
        : null;
      if (isGuidedOptionalTrack(track) && !level) {
        return NextResponse.json({ error: 'Pick Easy, Medium, or Hard' }, { status: 400 });
      }

      if (current.startedAt) {
        return NextResponse.json({
          success: true,
          slot,
          track: current.track || track,
          level: current.level,
          startedAt: current.startedAt,
          remainingSeconds: Math.max(0, OPTIONAL_SECONDS - optionalElapsedSeconds(current.startedAt)),
          lbs: 0,
          kickerLbs: Number(session.optional_kicker_lbs || 0),
        });
      }

      await query(
        `UPDATE workout_sessions
         SET ${columns.track} = ?, ${columns.level} = ?, ${columns.started} = NOW()
         WHERE id = ? AND user_id = ?`,
        [track, level, sessionId, user.id]
      );
      const startedAt = new Date().toISOString();
      return NextResponse.json({
        success: true,
        slot,
        track,
        level,
        startedAt,
        remainingSeconds: OPTIONAL_SECONDS,
        lbs: 0,
        kickerLbs: Number(session.optional_kicker_lbs || 0),
      });
    }

    if (action === 'complete') {
      if (current.completedAt) {
        return NextResponse.json({
          success: true,
          alreadyComplete: true,
          slot,
          track: current.track,
          level: current.level,
          startedAt: current.startedAt,
          completedAt: current.completedAt,
          lbs: current.lbs,
          kickerLbs: Number(session.optional_kicker_lbs || 0),
          optionalLbs: sessionOptionalLbs(session),
        });
      }

      if (!current.startedAt) {
        return NextResponse.json({ error: 'Start this Optional first' }, { status: 400 });
      }

      const circuitComplete =
        isGuidedOptionalTrack(current.track) && body.circuitComplete === true;
      // Stretch/core credit when all holds are done. Run/bike still need 10 minutes.
      // Small slack so a slow POST after the clock hits zero still counts.
      if (!circuitComplete && optionalElapsedSeconds(current.startedAt) < OPTIONAL_SECONDS - 5) {
        return NextResponse.json(
          {
            error: 'Ten minutes first',
            remainingSeconds: Math.max(0, OPTIONAL_SECONDS - optionalElapsedSeconds(current.startedAt)),
          },
          { status: 400 }
        );
      }

      await query(
        `UPDATE workout_sessions
         SET ${columns.completed} = NOW(), ${columns.lbs} = ?
         WHERE id = ? AND user_id = ?`,
        [OPTIONAL_SLOT_LBS, sessionId, user.id]
      );

      const kickerLbs = await awardOptionalKicker(user.id, sessionId);
      await updateDailyStats(sessionId, user.id);
      const awardedBadges = await checkAndAwardBadges(user.id);

      const updated = await query(
        `SELECT warmup_lbs, cooldown_lbs, optional_kicker_lbs, ${columns.completed} as completed_at
         FROM workout_sessions WHERE id = ? AND user_id = ?`,
        [sessionId, user.id]
      );
      const row = updated.rows[0] as {
        warmup_lbs: number;
        cooldown_lbs: number;
        optional_kicker_lbs: number;
        completed_at: string;
      };

      return NextResponse.json({
        success: true,
        slot,
        track: current.track,
        level: current.level,
        completedAt: row.completed_at,
        lbs: OPTIONAL_SLOT_LBS,
        kickerLbs,
        optionalLbs: sessionOptionalLbs(row),
        awardedBadges,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating Optional:', error);
    return NextResponse.json({ error: 'Failed to update Optional' }, { status: 500 });
  }
}
