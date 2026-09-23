"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatClock } from "@/lib/formatDuration";
import type { CoachTone } from "@/lib/coachTone";
import { armRestAlarm, cancelRestAlarm, unlockAudio } from "@/lib/playChime";
import GetToItModal from "./GetToItModal";
import { REST_SECONDS } from "@/lib/estimateDuration";

interface SetRestTimerProps {
  startToken: number;
  line: string;
  clipTemplate?: string;
  tone?: CoachTone;
  cancelled?: boolean;
  completedSets?: number;
  totalSets?: number;
  seconds?: number;
  /** Fires whenever the full-width rest banner opens/closes or its rendered height
   * changes, with that exact pixel height — so a sibling docked element (the floating
   * coach avatar) can lift clear of it by a measured amount instead of a guessed one. */
  onBannerChange?: (info: { active: boolean; height: number }) => void;
}

export default function SetRestTimer({
  startToken,
  line,
  clipTemplate,
  tone,
  cancelled = false,
  completedSets = 0,
  totalSets = 0,
  seconds = REST_SECONDS,
  onBannerChange,
}: SetRestTimerProps) {
  const restFor = Math.max(1, seconds);
  const [remaining, setRemaining] = useState(restFor);
  const [running, setRunning] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Report the banner's real rendered height (not a guessed constant) whenever it opens,
  // closes, or resizes — the floating coach avatar dock lifts clear of it by this amount.
  useEffect(() => {
    if (!running) {
      onBannerChange?.({ active: false, height: 0 });
      return;
    }
    const node = bannerRef.current;
    if (!node) return;
    const report = () => onBannerChange?.({ active: true, height: node.offsetHeight });
    report();
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [running, onBannerChange]);
  const [showGetToIt, setShowGetToIt] = useState(false);
  const endAtRef = useRef(0);
  const finishedRef = useRef(false);
  const prevRemainingRef = useRef(restFor);
  const urgent = running && remaining > 0 && remaining <= 5;

  const closeGetToIt = () => setShowGetToIt(false);

  useEffect(() => {
    if (startToken === 0) return;

    unlockAudio();
    finishedRef.current = false;
    endAtRef.current = Date.now() + restFor * 1000;
    armRestAlarm(restFor);
    setShowGetToIt(false);
    setRemaining(restFor);
    prevRemainingRef.current = restFor;
    setRunning(true);
    return () => {
      cancelRestAlarm();
    };
  }, [startToken, restFor]);

  useEffect(() => {
    if (!cancelled) return;
    finishedRef.current = true;
    cancelRestAlarm();
    setRunning(false);
    setShowGetToIt(false);
  }, [cancelled]);

  useEffect(() => {
    if (!running || cancelled) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      // Buzz once per second in the final stretch so the rest clock is felt, not just seen.
      if (left !== prevRemainingRef.current) {
        prevRemainingRef.current = left;
        if (left > 0 && left <= 5) {
          try {
            navigator.vibrate?.(60);
          } catch {
            // Vibration is not available on every phone.
          }
        }
      }
      if (left > 0 || finishedRef.current) return;
      finishedRef.current = true;
      setRunning(false);
      setShowGetToIt(true);
    };

    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [running, cancelled]);

  if (!running && startToken === 0 && !showGetToIt) return null;

  // Drains from 100% to 0% over the rest period — the same signal as the clock,
  // just easier to read at a glance for someone who doesn't know what "Rest" means yet.
  const drainPct = Math.min(100, Math.max(0, (remaining / restFor) * 100));

  return (
    <>
      {running && (
        <div
          ref={bannerRef}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div
            className={`rest-bar-entry pointer-events-auto relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border shadow-[0_18px_50px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-colors ${
              urgent ? 'animate-pulse border-[#e8c547] bg-[#1a1404]/95' : 'border-[#e8c547]/30 bg-[#101014]/92'
            }`}
          >
            {/* One-shot gold ring flash on arrival — the attention-getter for a rest period
                that just started, separate from the steady `urgent` pulse near the end. */}
            <span className="rest-bar-ring-pulse pointer-events-none absolute inset-0 rounded-[1.75rem] border-2 border-[#e8c547]" />

            <div className="flex items-center gap-3 px-4 pt-4 sm:px-5">
              <span
                className={`rest-bar-icon-bounce flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                  urgent ? 'border-[#e8c547] bg-[#e8c547]/25 text-[#e8c547]' : 'border-[#e8c547]/50 bg-[#e8c547]/15 text-[#e8c547]'
                }`}
              >
                <Timer className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-3xl font-black uppercase leading-none tracking-[0.06em] sm:text-4xl ${
                    urgent ? 'text-[#e8c547]' : 'text-white'
                  }`}
                >
                  Rest
                </p>
              </div>
              <p
                className={`shrink-0 text-3xl font-black tabular-nums sm:text-4xl ${
                  urgent ? 'text-[#e8c547]' : 'text-white'
                }`}
              >
                {formatClock(remaining)}
              </p>
            </div>

            <div className="mx-4 mt-3 h-1 overflow-hidden rounded-full bg-white/10 sm:mx-5">
              <div
                className="h-full rounded-full bg-[#e8c547] transition-[width] duration-500 ease-linear"
                style={{ width: `${drainPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              {totalSets > 0 ? (
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e8c547]">
                      Progress
                    </span>
                    <span className="text-sm font-black tabular-nums text-[#f5d76e]">
                      {completedSets} / {totalSets}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[#e8c547] transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (completedSets / totalSets) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => {
                  if (finishedRef.current) return;
                  finishedRef.current = true;
                  cancelRestAlarm();
                  setRunning(false);
                  setRemaining(0);
                  if (!cancelled) setShowGetToIt(true);
                }}
                className="min-h-12 shrink-0 rounded-2xl bg-white px-4 text-base font-black text-black hover:bg-gray-200 sm:px-5"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
      <GetToItModal
        open={showGetToIt && !cancelled}
        line={line}
        clipTemplate={clipTemplate}
        tone={tone}
        onClose={closeGetToIt}
      />
    </>
  );
}
