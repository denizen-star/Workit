"use client";

import { useEffect, useRef } from "react";
import { playCompleteChime } from "@/lib/playChime";

interface CompleteTakeoverProps {
  open: boolean;
  line: string;
  onClose: () => void;
}

function splitLine(line: string) {
  const match = line.match(/^([^.]+\.)\s*(.*)$/);
  if (!match || !match[2]) return { title: line, body: "" };
  return { title: match[1], body: match[2] };
}

export default function CompleteTakeover({ open, line, onClose }: CompleteTakeoverProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { title, body } = splitLine(line);

  useEffect(() => {
    if (!open) return;

    playCompleteChime();

    try {
      navigator.vibrate?.([40, 50, 70]);
    } catch {
      // Vibration is not available on every phone.
    }

    const timeout = window.setTimeout(() => onCloseRef.current(), 10000);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timeout);
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
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-[#07070a]/95 px-6"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#e8c547]/25 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
          Workout complete
        </p>
        <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
          {title}
        </h2>
        {body ? (
          <p className="mt-6 text-lg font-medium leading-relaxed text-[#f6f1e3]/85 sm:text-xl">
            {body}
          </p>
        ) : null}
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
