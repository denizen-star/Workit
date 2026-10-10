'use client';

import { useState, type ReactNode } from 'react';
import { UserPlus } from 'lucide-react';
import { HomeEffectiveKpi } from '@/components/HomeKpiLead';
import type { CoachTone } from '@/lib/coachTone';
import { coachPersonaSrc } from '@/lib/coachPersonas';
import { STREAK_BREAK_LINE } from '@/lib/streakBreak';

/**
 * Bottom of Home's hero card, same in every state: the Effective number, the Focus pill
 * (children), then (after a
 * broken streak, Mondays) the coach's encouragement, then the Invite row.
 */
export default function HomeHeroFooter({
  tone,
  showBreakNote,
  onInvite,
  children,
}: {
  tone: CoachTone;
  showBreakNote: boolean;
  /** Omit to hide the Invite row (Test athlete, Test Drive finish). */
  onInvite?: () => void;
  /** Sits right under the Effective number (the next-week Focus pill). */
  children?: ReactNode;
}) {
  // Picked once so the portrait doesn't flip between renders.
  const [face] = useState(() => coachPersonaSrc(tone, 'happy'));
  return (
    <>
      <HomeEffectiveKpi />
      {children}
      {showBreakNote ? (
        <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-[#e8c547]/20 bg-[#e8c547]/[0.08] px-3 py-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={face}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full border border-[#e8c547]/50 object-cover"
          />
          <p className="text-[15px] font-normal leading-snug text-[#f6f1e3]">{STREAK_BREAK_LINE}</p>
        </div>
      ) : null}
      {onInvite ? (
        <button
          type="button"
          onClick={onInvite}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-1.5 border-t border-white/10 pt-3 text-sm font-black text-[#e8c547]"
        >
          <UserPlus className="h-4 w-4" />
          Invite a friend
        </button>
      ) : null}
    </>
  );
}
