'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FourKpiSpike, KpiList, VolumeSpikeList } from '@/components/KpiList';
import { HBar, KpiCard, LastSessionCard, LiftCard } from '@/components/KpiStory';
import { PeriodPills } from '@/components/AthletePerformance';
import {
  formatLbs,
  normalizePerformancePeriod,
  performanceRangeLabel,
  type AthletePerformanceBoard,
  type PerformancePeriod,
} from '@/lib/athletePerformanceTypes';
import { kpisFromBoard, kpisFromLine, kpisFromLines } from '@/lib/kpi';
import {
  bestProgress,
  boardHasActivity,
  boardSummaryLine,
  formatWhen,
  gainers,
  hasPrior,
  heldLifts,
  heldOrFirst,
  latestWorkout,
  losers,
  volumePct,
} from '@/lib/kpiView';
import { progressIntro, progressSummaryBody, progressVerdict, workoutWhy } from '@/lib/kpiWhy';
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

type Tab = 'current' | 'progress' | 'analytics';
type Grain = 'workout' | 'exercise' | 'set';

const TAB_LABEL: Record<Tab, string> = {
  current: 'Current',
  progress: 'Progress',
  analytics: 'Analytics',
};

type HouseholdRow = AthletePerformanceBoard & { userId: number; name: string };

function TabSwitch({
  tab,
  tabs,
  onPick,
}: {
  tab: Tab;
  tabs: Tab[];
  onPick: (value: Tab) => void;
}) {
  return (
    <div className="mb-4 grid gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      {tabs.map((option) => {
        const on = option === tab;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onPick(option)}
            className={`min-h-11 rounded-2xl border text-sm font-black ${
              on ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]' : 'border-white/10 bg-black/25 text-[#f6f1e3]/70'
            }`}
          >
            {TAB_LABEL[option]}
          </button>
        );
      })}
    </div>
  );
}

function CurrentPane({ board, compact }: { board: AthletePerformanceBoard; compact?: boolean }) {
  const windowKpis = kpisFromBoard(board);
  const last = latestWorkout(board);
  const best = last ? bestProgress(last.exercises) : undefined;
  const held = last ? heldOrFirst(last.exercises) : undefined;
  const lifts = board.exercises.filter(hasPrior);
  const maxVolume = Math.max(
    ...lifts.map((row) => row.currentVolume),
    ...lifts.map((row) => row.priorVolume || 0),
    1
  );
  const hardMax = Math.max(...(board.hardMuscles || []).map((row) => row.count), 1);

  return (
    <div className="space-y-3">
      {!compact ? (
        <p className="text-sm text-[#f6f1e3]/55">{performanceRangeLabel(board.period)}. What you did.</p>
      ) : null}
      {windowKpis ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <KpiList rows={windowKpis} />
        </div>
      ) : null}
      {compact ? null : last ? <LastSessionCard workout={last} /> : null}
      {compact ? null : best ? <LiftCard row={best} chip="up" /> : null}
      {compact ? null : held && hasPrior(held) ? <LiftCard row={held} chip="held" /> : null}
      {!compact && lifts.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">This window · lifts</p>
          {lifts
            .slice()
            .sort((a, b) => b.currentVolume - a.currentVolume)
            .map((row) => (
              <div key={row.key} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-base font-black text-white">{row.name}</p>
                <HBar
                  label="Volume"
                  value={row.currentVolume}
                  prior={row.priorVolume}
                  max={maxVolume}
                  color="#2f8f8a"
                />
                <HBar
                  label="Effective"
                  value={row.effortVolume}
                  prior={row.priorEffortVolume}
                  max={maxVolume}
                  color="#c45d7a"
                />
                <p className="mt-2 text-xs text-[#f6f1e3]/50">
                  Weight {formatLbs(row.currentWeight)}
                  {row.priorWeight != null ? ` · last ${formatLbs(row.priorWeight)}` : ''}
                  {' · '}Reps {Math.round(row.currentReps)}
                  {row.priorReps != null ? ` · last ${Math.round(row.priorReps)}` : ''}
                </p>
              </div>
            ))}
        </div>
      ) : null}
      {!compact && board.hardMuscles && board.hardMuscles.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">Hard sets / muscle</p>
          <p className="mt-1 text-sm text-[#f6f1e3]/55">How hard 4–5 in this window.</p>
          {board.hardMuscles.map((row) => (
            <HBar key={row.name} label={row.name} value={row.count} max={hardMax} color="#e8c547" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function sameWorkout(left: string, right: string) {
  return left === right || left.replace(' Body ', ' ') === right.replace(' Body ', ' ');
}

function findFocusWorkout(board: AthletePerformanceBoard, workoutType: string | null) {
  if (!workoutType) return null;
  return (
    board.workouts.find(
      (row) => sameWorkout(row.workoutType, workoutType) || sameWorkout(row.name, workoutType)
    ) || null
  );
}

function analyticsHref(period: PerformancePeriod, grain: Grain, workoutType: string | null) {
  const params = new URLSearchParams({ tab: 'analytics', period, grain });
  if (workoutType) params.set('workout', workoutType);
  return `/performance?${params.toString()}`;
}

function HomeFocusCard({
  board,
  workoutType,
  kind,
}: {
  board: AthletePerformanceBoard;
  workoutType: string | null;
  kind: 'next' | 'latest';
}) {
  const workout = findFocusWorkout(board, workoutType) || (kind === 'latest' ? latestWorkout(board) : null);
  const type = workout?.workoutType || workoutType;
  const short = (type || 'Workout').replace(' Body ', ' ');
  const href = analyticsHref(board.period, 'workout', type);
  const kicker = kind === 'next' ? `Next workout · ${short}` : `Last workout · ${short}`;

  return (
    <div className="space-y-3">
      {workout ? (
        <KpiCard
          kicker={kicker}
          title={progressVerdict(workout)}
          sub={[
            performanceRangeLabel(board.period),
            formatWhen(workout.currentDate),
            formatWhen(workout.priorDate) ? `vs ${formatWhen(workout.priorDate)}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          line={workout}
          why={workoutWhy(workout)}
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#e8c547]">{kicker}</p>
          <p className="mt-1 text-base font-black text-white">No last time on {short} yet.</p>
        </div>
      )}
      <Link
        href={href}
        className="inline-flex min-h-11 flex-wrap items-center gap-x-2 text-base font-black text-[#e8c547]"
      >
        Open Analytics
        <span className="text-sm font-semibold text-[#f6f1e3]/55">
          {PERIOD_LABELS[board.period]} · {short} · workout
        </span>
      </Link>
    </div>
  );
}

function ProgressPane({ board, compact }: { board: AthletePerformanceBoard; compact?: boolean }) {
  const last = latestWorkout(board);
  const itd = boardSummaryLine(board);
  const up = gainers(board);
  const down = losers(board);
  const held = heldLifts(board).filter(hasPrior);
  const compared = board.exercises.filter(hasPrior).length;
  const intro = progressIntro(compared);
  const story = progressSummaryBody(last, board.workouts);
  const range = performanceRangeLabel(board.period);

  if (compact) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#f6f1e3]/55">{intro}</p>
        <p className="text-3xl font-black text-white">
          {up.length} up · {down.length} down
        </p>
        {itd ? (
          <KpiCard
            kicker="Summary · ITD"
            title={progressVerdict(itd)}
            sub={`${range}. ${story}`}
            line={itd}
            words
          />
        ) : null}
        <Link href="/performance?tab=progress" className="inline-flex min-h-11 items-center text-base font-black text-[#e8c547]">
          Open Progress
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#f6f1e3]/55">{intro}</p>
      <p className="text-3xl font-black text-white">
        {up.length} up · {down.length} down
      </p>
      {itd ? (
        <KpiCard
          kicker="Summary"
          title={progressVerdict(itd)}
          sub={`${range}. ${story}`}
          line={itd}
          words
        />
      ) : null}
      {last ? (
        <KpiCard
          kicker="Last session"
          title={last.workoutType.replace(' Body ', ' ')}
          sub={[formatWhen(last.currentDate), formatWhen(last.priorDate) ? `vs ${formatWhen(last.priorDate)}` : null]
            .filter(Boolean)
            .join(' · ')}
          line={last}
          words
          why={workoutWhy(last)}
        />
      ) : null}
      <p className="pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
        By workout vs last same day
      </p>
      {board.workouts.filter(hasPrior).map((workout) => (
        <KpiCard
          key={workout.workoutType}
          title={workout.workoutType.replace(' Body ', ' ')}
          sub={[formatWhen(workout.currentDate), formatWhen(workout.priorDate) ? `vs ${formatWhen(workout.priorDate)}` : null]
            .filter(Boolean)
            .join(' · ')}
          line={workout}
          why={workoutWhy(workout)}
        />
      ))}
      {up.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6d8b6e]">
            Moving up · Volume Load · {up.length}
          </p>
          {up.map((row) => (
            <LiftCard key={row.key} row={row} chip="up" />
          ))}
        </div>
      ) : null}
      {down.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a35d52]">
            Moving down · {down.length}
          </p>
          {down.map((row) => (
            <LiftCard key={row.key} row={row} chip="down" />
          ))}
        </div>
      ) : null}
      {held.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/55">
            Held · {held.length}
          </p>
          {held.map((row) => (
            <LiftCard key={row.key} row={row} chip="held" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AnalyticsPane({
  board,
  period,
  onPeriod,
  grain,
  onGrain,
  workouts,
  onToggleWorkout,
  compact,
}: {
  board: AthletePerformanceBoard;
  period: PerformancePeriod;
  onPeriod: (value: PerformancePeriod) => void;
  grain: Grain;
  onGrain: (value: Grain) => void;
  workouts: string[];
  onToggleWorkout: (value: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [spikeKey, setSpikeKey] = useState<string | null>(null);
  const allDays = workouts.length === 0;
  const workoutRows = allDays
    ? board.workouts
    : board.workouts.filter((row) => workouts.some((item) => sameWorkout(item, row.workoutType)));
  const names = new Set(workoutRows.flatMap((row) => row.exercises.map((item) => item.name)));
  const exercises = allDays ? board.exercises : board.exercises.filter((row) => names.has(row.name));
  const setRows = (board.sets || []).filter(
    (row) => allDays || workouts.some((item) => sameWorkout(item, row.workoutType))
  );
  const grainLines = grain === 'workout' ? workoutRows : grain === 'set' ? setRows : exercises;
  const lines = grainLines.filter((row) => (hideEmpty ? hasPrior(row) : true));
  const windowKpis = allDays ? kpisFromBoard(board) : kpisFromLines(grainLines, board.summary.perception);
  const up = gainers({ ...board, exercises });
  const down = losers({ ...board, exercises });
  const held = heldLifts({ ...board, exercises }).filter((row) => (hideEmpty ? hasPrior(row) : true));
  const cutLabel = allDays
    ? 'All days'
    : workouts.map((item) => item.replace(' Body ', ' ')).join(' + ');

  if (compact) {
    return (
      <div className="space-y-3">
        <PeriodPills period={period} onPick={onPeriod} />
        {windowKpis ? <FourKpiSpike rows={windowKpis} /> : null}
        <Link href="/performance?tab=analytics" className="inline-flex min-h-11 items-center text-base font-black text-[#e8c547]">
          Open Analytics
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-black/20">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left"
          aria-expanded={open}
        >
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">Cut</span>
          <span className="ml-auto truncate text-xs text-[#f6f1e3]/50">
            {PERIOD_LABELS[period]} · {cutLabel} · {grain}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {open ? (
          <div className="space-y-3 border-t border-white/10 px-3 py-3">
            <PeriodPills period={period} onPick={onPeriod} />
            <div className="flex gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => onToggleWorkout('all')}
                className={`min-h-10 shrink-0 rounded-2xl border px-3 text-sm font-semibold ${
                  allDays ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]' : 'border-white/10 text-[#f6f1e3]/75'
                }`}
              >
                All
              </button>
              {board.workouts.map((row) => {
                const on = workouts.some((item) => sameWorkout(item, row.workoutType));
                return (
                  <button
                    key={row.workoutType}
                    type="button"
                    onClick={() => onToggleWorkout(row.workoutType)}
                    className={`min-h-10 shrink-0 rounded-2xl border px-3 text-sm font-semibold ${
                      on ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]' : 'border-white/10 text-[#f6f1e3]/75'
                    }`}
                  >
                    {row.workoutType.replace(' Body ', ' ')}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['workout', 'exercise', 'set'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onGrain(option)}
                  className={`min-h-10 rounded-2xl border text-sm font-semibold capitalize ${
                    option === grain
                      ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                      : 'border-white/10 text-[#f6f1e3]/75'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHideEmpty((current) => !current)}
              className={`min-h-10 rounded-2xl border px-3 text-sm font-semibold ${
                hideEmpty
                  ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                  : 'border-white/10 text-[#f6f1e3]/75'
              }`}
            >
              Hide empty
            </button>
          </div>
        ) : null}
      </div>
      {windowKpis ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">This cut vs last time</p>
          <KpiList rows={windowKpis} />
        </div>
      ) : null}
      {windowKpis ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <FourKpiSpike rows={windowKpis} />
        </div>
      ) : null}
      {lines.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">Spike · Volume %</p>
          <VolumeSpikeList
            items={lines.map((row) => ({
              key: 'key' in row ? row.key : row.workoutType,
              name: row.name,
              pct: volumePct(row),
              kpis: kpisFromLine(row),
            }))}
            selected={spikeKey}
            onSelect={setSpikeKey}
          />
        </div>
      ) : null}
      {!compact && grain !== 'set' && up.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6d8b6e]">Moving up · {up.length}</p>
          {up.map((row) => (
            <LiftCard key={row.key} row={row} chip="up" />
          ))}
        </div>
      ) : null}
      {!compact && grain !== 'set' && down.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a35d52]">
            Moving down · {down.length}
          </p>
          {down.map((row) => (
            <LiftCard key={row.key} row={row} chip="down" />
          ))}
        </div>
      ) : null}
      {!compact && grain !== 'set' && held.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/55">
            Held · {held.length}
          </p>
          {held.map((row) => (
            <LiftCard key={row.key} row={row} chip="held" />
          ))}
        </div>
      ) : null}
      {lines.length === 0 ? (
        <p className="text-sm text-[#f6f1e3]/55">No finished workouts in this cut.</p>
      ) : null}
    </div>
  );
}

function parseTab(value: string | null): Tab | null {
  if (value === 'progress' || value === 'analytics' || value === 'current') return value;
  if (value === 'filter') return 'analytics';
  return null;
}

function parseGrain(value: string | null): Grain | null {
  if (value === 'workout' || value === 'exercise' || value === 'set') return value;
  return null;
}

function parseWorkouts(params: URLSearchParams) {
  return params.getAll('workout').map((item) => item.trim()).filter(Boolean);
}

export default function PerformanceDesk({
  variant = 'page',
  focusWorkout = null,
  focusKind = 'latest',
}: {
  variant?: 'page' | 'home';
  focusWorkout?: string | null;
  focusKind?: 'next' | 'latest';
}) {
  const page = variant === 'page';
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    page ? parseTab(searchParams.get('tab')) || 'current' : 'progress'
  );
  const [period, setPeriod] = useState<PerformancePeriod>(() =>
    normalizePerformancePeriod(searchParams.get('period') || 't-15')
  );
  const [grain, setGrain] = useState<Grain>(() => parseGrain(searchParams.get('grain')) || 'workout');
  const [workouts, setWorkouts] = useState<string[]>(() => parseWorkouts(searchParams));
  const [board, setBoard] = useState<AthletePerformanceBoard | null>(null);
  const [household, setHousehold] = useState<HouseholdRow[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const next = parseTab(searchParams.get('tab'));
    if (next) setTab(next);
    if (searchParams.get('period')) {
      setPeriod(normalizePerformancePeriod(searchParams.get('period')));
    }
    const nextGrain = parseGrain(searchParams.get('grain'));
    if (nextGrain) setGrain(nextGrain);
    if (searchParams.has('workout')) setWorkouts(parseWorkouts(searchParams));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      if (page) {
        const me = await fetch('/api/me').then((res) => (res.ok ? res.json() : null));
        const admin = Boolean(me?.user?.isAdmin);
        const userId = Number(me?.user?.id);
        if (cancelled) return;
        setIsAdmin(admin);
        if (admin) {
          const data = await fetch(
            '/api/athlete-performance?household=1&includeTest=1&period=' + period
          ).then((res) => (res.ok ? res.json() : null));
          if (cancelled) return;
          const rows = ((Array.isArray(data?.rows) ? data.rows : []) as HouseholdRow[]).filter(boardHasActivity);
          setHousehold(rows);
          setSelected((current) => {
            const keep = current.filter((id) => rows.some((row) => row.userId === id));
            if (keep.length > 0) return keep;
            return Number.isFinite(userId) && rows.some((row) => row.userId === userId)
              ? [userId]
              : rows[0]
                ? [rows[0].userId]
                : [];
          });
          return;
        }
      }
      const data = await fetch('/api/athlete-performance?period=' + period).then((res) =>
        res.ok ? res.json() : null
      );
      if (cancelled) return;
      setHousehold(null);
      setBoard(data?.hidden ? null : (data as AthletePerformanceBoard));
    };
    load()
      .catch(() => {
        if (!cancelled) {
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
    return mergeAthletePerformanceBoards(
      household.filter((row) => selected.includes(row.userId)),
      period
    );
  }, [board, household, period, selected]);

  const tabs: Tab[] = ['current', 'progress', 'analytics'];
  const empty = !loading && (!merged || (merged.exercises.length === 0 && merged.workouts.length === 0));

  const progressOnly = !page;

  const body = (
    <div>
      {progressOnly ? null : <TabSwitch tab={tab} tabs={tabs} onPick={setTab} />}
      {page && isAdmin && household ? (
        <div className="mb-3 flex flex-wrap gap-1">
          {household.map((row) => {
            const on = selected.includes(row.userId);
            return (
              <button
                key={row.userId}
                type="button"
                onClick={() =>
                  setSelected((current) =>
                    current.includes(row.userId)
                      ? current.filter((id) => id !== row.userId)
                      : [...current, row.userId]
                  )
                }
                className={`min-h-10 rounded-2xl border px-3 text-sm font-semibold ${
                  on ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]' : 'border-white/10 text-[#f6f1e3]/70'
                }`}
              >
                {firstName(row.name)}
              </button>
            );
          })}
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>
      ) : empty || !merged ? (
        <p className="text-sm text-[#f6f1e3]/55">No finished workouts in this window.</p>
      ) : progressOnly ? (
        <HomeFocusCard board={merged} workoutType={focusWorkout} kind={focusKind} />
      ) : tab === 'progress' ? (
        <ProgressPane board={merged} compact={!page} />
      ) : tab === 'current' ? (
        <CurrentPane board={merged} compact={!page} />
      ) : (
        <AnalyticsPane
          board={merged}
          period={period}
          onPeriod={(value) => {
            setPeriod(value);
            setWorkouts([]);
          }}
          grain={grain}
          onGrain={setGrain}
          workouts={workouts}
          onToggleWorkout={(value) => {
            if (value === 'all') {
              setWorkouts([]);
              return;
            }
            setWorkouts((current) =>
              current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
            );
          }}
          compact={!page}
        />
      )}
    </div>
  );

  return body;
}
