'use client';

import { Scale } from 'lucide-react';
import { BODY_WEIGHT_BANNER_CTA, BODY_WEIGHT_BANNER_TITLE, BODY_WEIGHT_WHY } from '@/lib/bodyWeightShared';

/**
 * Top-of-live-workout nudge for an athlete with no weight on file — shows for their
 * next 3 workouts (bodyWeightBannerDue) or until they save one. Neutral copy; gold is
 * only on the action. docs/plans/PLAN_BODY_WEIGHT.md.
 */
export default function BodyWeightBanner({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="glass-card mb-4 flex items-start gap-3 rounded-2xl p-4">
      <Scale className="mt-0.5 h-5 w-5 shrink-0 text-[#f6f1e3]/70" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-white">{BODY_WEIGHT_BANNER_TITLE}</p>
        <p className="mt-1 text-xs text-[#f6f1e3]/65">{BODY_WEIGHT_WHY}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="min-h-10 shrink-0 rounded-xl bg-[#e8c547] px-3 text-sm font-black text-[#1a1404]"
      >
        {BODY_WEIGHT_BANNER_CTA}
      </button>
    </div>
  );
}
