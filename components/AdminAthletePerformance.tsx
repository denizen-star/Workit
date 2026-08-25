'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  AthletePerformanceBoardView,
  PeriodPills,
} from '@/components/AthletePerformance';
import ScanCard from '@/components/ScanCard';
import {
  formatLbs,
  formatPct,
  pctChange,
  type AthletePerformanceBoard,
  type ExerciseTrend,
  type PerformancePeriod,
} from '@/lib/athletePerformanceTypes';
import { formatHardnessAvg } from '@/lib/hardness';
import { isTestUserName } from '@/lib/householdUsers';
import { firstName } from '@/lib/scoreboardTypes';

type HouseholdRow = AthletePerformanceBoard & {
  userId: number;
  name: string;
};

type LiftBoard = {
  key: string;
  name: string;
  athletes: { userId: number; name: string; line: ExerciseTrend }[];
};

type LiftAthlete = LiftBoard['athletes'][number];

type Lead = {
  userId: number;
  name: string;
  value: number;
  pct: number | null;
  tied: boolean;
};

function placeLabel(index: number) {
  if (index === 0) return '1st';
  if (index === 1) return '2nd';
  if (index === 2) return '3rd';
  return `${index + 1}th`;
}

function leadBy(athletes: LiftAthlete[], pick: (line: ExerciseTrend) => number): Lead | null {
  const ranked = athletes
    .map((athlete) => ({
      userId: athlete.userId,
      name: athlete.name,
      value: pick(athlete.line),
    }))
    .filter((row) => Number.isFinite(row.value) && row.value > 0)
    .sort((a, b) => b.value - a.value);
  if (ranked.length === 0) return null;
  const first = ranked[0];
  const second = ranked[1];
  const tied = second != null && second.value === first.value;
  return {
    ...first,
    tied,
    pct: tied ? 0 : second ? pctChange(first.value, second.value) : null,
  };
}

function leadIds(athletes: LiftAthlete[], pick: (line: ExerciseTrend) => number) {
  const lead = leadBy(athletes, pick);
  if (!lead) return [];
  return athletes
    .filter((athlete) => pick(athlete.line) === lead.value && pick(athlete.line) > 0)
    .map((athlete) => athlete.userId);
}

function formatLead(lead: Lead | null) {
  if (!lead) return '—';
  const who = firstName(lead.name);
  if (lead.tied) return `${who} tied`;
  if (lead.pct == null) return who;
  return `${who} ${formatPct(lead.pct)}`;
}

function shareLabel(count: number, total: number) {
  if (total <= 0) return '—';
  return `${count}/${total}`;
}

function athleteLeadShare(row: HouseholdRow, lifts: LiftBoard[]) {
  const mine = lifts.filter((lift) => lift.athletes.some((athlete) => athlete.userId === row.userId));
  let weight = 0;
  let reps = 0;
  for (const lift of mine) {
    if (leadIds(lift.athletes, (line) => line.currentWeight).includes(row.userId)) weight += 1;
    if (leadIds(lift.athletes, (line) => line.currentReps).includes(row.userId)) reps += 1;
  }
  return { weight, reps, lifts: mine.length };
}

function sparkTone(result: ExerciseTrend['result']): 'up' | 'down' | 'plain' {
  if (result === 'gain') return 'up';
  if (result === 'loss') return 'down';
  return 'plain';
}

function pivotLifts(rows: HouseholdRow[]): LiftBoard[] {
  const map = new Map<string, LiftBoard>();
  for (const row of rows) {
    if (isTestUserName(row.name)) continue;
    for (const line of row.exercises) {
      const existing = map.get(line.key) || { key: line.key, name: line.name, athletes: [] };
      existing.athletes.push({ userId: row.userId, name: row.name, line });
      map.set(line.key, existing);
    }
  }
  return [...map.values()]
    .map((lift) => ({
      ...lift,
      athletes: [...lift.athletes].sort((a, b) => b.line.currentWeight - a.line.currentWeight),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const LEAD_GRID =
  'grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_1rem] items-center gap-2';

function LeadHead({ left }: { left: string }) {
  return (
    <div className={`${LEAD_GRID} px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#f6f1e3]/40`}>
      <span>{left}</span>
      <span>Weight</span>
      <span>Reps</span>
      <span />
    </div>
  );
}

function LiftFold({ lift }: { lift: LiftBoard }) {
  const [open, setOpen] = useState(false);
  const weightLead = leadBy(lift.athletes, (line) => line.currentWeight);
  const repsLead = leadBy(lift.athletes, (line) => line.currentReps);
  return (
    <div className="border-t border-white/5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${LEAD_GRID} w-full px-3 py-2 text-left`}
        aria-expanded={open}
      >
        <p className="truncate text-sm font-black text-white">{lift.name}</p>
        <p className="truncate text-xs text-[#e8c547]">{formatLead(weightLead)}</p>
        <p className="truncate text-xs text-[#f6f1e3]/75">{formatLead(repsLead)}</p>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#f6f1e3]/65" />
        )}
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {lift.athletes.map((athlete, index) => (
            <ScanCard
              key={`${lift.key}-${athlete.userId}`}
              you={index === 0}
              spark={athlete.line.spark}
              sparkTone={sparkTone(athlete.line.result)}
              kicker={placeLabel(index)}
              title={athlete.name}
              headline={formatLbs(athlete.line.currentWeight)}
              metrics={[
                { label: 'Wt', value: formatLbs(athlete.line.currentWeight) },
                { label: 'Reps', value: String(Math.round(athlete.line.currentReps)) },
                { label: 'Total', value: formatLbs(athlete.line.currentVolume) },
                { label: '% chg', value: formatPct(athlete.line.volumeChangePct) },
                { label: 'Prog', value: formatPct(athlete.line.progressionPct) },
                { label: 'Hard', value: formatHardnessAvg(athlete.line.perception) },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AthleteFold({ row, lifts }: { row: HouseholdRow; lifts: LiftBoard[] }) {
  const [open, setOpen] = useState(false);
  const empty = row.exercises.length === 0 && row.workouts.length === 0;
  const share = athleteLeadShare(row, lifts);
  return (
    <div className="border-t border-white/5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${LEAD_GRID} w-full px-3 py-2 text-left`}
        aria-expanded={open}
      >
        <p className="truncate text-sm font-black text-white">{row.name}</p>
        <p className="truncate text-xs text-[#e8c547]">
          {empty ? '—' : shareLabel(share.weight, share.lifts)}
        </p>
        <p className="truncate text-xs text-[#f6f1e3]/75">
          {empty ? '—' : shareLabel(share.reps, share.lifts)}
        </p>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#f6f1e3]/65" />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3">
          {empty ? (
            <p className="text-sm text-[#f6f1e3]/55">No finished workouts in this window.</p>
          ) : (
            <AthletePerformanceBoardView board={row} page athleteName={row.name} />
          )}
        </div>
      )}
    </div>
  );
}

/** Admin Analytics: lift comparison across athletes, then each vs last time. Test stays off. */
export default function AdminAthletePerformance({ filterUserId }: { filterUserId: string }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<PerformancePeriod>('30');
  const [rows, setRows] = useState<HouseholdRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/athlete-performance?household=1&period=' + period)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const pack = useMemo(
    () => rows.filter((row) => !isTestUserName(row.name)),
    [rows]
  );
  const lifts = useMemo(() => pivotLifts(pack), [pack]);
  const athletes = useMemo(() => {
    return pack.filter((row) => !filterUserId || String(row.userId) === filterUserId);
  }, [pack, filterUserId]);

  return (
    <section className="glass-card p-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <h3 className="text-lg font-black text-white">Athletes</h3>
        <span className="ml-auto text-sm text-[#f6f1e3]/65">
          {lifts.length ? `${lifts.length} lifts · ${pack.length} athletes` : 'Empty'}
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />
        )}
      </button>
      {open && (
        <div className="mt-4">
          <p className="mb-3 text-xs text-[#f6f1e3]/55">
            Gold is heaviest. % is vs next. Athlete counts are lifts led. Test left out. 15 / 30 /
            all, not the traffic range.
          </p>
          <PeriodPills period={period} onPick={setPeriod} />
          {loading ? (
            <p className="text-sm text-[#f6f1e3]/55">Loading lifts...</p>
          ) : lifts.length === 0 ? (
            <p className="text-sm text-[#f6f1e3]/55">No finished workouts in this window.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
                  By lift
                </p>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                  <LeadHead left="Lift" />
                  {lifts.map((lift) => (
                    <LiftFold key={lift.key} lift={lift} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
                  By athlete
                </p>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                  <LeadHead left="Athlete" />
                  {athletes.map((row) => (
                    <AthleteFold key={row.userId} row={row} lifts={lifts} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
