'use client';

import { useEffect, useState } from 'react';
import { enablePush, notificationsDenied, pushSupport } from '@/lib/pushClient';
import {
  BACK_TO_BACK_WARNING,
  defaultWeekdaysFor,
  FOCUS_OPTIONS,
  hasBackToBackDays,
  hasFullBodyFocus,
  parseFocuses,
  scheduleDaysFromWeekdays,
  weekdaysSelectedCount,
  type Focus,
  type FocusInfo,
} from '@/lib/focus';
import { DEFAULT_REMINDER_TIME, formatReminderTime, REMINDER_DAY_LABELS } from '@/lib/reminderPrefs';
import { MAX_SCHEDULE_DAYS } from '@/lib/scheduleDays';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

type Loaded = { focusInfo: FocusInfo; scheduleDays: number; weekdays: string; remindersOn: boolean };

/**
 * Training setup (docs/plans/PLAN_FOCUS_ONBOARDING.md): pick one or more focuses (the week
 * alternates between them), then the weekdays to train on; a reminder goes out at 9am on those days if notifications are on. Home shows it
 * once to everyone (until `focus_chosen_at` is set) and the menu opens it any time. An
 * athlete who already trains can **Continue as is**. Reads and writes `/api/focus`.
 */
export default function FocusSetupTakeover({
  open,
  hasWorkouts,
  onDone,
  onClose,
}: {
  open: boolean;
  /** Has finished a workout already — offers Continue as is. */
  hasWorkouts: boolean;
  onDone: (info: FocusInfo, scheduleDays: number | null) => void;
  /** Present when the setup was opened on purpose (menu), so it can be dismissed. */
  onClose?: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [focuses, setFocuses] = useState<Focus[]>(['build']);
  const [weekdays, setWeekdays] = useState('0000000');
  const [remind, setRemind] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/focus')
      .then((response) => (response.ok ? (response.json() as Promise<Loaded>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setLoaded(data);
        setFocuses(parseFocuses(data.focusInfo.focuses));
        // Reminder days only mean "training days" once reminders were set up on purpose.
        setWeekdays(data.remindersOn ? data.weekdays : defaultWeekdaysFor(data.scheduleDays));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const count = weekdaysSelectedCount(weekdays);
  const workouts = scheduleDaysFromWeekdays(weekdays);
  /** Add or drop a focus; at least one always stays picked. */
  const toggleFocus = (id: Focus) =>
    setFocuses((current) =>
      current.includes(id) ? (current.length > 1 ? current.filter((item) => item !== id) : current) : parseFocuses([...current, id])
    );
  const toggleDay = (index: number) =>
    setWeekdays((current) => current.slice(0, index) + (current[index] === '1' ? '0' : '1') + current.slice(index + 1));

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'Could not save. Try again.');
    return data as { focusInfo: FocusInfo; scheduleDays?: number };
  };

  /** Asks this device for notifications (the tap is the gesture). True when pushes can reach it. */
  const allowNotifications = async () => {
    if (pushSupport() !== 'ready' || notificationsDenied()) return false;
    try {
      const keyResponse = await fetch('/api/push');
      const { publicKey } = (await keyResponse.json()) as { publicKey?: string };
      return Boolean(publicKey) && (await enablePush(publicKey as string)) === 'ok';
    } catch {
      return false;
    }
  };

  const save = async () => {
    if (count === 0) {
      setError('Pick at least one day.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const reachable = remind ? await allowNotifications() : false;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      const data = await post({ action: 'setup', focuses, weekdays, timeZone, remind: reachable });
      onDone(data.focusInfo, data.scheduleDays ?? null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save. Try again.');
      setBusy(false);
    }
  };

  const continueAsIs = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await post({ action: 'continue' });
      onDone(data.focusInfo, null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save. Try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#07070a]/95 px-4 py-8">
      <div className="relative w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">Your training</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-white">How do you want to train?</h2>
        <p className="mt-3 text-[#f6f1e3]/75">
          Pick one or more focuses and the days you will train. With more than one, your week alternates between them.
          You can change your mind any time from the menu.
        </p>

        <div role="group" aria-label="Training focus" className="mt-6 grid gap-3">
          {FOCUS_OPTIONS.map((option) => {
            const selected = focuses.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggleFocus(option.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected ? 'border-[#e8c547] bg-[#e8c547]/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="block text-lg font-black text-white">{option.label}</span>
                <span className="mt-1 block text-sm text-[#f6f1e3]/75">{option.description}</span>
                <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-[#f6f1e3]/50">
                  You need · {option.equipment}
                </span>
              </button>
            );
          })}
        </div>

        <h3 className="mt-8 text-lg font-black text-white">Which days will you train?</h3>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {DAY_LETTERS.map((letter, index) => {
            const on = weekdays[index] === '1';
            return (
              <button
                key={REMINDER_DAY_LABELS[index]}
                type="button"
                aria-pressed={on}
                aria-label={REMINDER_DAY_LABELS[index]}
                onClick={() => toggleDay(index)}
                className={`min-h-12 rounded-xl text-base font-black ${
                  on ? 'bg-[#e8c547] text-[#1a1404]' : 'border border-white/15 bg-white/5 text-[#f6f1e3]/70'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-[#f6f1e3]/75">
          {count === 0
            ? 'Pick at least one day.'
            : count > MAX_SCHEDULE_DAYS
              ? `${workouts} workouts lock your week (the most a week asks for).`
              : `${workouts} workout${workouts === 1 ? '' : 's'} a week locks your week.`}
        </p>

        {hasFullBodyFocus(focuses) && hasBackToBackDays(weekdays) ? (
          <p role="alert" className="mt-4 rounded-2xl border border-[#a35d52] bg-[#a35d52]/10 p-3 text-sm text-[#f6f1e3]">
            {BACK_TO_BACK_WARNING}
          </p>
        ) : null}

        <label className="mt-5 flex items-start gap-3 text-sm text-[#f6f1e3]/85">
          <input
            type="checkbox"
            checked={remind}
            onChange={(event) => setRemind(event.target.checked)}
            className="mt-1 h-5 w-5 accent-[#e8c547]"
          />
          <span>
            Remind me at {formatReminderTime(DEFAULT_REMINDER_TIME)} on
            these days. Needs notifications on this device.
          </span>
        </label>

        {error ? <p className="mt-4 text-sm font-semibold text-[#a35d52]">{error}</p> : null}

        <button
          type="button"
          disabled={busy || count === 0 || !loaded}
          onClick={save}
          className="mt-6 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404] disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        {hasWorkouts ? (
          <button
            type="button"
            disabled={busy}
            onClick={continueAsIs}
            className="mt-3 min-h-12 w-full rounded-2xl border border-white/15 text-base font-bold text-[#f6f1e3] disabled:opacity-50"
          >
            Continue as is
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 min-h-12 w-full text-base font-semibold text-[#f6f1e3]/60"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
