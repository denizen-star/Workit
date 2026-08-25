"use client";

import { useEffect, useRef } from "react";

interface PrFlashProps {
  open: boolean;
  exerciseName: string;
  valueLabel: string;
  onClose: () => void;
}

export default function PrFlash({ open, exerciseName, valueLabel, onClose }: PrFlashProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    try {
      navigator.vibrate?.([80, 40, 160]);
    } catch {
      // Ignore missing vibration support.
    }

    const timeout = window.setTimeout(() => onCloseRef.current(), 2800);
    return () => window.clearTimeout(timeout);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      className="fixed inset-0 z-[75] flex cursor-pointer items-center justify-center bg-black/70 backdrop-blur-md"
    >
      <div className="glass-card mx-6 w-full max-w-sm px-6 py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#e8c547]">
          Personal record
        </p>
        <h2 className="get-to-it-text mt-4 text-5xl font-black tracking-tight text-[#f5d76e]">
          NEW PR
        </h2>
        <p className="mt-4 text-lg font-semibold text-[#f6f1e3]">{exerciseName}</p>
        <p className="mt-2 text-3xl font-black text-white">{valueLabel}</p>
      </div>
    </div>
  );
}
