'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CoachTone } from '@/lib/coachTone';
import { coachPersonaSrc, type CoachExpression } from '@/lib/coachPersonas';

export interface CoachMoment {
  tone: CoachTone;
  expression: CoachExpression;
  kicker: string;
  title: string;
  body: string;
}

type QueuedMoment = CoachMoment & { src: string };

export interface CoachBubbleHandle {
  /** Queue a coach moment. Shows immediately if the dock is idle, otherwise waits its turn. */
  announce: (moment: CoachMoment) => void;
}

interface CoachBubbleProps {
  /** The session's coach, for the idle avatar shown before any moment has fired. */
  tone: CoachTone;
  /** Measured pixel height of SetRestTimer's open banner (0 when it's closed). The dock
   * sits this many pixels above the bottom edge instead of a guessed constant, so it
   * never ends up underneath — or, if the banner is short, needlessly far above — it. */
  liftPx?: number;
}

const DISMISS_MS = 7000;
const FADE_MS = 260;

/**
 * Persistent circular coach avatar docked bottom-right during a live session, with a
 * glassmorphic bubble that opens beside it for each coaching moment and fades on its own
 * after five seconds. Announced moments queue rather than overwrite one another. Tapping the
 * avatar while idle replays the last moment shown.
 */
const CoachBubble = forwardRef<CoachBubbleHandle, CoachBubbleProps>(function CoachBubble(
  { tone, liftPx = 0 },
  ref
) {
  // Fixed once on mount so the idle face doesn't re-roll a new random variant on every render.
  const idleSrc = useRef(coachPersonaSrc(tone, 'happy')).current;
  const [current, setCurrent] = useState<QueuedMoment | null>(null);
  const [visible, setVisible] = useState(false);
  const [last, setLast] = useState<QueuedMoment | null>(null);
  const queue = useRef<QueuedMoment[]>([]);
  const active = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = () => {
    const next = queue.current.shift();
    if (!next) {
      active.current = false;
      return;
    }
    active.current = true;
    setCurrent(next);
    setLast(next);
    setVisible(true);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(advance, DISMISS_MS);
  };

  // A message's display time is up. If another one is already queued, swap straight
  // into it — the dock stays visible the whole time, no fade-to-nothing in between —
  // and only fades away once there's truly nothing left to show.
  const advance = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    if (queue.current.length > 0) {
      showNext();
      return;
    }
    dismiss();
  };

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setVisible(false);
    // Let the fade/blur play before pulling the next moment off the queue.
    setTimeout(() => {
      setCurrent(null);
      showNext();
    }, FADE_MS);
  };

  useImperativeHandle(ref, () => ({
    announce: (moment) => {
      let src = '';
      try {
        src = coachPersonaSrc(moment.tone, moment.expression);
      } catch (error) {
        console.error('Error resolving coach persona image:', error);
      }
      queue.current.push({ ...moment, src });
      // If this throws for any reason, `active` must not get stuck mid-flip — a bad
      // moment would otherwise silently wedge every one announced after it, only
      // recoverable by tapping the dock (which goes through a different path).
      if (!active.current) {
        try {
          showNext();
        } catch (error) {
          console.error('Error showing coach moment:', error);
          active.current = false;
        }
      }
    },
  }));

  useEffect(
    () => () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    },
    []
  );

  const replay = () => {
    if (active.current || !last) return;
    queue.current.unshift(last);
    showNext();
  };

  const avatarSrc = current?.src ?? last?.src ?? idleSrc;

  return (
    <div
      className="fixed right-4 z-30 transition-[bottom] duration-200"
      style={{
        bottom: liftPx > 0 ? `calc(${liftPx}px + 12px)` : 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {current ? (
        <div
          role="button"
          tabIndex={0}
          onClick={dismiss}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') dismiss();
          }}
          className={`glass-card absolute bottom-0 right-[112px] w-[min(300px,calc(100vw-180px))] cursor-pointer rounded-2xl rounded-br-md px-4 py-3.5 text-left transition-all duration-200 ${
            visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0 blur-sm'
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e8c547]">{current.kicker}</p>
          <h4 className="get-to-it-text mt-1.5 text-base font-black leading-tight text-[#f6f1e3]">
            {current.title}
          </h4>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#f6f1e3]/95">{current.body}</p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={replay}
        aria-label="Replay last coach message"
        className="block h-24 w-24 overflow-hidden rounded-full border-2 border-white/15 shadow-[0_8px_26px_rgba(0,0,0,0.55)]"
      >
        <img
          src={avatarSrc}
          alt=""
          className={`h-full w-full object-cover object-top transition-opacity duration-[260ms] ${
            current && !visible ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </button>
    </div>
  );
});

export default CoachBubble;
