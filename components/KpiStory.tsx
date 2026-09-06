'use client';

import { KpiList } from '@/components/KpiList';
import { formatPct, type PerformanceLine, type WorkoutTrend } from '@/lib/athletePerformanceTypes';
import { kpisFromLine } from '@/lib/kpi';
import { lastSessionSub, lastSessionTitle, liftStory, volumePct } from '@/lib/kpiView';
import { whyFromLine } from '@/lib/kpiWhy';

export function KpiCard({
  kicker,
  title,
  sub,
  line,
  words,
  why,
}: {
  kicker?: string;
  title: string;
  sub?: string | null;
  line: Parameters<typeof kpisFromLine>[0];
  words?: boolean;
  why?: string | boolean;
}) {
  const whyText = why === true ? whyFromLine(line) : typeof why === 'string' ? why : null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      {kicker ? (
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#e8c547]">{kicker}</p>
      ) : null}
      <p className="mt-1 text-base font-black text-white">{title}</p>
      {sub ? <p className="mt-0.5 text-sm text-[#f6f1e3]/55">{sub}</p> : null}
      {whyText ? <p className="mt-1 text-sm text-[#f6f1e3]/55">{whyText}</p> : null}
      <KpiList rows={kpisFromLine(line, words)} />
    </div>
  );
}

export function LastSessionCard({ workout }: { workout: WorkoutTrend }) {
  return (
    <KpiCard
      kicker={`Last session · ${workout.workoutType.replace(' Body ', ' ')}`}
      title={lastSessionTitle(workout) || workout.workoutType.replace(' Body ', ' ')}
      sub={lastSessionSub(workout)}
      line={workout}
    />
  );
}

export function LiftCard({
  row,
  chip,
}: {
  row: PerformanceLine;
  chip?: 'up' | 'down' | 'held' | 'best';
}) {
  const pct = volumePct(row);
  const label =
    chip === 'best'
      ? `Best lift · ${formatPct(pct)}`
      : chip === 'up'
        ? `Up · ${formatPct(pct)}`
        : chip === 'down'
          ? `Down · ${formatPct(pct)}`
          : 'Held';
  const color = chip === 'up' || chip === 'best' ? '#6d8b6e' : chip === 'down' ? '#a35d52' : '#f6f1e3';
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color }}>
        {label}
      </p>
      <p className="mt-1 text-base font-black text-white">{row.name}</p>
      <p className="mt-1 text-sm text-[#f6f1e3]/55">{liftStory(row)}</p>
      <p className="mt-1 text-sm text-[#f6f1e3]/55">Why: {whyFromLine(row)}</p>
      <KpiList rows={kpisFromLine(row)} />
    </div>
  );
}

export function HBar({
  label,
  value,
  max,
  color,
  prior,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  prior?: number | null;
}) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
  const priorWidth =
    prior != null && Number.isFinite(prior) && max > 0
      ? Math.max(1, Math.min(100, Math.round((prior / max) * 100)))
      : null;
  return (
    <div className="hbar-row">
      <span>{label}</span>
      <div className="hbar" title={prior != null ? `Last time ${Math.round(prior).toLocaleString()}` : undefined}>
        <i style={{ width: `${width}%`, background: color }} />
        {priorWidth != null ? <em className="hbar-last" style={{ left: `${priorWidth}%` }} /> : null}
      </div>
      <b>
        {Math.round(value).toLocaleString()}
        {prior != null ? <span>last {Math.round(prior).toLocaleString()}</span> : null}
      </b>
    </div>
  );
}
