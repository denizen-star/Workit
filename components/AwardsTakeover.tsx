'use client';

import BadgeMark from '@/components/BadgeMark';
import BeltDiploma from '@/components/BeltDiploma';
import type { TakeoverBadge, TakeoverBelt } from '@/components/CompleteTakeover';
import { BELTS, type Belt } from '@/lib/belts';

function diplomaBelt(earned: TakeoverBelt): Belt {
  const catalog = BELTS.find((row) => row.slug === earned.slug || row.name === earned.name);
  const base = catalog ?? BELTS[0];
  return {
    ...base,
    weeks: earned.weeks ?? base.weeks,
    name: earned.name,
    slug: earned.slug || base.slug,
    fill: earned.fill || base.fill,
    trim: earned.trim || base.trim,
    quote: earned.quote || base.quote,
    saidBy: earned.saidBy || base.saidBy,
    coachLine: earned.coachLine || base.coachLine,
    paper: earned.paper || base.paper,
  };
}

function nextDiplomaLine(earned: Belt) {
  const next = BELTS.find((row) => row.weeks > earned.weeks);
  if (!next) return 'Last diploma. You know how to keep it up.';
  return `Next diploma: ${next.name}. ${earned.weeks} of ${next.weeks} locked weeks.`;
}

function beltTitleColor(belt: { fill: string; trim?: string | null }) {
  return belt.trim || belt.fill || '#e8c547';
}

/** One finish screen: diploma card first if unlocked, then new badges in rows of three. */
export default function AwardsTakeover({
  open,
  belt,
  badges,
  accent,
  onClose,
}: {
  open: boolean;
  belt: TakeoverBelt | null;
  badges: TakeoverBadge[];
  accent?: { fill: string; trim?: string | null } | null;
  onClose: () => void;
}) {
  if (!open || (!belt && badges.length === 0)) return null;

  const earned = belt ? diplomaBelt(belt) : null;
  const titleBelt = accent || earned || { fill: '#e8c547' };
  const titleColor = beltTitleColor(titleBelt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') onClose();
      }}
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-y-auto bg-[#07070a]/95 px-6 py-10"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: titleColor, opacity: 0.28 }}
        />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <h2
          className="get-to-it-text mb-8 text-center text-4xl font-black leading-tight tracking-tight drop-shadow-[0_0_28px_rgba(255,255,255,0.35)] sm:text-6xl"
          style={{ color: titleColor }}
        >
          YOU EARNED IT!
        </h2>
        {earned ? (
          <div className="mb-10 text-left">
            <BeltDiploma belt={earned} state="after" showStateLabel={false} />
            <p className="mt-4 text-center text-sm font-medium leading-relaxed text-[#f6f1e3]/80">
              {nextDiplomaLine(earned)}
            </p>
          </div>
        ) : null}

        {badges.length > 0 ? (
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
              {badges.length === 1 ? 'New badge' : 'New badges'}
            </p>
            <div className="mx-auto flex max-w-md flex-wrap justify-center gap-3">
              {badges.map((badge) => (
                <div key={badge.id} className="min-w-0 basis-[30%]">
                  <BadgeMark name={badge.name} className="h-16 w-16 sm:h-20 sm:w-20" />
                  <p className="mt-2 text-xs font-black leading-snug text-white sm:text-sm">{badge.name}</p>
                  {badge.description ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#f6f1e3]/65">
                      {badge.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-10 text-center text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere for Home
        </p>
      </div>
    </div>
  );
}
