'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ScanCard from '@/components/ScanCard';
import {
  PERFORMANCE_PERIODS,
  formatLbs,
  formatPct,
  type AthletePerformanceBoard,
  type PerformanceLine,
  type PerformancePeriod,
  type PerformanceSummary,
  type WorkoutTrend,
} from '@/lib/athletePerformanceTypes';
import { formatHardnessAvg } from '@/lib/hardness';
import HardnessCharts from '@/components/HardnessCharts';

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  '15': '15 days',
  '30': '30 days',
  all: 'All time',
};

function formatWhen(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function toneFor(result: PerformanceLine['result']): 'up' | 'down' | 'plain' {
  if (result === 'gain') return 'up';
  if (result === 'loss') return 'down';
  return 'plain';
}

function LineRow({
  line,
  label,
  detail,
}: {
  line: PerformanceLine;
  label?: string;
  detail?: string | null;
}) {
  return (
    <ScanCard
      spark={line.spark}
      sparkTone={toneFor(line.result)}
      title={label || line.name}
      headline={formatPct(line.volumeChangePct)}
      sub={detail || undefined}
      metrics={[
        { label: 'This weight', value: formatLbs(line.currentWeight) },
        { label: 'This total', value: formatLbs(line.currentVolume) },
        { label: 'Total vs last', value: formatPct(line.volumeChangePct) },
        { label: 'Load vs last', value: formatPct(line.progressionPct) },
        { label: 'How hard', value: formatHardnessAvg(line.perception) },
      ]}
    />
  );
}

function Fold({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">{title}</h3>
        {hint ? (
          <span className="ml-auto truncate text-xs text-[#f6f1e3]/50">{hint}</span>
        ) : (
          <span className="ml-auto" />
        )}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
        )}
      </button>
      {open && <div className="space-y-2 border-t border-white/10 px-3 py-2">{children}</div>}
    </div>
  );
}

function SummaryCard({
  summary,
  athleteName,
}: {
  summary: PerformanceSummary;
  athleteName?: string;
}) {
  return (
    <ScanCard
      you={!athleteName}
      roomy={!athleteName}
      kicker={athleteName || 'Your performance'}
      title={athleteName ? `${athleteName} vs last time` : 'You vs last time'}
      headline={`${summary.gains} up · ${summary.losses} down`}
      sub={`How hard ${summary.perception == null ? '—' : formatHardnessAvg(summary.perception)}${
        summary.perceptionCount ? ` · ${summary.perceptionCount} sets` : ''
      }`}
      metrics={[
        { label: 'Gains', value: String(summary.gains) },
        { label: 'Losses', value: String(summary.losses) },
        { label: 'Hard', value: formatHardnessAvg(summary.perception) },
        { label: 'Wt up', value: String(summary.weightClimbing) },
        { label: 'Wt down', value: String(summary.weightDropping) },
        { label: 'Reps up', value: String(summary.repsClimbing) },
        { label: 'Reps down', value: String(summary.repsDropping) },
      ]}
    />
  );
}

export function PeriodPills({
  period,
  onPick,
}: {
  period: PerformancePeriod;
  onPick: (value: PerformancePeriod) => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      {PERFORMANCE_PERIODS.map((option) => {
        const selected = option === period;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onPick(option)}
            className={`min-h-12 rounded-2xl border text-base font-semibold ${
              selected
                ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
            }`}
          >
            {PERIOD_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

export function AthletePerformanceBoardView({
  board,
  page,
  athleteName,
}: {
  board: AthletePerformanceBoard;
  page: boolean;
  athleteName?: string;
}) {
  const summary = board.summary;
  const gainers = [...board.exercises]
    .filter((row) => row.result === 'gain')
    .sort((a, b) => (b.volumeChangePct || 0) - (a.volumeChangePct || 0))
    .slice(0, 4);
  const losers = [...board.exercises]
    .filter((row) => row.result === 'loss')
    .sort((a, b) => (a.volumeChangePct || 0) - (b.volumeChangePct || 0));

  return (
    <div className="space-y-3">
      <SummaryCard summary={summary} athleteName={athleteName} />
      <HardnessCharts board={board} athleteName={athleteName} />
      {page && gainers.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6d8b6e]">Gainers</p>
          {gainers.map((row) => (
            <LineRow key={row.key} line={row} />
          ))}
        </div>
      )}
      {page && losers.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a35d52]">Losers</p>
          {losers.map((row) => (
            <LineRow key={row.key} line={row} />
          ))}
        </div>
      )}
      {page && (
        <Fold title="Every lift" hint={`${board.exercises.length} lifts`}>
          {board.exercises.map((row) => (
            <LineRow key={row.key} line={row} />
          ))}
        </Fold>
      )}
      {page && (
        <Fold title="By workout" hint={`${board.workouts.length} days`}>
          {board.workouts.map((workout) => (
            <WorkoutBlock key={workout.workoutType} workout={workout} />
          ))}
        </Fold>
      )}
    </div>
  );
}

export default function AthletePerformance({
  variant = 'home',
}: {
  variant?: 'home' | 'page';
}) {
  const page = variant === 'page';
  const [open, setOpen] = useState(page);
  const [period, setPeriod] = useState<PerformancePeriod>('15');
  const [board, setBoard] = useState<AthletePerformanceBoard | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/athlete-performance?period=' + period)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.hidden) {
          setHidden(true);
          setBoard(null);
          return;
        }
        setHidden(false);
        setBoard(data as AthletePerformanceBoard);
      })
      .catch(() => {
        if (!cancelled) {
          setHidden(false);
          setBoard(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (hidden) return null;

  const summary = board?.summary;
  const trailing = summary ? `${summary.gains} up · ${summary.losses} down` : undefined;
  const empty =
    !loading && !!board && board.exercises.length === 0 && board.workouts.length === 0;

  const body = (
    <div>
      {page ? (
        <p className="mb-3 text-xs text-[#f6f1e3]/55">
          You vs the last time you did that lift. This weight is the heaviest set. This total is
          lb × reps. Green is up. Red is down. This is not vs the house.
        </p>
      ) : null}
      <PeriodPills
        period={period}
        onPick={(value) => {
          setPeriod(value);
          setLoading(true);
        }}
      />
      {loading ? (
        <p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>
      ) : empty ? (
        <p className="text-sm text-[#f6f1e3]/55">
          No finished workouts in this window. Log a session and this fills in.
        </p>
      ) : board ? (
        <AthletePerformanceBoardView board={board} page={page} />
      ) : null}
      {!page && board ? (
        <Link
          href="/performance"
          className="mt-4 inline-flex min-h-11 items-center text-base font-semibold text-[#e8c547]"
        >
          Open Your performance
        </Link>
      ) : null}
    </div>
  );

  if (page) return body;

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <h2 className="text-base font-black uppercase tracking-[0.16em] text-[#e8c547]">
          Your performance
        </h2>
        <span className="ml-auto truncate text-sm text-[#f6f1e3]/55">{trailing || 'You vs last time'}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
        )}
      </button>
      {open && <div className="border-t border-white/10 px-5 pb-5 pt-4">{body}</div>}
    </div>
  );
}

function WorkoutBlock({ workout }: { workout: WorkoutTrend }) {
  const [open, setOpen] = useState(false);
  const when = formatWhen(workout.currentDate);
  const prior = formatWhen(workout.priorDate);
  const detail = [
    when ? (prior ? `${when} vs ${prior}` : when) : null,
    workout.weekNumber ? `Week ${workout.weekNumber}` : null,
    `${workout.gains} up · ${workout.losses} down`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <button type="button" onClick={() => setOpen((current) => !current)} className="w-full text-left" aria-expanded={open}>
        <LineRow line={workout} label={workout.workoutType} detail={detail} />
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-3">
          {workout.exercises.map((row) => (
            <LineRow key={`${workout.workoutType}-${row.name}`} line={row} />
          ))}
        </div>
      )}
    </div>
  );
}
