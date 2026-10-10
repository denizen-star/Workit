'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, FastForward, Play } from 'lucide-react';
import SetHardness from '@/components/SetHardness';
import YourPickIcon from '@/components/YourPickIcon';
import { circuitTemplateForDay } from '@/lib/circuits';
import { formatClock } from '@/lib/formatDuration';
import type { HardnessScore } from '@/lib/hardness';
import { playSetChime, unlockAudio } from '@/lib/playChime';

type Interval = { phase: 'work' | 'rest'; move: number; round: number; seconds: number };

type Progress = {
  /** Next interval to do (intervals.length = all done). */
  index: number;
  endRating: number | null;
};

const EMPTY: Progress = { index: 0, endRating: null };

/** Per-viewer convenience only: survives a reload mid-session. Never the source of truth. */
const storageKey = (sessionId: number) => `workit-hiit-${sessionId}`;

function readProgress(sessionId: number): Progress {
  try {
    const raw = window.localStorage.getItem(storageKey(sessionId));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Progress) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeProgress(sessionId: number, progress: Progress) {
  try {
    window.localStorage.setItem(storageKey(sessionId), JSON.stringify(progress));
  } catch {
    // Storage off (private window etc.) — it still works, it just won't survive a reload.
  }
}

/**
 * HIIT Your pick live session (docs/plans/PLAN_CIRCUITS.md), in place of the exercise cards.
 * Easy timed intervals: each move's work clock auto-advances into a short rest and then the
 * next move, round after round, with a manual Next always available. Nothing is logged per
 * move; when the last interval ends the athlete rates the whole session (How hard), which
 * unlocks Finish and is what `applyYourPickCredit` scores (an average lifting session,
 * like Yoga/Core). Reports that rating up through `onReadyChange`, else null.
 */
export default function HiitFlow({
  sessionId,
  dayNumber,
  onReadyChange,
}: {
  sessionId: number;
  dayNumber: number;
  onReadyChange: (sessionHardness: number | null) => void;
}) {
  const template = circuitTemplateForDay(dayNumber);
  const hiit = template?.kind === 'hiit' ? template : null;

  // Work, then rest, for every move, every round — no rest after the very last work interval.
  const intervals = useMemo<Interval[]>(() => {
    if (!hiit) return [];
    const list: Interval[] = [];
    for (let round = 1; round <= hiit.rounds; round += 1) {
      hiit.moves.forEach((_, move) => {
        list.push({ phase: 'work', move, round, seconds: hiit.workSeconds });
        list.push({ phase: 'rest', move, round, seconds: hiit.restSeconds });
      });
    }
    list.pop();
    return list;
  }, [hiit]);

  // Mounted keyed by session (app/workout/page.tsx) and only client-side, so saved progress
  // can load in the initializer. A resumed session waits on Start again.
  const [progress, setProgress] = useState<Progress>(() => readProgress(sessionId));
  const [running, setRunning] = useState(false);
  const [intervalStart, setIntervalStart] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const save = (next: Progress) => {
    writeProgress(sessionId, next);
    setProgress(next);
  };
  const advance = () => {
    playSetChime();
    setIntervalStart(Date.now());
    setProgress((prev) => {
      const next = { ...prev, index: prev.index + 1 };
      writeProgress(sessionId, next);
      return next;
    });
  };

  // One tick a half-second; the current interval ends on wall clock, so a locked phone catches up.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      const current = intervals[progress.index];
      if (current && tick - intervalStart >= current.seconds * 1000) advance();
    }, 500);
    return () => window.clearInterval(timer);
    // `advance` only reads state through setters and refs-by-closure of stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, intervals, progress.index, intervalStart]);

  const finished = progress.index >= intervals.length && intervals.length > 0;
  const current = finished ? null : intervals[progress.index];
  const left = current ? Math.min(current.seconds, Math.max(0, current.seconds - Math.floor((now - intervalStart) / 1000))) : 0;
  const hardness = finished ? progress.endRating : null;

  useEffect(() => {
    onReadyChange(hardness);
  }, [hardness, onReadyChange]);

  if (!hiit) return null;

  const move = current ? hiit.moves[current.move] : null;
  // During rest, preview what is coming: the next move (or the first of the next round).
  const upcoming = current?.phase === 'rest' ? hiit.moves[(current.move + 1) % hiit.moves.length] : null;

  return (
    <section className="glass-card p-5 text-center">
      <p className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#e8c547]">
        <YourPickIcon /> Your pick · HIIT
      </p>
      <p className="mt-2 text-sm text-[#f6f1e3]/60">
        {hiit.workSeconds}s on, {hiit.restSeconds}s off. Easy effort. You could still talk.
      </p>

      {current && move && !running ? (
        <>
          <p className="mt-6 text-lg font-black text-white">
            {hiit.rounds} rounds · {hiit.moves.length} moves
          </p>
          <ul className="mx-auto mt-3 max-w-md space-y-1 text-left text-sm text-[#f6f1e3]/75">
            {hiit.moves.map((item, i) => (
              <li key={item.title}>
                {i + 1}. {item.title}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setIntervalStart(Date.now());
              setNow(Date.now());
              setRunning(true);
            }}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
          >
            <Play className="h-5 w-5 fill-[#1a1404]" />
            {progress.index > 0 ? 'Resume' : 'Start'}
          </button>
        </>
      ) : null}

      {current && move && running ? (
        <>
          <p className="mt-4 text-sm font-black text-[#f6f1e3]/70">
            Round {current.round} of {hiit.rounds} · Move {current.move + 1} of {hiit.moves.length}
          </p>
          <p
            className={`mt-1 text-xs font-black uppercase tracking-[0.3em] ${
              current.phase === 'work' ? 'text-[#e8c547]' : 'text-[#6d8b6e]'
            }`}
          >
            {current.phase === 'work' ? 'Work' : 'Rest'}
          </p>
          <p className="mt-1 text-7xl font-black tabular-nums text-[#e8c547]">{formatClock(left)}</p>
          <h2 className="mt-4 text-3xl font-black text-white">{current.phase === 'work' ? move.title : 'Breathe'}</h2>
          <p className="mx-auto mt-3 max-w-md text-base text-[#f6f1e3]/85">
            {current.phase === 'work' ? move.body : upcoming ? `Next: ${upcoming.title}` : ''}
          </p>
          <button
            type="button"
            onClick={advance}
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 text-sm font-black text-[#f6f1e3]"
          >
            <FastForward className="h-4 w-4" />
            {current.phase === 'work' ? 'Next' : 'Skip rest'}
          </button>
        </>
      ) : null}

      {finished ? (
        <>
          <p className="mt-5 inline-flex items-center gap-2 text-xl font-black text-white">
            <Check className="h-6 w-6 text-[#6d8b6e]" strokeWidth={3} />
            All {hiit.rounds} rounds done
          </p>
          <div className="mx-auto mt-5 max-w-md text-left">
            <p className="text-sm font-black text-white">How hard was the whole session?</p>
            <SetHardness
              value={(progress.endRating as HardnessScore | null) ?? null}
              forceEditable
              highlight={progress.endRating == null}
              onPick={(score: HardnessScore) => save({ ...progress, endRating: score })}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
