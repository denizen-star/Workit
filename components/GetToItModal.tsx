"use client";

import { useEffect, useRef } from "react";
import { cancelRestAlarm, playHorn } from "@/lib/playChime";

interface GetToItModalProps {
  open: boolean;
  line: string;
  onClose: () => void;
}

const DISMISS_MS = 10000;

export default function GetToItModal({ open, line, onClose }: GetToItModalProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const openedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      openedAtRef.current = null;
      return;
    }

    if (openedAtRef.current == null) {
      openedAtRef.current = Date.now();
      cancelRestAlarm();
      playHorn();
      try {
        navigator.vibrate?.([200, 80, 200, 80, 420]);
      } catch {
        // Vibration is not available on every phone.
      }
    }

    const interval = window.setInterval(() => {
      const openedAt = openedAtRef.current;
      if (openedAt != null && Date.now() - openedAt >= DISMISS_MS) {
        onCloseRef.current();
      }
    }, 200);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
        <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
          {line}
        </h2>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
