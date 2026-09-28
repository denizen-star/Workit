'use client';

import { useState } from 'react';
import { coachPersonaSrc } from '@/lib/coachPersonas';
import { pickOverloadLine } from '@/lib/coachLines';
import type { CoachTone } from '@/lib/coachTone';
import { OVERLOAD_DIPLOMA_NAMES } from '@/lib/overloadProgram';

interface OverloadDiplomaTakeoverProps {
  tier: number;
  tone: CoachTone;
  name: string;
  onDone: () => void;
}

const WEEK_FOR_TIER: Record<number, number> = { 1: 2, 2: 4, 3: 6 };

/** One-time Home takeover for an earned Overload Progressions diploma tier
 * (`unseenDiploma` on GET /api/overload). Shows on normal Home too, since tier 3
 * lands as the run closes. */
export default function OverloadDiplomaTakeover({ tier, tone, name, onDone }: OverloadDiplomaTakeoverProps) {
  const [avatarSrc] = useState(() => coachPersonaSrc(tone, 'celebratory'));
  const [line] = useState(() => pickOverloadLine('diploma', tone, name));

  return (
    <div className="fixed inset-0 z-[85] flex items-center overflow-y-auto bg-[#07070a] px-5 py-10">
      <div className="mx-auto w-full max-w-md text-center">
        <img
          src={avatarSrc}
          alt=""
          className="mx-auto mb-5 h-20 w-20 rounded-full border border-white/15 object-cover object-top"
        />
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">
          Overload Progressions · Week {WEEK_FOR_TIER[tier] ?? tier * 2} done
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#e8c547]">YOU EARNED IT!</h2>
        <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[#e8c547]/50 bg-[#e8c547]/10 p-6">
          <p className="text-5xl font-black text-[#e8c547]">{tier}</p>
          <p className="mt-2 text-lg font-black text-white">{OVERLOAD_DIPLOMA_NAMES[tier] ?? `Tier ${tier}`}</p>
        </div>
        {line ? <p className="mt-6 text-base font-bold text-[#f6f1e3]">{line}</p> : null}
        <button
          type="button"
          onClick={onDone}
          className="mt-8 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
        >
          {tier >= 3 ? 'Back to the program' : 'Keep climbing'}
        </button>
      </div>
    </div>
  );
}
