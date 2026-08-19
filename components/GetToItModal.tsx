"use client";

import { useEffect } from "react";

interface GetToItModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GetToItModal({ open, onClose }: GetToItModalProps) {
  useEffect(() => {
    if (!open) return;

    try {
      navigator.vibrate?.([200, 80, 200, 80, 420]);
    } catch {
      // Vibration is not available on every phone.
    }

    const timeout = window.setTimeout(onClose, 4000);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
          onClose();
        }
      }}
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-[#07070a]/95"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative px-6 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-white/80">
          Rest is over
        </p>
        <h2 className="get-to-it-text text-6xl font-black tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-8xl">
          GET TO IT
        </h2>
        <p className="mt-6 text-lg font-medium text-[#f6f1e3]/85">Next set. Same energy.</p>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
