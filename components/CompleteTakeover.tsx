"use client";

import { useEffect, useRef } from "react";
import { formatCompact } from "@/lib/athletePerformanceTypes";

export type TakeoverBadge = {
  id: number;
  name: string;
  description: string;
  icon: string | null;
};

export type TakeoverBelt = {
  weeks?: number;
  name: string;
  slug?: string;
  fill: string;
  trim?: string | null;
  quote: string;
  saidBy: string;
  coachLine: string;
  paper?: 'light' | 'dark';
};

interface CompleteTakeoverProps {
  open: boolean;
  line: string;
  replenish?: string;
  bonus?: boolean;
  bonusCount?: number;
  optionalLbs?: number;
  kickerLbs?: number;
  onClose: () => void;
}

function splitLine(line: string) {
  const match = line.match(/^([^.]+\.)\s*(.*)$/);
  if (!match || !match[2]) return { title: line, body: "" };
  return { title: match[1], body: match[2] };
}

/** Coach line only. Badges and diplomas live on AwardsTakeover. */
export default function CompleteTakeover({
  open,
  line,
  replenish,
  bonus = false,
  bonusCount = 0,
  optionalLbs = 0,
  kickerLbs = 0,
  onClose,
}: CompleteTakeoverProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { title, body } = splitLine(line);

  useEffect(() => {
    if (!open) return;

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
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#e8c547] opacity-28 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
          {bonus ? 'Bonus locked' : optionalLbs > 0 ? 'Optional locked' : 'Workout complete'}
        </p>
        <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
          {title}
        </h2>
        {bonus && bonusCount > 0 ? (
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#e8c547]">
            {bonusCount} bonus {bonusCount === 1 ? 'day' : 'days'} this program
          </p>
        ) : null}
        {optionalLbs > 0 ? (
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#e8c547]">
            +{formatCompact(optionalLbs)} lb optional
            {kickerLbs > 0 ? ` · +${formatCompact(kickerLbs)} lb kicker` : ''}
          </p>
        ) : null}
        {body ? (
          <p className="mt-6 text-lg font-medium leading-relaxed text-[#f6f1e3]/85 sm:text-xl">
            {body}
          </p>
        ) : null}
        {replenish ? (
          <p className="mt-6 text-base font-medium leading-relaxed text-[#e8c547] sm:text-lg">
            {replenish}
          </p>
        ) : null}
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
