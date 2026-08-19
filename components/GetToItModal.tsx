"use client";

import { useEffect } from "react";

interface GetToItModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GetToItModal({ open, onClose }: GetToItModalProps) {
  useEffect(() => {
    if (!open) return;

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
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-16 top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
      </div>
      <div className="relative px-6 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-white/75">
          Rest is over
        </p>
        <h2 className="get-to-it-text text-6xl font-black tracking-tight text-white drop-shadow-lg sm:text-8xl">
          GET TO IT
        </h2>
        <p className="mt-6 text-lg font-medium text-white/85">Next set. Same energy.</p>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
