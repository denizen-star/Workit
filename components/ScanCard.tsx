'use client';

import type { ReactNode } from 'react';
import SpikeChart from '@/components/SpikeChart';

export type ScanMetric = {
  label: string;
  value: string;
};

/**
 * Dense scan row used on Home Quiet, Scoreboard, and Your performance.
 * Gold chrome matches the live scoreboard first-place card.
 */
export default function ScanCard({
  you = false,
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
  kicker?: string;
  title: string;
  headline: string;
  sub?: string;
  metrics: ScanMetric[];
  foot?: string;
  spark?: number[];
  sparkTone?: 'up' | 'down' | 'plain';
}) {
  const columns = metrics.length >= 6 ? 3 : metrics.length >= 4 ? 4 : Math.max(metrics.length, 1);

  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 ${
        you ? 'border-[#e8c547]/70 bg-[#e8c547]/10' : 'border-white/10 bg-black/25'
      }`}
    >
      <div className="flex items-center gap-2">
        {spark ? <SpikeChart values={spark} tone={sparkTone} /> : null}
        <div className="min-w-0 flex-1">
          {kicker ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f6f1e3]/45">
              {kicker}
            </p>
          ) : null}
          <p className={`truncate text-sm font-black ${you ? 'text-[#e8c547]' : 'text-white'}`}>
            {title}
          </p>
        </div>
        <p className="shrink-0 text-sm font-black text-white">{headline}</p>
      </div>
      {sub ? <p className="mt-0.5 truncate text-xs text-[#f6f1e3]/50">{sub}</p> : null}
      {metrics.length > 0 ? (
        <div
          className="mt-2 grid gap-x-2 gap-y-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {metrics.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#f6f1e3]/40">
                {item.label}
              </p>
              <p className="truncate text-[11px] font-semibold text-[#f6f1e3]/85">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {foot ? (
        <p className="mt-2 text-xs font-semibold leading-snug text-[#e8c547]">{foot}</p>
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
