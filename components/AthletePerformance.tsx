'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ScanCard from '@/components/ScanCard';
import FlagStrip from '@/components/FlagStrip';
import {
  PERFORMANCE_PERIODS,
  addPerformanceFlags,
  emptyPerformanceFlags,
  formatLbs,
  formatPct,
  type AthletePerformanceBoard,
  type PerformanceFlags,
  type PerformanceLine,
  type PerformancePeriod,
  type PerformanceSummary,
  type WorkoutTrend,
} from '@/lib/athletePerformanceTypes';
import { formatHardnessAvg } from '@/lib/hardness';
import HardnessCharts from '@/components/HardnessCharts';
import { mergeAthletePerformanceBoards } from '@/lib/mergeAthletePerformance';
import { firstName } from '@/lib/scoreboardTypes';

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  t: 'T',
  't-1': 'T-1',
  't-7': 'T-7',
  't-15': 'T-15',
  't-30': 'T-30',
  all: 'All',
};

type HouseholdRow = AthletePerformanceBoard & {
  userId: number;
  name: string;
  flags?: PerformanceFlags;
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
    <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
  layout = 'classic',
}: {
  board: AthletePerformanceBoard;
  page: boolean;
  athleteName?: string;
  /** `detail` is `/performance` only. Admin keeps `classic`. */
  layout?: 'classic' | 'detail';
}) {
  const summary = board.summary;
  const gainers = [...board.exercises]
    .filter((row) => row.result === 'gain')
    .sort((a, b) => (b.volumeChangePct || 0) - (a.volumeChangePct || 0))
    .slice(0, 4);
  const losers = [...board.exercises]
    .filter((row) => row.result === 'loss')
    .sort((a, b) => (a.volumeChangePct || 0) - (b.volumeChangePct || 0));

  const gainerBlock =
    page && gainers.length > 0 ? (
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6d8b6e]">Gainers</p>
        {gainers.map((row) => (
          <LineRow key={row.key} line={row} />
        ))}
      </div>
    ) : null;
  const loserBlock =
    page && losers.length > 0 ? (
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a35d52]">Losers</p>
        {losers.map((row) => (
          <LineRow key={row.key} line={row} />
        ))}
      </div>
    ) : null;
  const everyLift = page ? (
    <Fold title="Every lift" hint={`${board.exercises.length} lifts`}>
      {board.exercises.map((row) => (
        <LineRow key={row.key} line={row} />
      ))}
    </Fold>
  ) : null;
  const byWorkout = page ? (
    <Fold title="By workout" hint={`${board.workouts.length} days`}>
      {board.workouts.map((workout) => (
        <WorkoutBlock key={workout.workoutType} workout={workout} />
      ))}
    </Fold>
  ) : null;

  if (page && layout === 'detail') {
    return (
      <div className="space-y-3">
        <SummaryCard summary={summary} athleteName={athleteName} />
        <HardnessCharts board={board} athleteName={athleteName} section="workout" />
        {byWorkout}
        {gainerBlock}
        {loserBlock}
        <HardnessCharts board={board} athleteName={athleteName} section="lift" />
        {everyLift}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SummaryCard summary={summary} athleteName={athleteName} />
      <HardnessCharts board={board} athleteName={athleteName} />
      {gainerBlock}
      {loserBlock}
      {everyLift}
      {byWorkout}
    </div>
  );
}

function AthleteFilter({
  rows,
  selected,
  onToggle,
  onCheckAll,
}: {
  rows: HouseholdRow[];
  selected: number[];
  onToggle: (userId: number) => void;
  onCheckAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    selected.length === 0
      ? 'No athletes'
      : selected.length === 1
        ? firstName(rows.find((row) => row.userId === selected[0])?.name || 'You')
        : `${selected.length} athletes`;

  return (
    <div className="relative mb-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-[#e8c547]/40 bg-black/25 px-3 text-left text-base font-semibold text-[#e8c547]"
        aria-expanded={open}
      >
        <span>{label}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full space-y-1 rounded-2xl border border-white/10 bg-[#141414] p-2 shadow-xl">
          <button
            type="button"
            onClick={onCheckAll}
            className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-[#e8c547]"
          >
            Check all
          </button>
          {rows.map((row) => {
            const checked = selected.includes(row.userId);
            return (
              <label
                key={row.userId}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[#f6f1e3]/85"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(row.userId)}
                  className="h-4 w-4 accent-[#e8c547]"
                />
                <span className="text-sm font-semibold">{row.name}</span>
              </label>
            );
          })}
        </div>
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
  const [period, setPeriod] = useState<PerformancePeriod>('t');
  const [board, setBoard] = useState<AthletePerformanceBoard | null>(null);
  const [household, setHousehold] = useState<HouseholdRow[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(page ? null : false);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      if (page) {
        const meRes = await fetch('/api/me');
        const me = meRes.ok ? await meRes.json() : null;
        const admin = Boolean(me?.user?.isAdmin);
        const userId = Number(me?.user?.id);
        if (cancelled) return;
        setIsAdmin(admin);

        if (admin) {
          const res = await fetch('/api/athlete-performance?household=1&includeTest=1&period=' + period);
          const data = res.ok ? await res.json() : null;
          if (cancelled) return;
          const rows = (Array.isArray(data?.rows) ? data.rows : []) as HouseholdRow[];
          setHousehold(rows);
          setHidden(false);
          setSelected((current) => {
            if (current.length > 0) return current.filter((id) => rows.some((row) => row.userId === id));
            return Number.isFinite(userId) ? [userId] : [];
          });
          return;
        }
      }

      const res = await fetch('/api/athlete-performance?period=' + period);
      const data = res.ok ? await res.json() : null;
      if (cancelled) return;
      setHousehold(null);
      if (data?.hidden) {
        setHidden(true);
        setBoard(null);
        return;
      }
      setHidden(false);
      setBoard(data as AthletePerformanceBoard);
    };

    load()
      .catch(() => {
        if (!cancelled) {
          setHidden(false);
          setBoard(null);
          setHousehold(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, period]);

  const merged = useMemo(() => {
    if (!household) return board;
    const rows = household.filter((row) => selected.includes(row.userId));
    return mergeAthletePerformanceBoards(rows, period);
  }, [board, household, period, selected]);

  const flags = useMemo(() => {
    if (!household) return null;
    return household
      .filter((row) => selected.includes(row.userId))
      .reduce((sum, row) => addPerformanceFlags(sum, row.flags || emptyPerformanceFlags()), emptyPerformanceFlags());
  }, [household, selected]);

  if (hidden) return null;

  const summary = merged?.summary;
  const trailing = summary ? `${summary.gains} up · ${summary.losses} down` : undefined;
  const empty =
    !loading && !!merged && merged.exercises.length === 0 && merged.workouts.length === 0;
  const noneSelected = page && isAdmin && selected.length === 0;

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
      {page && isAdmin === true && household ? (
        <AthleteFilter
          rows={household}
          selected={selected}
          onToggle={(userId) => {
            setSelected((current) =>
              current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
            );
          }}
          onCheckAll={() => setSelected(household.map((row) => row.userId))}
        />
      ) : null}
      {loading ? (
        <p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>
      ) : noneSelected ? (
        <p className="text-sm text-[#f6f1e3]/55">No athletes selected.</p>
      ) : empty ? (
        <p className="text-sm text-[#f6f1e3]/55">
          No finished workouts in this window. Log a session and this fills in.
        </p>
      ) : merged ? (
        <AthletePerformanceBoardView board={merged} page={page} layout={page ? 'detail' : 'classic'} />
      ) : null}
      {page && isAdmin === true && flags ? <FlagStrip period={period} flags={flags} /> : null}
      {page && isAdmin === false ? <FlagStrip period={period} /> : null}
      {!page && merged ? (
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
