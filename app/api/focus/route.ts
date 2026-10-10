import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireCurrentUser, updateScheduleDaysPerWeek } from '@/lib/auth';
import { isFocus, parseFocuses, scheduleDaysFromWeekdays, weekdaysSelectedCount } from '@/lib/focus';
import { loadFocusInfo, markFocusSeen, saveFocus, saveWeekFocus, weekHasSessions } from '@/lib/focusState';
import { loadReminderSettings, saveReminderSettings } from '@/lib/pushReminders';
import { DEFAULT_REMINDER_TIME, isValidReminderDays, isValidTimeZone } from '@/lib/reminderPrefs';
import { MAIN_PROGRAM_WEEKS } from '@/lib/programTrack';
import { trackServerEvent } from '@/lib/trackServerEvent';

// Focus setup (docs/plans/PLAN_FOCUS_ONBOARDING.md). Session-gated by middleware.

function authError(error: unknown, fallback: string) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

/** GET — the athlete's focus, their weekly workout count, and the weekdays they train. */
export async function GET() {
  try {
    const user = await requireCurrentUser();
    const [focusInfo, reminders] = await Promise.all([loadFocusInfo(user.id), loadReminderSettings(user.id)]);
    return NextResponse.json({
      focusInfo,
      scheduleDays: user.scheduleDaysPerWeek,
      weekdays: reminders.days,
      remindersOn: reminders.on,
    });
  } catch (error) {
    return authError(error, 'Failed to load focus');
  }
}

/** The focuses a request names: a non-empty list of valid ids, else null. */
function pickedFocuses(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isFocus)) return null;
  return parseFocuses(value);
}

type FocusBody = {
  action?: string;
  /** One or more focus ids. */
  focuses?: unknown;
  weekdays?: unknown;
  timeZone?: unknown;
  remind?: unknown;
  weekNumber?: unknown;
};

/**
 * POST { action } —
 * `setup` { focuses, weekdays, timeZone, remind } — the wizard / menu chooser: saves the
 *   default focuses (one or more; the week alternates between them), derives the weekly workout count from the chosen weekdays, and points
 *   the reminder push at those days (9am unless reminders were already on with a time).
 *   `remind` is true only once the athlete allowed notifications on this device.
 * `continue` — "Continue as is": marks the setup seen, changes nothing else.
 * `week` { weekNumber, focuses } — the focuses of a week with no session yet.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = ((await request.json().catch(() => ({}))) ?? {}) as FocusBody;

    switch (body.action) {
      case 'setup': {
        const focuses = pickedFocuses(body.focuses);
        if (!focuses) return NextResponse.json({ error: 'Pick a focus' }, { status: 400 });
        if (!isValidReminderDays(body.weekdays) || weekdaysSelectedCount(body.weekdays) === 0) {
          return NextResponse.json({ error: 'Pick at least one day' }, { status: 400 });
        }
        if (!isValidTimeZone(body.timeZone)) return NextResponse.json({ error: 'Bad time zone' }, { status: 400 });
        const scheduleDays = scheduleDaysFromWeekdays(body.weekdays);
        const before = await loadReminderSettings(user.id);
        await saveFocus(user.id, focuses);
        await updateScheduleDaysPerWeek(user.id, scheduleDays);
        await saveReminderSettings(user.id, {
          on: body.remind === true || before.on,
          // An athlete who already set a reminder time keeps it; a new setup is 9am.
          time: before.on ? before.time : DEFAULT_REMINDER_TIME,
          timeZone: body.timeZone,
          days: body.weekdays,
        });
        void trackServerEvent({ eventType: 'focus_setup', pageCategory: 'focus', ctaType: focuses.join('+') });
        return NextResponse.json({ focusInfo: await loadFocusInfo(user.id), scheduleDays });
      }
      case 'continue': {
        await markFocusSeen(user.id);
        void trackServerEvent({ eventType: 'focus_continue', pageCategory: 'focus', ctaType: 'continue' });
        return NextResponse.json({ focusInfo: await loadFocusInfo(user.id) });
      }
      case 'week': {
        const week = Number(body.weekNumber);
        const focuses = pickedFocuses(body.focuses);
        if (!focuses) return NextResponse.json({ error: 'Pick a focus' }, { status: 400 });
        if (!Number.isInteger(week) || week < MAIN_PROGRAM_WEEKS.first || week > MAIN_PROGRAM_WEEKS.last) {
          return NextResponse.json({ error: 'Pick a program week' }, { status: 400 });
        }
        // A week that has started keeps the workouts it started with.
        if (await weekHasSessions(user.id, week)) {
          return NextResponse.json({ error: 'That week has already started' }, { status: 400 });
        }
        const current = await loadFocusInfo(user.id);
        await saveWeekFocus(user.id, week, focuses, current.focuses);
        void trackServerEvent({ eventType: 'focus_week', pageCategory: 'focus', ctaType: focuses.join('+') });
        return NextResponse.json({ focusInfo: await loadFocusInfo(user.id) });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return authError(error, 'Failed to save focus');
  }
}
