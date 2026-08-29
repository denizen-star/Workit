"use client";

import { useEffect, useRef, useState } from "react";
import BadgeMark from "@/components/BadgeMark";

export type TakeoverBadge = {
  id: number;
  name: string;
  description: string;
  icon: string | null;
};

export type TakeoverBelt = {
  name: string;
  fill: string;
  trim?: string | null;
  quote: string;
  saidBy: string;
  coachLine: string;
};

interface CompleteTakeoverProps {
  open: boolean;
  line: string;
  badges?: TakeoverBadge[];
  earnedBelt?: TakeoverBelt | null;
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

export default function CompleteTakeover({
  open,
  line,
  badges = [],
  earnedBelt = null,
  bonus = false,
  bonusCount = 0,
  optionalLbs = 0,
  kickerLbs = 0,
  onClose,
}: CompleteTakeoverProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [step, setStep] = useState(0);
  const { title, body } = splitLine(line);
  const totalSteps = badges.length + (earnedBelt ? 1 : 0) + 1;
  const showingBadge = step < badges.length;
  const showingBelt = Boolean(earnedBelt) && step === badges.length;
  const badge = showingBadge ? badges[step] : null;

  useEffect(() => {
    if (!open) {
      setStep(0);
      return;
    }
    setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open || showingBadge || showingBelt) return;

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
  }, [open, showingBadge, showingBelt, step]);

  const advance = () => {
    if (step + 1 >= totalSteps) {
      onClose();
      return;
    }
    setStep((current) => current + 1);
  };

  if (!open) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={advance}
      onKeyDown={(event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
          advance();
        }
      }}
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-[#07070a]/95 px-6"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: showingBelt && earnedBelt ? earnedBelt.fill : '#e8c547', opacity: 0.28 }}
        />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative max-w-xl text-center">
        {badge ? (
          <>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
              Badge earned · {step + 1} of {badges.length}
            </p>
            <div className="mb-6">
              <BadgeMark name={badge.name} className="h-28 w-28" />
            </div>
            <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
              {badge.name}
            </h2>
            {badge.description ? (
              <p className="mt-6 text-lg font-medium leading-relaxed text-[#f6f1e3]/85 sm:text-xl">
                {badge.description}
              </p>
            ) : null}
          </>
        ) : showingBelt && earnedBelt ? (
          <>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em]" style={{ color: earnedBelt.trim || earnedBelt.fill }}>
              Diploma
            </p>
            <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
              {earnedBelt.name}
            </h2>
            <p className="mt-6 text-lg font-medium leading-relaxed text-[#f6f1e3]/85 sm:text-xl">
              {earnedBelt.quote}
            </p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#f6f1e3]/60">
              {earnedBelt.saidBy}
            </p>
            <p className="mt-4 text-lg font-medium leading-relaxed text-[#f6f1e3]/85 sm:text-xl">
              {earnedBelt.coachLine}
            </p>
          </>
        ) : (
          <>
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
                +{Math.round(optionalLbs).toLocaleString()} lb optional
                {kickerLbs > 0 ? ` · +${Math.round(kickerLbs).toLocaleString()} lb kicker` : ''}
              </p>
            ) : null}
            {body ? (
              <p className="mt-6 text-lg font-medium leading-relaxed text-[#f6f1e3]/85 sm:text-xl">
                {body}
              </p>
            ) : null}
          </>
        )}
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
