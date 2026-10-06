import { formatCompact, formatPct, pctChange } from '@/lib/athletePerformanceTypes';
import { setVolume } from '@/lib/exerciseKind';
import { kpiTone } from '@/lib/kpi';

export type CompareCell = {
  value: string;
  /** Green / red under the value. Omit or null = no % line. */
  pct?: number | null;
};

export type CompareRow = {
  id: string;
  label: string;
  you: CompareCell;
  last?: CompareCell | null;
  them?: CompareCell | null;
};

export function comparePctClass(pct: number | null | undefined) {
  const tone = kpiTone(pct);
  if (tone === 'up') return 'pct-up';
  if (tone === 'down') return 'pct-down';
  return 'pct-held';
}

export function comparePctLabel(pct: number | null | undefined) {
  return formatPct(pct);
}

/** Recap rows: this session vs last time that lift ran. */
export function recapExerciseRows(
  exercises: Array<{
    name: string;
    currentVolume: number;
    priorVolume: number | null;
    rawVolumeChangePct?: number | null;
  }>
): CompareRow[] {
  return exercises.map((lift, index) => ({
    id: `${lift.name}-${index}`,
    label: lift.name,
    you: {
      value: formatCompact(lift.currentVolume),
      pct: lift.rawVolumeChangePct ?? pctChange(lift.currentVolume, lift.priorVolume),
    },
    last: { value: lift.priorVolume != null ? formatCompact(lift.priorVolume) : '—' },
  }));
}

/**
 * Fallback recap rows built from this session's own sets, for when the performance
 * board can't be loaded right after Finish. This side only; Last reads —.
 */
export function recapRowsFromSets(
  sets: Array<{
    exercise_name: string;
    target_reps?: string | null;
    weight_lbs?: number | string | null;
    actual_reps?: number | null;
    bodyweight_lb?: number | string | null;
  }>
): CompareRow[] {
  const volumes = new Map<string, number>();
  for (const set of sets) {
    const volume = setVolume(
      set.exercise_name,
      set.target_reps,
      set.weight_lbs == null ? null : Number(set.weight_lbs),
      set.actual_reps,
      set.bodyweight_lb
    );
    volumes.set(set.exercise_name, (volumes.get(set.exercise_name) ?? 0) + volume);
  }
  return recapExerciseRows(
    [...volumes].map(([name, currentVolume]) => ({ name, currentVolume, priorVolume: null }))
  );
}

/** Finish recap row for skipped sets (lib/skippedSets.ts) — just the count, no reason. */
export function recapSkippedRow(count: number): CompareRow | null {
  if (count <= 0) return null;
  return {
    id: 'skipped',
    label: 'Skipped',
    you: { value: `${count} ${count === 1 ? 'set' : 'sets'}` },
    last: { value: '—' },
  };
}

export function optionalLbsCompareRow(lbs: number, lastLbs?: number | null): CompareRow | null {
  if (!lbs && lastLbs == null) return null;
  if (!lbs && !lastLbs) return null;
  return {
    id: 'optional-lbs',
    label: 'Optional lbs',
    you: { value: lbs ? `+${formatCompact(lbs)}` : '0', pct: pctChange(lbs, lastLbs) },
    last: { value: lastLbs != null ? `+${formatCompact(lastLbs)}` : '—' },
  };
}

export function recapOptionalRows(opts: {
  lbs: number;
  warmup: boolean;
  cooldown: boolean;
}): CompareRow[] {
  const rows: CompareRow[] = [
    {
      id: 'warmup',
      label: 'Warmup',
      you: { value: opts.warmup ? 'Done' : '—' },
      last: { value: '—' },
    },
    {
      id: 'cooldown',
      label: 'Cooldown',
      you: { value: opts.cooldown ? 'Done' : '—' },
      last: { value: '—' },
    },
  ];
  const extra = optionalLbsCompareRow(opts.lbs);
  return extra ? [...rows, extra] : rows;
}

export function sessionStoryRows(
  last: {
    currentVolume: number;
    priorVolume: number | null;
    rawVolumeChangePct?: number | null;
    exercises: Array<{ result: string; currentVolume: number; priorVolume: number | null; rawVolumeChangePct?: number | null }>;
  } | null,
  week: {
    currentVolume: number;
    priorVolume: number | null;
    rawVolumeChangePct?: number | null;
  } | null
): CompareRow[] {
  if (!last) return [];
  const compared = last.exercises.filter((lift) => lift.priorVolume != null).length;
  const down = last.exercises.filter((lift) => lift.result === 'loss').length;
  const best = [...last.exercises]
    .filter((lift) => lift.priorVolume != null)
    .sort((a, b) => {
      const ap = a.rawVolumeChangePct ?? pctChange(a.currentVolume, a.priorVolume) ?? -999;
      const bp = b.rawVolumeChangePct ?? pctChange(b.currentVolume, b.priorVolume) ?? -999;
      return bp - ap;
    })[0];
  return [
    {
      id: 'session-vol',
      label: 'Last session volume',
      you: {
        value: formatCompact(last.currentVolume),
        pct: last.rawVolumeChangePct ?? pctChange(last.currentVolume, last.priorVolume),
      },
      last: { value: last.priorVolume != null ? formatCompact(last.priorVolume) : '—' },
    },
    {
      id: 'best-lift',
      label: 'Best lift total',
      you: best
        ? {
            value: formatCompact(best.currentVolume),
            pct: best.rawVolumeChangePct ?? pctChange(best.currentVolume, best.priorVolume),
          }
        : { value: '—' },
      last: { value: best?.priorVolume != null ? formatCompact(best.priorVolume) : '—' },
    },
    {
      id: 'lifts-down',
      label: 'Lifts down',
      you: {
        value: compared ? `${down} / ${compared}` : '—',
        pct: !compared ? null : down ? -Math.round((down / compared) * 100) : 0,
      },
      last: { value: '—' },
    },
    {
      id: 'week-vol',
      label: 'Week volume',
      you: week
        ? {
            value: formatCompact(week.currentVolume),
            pct: week.rawVolumeChangePct ?? pctChange(week.currentVolume, week.priorVolume),
          }
        : { value: '—' },
      last: { value: week?.priorVolume != null ? formatCompact(week.priorVolume) : '—' },
    },
  ];
}
