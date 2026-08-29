'use client';

import type { ReactNode } from 'react';
import SpikeChart from '@/components/SpikeChart';

export type ScanMetric = {
  label: string;
  value: string;
};

/**
 * Dense scan row used on Home Quiet, Scoreboard, and Your performance.
 * Cream = you. Copper = the house. Gold is for actions, not identity.
 * `roomy` is the 50+ size for Home and The house.
 */
export default function ScanCard({
  you = false,
  house = false,
  roomy = false,
  kicker,
  title,
  headline,
  sub,
  metrics,
  foot,
  spark,
  sparkTone = 'plain',
}: {
  you?: boolean;
  house?: boolean;
  roomy?: boolean;
  kicker?: string;
  title: string;
  headline: string;
  sub?: string;
  metrics: ScanMetric[];
  foot?: string;
  spark?: number[];
  sparkTone?: 'up' | 'down' | 'plain';
}) {
  const columns = roomy
    ? Math.min(2, Math.max(metrics.length, 1))
    : metrics.length >= 6
      ? 3
      : metrics.length >= 4
        ? 4
        : Math.max(metrics.length, 1);

  return (
    <div
      className={`rounded-2xl border ${
        roomy ? 'px-6 py-5' : 'px-3 py-2.5'
      } ${you ? 'border-[#f6f1e3]/45 bg-white/[0.06]' : 'border-white/10 bg-black/25'}`}
    >
      <div className="flex items-center gap-3">
        {spark ? <SpikeChart values={spark} tone={sparkTone} roomy={roomy} /> : null}
        <div className="min-w-0 flex-1">
          {kicker ? (
            <p
              className={`font-semibold uppercase tracking-[0.16em] ${
                house ? 'text-[#c08457]' : 'text-[#f6f1e3]/55'
              } ${roomy ? 'text-sm' : 'text-[10px]'}`}
            >
              {kicker}
            </p>
          ) : null}
          <p
            className={`truncate font-black ${roomy ? 'text-xl' : 'text-sm'} ${
              you ? 'text-[#f6f1e3]' : 'text-white'
            }`}
          >
            {title}
          </p>
        </div>
        <p className={`shrink-0 font-black text-white ${roomy ? 'text-xl' : 'text-sm'}`}>
          {headline}
        </p>
      </div>
      {sub ? (
        <p className={`mt-1 text-[#f6f1e3]/60 ${roomy ? 'text-base leading-snug' : 'truncate text-xs text-[#f6f1e3]/50'}`}>
          {sub}
        </p>
      ) : null}
      {metrics.length > 0 ? (
        <div
          className={`mt-3 grid ${roomy ? 'gap-x-4 gap-y-3' : 'mt-2 gap-x-2 gap-y-1'}`}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {metrics.map((item) => (
            <div key={item.label} className="min-w-0">
              <p
                className={`font-semibold uppercase tracking-wider text-[#f6f1e3]/50 ${
                  roomy ? 'text-sm' : 'text-[9px] text-[#f6f1e3]/40'
                }`}
              >
                {item.label}
              </p>
              <p
                className={`font-semibold text-[#f6f1e3]/90 ${
                  roomy ? 'text-lg' : 'truncate text-[11px] text-[#f6f1e3]/85'
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {foot ? (
        <p
          className={`mt-3 font-semibold leading-snug text-[#e8c547] ${
            roomy ? 'text-base' : 'mt-2 text-xs'
          }`}
        >
          {foot}
        </p>
      ) : null}
    </div>
  );
}

export function ScanFold({
  title,
  trailing,
  open,
  onToggle,
  children,
}: {
  title: string;
  trailing?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="glass-card mb-6 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">{title}</h2>
        {trailing ? (
          <span className="ml-auto truncate text-xs text-[#f6f1e3]/50">{trailing}</span>
        ) : (
          <span className="ml-auto" />
        )}
      </button>
      {open ? <div className="border-t border-white/10 px-4 pb-4 pt-3">{children}</div> : null}
    </div>
  );
}
