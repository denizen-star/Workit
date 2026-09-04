"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatClock } from "@/lib/formatDuration";
import { armRestAlarm, cancelRestAlarm, unlockAudio } from "@/lib/playChime";
import GetToItModal from "./GetToItModal";
import { REST_SECONDS } from "@/lib/estimateDuration";

interface SetRestTimerProps {
  startToken: number;
  line: string;
  cancelled?: boolean;
  completedSets?: number;
  totalSets?: number;
  seconds?: number;
}

export default function SetRestTimer({
  startToken,
  line,
  cancelled = false,
  completedSets = 0,
  totalSets = 0,
  seconds = REST_SECONDS,
}: SetRestTimerProps) {
  const restFor = Math.max(1, seconds);
  const [remaining, setRemaining] = useState(restFor);
  const [running, setRunning] = useState(false);
  const [showGetToIt, setShowGetToIt] = useState(false);
  const endAtRef = useRef(0);
  const finishedRef = useRef(false);

  const closeGetToIt = () => setShowGetToIt(false);

  useEffect(() => {
    if (startToken === 0) return;

    unlockAudio();
    finishedRef.current = false;
    endAtRef.current = Date.now() + restFor * 1000;
    armRestAlarm(restFor);
    setShowGetToIt(false);
    setRemaining(restFor);
    setRunning(true);
    return () => {
      cancelRestAlarm();
    };
  }, [startToken, restFor]);

  useEffect(() => {
    if (!cancelled) return;
    finishedRef.current = true;
    cancelRestAlarm();
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
          <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-[1.5rem] border border-[#e8c547]/25 bg-[#101014]/92 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:gap-4 sm:px-5 sm:py-4">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Timer className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white sm:text-xs">
                  Rest
                </p>
                <p className="text-2xl font-black tabular-nums text-white sm:text-3xl">
                  {formatClock(remaining)}
                </p>
              </div>
            </div>
            {totalSets > 0 ? (
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e8c547]">
                    Progress
                  </span>
                  <span className="text-sm font-black tabular-nums text-[#f5d76e]">
                    {completedSets} / {totalSets}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-[#e8c547] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (completedSets / totalSets) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (finishedRef.current) return;
                finishedRef.current = true;
                cancelRestAlarm();
                setRunning(false);
                setRemaining(0);
                if (!cancelled) setShowGetToIt(true);
              }}
              className="min-h-12 shrink-0 rounded-2xl bg-white px-4 text-base font-black text-black hover:bg-gray-200 sm:px-5"
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
