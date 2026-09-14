'use client';

import { useEffect, useState } from 'react';
import { coachPersonaSrc } from '@/lib/coachPersonas';
import type { CoachTone } from '@/lib/coachTone';

interface HyroxIntroTakeoverProps {
  tone: CoachTone;
  name: string;
  onStart: () => void;
  onCancel: () => void;
  error?: string;
}

/** Shown once when an eligible athlete selects Hyrox Training. Fixed copy — three
 * things, no more: it starts Monday, what a workout looks like, and the Milestone 1
 * challenge that gates Phase 2. */
export default function HyroxIntroTakeover({ tone, name: _name, onStart, onCancel, error }: HyroxIntroTakeoverProps) {
  const [avatarSrc] = useState(() => coachPersonaSrc(tone, 'welcome'));

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
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Hyrox Training</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Welcome to Hyrox Training</h2>
        <p className="mt-3 text-[#f6f1e3]/80">
          A 4-milestone, 16-week track that replaces your normal program while it&apos;s active: running
          volume, station work, and four self-tested milestones that build toward a Hyrox race.
        </p>

        <ol className="mt-8 space-y-4">
          <li className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c547]/15 text-base font-black text-[#e8c547]">1</span>
              <div>
                <h3 className="text-lg font-black text-white">It starts Monday</h3>
                <p className="mt-1 text-sm text-[#f6f1e3]/80">
                  Week 1, Day 1 opens next Monday. Your normal program pauses right where you left it —
                  you pick it back up the moment you leave Hyrox, further along than you left it.
                </p>
              </div>
            </div>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c547]/15 text-base font-black text-[#e8c547]">2</span>
              <div>
                <h3 className="text-lg font-black text-white">What a workout looks like</h3>
                <p className="mt-1 text-sm text-[#f6f1e3]/80">
                  Four training days a week: a run, a lower-body + sled day, an upper-body day with a
                  compromised-running circuit, and a full-body conditioning finisher.
                </p>
              </div>
            </div>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c547]/15 text-base font-black text-[#e8c547]">3</span>
              <div>
                <h3 className="text-lg font-black text-white">Accept the challenge</h3>
                <p className="mt-1 text-sm text-[#f6f1e3]/80">
                  In four weeks from now, you will complete a 5K run, then two short stations. Stay steady.
                  That is the pass to the next phase.
                </p>
              </div>
            </div>
          </li>
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
