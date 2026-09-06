'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ScanCard from '@/components/ScanCard';
import FlagStrip from '@/components/FlagStrip';
import { FourKpiSpike, KpiList, VolumeSpikeList } from '@/components/KpiList';
import { kpisFromBoard, kpisFromLine } from '@/lib/kpi';
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
import { formatHardnessWithPct } from '@/lib/hardness';
import HardnessCharts from '@/components/HardnessCharts';
import HouseholdAthleteCard from '@/components/HouseholdAthleteCard';
import { mergeAthletePerformanceBoards } from '@/lib/mergeAthletePerformance';
import { firstName, type PerformanceSnapshot } from '@/lib/scoreboardTypes';

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
  snapshot?: PerformanceSnapshot;
};

function formatWhen(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function lineView(line: PerformanceLine) {
  return {
    spark: line.spark,
    result: line.result,
    volumeChangePct: line.volumeChangePct,
    progressionPct: line.progressionPct,
    volume: line.effortVolume,
  };
}

function verdictLabel(result: PerformanceLine['result']) {
  if (result === 'gain') return 'Up';
  if (result === 'loss') return 'Down';
  if (result === 'first') return 'First';
  if (result === 'held') return 'Held';
  return 'Mixed';
}

function hasReps(line: PerformanceLine): line is PerformanceLine & { currentReps: number; priorReps: number | null } {
  return 'currentReps' in line;
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
  const view = lineView(line);
  const reps = hasReps(line) ? line.currentReps : null;
  const now = [
    `${formatLbs(line.currentWeight)} lb`,
    reps != null ? `${Math.round(reps)} reps` : null,
    `${formatLbs(view.volume)} total`,
  ]
    .filter(Boolean)
    .join(' · ');
  const vs = formatPct(view.volumeChangePct);
  const headline =
    view.result === 'first' ? 'First' : view.volumeChangePct == null ? verdictLabel(view.result) : `${verdictLabel(view.result)} · ${vs}`;
  const tone =
    view.result === 'gain' ? 'text-[#6d8b6e]' : view.result === 'loss' ? 'text-[#a35d52]' : 'text-[#f6f1e3]/80';
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{label || line.name}</p>
          <p className="mt-0.5 truncate text-xs text-[#f6f1e3]/55">{[now, detail].filter(Boolean).join(' · ')}</p>
        </div>
        <p className={`shrink-0 text-sm font-black ${tone}`}>{headline}</p>
      </div>
      <KpiList rows={kpisFromLine(line)} />
    </div>
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

function compareStory(up: number, down: number, noun: string) {
  if (up === 0 && down === 0) return `${noun} has nothing to compare.`;
  if (up > down) return `${noun} moving up.`;
  if (down > up) return `${noun} moving down.`;
  return `${noun} mixed.`;
}

function summaryStory(summary: PerformanceSummary, gains: number, losses: number) {
  const lifts =
    gains + losses === 0
      ? 'No lift to compare yet.'
      : gains > losses
        ? `${gains} lifts are up. ${losses} ${losses === 1 ? 'is' : 'are'} down.`
        : losses > gains
          ? `${losses} lifts are down. ${gains} ${gains === 1 ? 'is' : 'are'} up.`
          : `${gains} up, ${losses} down. Even.`;
  return [
    lifts,
    compareStory(summary.weightClimbing, summary.weightDropping, 'Weight'),
    compareStory(summary.repsClimbing, summary.repsDropping, 'Reps'),
    `Effort ${formatHardnessWithPct(summary.perception)}${
      summary.perceptionCount ? ` on ${summary.perceptionCount} sets` : ''
    }.`,
  ].join(' ');
}

function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">{children}</p>
      {hint ? <p className="mt-1 text-sm text-[#f6f1e3]/55">{hint}</p> : null}
    </div>
  );
}

function SummaryCard({
  summary,
  athleteName,
  board,
}: {
  summary: PerformanceSummary;
  athleteName?: string;
  board: AthletePerformanceBoard;
}) {
  const gains = board.exercises.filter((row) => lineView(row).result === 'gain').length;
  const losses = board.exercises.filter((row) => lineView(row).result === 'loss').length;
  return (
    <ScanCard
      you={!athleteName}
      roomy={!athleteName}
      kicker={athleteName || undefined}
      title={athleteName ? `${athleteName} vs last time` : 'You vs last time'}
      headline={`${gains} up · ${losses} down`}
      sub={summaryStory(summary, gains, losses)}
      metrics={[]}
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
    <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
      {PERFORMANCE_PERIODS.map((option) => {
        const selected = option === period;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onPick(option)}
            className={`min-h-10 min-w-0 flex-1 rounded-2xl border px-1 text-sm font-semibold ${
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
  grain = 'exercise',
}: {
  board: AthletePerformanceBoard;
  page: boolean;
  athleteName?: string;
  /** `detail` is `/performance` only. Admin keeps `classic`. */
  layout?: 'classic' | 'detail';
  grain?: 'exercise' | 'workout';
}) {
  const summary = board.summary;
  const lines = grain === 'workout' ? board.workouts : board.exercises;
  const gainers = [...lines]
    .filter((row) => lineView(row).result === 'gain')
    .sort((a, b) => (lineView(b).volumeChangePct || 0) - (lineView(a).volumeChangePct || 0));
  const losers = [...lines]
    .filter((row) => lineView(row).result === 'loss')
    .sort((a, b) => (lineView(a).volumeChangePct || 0) - (lineView(b).volumeChangePct || 0));
  const held = lines.filter((row) => {
    const result = lineView(row).result;
    return result === 'held' || result === 'first' || result === 'mixed';
  });
  const windowKpis = kpisFromBoard(board);
  const spikeItems = lines.map((row) => ({
    key: 'key' in row ? row.key : row.workoutType,
    name: row.name,
    pct: row.rawVolumeChangePct ?? row.volumeChangePct,
    kpis: kpisFromLine(row),
  }));
  const [spikeKey, setSpikeKey] = useState<string | null>(null);

  const cutBlock =
    windowKpis && windowKpis.length > 0 ? (
      <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">This cut vs last time</p>
        <KpiList rows={windowKpis} />
      </div>
    ) : null;
  const kpiSpikeBlock =
    page && windowKpis && windowKpis.some((row) => row.pct != null) ? (
      <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
        <FourKpiSpike rows={windowKpis} />
      </div>
    ) : null;
  const volumeSpikeBlock =
    page && spikeItems.length > 0 ? (
      <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">Spike · Volume %</p>
        <VolumeSpikeList items={spikeItems} selected={spikeKey} onSelect={setSpikeKey} />
      </div>
    ) : null;

  const gainerBlock =
    page && gainers.length > 0 ? (
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6d8b6e]">
          Moving up · {gainers.length}
        </p>
        {gainers.map((row) => (
          <LineRow key={'key' in row ? row.key : row.workoutType} line={row} />
        ))}
      </div>
    ) : null;
  const loserBlock =
    page && losers.length > 0 ? (
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a35d52]">
          Moving down · {losers.length}
        </p>
        {losers.map((row) => (
          <LineRow key={'key' in row ? row.key : row.workoutType} line={row} />
        ))}
      </div>
    ) : null;
  const heldBlock =
    page && held.length > 0 ? (
      <Fold title="Held / first" hint={`${held.length} lifts`}>
        {held.map((row) => (
          <LineRow key={'key' in row ? row.key : row.workoutType} line={row} />
        ))}
      </Fold>
    ) : null;
  const everyLift = page && grain === 'exercise' && lines.length > 0 ? (
    <Fold title="Every lift" hint={`${board.exercises.length} lifts`}>
      {lines.map((row) => (
        <LineRow key={'key' in row ? row.key : row.workoutType} line={row} />
      ))}
    </Fold>
  ) : null;
  const byWorkout = page && grain === 'exercise' && board.workouts.length > 0 ? (
    <Fold title="By workout" hint={`${board.workouts.length} days`}>
      {board.workouts.map((workout) => (
        <WorkoutBlock key={workout.workoutType} workout={workout} />
      ))}
    </Fold>
  ) : null;
  const charts = (
    <Fold title="Effort by day / lift" hint="1–5">
      <HardnessCharts board={board} athleteName={athleteName} />
    </Fold>
  );

  if (page && layout === 'detail') {
    return (
      <div className="space-y-3">
        {cutBlock}
        {kpiSpikeBlock}
        {volumeSpikeBlock}
        {gainerBlock}
        {loserBlock}
        {heldBlock}
        {everyLift}
        {byWorkout}
        {charts}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cutBlock}
      <SummaryCard summary={summary} athleteName={athleteName} board={board} />
      {gainerBlock}
      {loserBlock}
      {charts}
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
  const [workout, setWorkout] = useState('all');
  const [grain, setGrain] = useState<'exercise' | 'workout'>('exercise');
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const filtered = useMemo(() => {
    if (!merged) return null;
    if (workout === 'all') return merged;
    const selectedWorkouts = merged.workouts.filter((row) => row.workoutType === workout);
    const names = new Set(selectedWorkouts.flatMap((row) => row.exercises.map((item) => item.name)));
    return {
      ...merged,
      workouts: selectedWorkouts,
      exercises: merged.exercises.filter((row) => names.has(row.name)),
    };
  }, [merged, workout]);

  const flags = useMemo(() => {
    if (!household) return null;
    return household
      .filter((row) => selected.includes(row.userId))
      .reduce((sum, row) => addPerformanceFlags(sum, row.flags || emptyPerformanceFlags()), emptyPerformanceFlags());
  }, [household, selected]);

  const snapshots = useMemo(() => {
    if (household) {
      return household
        .filter((row) => selected.includes(row.userId) && row.snapshot)
        .map((row) => row.snapshot as PerformanceSnapshot);
    }
    return board?.snapshot ? [board.snapshot] : [];
  }, [board, household, selected]);

  if (hidden) return null;

  const viewBoard = filtered;
  const trailing = viewBoard
    ? `${viewBoard.exercises.filter((row) => lineView(row).result === 'gain').length} up · ${
        viewBoard.exercises.filter((row) => lineView(row).result === 'loss').length
      } down`
    : undefined;
  const empty =
    !loading && !!viewBoard && viewBoard.exercises.length === 0 && viewBoard.workouts.length === 0;
  const noneSelected = page && isAdmin && selected.length === 0;
  const workoutOptions = merged?.workouts.map((row) => row.workoutType) || [];

  const filters = (
    <div className="mb-3 rounded-2xl border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={() => setFiltersOpen((current) => !current)}
        className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={filtersOpen}
      >
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">Cut</h3>
        <span className="ml-auto truncate text-xs text-[#f6f1e3]/50">
          {PERIOD_LABELS[period]}
          {workout !== 'all' ? ` · ${workout}` : ''}
          {` · ${grain === 'workout' ? 'Workout' : 'Exercise'}`}
        </span>
        {filtersOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
        )}
      </button>
      {filtersOpen && (
        <div className="space-y-3 border-t border-white/10 px-3 py-3">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/45">Period</p>
            <PeriodPills
              period={period}
              onPick={(value) => {
                setPeriod(value);
                setWorkout('all');
                setLoading(true);
              }}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/45">Workout</p>
            <div className="flex min-w-0 gap-1 overflow-x-auto">
              {['all', ...workoutOptions].map((option) => {
                const selectedWorkout = option === workout;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setWorkout(option)}
                    className={`min-h-10 shrink-0 rounded-2xl border px-3 text-sm font-semibold ${
                      selectedWorkout
                        ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                        : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
                    }`}
                  >
                    {option === 'all' ? 'All' : option.replace(' Body ', ' ')}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/45">Grain</p>
            <div className="grid grid-cols-2 gap-1">
              {(['exercise', 'workout'] as const).map((option) => {
                const selectedGrain = option === grain;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGrain(option)}
                    className={`min-h-10 rounded-2xl border text-sm font-semibold ${
                      selectedGrain
                        ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                        : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
                    }`}
                  >
                    {option === 'exercise' ? 'Exercise' : 'Workout'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const body = (
    <div>
      {page ? (
        filters
      ) : (
        <div className="mb-3">
          <PeriodPills
            period={period}
            onPick={(value) => {
              setPeriod(value);
              setWorkout('all');
              setLoading(true);
            }}
          />
        </div>
      )}
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
      ) : viewBoard && page ? (
        <div className="space-y-8">
          <section>
            <SectionLabel hint="The read on this window vs last time you did those lifts.">
              Summary
            </SectionLabel>
            <SummaryCard summary={viewBoard.summary} board={viewBoard} />
          </section>
          {snapshots.length > 0 || flags ? (
            <section>
              <SectionLabel hint="What you did in this window. Totals use Effort. Place is vs the house on raw iron.">
                Details
              </SectionLabel>
              {snapshots.length > 0 ? (
                <div className="space-y-3">
                  {snapshots.map((snapshot) => (
                    <HouseholdAthleteCard
                      key={snapshot.row.id}
                      snapshot={snapshot}
                      you={snapshots.length === 1}
                    />
                  ))}
                </div>
              ) : null}
              {isAdmin === true && flags ? <div className="mt-3"><FlagStrip period={period} flags={flags} /></div> : null}
              {isAdmin === false ? <div className="mt-3"><FlagStrip period={period} /></div> : null}
            </section>
          ) : null}
          <section>
            <SectionLabel hint="Each lift vs the last time you did it. Green is up. Red is down.">
              Progression
            </SectionLabel>
            <AthletePerformanceBoardView board={viewBoard} page layout="detail" grain={grain} />
          </section>
        </div>
      ) : viewBoard ? (
        <AthletePerformanceBoardView board={viewBoard} page={false} layout="classic" />
      ) : null}
      {!page && viewBoard ? (
        <Link
          href="/performance"
          className="mt-4 inline-flex min-h-11 items-center text-base font-semibold text-[#e8c547]"
        >
          Open Your performance
        </Link>
      ) : null}
    </div>
  );

  const homeKpis = !page && !open && viewBoard ? kpisFromBoard(viewBoard) : null;

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
      {homeKpis ? (
        <div className="border-t border-white/10 px-5 pb-4">
          <KpiList rows={homeKpis} />
        </div>
      ) : null}
      {open && <div className="border-t border-white/10 px-5 pb-5 pt-4">{body}</div>}
    </div>
  );
}

function WorkoutBlock({ workout }: { workout: WorkoutTrend }) {
  const [open, setOpen] = useState(false);
  const when = formatWhen(workout.currentDate);
  const prior = formatWhen(workout.priorDate);
  const gains = workout.exercises.filter((row) => lineView(row).result === 'gain').length;
  const losses = workout.exercises.filter((row) => lineView(row).result === 'loss').length;
  const detail = [
    when ? (prior ? `${when} vs ${prior}` : when) : null,
    workout.weekNumber ? `Week ${workout.weekNumber}` : null,
    `${gains} up · ${losses} down`,
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
