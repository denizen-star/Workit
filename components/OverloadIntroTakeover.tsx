'use client';

import { useEffect, useState } from 'react';
import { coachPersonaSrc } from '@/lib/coachPersonas';
import { pickOverloadLine } from '@/lib/coachLines';
import type { CoachTone } from '@/lib/coachTone';

interface OverloadIntroTakeoverProps {
  tone: CoachTone;
  name: string;
  onStart: () => void;
  onCancel: () => void;
  error?: string;
}

const STEPS: { title: string; body: string }[] = [
  {
    title: 'It starts Monday',
    body:
      'Week 1 opens on the next Monday. Until then, keep training your normal program. When you leave, your normal program picks back up further along, by the weeks you locked here.',
  },
  {
    title: 'What a week looks like',
    body:
      'Your days per week set the split: 1-3 days full body, 4 days upper/lower, 5 days upper/lower/push/pull/legs. Heavy lifts rest 3 minutes, secondary lifts 2, isolation 75 seconds.',
  },
  {
    title: 'How it climbs',
    body:
      'Weeks 1-2 find your weights at Fair. Weeks 3-4 go Hard. Weeks 5-6 push the last isolation set to failure. Hit the top of the rep range and the card tells you to add weight.',
  },
  {
    title: 'Three diplomas',
    body:
      'One when week 2 ends, one at week 4, one at week 6. Every week you lock here also counts toward your next belt.',
  },
];

/** Shown when an eligible athlete selects Overload Progressions (menu or `/home?overload=1`).
 * Fixed copy plus one coach line (`overload_start` bucket). */
export default function OverloadIntroTakeover({ tone, name, onStart, onCancel, error }: OverloadIntroTakeoverProps) {
  const [avatarSrc] = useState(() => coachPersonaSrc(tone, 'welcome'));
  const [line] = useState(() => pickOverloadLine('start', tone, name));

  useEffect(() => {
    try {
      navigator.vibrate?.(80);
    } catch {
      // Vibration is not available on every phone.
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto bg-[#07070a] px-5 py-10">
      <div className="mx-auto max-w-md">
        <img
          src={avatarSrc}
          alt=""
          className="mb-4 h-16 w-16 rounded-full border border-white/15 object-cover object-top"
        />
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Overload Progressions</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Six weeks of more</h2>
        <p className="mt-3 text-[#f6f1e3]/80">
          A 6-week muscle-building series that replaces your normal program while it&apos;s active. Same
          lifts you know, more weight every time you earn it.
        </p>
        {line ? <p className="mt-4 text-base font-bold italic text-[#f6f1e3]">{line}</p> : null}

        <ol className="mt-8 space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c547]/15 text-base font-black text-[#e8c547]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-[#f6f1e3]/80">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {error && (
          <p className="mt-6 rounded-xl border border-[#e4032e]/40 bg-[#e4032e]/10 px-4 py-3 text-sm font-bold text-[#ff5c6c]">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onStart}
          className="mt-8 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
        >
          Start Monday
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 block w-full text-center text-sm font-bold text-[#f6f1e3]/60"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
