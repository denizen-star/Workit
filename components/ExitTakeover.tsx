"use client";

import { useEffect, useRef, useState } from "react";
import StarRating from "@/components/StarRating";
import { playHorn } from "@/lib/playChime";

interface ExitTakeoverProps {
  open: boolean;
  line: string;
  onStay: () => void;
  onQuit: (stars: number) => void;
}

export default function ExitTakeover({ open, line, onStay, onQuit }: ExitTakeoverProps) {
  const onStayRef = useRef(onStay);
  onStayRef.current = onStay;
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    playHorn();

    try {
      navigator.vibrate?.([200, 80, 200, 80, 420]);
    } catch {
      // Vibration is not available on every phone.
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onStayRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) setStars(null);
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
          Attempting to exit early
        </p>
        <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
          {line}
        </h2>
        <div className="mt-8 w-full">
          <StarRating
            value={stars}
            onChange={setStars}
            label="Before you walk, score this session. One is trash. Five means you still felt it."
          />
        </div>
        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={stars == null}
            onClick={() => {
              if (stars == null) return;
              onQuit(stars);
            }}
            className="min-h-14 flex-1 rounded-2xl border border-white/20 bg-white/5 px-5 text-lg font-black text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Quitter
          </button>
          <button
            type="button"
            onClick={onStay}
            className="min-h-14 flex-1 rounded-2xl bg-white px-5 text-lg font-black text-black hover:bg-gray-200"
          >
            Stay for More
          </button>
        </div>
      </div>
    </div>
  );
}
