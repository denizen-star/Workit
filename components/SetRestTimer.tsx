"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatClock } from "@/lib/formatDuration";
import { playChime, unlockAudio } from "@/lib/playChime";
import GetToItModal from "./GetToItModal";

const REST_SECONDS = 60;

interface SetRestTimerProps {
  disabled?: boolean;
}

export default function SetRestTimer({ disabled }: SetRestTimerProps) {
  const [remaining, setRemaining] = useState(REST_SECONDS);
  const [running, setRunning] = useState(false);
  const [showGetToIt, setShowGetToIt] = useState(false);
  const completedRef = useRef(false);

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

  const startTimer = () => {
    if (disabled || running) return;
    unlockAudio();
    completedRef.current = false;
    setRemaining(REST_SECONDS);
    setRunning(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={startTimer}
        disabled={disabled || running}
        className={`flex h-11 min-w-16 flex-col items-center justify-center rounded-xl px-2.5 text-xs font-bold transition-colors ${
          running
            ? "bg-indigo-600 text-white"
            : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
        }`}
        aria-label="Start 60 second rest timer"
      >
        <Timer className="mb-0.5 h-4 w-4" />
        {running ? formatClock(remaining) : "60s"}
      </button>
      <GetToItModal open={showGetToIt} onClose={() => setShowGetToIt(false)} />
    </>
  );
}
