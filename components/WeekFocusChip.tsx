'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import { FOCUS_OPTIONS, focusesLabel, parseFocuses, sameFocuses, type Focus, type FocusInfo, type Focuses } from '@/lib/focus';

/**
 * Home hero control (docs/plans/PLAN_FOCUS_ONBOARDING.md): the focuses of the athlete's
 * next unstarted week, with a sheet to pick different ones (one or more) for just that
 * week. Choosing their own default clears the override. The pill spans the card width,
 * text centered (it sits under the Effective number in `HomeHeroFooter`). A week that has started is never offered.
 */
export default function WeekFocusChip({
  weekNumber,
  weekLabel,
  focuses,
  defaultFocuses,
  onChanged,
}: {
  /** The unstarted program week this choice applies to. */
  weekNumber: number;
  /** "This week" when it is the week Home is on, else "Next week". */
  weekLabel: string;
  /** The focuses that week currently runs under. */
  focuses: Focuses;
  defaultFocuses: Focuses;
  onChanged: (info: FocusInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Focus[]>([...focuses]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: Focus) =>
    setPicked((current) =>
      current.includes(id) ? (current.length > 1 ? current.filter((item) => item !== id) : current) : parseFocuses([...current, id])
    );

  const save = async () => {
    if (sameFocuses(picked, focuses)) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'week', weekNumber, focuses: picked }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'Could not save. Try again.');
      onChanged(data.focusInfo as FocusInfo);
      setOpen(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPicked([...focuses]);
          setOpen(true);
        }}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#e8c547]/40 px-4 text-sm font-semibold text-[#e8c547]"
      >
        <Target className="h-4 w-4" />
        {weekLabel} · {focusesLabel(focuses)}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-[#14110a] p-5 sm:rounded-3xl">
            <h3 className="text-xl font-black text-white">
              Week {weekNumber} focus
            </h3>
            <p className="mt-1 text-sm text-[#f6f1e3]/70">
              Only this week. Pick one or more; the week alternates between them. Your usual: {focusesLabel(defaultFocuses)}.
            </p>
            <div className="mt-4 grid gap-2">
              {FOCUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="checkbox"
                  aria-checked={picked.includes(option.id)}
                  disabled={busy}
                  onClick={() => toggle(option.id)}
                  className={`rounded-2xl border p-3 text-left disabled:opacity-60 ${
                    picked.includes(option.id) ? 'border-[#e8c547] bg-[#e8c547]/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className="block font-black text-white">{option.label}</span>
                  <span className="block text-sm text-[#f6f1e3]/70">{option.description}</span>
                </button>
              ))}
            </div>
            {error ? <p className="mt-3 text-sm font-semibold text-[#a35d52]">{error}</p> : null}
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="mt-4 min-h-12 w-full rounded-2xl bg-[#e8c547] text-base font-black text-[#1a1404] disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 min-h-11 w-full text-base font-semibold text-[#f6f1e3]/60"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
