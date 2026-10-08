'use client';

import { useRef } from 'react';
import type { CoachTone } from '@/lib/coachTone';
import { coachPersonaSrc, type CoachExpression } from '@/lib/coachPersonas';
import TapTakeover from '@/components/TapTakeover';

export default function WeekMissTakeover({
  open,
  line,
  tone,
  onClose,
  eyebrow = 'Last week · short',
  expression = 'mad',
  accent = '#a35d52',
}: {
  open: boolean;
  line: string;
  tone: CoachTone;
  onClose: () => void;
  /** Defaults are the missed-week roast; Test Drive's "Week 1 starts now" reuses this with its own. */
  eyebrow?: string;
  expression?: CoachExpression;
  accent?: string;
}) {
  // Fixed per mount so the photo doesn't re-roll a variant on unrelated re-renders.
  const avatarSrc = useRef(coachPersonaSrc(tone, expression)).current;
  const [title, ...rest] = line.split('\n');
  const body = rest.join('\n').trim();

  if (!open) return null;

  return (
    <TapTakeover onClose={onClose} glow={accent} glowOpacity={0.4} closeOnWindowKeys>
      <div className="relative max-w-xl text-center">
        <img
          src={avatarSrc}
          alt=""
          className="mx-auto mb-5 h-16 w-16 rounded-full border border-white/15 object-cover object-top shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
        />
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em]" style={{ color: accent }}>
          {eyebrow}
        </p>
        <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
          {title}
        </h2>
        {body ? (
          <p className="mt-6 text-xl font-black leading-snug text-[#f6f1e3] sm:text-2xl">{body}</p>
        ) : null}
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </TapTakeover>
  );
}
