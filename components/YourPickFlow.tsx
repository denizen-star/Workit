'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Play } from 'lucide-react';
import SetHardness from '@/components/SetHardness';
import VideoModal from '@/components/VideoModal';
import YourPickIcon from '@/components/YourPickIcon';
import { formatClock } from '@/lib/formatDuration';
import type { HardnessScore } from '@/lib/hardness';
import { youtubeThumbUrl } from '@/lib/exerciseMedia';
import {
  pickPhaseNote,
  pickSessionHardness,
  yourPickLabel,
  yourPickSteps,
  YOUR_PICK_DONE_MIN_SECONDS,
  type YourPickType,
} from '@/lib/yourPick';

type Progress = {
  /** Next hold to do (steps.length = all done). */
  index: number;
  /** Ratings for holds tapped complete. */
  tapped: number[];
  /** Holds the timer moved on from — covered by the one end rating. */
  timerHolds: number;
  endRating: number | null;
};

const EMPTY: Progress = { index: 0, tapped: [], timerHolds: 0, endRating: null };

/** Live flow state: saved progress plus the current hold's start and whether it's being rated. */
type Flow = Progress & { holdStartedAt: number; rating: boolean };

/** Per-viewer convenience only: survives a reload mid-flow. Never the source of truth. */
function storageKey(sessionId: number) {
  return `workit-yourpick-${sessionId}`;
}

function readProgress(sessionId: number): Progress {
  try {
    const raw = window.localStorage.getItem(storageKey(sessionId));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Progress) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeProgress(sessionId: number, progress: Progress) {
  const { index, tapped, timerHolds, endRating } = progress;
  try {
    window.localStorage.setItem(storageKey(sessionId), JSON.stringify({ index, tapped, timerHolds, endRating }));
  } catch {
    // Storage off (private window etc.) — the flow still works, it just won't survive a reload.
  }
}

/**
 * Yoga / Core Your pick live session (docs/plans/PLAN_YOUR_PICK.md), in place of the
 * exercise cards. Timed: tap through the week's holds — each moves on when its clock
 * runs out, or when tapped done (which asks a quick How hard for that hold). Mark done:
 * the flow is a guide, and the end How hard unlocks at 30 minutes. Reports the
 * session How hard up (`pickSessionHardness`) once Finish is allowed, else null.
 */
export default function YourPickFlow({
  sessionId,
  weekNumber,
  type,
  mode,
  startedAt,
  onReadyChange,
}: {
  sessionId: number;
  weekNumber: number;
  type: YourPickType;
  mode: 'timed' | 'done';
  /** Session start (ms) — mark done's 30-minute clock. */
  startedAt: number | null;
  onReadyChange: (sessionHardness: number | null) => void;
}) {
  const steps = useMemo(() => yourPickSteps(weekNumber, type), [weekNumber, type]);
  // Mounted keyed by session (app/workout/page.tsx), and only ever client-side (a live
  // session never server-renders), so saved progress can load in the initializer.
  const [flow, setFlow] = useState<Flow>(() => ({ ...readProgress(sessionId), holdStartedAt: Date.now(), rating: false }));
  const [now, setNow] = useState(() => Date.now());
  const [video, setVideo] = useState<{ title: string; videoId: string; body: string } | null>(null);
  const progress: Progress = flow;
  const { holdStartedAt, rating } = flow;

  // One clock tick a second. In timed mode it also moves on from a hold whose timer
  // ran out (unless the athlete is mid-rating it) — that hold joins the end rating.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (mode !== 'timed') return;
      setFlow((prev) => {
        const hold = steps[prev.index];
        if (!hold || prev.rating) return prev;
        const target = Number(hold.holdSeconds || 0);
        if (target <= 0 || tick - prev.holdStartedAt < target * 1000) return prev;
        const next = { ...prev, index: prev.index + 1, timerHolds: prev.timerHolds + 1, holdStartedAt: tick };
        writeProgress(sessionId, next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, steps, sessionId]);

  const save = (next: Progress) => {
    writeProgress(sessionId, next);
    setFlow({ ...next, holdStartedAt: Date.now(), rating: false });
  };
  const setRating = (value: boolean) => setFlow((prev) => ({ ...prev, rating: value }));

  const flowDone = mode === 'timed' && progress.index >= steps.length;
  const step = mode === 'timed' && !flowDone ? steps[progress.index] : null;
  const holdTarget = Number(step?.holdSeconds || 0);
  const holdLeft = Math.max(0, holdTarget - Math.floor((now - holdStartedAt) / 1000));
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const doneUnlocked = mode === 'done' && elapsed >= YOUR_PICK_DONE_MIN_SECONDS;

  const needsEndRating = mode === 'done' ? doneUnlocked : flowDone && progress.timerHolds > 0;
  const hardness =
    mode === 'done'
      ? doneUnlocked
        ? progress.endRating
        : null
      : flowDone
        ? pickSessionHardness(progress.tapped, progress.timerHolds, progress.endRating)
        : null;

  useEffect(() => {
    onReadyChange(hardness);
  }, [hardness, onReadyChange]);

  const media = (item: (typeof steps)[number]) =>
    item.start && item.end ? (
      <div className="mx-auto mt-4 grid w-full max-w-md grid-cols-2 gap-2">
        {[item.start, item.end].map((src, i) => (
          <figure key={src} className="overflow-hidden rounded-xl ring-1 ring-[#e8c547]/25">
            <img src={src} alt={`${item.title} ${i ? 'end' : 'start'} position`} className="aspect-[4/3] w-full object-cover" />
          </figure>
        ))}
      </div>
    ) : null;

  return (
    <section className="glass-card p-5 text-center">
      <p className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#e8c547]">
        <YourPickIcon /> Your pick · {yourPickLabel(type)} · {mode === 'timed' ? 'Timed' : 'Mark done'}
      </p>
      <p className="mt-2 text-sm text-[#f6f1e3]/60">{pickPhaseNote(weekNumber)}</p>

      {mode === 'timed' && step ? (
        <>
          <p className="mt-4 text-sm font-black text-[#f6f1e3]/70">
            {progress.index + 1} of {steps.length}
          </p>
          <p className="mt-3 text-6xl font-black tabular-nums text-[#e8c547]">{formatClock(holdLeft)}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <h2 className="text-3xl font-black text-white">{step.title}</h2>
            {step.videoId ? (
              <button
                type="button"
                onClick={() => setVideo({ title: step.title, videoId: step.videoId!, body: step.body })}
                className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-[#e8c547]/35"
                aria-label={`Watch ${step.title} video`}
              >
                <img src={youtubeThumbUrl(step.videoId)} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Play className="h-4 w-4 fill-white text-white" />
                </span>
              </button>
            ) : null}
          </div>
          {media(step)}
          <p className="mx-auto mt-4 max-w-md text-base text-[#f6f1e3]/85">{step.body}</p>
          {rating ? (
            <div className="mx-auto mt-4 max-w-md text-left">
              <p className="text-sm font-black text-white">How hard was that hold?</p>
              <SetHardness
                value={null}
                highlight
                onPick={(score: HardnessScore) =>
                  save({ ...progress, index: progress.index + 1, tapped: [...progress.tapped, score] })
                }
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRating(true)}
              className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
            >
              <Check className="h-6 w-6" />
              Done
            </button>
          )}
        </>
      ) : null}

      {mode === 'timed' && flowDone ? (
        <p className="mt-5 inline-flex items-center gap-2 text-xl font-black text-white">
          <Check className="h-6 w-6 text-[#6d8b6e]" strokeWidth={3} />
          All {steps.length} done
        </p>
      ) : null}

      {mode === 'done' ? (
        <>
          <p className="mt-4 inline-flex items-center gap-1 text-4xl font-black tabular-nums text-[#e8c547]">
            <Clock className="h-6 w-6" />
            {formatClock(elapsed)}
          </p>
          <p className="mt-2 text-sm text-[#f6f1e3]/60">
            {doneUnlocked
              ? 'Thirty minutes in. Rate it, then Finish it.'
              : `Done unlocks at ${Math.round(YOUR_PICK_DONE_MIN_SECONDS / 60)} minutes. Use the flow below as a guide.`}
          </p>
          <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-[#f6f1e3]/75">
            {steps.map((item, i) => (
              <li key={`${item.title}-${i}`}>
                {i + 1}. {item.title} · {Math.round(Number(item.holdSeconds || 0))}s
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {needsEndRating ? (
        <div className="mx-auto mt-5 max-w-md text-left">
          <p className="text-sm font-black text-white">How hard was the whole session?</p>
          <SetHardness
            value={(progress.endRating as HardnessScore | null) ?? null}
            forceEditable
            highlight={progress.endRating == null}
            onPick={(score: HardnessScore) =>
              setFlow((prev) => {
                const next = { ...prev, endRating: score };
                writeProgress(sessionId, next);
                return next;
              })
            }
          />
        </div>
      ) : null}

      <VideoModal
        open={Boolean(video)}
        title={video?.title || ''}
        videoId={video?.videoId || ''}
        how={video?.body || null}
        onClose={() => setVideo(null)}
      />
    </section>
  );
}
