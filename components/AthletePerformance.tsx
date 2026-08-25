'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Minus, TrendingUp } from 'lucide-react';
import SpikeChart from '@/components/SpikeChart';
import {
  PERFORMANCE_PERIODS,
  formatLbs,
  formatPct,
  performanceRangeLabel,
  type AthletePerformanceBoard,
  type PerformanceLine,
  type PerformancePeriod,
  type PerformanceSummary,
  type WorkoutTrend,
} from '@/lib/athletePerformanceTypes';
import { formatHardnessAvg } from '@/lib/hardness';

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

function Arrow({ result }: { result: PerformanceLine['result'] }) {
  const tone = toneFor(result);
  const className =
    tone === 'up' ? 'text-[#22c55e]' : tone === 'down' ? 'text-[#ff2a2a]' : 'text-[#f6f1e3]/45';
  if (result === 'gain') return <ArrowUp className={`h-4 w-4 shrink-0 ${className}`} />;
  if (result === 'loss') return <ArrowDown className={`h-4 w-4 shrink-0 ${className}`} />;
  return <Minus className={`h-4 w-4 shrink-0 ${className}`} />;
}

function pctClass(value: number | null | undefined) {
  if (value == null) return 'text-[#f6f1e3]/45';
  if (value > 0) return 'text-[#22c55e]';
  if (value < 0) return 'text-[#ff2a2a]';
  return 'text-[#f6f1e3]/55';
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
    <div className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 border-b border-white/8 py-2 last:border-b-0">
      <Arrow result={line.result} />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{label || line.name}</p>
        {detail ? <p className="truncate text-[10px] text-[#f6f1e3]/45">{detail}</p> : null}
      </div>
      <SpikeChart values={line.spark} tone={toneFor(line.result)} />
      <div className="col-span-3 mt-0.5 grid grid-cols-4 gap-1 text-right text-[11px] font-semibold leading-tight">
        <p className="text-[#f6f1e3]/80">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#f6f1e3]/40">
            Wt
          </span>
          {formatLbs(line.currentWeight)}
        </p>
        <p className="text-[#f5d76e]">
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#f6f1e3]/40">
            Total
          </span>
          {formatLbs(line.currentVolume)}
        </p>
        <p className={pctClass(line.volumeChangePct)}>
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#f6f1e3]/40">
            % chg
          </span>
          {formatPct(line.volumeChangePct)}
        </p>
        <p className={pctClass(line.progressionPct)}>
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#f6f1e3]/40">
            Prog
          </span>
          {formatPct(line.progressionPct)}
        </p>
      </div>
    </div>
  );
}

function Fold({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
      {open && <div className="border-t border-white/10 px-3 pb-2">{children}</div>}
    </div>
  );
}

function SummaryList({ summary }: { summary: PerformanceSummary }) {
  const rows: Array<{ label: string; value: string; tone?: 'up' | 'down' }> = [
    { label: 'Gains', value: String(summary.gains), tone: 'up' },
    { label: 'Losses', value: String(summary.losses), tone: 'down' },
    { label: 'Weight up', value: String(summary.weightClimbing), tone: 'up' },
    { label: 'Weight down', value: String(summary.weightDropping), tone: 'down' },
    { label: 'Reps up', value: String(summary.repsClimbing) },
    { label: 'Reps down', value: String(summary.repsDropping) },
    {
      label: 'Perception',
      value: summary.perception == null ? '—' : formatHardnessAvg(summary.perception),
    },
  ];

  return (
    <div>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b border-white/8 py-2 text-sm last:border-b-0"
        >
          <span className="text-[#f6f1e3]/60">{row.label}</span>
          <span
            className={`font-black ${
              row.tone === 'up'
                ? 'text-[#22c55e]'
                : row.tone === 'down'
                  ? 'text-[#ff2a2a]'
                  : 'text-white'
            }`}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AthletePerformance() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<PerformancePeriod>('15');
  const [board, setBoard] = useState<AthletePerformanceBoard | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
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
  }, [open, period]);

  if (hidden) return null;

  const summary = board?.summary;
  const empty =
    !loading && !!board && board.exercises.length === 0 && board.workouts.length === 0;

  return (
    <div className="glass-card mb-8 p-5">
      <button
        type="button"
        onClick={() =>
          setOpen((current) => {
            if (!current) setLoading(true);
            return !current;
          })
        }
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <TrendingUp className="h-6 w-6 text-[#e8c547]" />
        <h2 className="text-2xl font-black text-white">Your performance</h2>
        <span className="ml-auto text-sm text-[#f6f1e3]/65">{performanceRangeLabel(period)}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />
        )}
      </button>

      {open && (
        <div className="mt-3">
          <p className="mb-3 text-xs text-[#f6f1e3]/55">
            You vs last time. Weight, total, % change, progression.
          </p>

          <div className="mb-3 grid grid-cols-3 gap-2">
            {PERFORMANCE_PERIODS.map((option) => {
              const selected = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setPeriod(option);
                    setLoading(true);
                  }}
                  className={`min-h-10 rounded-2xl border text-sm font-semibold ${
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

          {loading ? (
            <p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>
          ) : empty ? (
            <p className="text-sm text-[#f6f1e3]/55">
              No finished workouts in this window. Log a session and this fills in.
            </p>
          ) : (
            <div className="space-y-2">
              {summary && (
                <Fold
                  title="Summary"
                  hint={`↑ ${summary.gains} · ↓ ${summary.losses}`}
                >
                  <SummaryList summary={summary} />
                </Fold>
              )}

              <Fold title="By exercise" hint={`${board?.exercises.length || 0} lifts`}>
                {board?.exercises.map((row) => (
                  <LineRow key={row.key} line={row} />
                ))}
              </Fold>

              <Fold title="By workout" hint={`${board?.workouts.length || 0} days`}>
                {board?.workouts.map((workout) => (
                  <WorkoutBlock key={workout.workoutType} workout={workout} />
                ))}
              </Fold>
            </div>
          )}
        </div>
      )}
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
    <div className="border-b border-white/8 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <LineRow line={workout} label={workout.workoutType} detail={detail} />
      </button>
      {open && (
        <div className="ml-6">
          {workout.exercises.map((row) => (
            <LineRow key={`${workout.workoutType}-${row.name}`} line={row} />
          ))}
        </div>
      )}
    </div>
  );
}
