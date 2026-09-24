'use client';

import { useSyncExternalStore } from 'react';
import YourPickIcon from '@/components/YourPickIcon';

/** Per-device "seen" flag — a light, dismissable hint (same choice as the Hyrox
 * banner), not a DB-tracked takeover. Never the source of truth for anything. */
const KEY = 'workit-yourpick-explainer-seen';
const listeners = new Set<() => void>();

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    // Storage off — the card just shows again next visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * One-time Select Workout card (docs/plans/PLAN_YOUR_PICK.md): the week locks on a
 * count of workouts, not specific days — follow the plan, swap a day you haven't
 * started, or add a Your pick. Server render and first paint treat it as seen, so
 * it never flashes for someone who already dismissed it.
 */
export default function YourPickExplainer({ requiredCount }: { requiredCount: number }) {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  if (seen) return null;
  return (
    <div className="glass-card border border-[#e8c547]/40 p-5">
      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#e8c547]">
        <YourPickIcon /> How your week locks
      </p>
      <p className="mt-2 text-lg font-black text-white">
        Your week locks at {requiredCount} {requiredCount === 1 ? 'workout' : 'workouts'}. Any mix counts.
      </p>
      <ul className="mt-2 space-y-1 text-sm text-[#f6f1e3]/75">
        <li>Follow the plan day by day.</li>
        <li>Swap any day you haven&apos;t started for a Your pick.</li>
        <li>Add a Your pick — Upper, Lower, Yoga, Core or Full body — whenever you want.</li>
      </ul>
      <button
        type="button"
        onClick={markSeen}
        className="mt-4 min-h-11 rounded-2xl bg-[#e8c547] px-5 text-sm font-black text-[#1a1404]"
      >
        Got it
      </button>
    </div>
  );
}
