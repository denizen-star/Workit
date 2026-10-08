'use client';

import { useEffect, useState } from 'react';
import { coachPersonaSrc } from '@/lib/coachPersonas';
import { pickOverloadLine } from '@/lib/coachLines';
import type { CoachTone } from '@/lib/coachTone';
import type { OptInTrack } from '@/lib/programTrack';

type IntroCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  steps: { title: string; body: string }[];
  /** Optional coach line under the lead. */
  line?: (tone: CoachTone, name: string) => string;
};

/** Fixed copy per More program (docs/plans/PLAN_MORE_PROGRAMS.md). */
const INTRO_COPY: Record<OptInTrack, IntroCopy> = {
  hyrox: {
    eyebrow: 'Hyrox Training',
    title: 'Welcome to Hyrox Training',
    lead: "A 4-milestone, 16-week track that replaces your normal program while it's active: running volume, station work, and four self-tested milestones that build toward a Hyrox race.",
    steps: [
      {
        title: 'It starts Monday',
        body: 'Week 1, Day 1 opens next Monday. Your normal program pauses right where you left it — you pick it back up the moment you leave Hyrox, further along than you left it.',
      },
      {
        title: 'What a workout looks like',
        body: 'Four training days a week: a run, a lower-body + sled day, an upper-body day with a compromised-running circuit, and a full-body conditioning finisher.',
      },
      {
        title: 'Accept the challenge',
        body: 'In four weeks from now, you will complete a 5K run, then two short stations. Stay steady. That is the pass to the next phase.',
      },
    ],
  },
  overload: {
    eyebrow: 'Overload Progressions',
    title: 'Six weeks of more',
    lead: "A 6-week muscle-building series that replaces your normal program while it's active. Same lifts you know, more weight every time you earn it.",
    steps: [
      {
        title: 'It starts Monday',
        body: 'Week 1 opens on the next Monday. Until then, keep training your normal program. When you leave, your normal program picks back up further along, by the weeks you locked here.',
      },
      {
        title: 'What a week looks like',
        body: 'Your days per week set the split: 1-3 days full body, 4 days upper/lower, 5 days upper/lower/push/pull/legs. Heavy lifts rest 3 minutes, secondary lifts 2, isolation 75 seconds.',
      },
      {
        title: 'How it climbs',
        body: 'Weeks 1-2 find your weights at Fair. Weeks 3-4 go Hard. Weeks 5-6 push the last isolation set to failure. Hit the top of the rep range and the card tells you to add weight.',
      },
      {
        title: 'Three diplomas',
        body: 'One when week 2 ends, one at week 4, one at week 6. Every week you lock here also counts toward your next belt.',
      },
    ],
    line: (tone, name) => pickOverloadLine('start', tone, name),
  },
};

interface ProgramIntroTakeoverProps {
  track: OptInTrack;
  tone: CoachTone;
  name: string;
  onStart: () => void;
  onCancel: () => void;
  error?: string;
}

/** Shown when an eligible athlete selects a More program (menu, banner, or
 * `/home?program=<track>`): what it is, when it starts, how it works. */
export default function ProgramIntroTakeover({ track, tone, name, onStart, onCancel, error }: ProgramIntroTakeoverProps) {
  const copy = INTRO_COPY[track];
  const [avatarSrc] = useState(() => coachPersonaSrc(tone, 'welcome'));
  const [line] = useState(() => copy.line?.(tone, name) ?? null);

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
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">{copy.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{copy.title}</h2>
        <p className="mt-3 text-[#f6f1e3]/80">{copy.lead}</p>
        {line ? <p className="mt-4 text-base font-bold italic text-[#f6f1e3]">{line}</p> : null}

        <ol className="mt-8 space-y-4">
          {copy.steps.map((step, index) => (
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
