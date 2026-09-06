import {
  formatLbs,
  formatPct,
  pctChange,
  type AthletePerformanceBoard,
  type PerformanceLine,
} from '@/lib/athletePerformanceTypes';
import { formatHardnessWithPct } from '@/lib/hardness';
import type { HouseholdScoreboardRow } from '@/lib/scoreboardTypes';

export const KPI_IDS = ['weight', 'reps', 'volume', 'effective'] as const;
export type KpiId = (typeof KPI_IDS)[number];

export const KPI_LABEL: Record<KpiId, string> = {
  weight: 'Weight',
  reps: 'Reps',
  volume: 'Volume',
  effective: 'Effective',
};

/** Identity only. Green / red still own gain and loss. */
export const KPI_COLOR: Record<KpiId, string> = {
  weight: '#5b7c99',
  reps: '#8b7aad',
  volume: '#2f8f8a',
  effective: '#c45d7a',
};

export type KpiTone = 'up' | 'down' | 'held';

export type KpiRowModel = {
  id: KpiId;
  value: string;
  hint?: string;
  pct: number | null;
  spark?: number[];
};

export function kpiTone(pct: number | null | undefined): KpiTone {
  if (pct == null || !Number.isFinite(pct) || pct === 0) return 'held';
  return pct > 0 ? 'up' : 'down';
}

export function kpiStroke(pct: number | null | undefined, id: KpiId) {
  const tone = kpiTone(pct);
  if (tone === 'up') return '#6d8b6e';
  if (tone === 'down') return '#a35d52';
  return KPI_COLOR[id];
}

export function formatKpiPct(pct: number | null | undefined) {
  return formatPct(pct);
}

function lineReps(line: PerformanceLine) {
  if ('currentReps' in line && typeof line.currentReps === 'number') {
    return {
      current: line.currentReps,
      prior: 'priorReps' in line && typeof line.priorReps === 'number' ? line.priorReps : null,
    };
  }
  if ('exercises' in line && Array.isArray(line.exercises)) {
    const rows = line.exercises as Array<{ currentReps?: number; priorReps?: number | null }>;
    const current = rows.reduce((sum, row) => sum + Number(row.currentReps || 0), 0);
    const priors = rows.map((row) => row.priorReps).filter((value): value is number => value != null);
    return { current, prior: priors.length ? priors.reduce((sum, value) => sum + value, 0) : null };
  }
  return { current: null as number | null, prior: null as number | null };
}

function pairValue(current: number, prior: number | null, kind: 'lb' | 'reps' | 'num') {
  const now =
    kind === 'reps'
      ? String(Math.round(current * 10) / 10)
      : kind === 'lb'
        ? formatLbs(current)
        : formatLbs(current);
  if (prior == null) return now;
  const then =
    kind === 'reps'
      ? String(Math.round(prior * 10) / 10)
      : formatLbs(prior);
  if (then === now) return now;
  return `${then} → ${now}`;
}

export function kpiWord(pct: number | null | undefined) {
  if (pct == null || !Number.isFinite(pct) || pct === 0) return 'Held';
  return pct > 0 ? 'Up' : 'Down';
}

export function kpisFromLine(line: PerformanceLine, words = false): KpiRowModel[] {
  const reps = lineReps(line);
  const repsPct = reps.current != null ? pctChange(reps.current, reps.prior) : null;
  return [
    {
      id: 'weight',
      value: words ? kpiWord(line.weightChangePct) : pairValue(line.currentWeight, line.priorWeight, 'lb'),
      pct: line.weightChangePct,
      spark: line.sparkWeight,
    },
    ...(reps.current != null
      ? [
          {
            id: 'reps' as const,
            value: words ? kpiWord(repsPct) : pairValue(reps.current, reps.prior, 'reps'),
            pct: repsPct,
            spark: line.sparkReps,
          },
        ]
      : []),
    {
      id: 'volume',
      value: words
        ? kpiWord(line.rawVolumeChangePct ?? pctChange(line.currentVolume, line.priorVolume))
        : pairValue(line.currentVolume, line.priorVolume, 'num'),
      pct: line.rawVolumeChangePct ?? pctChange(line.currentVolume, line.priorVolume),
      spark: line.sparkRaw,
    },
    {
      id: 'effective',
      value: words ? kpiWord(line.volumeChangePct) : pairValue(line.effortVolume, line.priorEffortVolume, 'num'),
      hint: formatHardnessWithPct(line.perception),
      pct: line.volumeChangePct,
      spark: line.spark,
    },
  ];
}

function meanPct(values: Array<number | null | undefined>) {
  const nums = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (!nums.length) return null;
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 10) / 10;
}

function lastTimePcts(rows: Array<PerformanceLine & { currentReps?: number; priorReps?: number | null }>) {
  return {
    weight: meanPct(rows.map((row) => row.weightChangePct)),
    reps: meanPct(rows.map((row) => ('currentReps' in row ? pctChange(row.currentReps || 0, row.priorReps) : null))),
    volume: meanPct(rows.map((row) => row.rawVolumeChangePct ?? pctChange(row.currentVolume, row.priorVolume))),
    effective: meanPct(rows.map((row) => row.volumeChangePct)),
  };
}

/** Cut totals from the selected lines. % is last time those lines ran, not a prior calendar dump. */
export function kpisFromLines(
  rows: Array<PerformanceLine & { currentReps?: number; priorReps?: number | null }>,
  perception?: number | null
): KpiRowModel[] | null {
  if (!rows.length) return null;
  const compared = rows.filter((row) => row.priorVolume != null || row.priorWeight != null);
  const pcts = lastTimePcts(compared.length ? compared : rows);
  const weight = rows.reduce((sum, row) => sum + row.currentWeight, 0);
  const reps = rows.reduce((sum, row) => sum + Number(row.currentReps || 0), 0);
  const volume = rows.reduce((sum, row) => sum + row.currentVolume, 0);
  const effective = rows.reduce((sum, row) => sum + row.effortVolume, 0);
  const count = rows.length;
  return [
    {
      id: 'weight',
      value: formatLbs(weight),
      hint: `sum · avg ${Math.round(weight / count)}`,
      pct: pcts.weight,
      spark: rows[0]?.sparkWeight,
    },
    {
      id: 'reps',
      value: String(Math.round(reps)),
      hint: `sum · avg ${Math.round((reps / count) * 10) / 10}`,
      pct: pcts.reps,
      spark: rows[0]?.sparkReps,
    },
    {
      id: 'volume',
      value: formatLbs(volume),
      hint: 'reps × weight · lb',
      pct: pcts.volume,
      spark: rows[0]?.sparkRaw,
    },
    {
      id: 'effective',
      value: formatLbs(effective),
        hint: `Perceived Effort ${formatHardnessWithPct(perception)}`,
      pct: pcts.effective,
      spark: rows[0]?.spark,
    },
  ];
}

export function kpisFromBoard(board: AthletePerformanceBoard): KpiRowModel[] | null {
  const window = board.window;
  const compared = board.exercises.filter((row) => row.priorVolume != null || row.priorWeight != null);
  const pcts = lastTimePcts(compared.length ? compared : board.exercises);
  if (window && window.setCount > 0) {
    const sets = window.setCount;
    return [
      {
        id: 'weight',
        value: formatLbs(window.weightSum),
        hint: `sum · avg/set ${Math.round(window.weightSum / sets)} lb`,
        pct: pcts.weight ?? pctChange(window.weightSum, window.priorWeightSum),
        spark: window.sparkWeight,
      },
      {
        id: 'reps',
        value: String(Math.round(window.repSum)),
        hint: `sum · avg/set ${Math.round((window.repSum / sets) * 10) / 10}`,
        pct: pcts.reps ?? pctChange(window.repSum, window.priorRepSum),
        spark: window.sparkReps,
      },
      {
        id: 'volume',
        value: formatLbs(window.volume),
        hint: 'reps × weight · lb',
        pct: pcts.volume ?? pctChange(window.volume, window.priorVolume),
        spark: window.sparkVolume,
      },
      {
        id: 'effective',
        value: formatLbs(window.effective),
        hint: `Perceived Effort ${formatHardnessWithPct(board.summary.perception)}`,
        pct: pcts.effective ?? pctChange(window.effective, window.priorEffective),
        spark: window.sparkEffective,
      },
    ];
  }

  const rows = board.exercises;
  if (!rows.length) return null;

  const weight = rows.reduce((sum, row) => sum + row.currentWeight, 0);
  const priorWeight = rows.every((row) => row.priorWeight == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorWeight || 0), 0);
  const reps = rows.reduce((sum, row) => sum + row.currentReps, 0);
  const priorReps = rows.every((row) => row.priorReps == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorReps || 0), 0);
  const volume = rows.reduce((sum, row) => sum + row.currentVolume, 0);
  const priorVolume = rows.every((row) => row.priorVolume == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorVolume || 0), 0);
  const effective = rows.reduce((sum, row) => sum + row.effortVolume, 0);
  const priorEffective = rows.every((row) => row.priorEffortVolume == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorEffortVolume || 0), 0);
  const count = rows.length;

  return [
    {
      id: 'weight',
      value: formatLbs(weight),
      hint: `avg ${Math.round(weight / count)}`,
      pct: meanPct(rows.map((row) => row.weightChangePct)),
      spark: rows[0]?.sparkWeight,
    },
    {
      id: 'reps',
      value: String(Math.round(reps)),
      hint: `avg ${Math.round((reps / count) * 10) / 10}`,
      pct: meanPct(rows.map((row) => pctChange(row.currentReps, row.priorReps))),
      spark: rows[0]?.sparkReps,
    },
    {
      id: 'volume',
      value: formatLbs(volume),
      hint: 'reps × weight',
      pct: meanPct(rows.map((row) => row.rawVolumeChangePct ?? pctChange(row.currentVolume, row.priorVolume))),
      spark: board.workouts[0]?.sparkRaw || rows[0]?.sparkRaw,
    },
    {
      id: 'effective',
      value: formatLbs(effective),
      hint: formatHardnessWithPct(board.summary.perception),
      pct: meanPct(rows.map((row) => row.volumeChangePct)),
      spark: board.workouts[0]?.spark || rows[0]?.spark,
    },
  ];
}

export function kpisFromScoreboard(row: HouseholdScoreboardRow): KpiRowModel[] {
  const volume = row.rawVolume != null ? row.rawVolume : row.volume;
  const effective = row.effortSets != null ? row.effortSets : row.effortVolume != null ? row.effortVolume : row.volume;
  const weight = row.weightSum;
  const reps = row.repsSum;
  const sets = row.sets || 0;
  return [
    ...(weight != null
      ? [
          {
            id: 'weight' as const,
            value: formatLbs(weight),
            hint: sets ? `avg ${Math.round(weight / sets)}` : undefined,
            pct: pctChange(weight, row.priorWeightSum),
          },
        ]
      : []),
    ...(reps != null
      ? [
          {
            id: 'reps' as const,
            value: String(Math.round(reps)),
            hint: sets ? `avg ${Math.round((reps / sets) * 10) / 10}` : `${row.sets} sets`,
            pct: pctChange(reps, row.priorRepSum),
          },
        ]
      : []),
    {
      id: 'volume',
      value: formatLbs(volume),
      hint: 'reps × weight',
      pct: pctChange(volume, row.priorRawVolume ?? row.priorVolume),
    },
    {
      id: 'effective',
      value: formatLbs(effective),
      hint: formatHardnessWithPct(row.perception),
      pct: pctChange(effective, row.priorEffortSets ?? row.priorEffortVolume),
    },
  ];
}
