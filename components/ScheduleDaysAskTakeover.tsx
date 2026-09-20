'use client';

import { useEffect, useState } from 'react';
import { clampScheduleDays, DEFAULT_SCHEDULE_DAYS, MAX_SCHEDULE_DAYS, MIN_SCHEDULE_DAYS } from '@/lib/scheduleDays';

/** Every 6 program weeks, Home asks whether the athlete's chosen training
 * frequency still fits. Ignoring it (tap outside, or just closing) keeps the
 * current count and doesn't resurface until the next boundary. */
export default function ScheduleDaysAskTakeover({
  open,
  currentDays,
  onDone,
}: {
  open: boolean;
  currentDays: number;
  /** Called with the chosen count whether or not it changed — the caller marks
   * the checkpoint asked either way. */
  onDone: (days: number) => void;
}) {
  const [days, setDays] = useState(clampScheduleDays(currentDays));

  useEffect(() => {
    if (open) setDays(clampScheduleDays(currentDays));
  }, [open, currentDays]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#07070a]/95 px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#e8c547]/25 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
          Six weeks in
        </p>
        <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
          Still the right pace?
        </h2>
        <p className="mt-4 text-[#f6f1e3]/75">
          You&rsquo;re set to train {days} day{days === 1 ? '' : 's'} a week. Keep it, or change it here
          &mdash; you can always change it later in Edit profile.
        </p>
        <div className="mt-8">
          <p className="text-lg font-black text-white">
            {days}
            {days === DEFAULT_SCHEDULE_DAYS ? ' (recommended)' : ''}
          </p>
          <input
            type="range"
            min={MIN_SCHEDULE_DAYS}
            max={MAX_SCHEDULE_DAYS}
            step={1}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="mt-3 w-full accent-[#e8c547]"
          />
        </div>
        <button
          type="button"
          onClick={() => onDone(days)}
          className="mt-8 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
        >
          Save &amp; continue
        </button>
      </div>
    </div>
  );
}
