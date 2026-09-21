"use client";

import { useEffect, useRef, useState } from "react";
import { armSetAlarm, cancelSetAlarm, playSetChime, unlockAudio } from "@/lib/playChime";

type Phase = "ready" | "down" | "up";

interface TimedSetTimerProps {
  open: boolean;
  targetSeconds: number;
  onStop: (heldSeconds: number) => void;
  onCancel: () => void;
}

const READY_SECONDS = 3;

export default function TimedSetTimer({
  open,
  targetSeconds,
  onStop,
  onCancel,
}: TimedSetTimerProps) {
  const holdFor = Math.max(1, Math.round(Number(targetSeconds) || 45));
  const [phase, setPhase] = useState<Phase>("ready");
  const [display, setDisplay] = useState(READY_SECONDS);
  const startedAtRef = useRef(0);
  const phaseRef = useRef<Phase>("ready");
  const displayRef = useRef(READY_SECONDS);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  useEffect(() => {
    if (!open) return;

    unlockAudio();
    armSetAlarm(READY_SECONDS + holdFor);
    startedAtRef.current = Date.now();
    phaseRef.current = "ready";
    displayRef.current = READY_SECONDS;
    setPhase("ready");
    setDisplay(READY_SECONDS);

    const interval = window.setInterval(() => {
      const now = Date.now();
      const readyUntil = startedAtRef.current + READY_SECONDS * 1000;
      const holdUntil = readyUntil + holdFor * 1000;

      if (now < readyUntil) {
        const next = Math.max(1, Math.ceil((readyUntil - now) / 1000));
        if (phaseRef.current !== "ready") {
          phaseRef.current = "ready";
          setPhase("ready");
        }
        if (displayRef.current !== next) {
          displayRef.current = next;
          setDisplay(next);
        }
        return;
      }

      if (now < holdUntil) {
        if (phaseRef.current === "ready") {
          playSetChime();
          try {
            navigator.vibrate?.(80);
          } catch {
            // Vibration is not available on every phone.
          }
        }
        if (phaseRef.current !== "down") {
          phaseRef.current = "down";
          setPhase("down");
        }
        const remaining = Math.max(1, Math.ceil((holdUntil - now) / 1000));
        if (displayRef.current !== remaining) {
          displayRef.current = remaining;
          setDisplay(remaining);
        }
        return;
      }

      if (phaseRef.current !== "up") {
        phaseRef.current = "up";
        setPhase("up");
        cancelSetAlarm();
        playSetChime();
      }

      const overtime = Math.floor((now - holdUntil) / 1000);
      if (displayRef.current !== overtime) {
        displayRef.current = overtime;
        setDisplay(overtime);
      }
    }, 50);

    return () => {
      window.clearInterval(interval);
      cancelSetAlarm();
    };
  }, [open, holdFor]);

  if (!open) return null;

  const label =
    phase === "ready" ? "Get ready" : phase === "down" ? "Hold" : "Overtime";

  const heldSeconds = () => {
    const elapsed = (Date.now() - startedAtRef.current) / 1000;
    if (elapsed < READY_SECONDS) return 0;
    return Math.max(1, Math.round(elapsed - READY_SECONDS));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex h-[50dvh] flex-col border-t border-white/15 bg-[#07070a]/95 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-white/15 blur-3xl" />
      </div>
      <p className="relative text-center text-sm font-semibold uppercase tracking-[0.45em] text-white/75">
        {label}
      </p>
      <div className="relative flex flex-1 items-center justify-center">
        <p className="whitespace-nowrap text-[clamp(4.5rem,18vw,8rem)] font-black leading-none tabular-nums text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.35)]">
          {phase === "up" ? `+${display}` : display}
        </p>
      </div>
      <div className="relative flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-14 flex-1 rounded-2xl border border-white/20 bg-white/5 text-base font-black text-white/80"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const held = heldSeconds();
            if (held <= 0) {
              onCancel();
              return;
            }
            onStop(held);
          }}
          className="min-h-14 flex-[2] rounded-2xl bg-white text-lg font-black text-black"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
