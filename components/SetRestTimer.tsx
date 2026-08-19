"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatClock } from "@/lib/formatDuration";
import { playChime, unlockAudio } from "@/lib/playChime";
import GetToItModal from "./GetToItModal";

const REST_SECONDS = 60;

interface SetRestTimerProps {
  startToken: number;
}

export default function SetRestTimer({ startToken }: SetRestTimerProps) {
  const [remaining, setRemaining] = useState(REST_SECONDS);
  const [running, setRunning] = useState(false);
  const [showGetToIt, setShowGetToIt] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (startToken === 0) return;
    unlockAudio();
    completedRef.current = false;
    setRemaining(REST_SECONDS);
    setRunning(true);
  }, [startToken]);

  useEffect(() => {
    if (!running) return;

    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            playChime();
            setShowGetToIt(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  if (!running && startToken === 0) return null;

  return (
    <>
      {running && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="glass-card pointer-events-auto mx-auto flex max-w-xl items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <Timer className="h-7 w-7 text-white" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white">
                  Rest
                </p>
                <p className="text-3xl font-black tabular-nums text-white">
                  {formatClock(remaining)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setRemaining(0);
                if (!completedRef.current) {
                  completedRef.current = true;
                  playChime();
                  setShowGetToIt(true);
                }
              }}
              className="min-h-12 rounded-2xl bg-white px-5 text-base font-black text-black hover:bg-gray-200"
            >
              Skip
            </button>
          </div>
        </div>
      )}
      <GetToItModal open={showGetToIt} onClose={() => setShowGetToIt(false)} />
    </>
  );
}
