"use client";

import { useEffect, useRef } from "react";
import { playHorn } from "@/lib/playChime";

interface ResumeTakeoverProps {
  open: boolean;
  line: string;
  onClose: () => void;
}

export default function ResumeTakeover({ open, line, onClose }: ResumeTakeoverProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    playHorn();

    try {
      navigator.vibrate?.([200, 80, 200]);
    } catch {
      // Vibration is not available on every phone.
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#07070a]/95 px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative flex w-full max-w-xl flex-col items-center text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-white/80">
          Still open
        </p>
        <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
          {line}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="mt-10 min-h-14 w-full rounded-2xl bg-[#e8c547] px-5 text-lg font-black text-[#1a1404] hover:bg-[#f0d56a] sm:w-auto sm:min-w-[16rem]"
        >
          Back under the bar
        </button>
      </div>
    </div>
  );
}
