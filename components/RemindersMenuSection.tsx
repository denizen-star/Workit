'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, ChevronDown, X } from 'lucide-react';
import { HelpTip } from '@/components/HelpSheet';
import {
  deviceSubscription,
  enablePush,
  notificationsDenied,
  pushSupport,
  type PushSupport,
} from '@/lib/pushClient';
import { HOME_SCREEN_BEATS } from '@/lib/helpCopy';
import {
  REMINDER_DENIED_LINE,
  REMINDER_HELP,
  REMINDER_HOME_SCREEN_LEAD,
  REMINDER_SETUP_LINE,
  REMINDER_SKIP_NOTE,
  REMINDER_UNSUPPORTED_LINE,
} from '@/lib/reminderCopy';
import {
  formatReminderTime,
  REMINDER_DAY_LABELS,
  REMINDER_TIMES,
  type ReminderSettings,
} from '@/lib/reminderPrefs';

/** The section opens on its own for this many menu opens on a device, then starts folded. */
const OPEN_MENU_VIEWS = 2;
const MENU_VIEWS_KEY = 'workit-reminders-menu-views';

/** Counts this menu open on this device; true once it's past the first OPEN_MENU_VIEWS. */
function countMenuViewPastLimit(): boolean {
  try {
    const views = Number(window.localStorage.getItem(MENU_VIEWS_KEY) || 0) + 1;
    window.localStorage.setItem(MENU_VIEWS_KEY, String(views));
    return views > OPEN_MENU_VIEWS;
  } catch {
    return false;
  }
}

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
}

function postPush(body: Record<string, unknown>) {
  return fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Workout reminders, on their own at the top of the hamburger menu
 * (docs/plans/PLAN_PUSH_REMINDERS.md): on/off, time, days, Allow notifications, Send a test.
 * Until this device is subscribed with reminders on it leads with a gold setup line.
 * It renders open for the first two menu opens on a device, then folded to one line every
 * time after (localStorage count). ✕ folds it early (account-wide); tapping the line opens it.
 */
export default function RemindersMenuSection() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [support, setSupport] = useState<PushSupport>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  // Past the first two menu opens on this device: start folded (a tap still opens it).
  const [autoFolded, setAutoFolded] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    // The menu mounts this section on every open; the ref keeps dev Strict Mode from counting twice.
    if (!counted.current) {
      counted.current = true;
      setAutoFolded(countMenuViewPastLimit());
    }
    setSupport(pushSupport());
    setDenied(notificationsDenied());
    deviceSubscription()
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => setSubscribed(false));
    fetch('/api/push')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setPublicKey(data.publicKey ?? null);
        setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  if (!settings) return null;

  const setUp = subscribed && settings.on;

  /** Optimistic save; account-wide, stamped with this browser's time zone. */
  const save = (patch: Partial<Pick<ReminderSettings, 'on' | 'time' | 'days'>>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setStatus('');
    void postPush({ action: 'settings', on: next.on, time: next.time, days: next.days, timeZone: browserTimeZone() }).then(
      (res) => {
        if (!res.ok) setStatus('Could not save. Try again.');
      }
    );
  };

  const setFolded = (folded: boolean) => {
    setSettings({ ...settings, folded });
    void postPush({ action: 'fold', folded });
  };

  const allow = async () => {
    if (!publicKey) {
      setStatus('Reminders are not set up yet.');
      return;
    }
    setBusy(true);
    setStatus('');
    const result = await enablePush(publicKey);
    setBusy(false);
    if (result === 'ok') {
      setSubscribed(true);
      if (!settings.on) save({ on: true });
      setStatus('Notifications on for this device.');
    } else if (result === 'denied') {
      setDenied(notificationsDenied());
      setStatus(notificationsDenied() ? '' : 'Notifications were not allowed.');
    } else {
      setStatus('Could not turn on notifications. Try again.');
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setStatus('');
    const res = await postPush({ action: 'test' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setStatus(res.ok && data.sent > 0 ? 'Test sent. Check your notifications.' : data.error || 'No device got it. Tap Allow notifications again.');
  };

  if (settings.folded || autoFolded) {
    return (
      <div className="border-b border-white/10 py-1">
        <button
          type="button"
          onClick={() => {
            setAutoFolded(false);
            if (settings.folded) setFolded(false);
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5"
        >
          <Bell className="h-4 w-4 shrink-0 text-[#e8c547]" />
          <span className="min-w-0 flex-1">Reminders</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#f6f1e3]/45" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-2">
        {settings.on ? (
          <Bell className="h-4 w-4 shrink-0 text-[#e8c547]" aria-hidden />
        ) : (
          <BellOff className="h-4 w-4 shrink-0 text-[#f6f1e3]/45" aria-hidden />
        )}
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e8c547]">Reminders</p>
        <HelpTip label="About workout reminders" {...REMINDER_HELP} />
        <button
          type="button"
          aria-label="Fold reminders"
          onClick={() => setFolded(true)}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center text-[#f6f1e3]/45 hover:text-[#f6f1e3]/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!setUp ? <p className="mt-1 text-sm font-semibold text-[#e8c547]">{REMINDER_SETUP_LINE}</p> : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-black text-white">Remind me</span>
        <button
          type="button"
          role="switch"
          aria-checked={settings.on}
          aria-label="Workout reminders"
          onClick={() => save({ on: !settings.on })}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            settings.on ? 'bg-[#e8c547]' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-[#1a1404] transition-transform ${
              settings.on ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <label className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-[#f6f1e3]/65">
        Time
        <select
          value={settings.time}
          onChange={(event) => save({ time: event.target.value })}
          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm font-semibold text-white"
        >
          {REMINDER_TIMES.map((time) => (
            <option key={time} value={time}>
              {formatReminderTime(time)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-3">
        <legend className="text-sm font-semibold text-[#f6f1e3]/65">Days</legend>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {REMINDER_DAY_LABELS.map((label, index) => {
            const checked = settings.days[index] === '1';
            return (
              <label key={label} className="flex flex-col items-center gap-1 text-[11px] font-semibold text-[#f6f1e3]/75">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    save({
                      days: settings.days.slice(0, index) + (checked ? '0' : '1') + settings.days.slice(index + 1),
                    })
                  }
                  className="h-5 w-5 accent-[#e8c547]"
                />
                {label}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[#f6f1e3]/45">{REMINDER_SKIP_NOTE}</p>
      </fieldset>

      <div className="mt-3 space-y-2">
        {support === 'needs-home-screen' ? (
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs leading-relaxed text-[#f6f1e3]/75">
            <p className="font-semibold text-white">{REMINDER_HOME_SCREEN_LEAD}</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              {HOME_SCREEN_BEATS.map((beat) => (
                <li key={beat}>{beat}</li>
              ))}
            </ol>
          </div>
        ) : support === 'unsupported' ? (
          <p className="text-xs text-[#f6f1e3]/55">{REMINDER_UNSUPPORTED_LINE}</p>
        ) : denied ? (
          <p className="text-xs text-[#a35d52]">{REMINDER_DENIED_LINE}</p>
        ) : !subscribed ? (
          <button
            type="button"
            disabled={busy}
            onClick={allow}
            className="w-full rounded-xl bg-[#e8c547] px-4 py-2.5 text-sm font-black text-[#1a1404] disabled:opacity-60"
          >
            Allow notifications
          </button>
        ) : null}
        {subscribed ? (
          <button
            type="button"
            disabled={busy}
            onClick={sendTest}
            className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5 disabled:opacity-60"
          >
            Send a test
          </button>
        ) : null}
        {status ? <p className="text-xs text-[#f6f1e3]/65">{status}</p> : null}
      </div>
    </div>
  );
}
