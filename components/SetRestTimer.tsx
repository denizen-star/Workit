"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatClock } from "@/lib/formatDuration";
import { unlockAudio } from "@/lib/playChime";
import GetToItModal from "./GetToItModal";

const REST_SECONDS = 60;

interface SetRestTimerProps {
  startToken: number;
  line: string;
  cancelled?: boolean;
}

export default function SetRestTimer({ startToken, line, cancelled = false }: SetRestTimerProps) {
  const [remaining, setRemaining] = useState(REST_SECONDS);
  const [running, setRunning] = useState(false);
  const [showGetToIt, setShowGetToIt] = useState(false);
  const endAtRef = useRef(0);
  const finishedRef = useRef(false);

  const closeGetToIt = () => setShowGetToIt(false);

  useEffect(() => {
    if (startToken === 0) return;

    unlockAudio();
    finishedRef.current = false;
    endAtRef.current = Date.now() + REST_SECONDS * 1000;
    setShowGetToIt(false);
    setRemaining(REST_SECONDS);
    setRunning(true);
  }, [startToken]);

  useEffect(() => {
    if (!cancelled) return;
    finishedRef.current = true;
    setRunning(false);
    setShowGetToIt(false);
  }, [cancelled]);

  useEffect(() => {
    if (!running || cancelled) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left > 0 || finishedRef.current) return;
      finishedRef.current = true;
      setRunning(false);
      setShowGetToIt(true);
    };

    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [running, cancelled]);

  if (!running && startToken === 0 && !showGetToIt) return null;

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
                if (finishedRef.current) return;
                finishedRef.current = true;
                setRunning(false);
                setRemaining(0);
                if (!cancelled) setShowGetToIt(true);
              }}
              className="min-h-12 rounded-2xl bg-white px-5 text-base font-black text-black hover:bg-gray-200"
            >
              Skip
            </button>
          </div>
        </div>
      )}
      <GetToItModal open={showGetToIt && !cancelled} line={line} onClose={closeGetToIt} />
    </>
  );
}
