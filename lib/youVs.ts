import { formatCompact, pctChange } from '@/lib/athletePerformanceTypes';
import type { CompareRow } from '@/lib/compareTable';
import { formatDuration } from '@/lib/formatDuration';
import { formatHardnessWithPct } from '@/lib/hardness';
import { isTestUserName } from '@/lib/householdUsers';
import { kpisFromScoreboard } from '@/lib/kpi';
import { athleteCallName } from '@/lib/profile';
import {
  scoreboardBestDay,
  type BonusHonorRow,
  type CardioHonorRow,
  type HouseholdScoreboardRow,
  type OptionalHonorRow,
} from '@/lib/scoreboardTypes';

export type YouVsMode = 'up' | 'down' | 'house';

export function placeWord(place: number) {
  if (place === 1) return '1st';
  if (place === 2) return '2nd';
  if (place === 3) return '3rd';
  return `${place}th`;
}

export function youVsIndex(rows: HouseholdScoreboardRow[], userId: number) {
  return rows.findIndex((row) => Number(row.id) === userId);
}

export function packRows(rows: HouseholdScoreboardRow[]) {
  return rows.filter((row) => !isTestUserName(row.name));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatBoardNum(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1000 && Math.abs(value - Math.round(value)) > 0.05) {
    return String(Math.round(value * 10) / 10);
  }
  return formatCompact(value);
}

function optionalLbs(row: HouseholdScoreboardRow) {
  const volume = row.volume;
  const raw = row.rawVolume != null ? row.rawVolume : volume;
  return Math.max(0, volume - raw);
}

function priorOptionalLbs(row: HouseholdScoreboardRow) {
  if (row.priorVolume == null) return null;
  const priorRaw = row.priorRawVolume != null ? row.priorRawVolume : row.priorVolume;
  return Math.max(0, row.priorVolume - priorRaw);
}

function honorCount(
  list: Array<{ id: number; bonusWeeks?: number; optionalWeeks?: number; cardioSeconds?: number }>,
  userId: number,
  key: 'bonusWeeks' | 'optionalWeeks' | 'cardioSeconds'
) {
  const hit = list.find((row) => Number(row.id) === userId);
  if (!hit) return 0;
  return Number(hit[key] || 0);
}

/** Pack average, you in, Test out. Used as the House column. */
export function houseAvgRow(rows: HouseholdScoreboardRow[]): HouseholdScoreboardRow | null {
  const pack = packRows(rows);
  if (pack.length === 0) return null;
  const n = pack.length;
  return {
    id: -1,
    name: 'House',
    displayName: 'House',
    workouts: mean(pack.map((row) => row.workouts)),
    volume: mean(pack.map((row) => row.volume)),
    sets: mean(pack.map((row) => row.sets)),
    heaviest: mean(pack.map((row) => row.heaviest)),
    avgSeconds: mean(pack.map((row) => row.avgSeconds || 0)),
    bestSessionVolume: mean(pack.map((row) => row.bestSessionVolume)),
    badges: 0,
    beltName: null,
    beltFill: null,
    lastWorkout: null,
    lastAt: null,
    perception: mean(pack.map((row) => row.perception || 0).filter(Boolean)) || null,
    effortVolume: mean(pack.map((row) => row.effortVolume || 0)),
    bestSessionEffort: mean(pack.map((row) => row.bestSessionEffort || 0)),
    weightSum: mean(pack.map((row) => row.weightSum || 0)),
    repsSum: mean(pack.map((row) => row.repsSum || 0)),
    rawVolume: mean(pack.map((row) => (row.rawVolume != null ? row.rawVolume : row.volume))),
    effortSets: mean(pack.map((row) => (row.effortSets != null ? row.effortSets : row.effortVolume || 0))),
    priorWeightSum: mean(pack.map((row) => row.priorWeightSum || 0)),
    priorRepSum: mean(pack.map((row) => row.priorRepSum || 0)),
    priorVolume: mean(pack.map((row) => row.priorVolume || 0)),
    priorRawVolume: mean(pack.map((row) => row.priorRawVolume || 0)),
    priorEffortVolume: mean(pack.map((row) => row.priorEffortVolume || 0)),
    priorEffortSets: mean(pack.map((row) => row.priorEffortSets || 0)),
  };
}

/** Last-7 numbers for a house rival. Missing = they did not train in the window. */
export function weekRowFor(
  weekRows: HouseholdScoreboardRow[],
  identity: HouseholdScoreboardRow
): HouseholdScoreboardRow {
  const hit = weekRows.find((row) => Number(row.id) === Number(identity.id));
  if (hit) return hit;
  return {
    ...identity,
    workouts: 0,
    volume: 0,
    sets: 0,
    heaviest: 0,
    avgSeconds: null,
    bestSessionVolume: 0,
    lastWorkout: null,
    lastAt: null,
    perception: null,
    effortVolume: 0,
    bestSessionEffort: 0,
    weightSum: 0,
    repsSum: 0,
    rawVolume: 0,
    effortSets: 0,
    priorWeightSum: null,
    priorRepSum: null,
    priorVolume: null,
    priorRawVolume: null,
    priorEffortVolume: null,
    priorEffortSets: null,
  };
}

export function stubBoardRow(identity: {
  id: number;
  name: string;
  displayName: string | null;
}): HouseholdScoreboardRow {
  return weekRowFor([], {
    id: identity.id,
    name: identity.name,
    displayName: identity.displayName,
    workouts: 0,
    volume: 0,
    sets: 0,
    heaviest: 0,
    avgSeconds: null,
    bestSessionVolume: 0,
    badges: 0,
    beltName: null,
    beltFill: null,
    lastWorkout: null,
    lastAt: null,
  });
}

/** Scored pack first, then everyone else in the house. Test already out. */
export function houseRankRows(
  scored: HouseholdScoreboardRow[],
  members: Array<{ id: number; name: string; displayName: string | null }>
) {
  const pack = packRows(scored);
  const seen = new Set(pack.map((row) => Number(row.id)));
  const rest = members.filter((member) => !seen.has(Number(member.id)) && !isTestUserName(member.name));
  return [...pack, ...rest.map((member) => stubBoardRow(member))];
}

export function themRow(
  rows: HouseholdScoreboardRow[],
  youIndex: number,
  mode: YouVsMode
): HouseholdScoreboardRow | null {
  if (mode === 'house') return houseAvgRow(rows);
  if (youIndex < 0) return null;
  if (mode === 'up') return youIndex > 0 ? rows[youIndex - 1] : null;
  return youIndex < rows.length - 1 ? rows[youIndex + 1] : null;
}

export function themLabel(row: HouseholdScoreboardRow | null, mode: YouVsMode) {
  if (!row) return '';
  if (mode === 'house') return 'House';
  return athleteCallName({ display_name: row.displayName, name: row.name });
}

function kpiCell(
  kpis: ReturnType<typeof kpisFromScoreboard>,
  id: 'weight' | 'reps' | 'volume' | 'effective'
) {
  const row = kpis.find((item) => item.id === id);
  if (!row) return { value: '—' as const, pct: null as number | null };
  return { value: row.value, pct: row.pct };
}

function lastKpiValue(prior: number | null | undefined) {
  if (prior == null) return { value: '—' };
  return { value: formatBoardNum(prior) };
}

export function boardVolume(row: HouseholdScoreboardRow) {
  return row.rawVolume != null ? row.rawVolume : row.volume;
}

/** Fall back if Next up/down is hidden for this place. */
export function resolveYouVsMode(mode: YouVsMode, youIndex: number, rowCount: number): YouVsMode {
  const canUp = youIndex > 0;
  const canDown = youIndex >= 0 && youIndex < rowCount - 1;
  if (mode === 'up' && canUp) return 'up';
  if (mode === 'down' && canDown) return 'down';
  if (mode === 'house') return 'house';
  if (canUp) return 'up';
  if (canDown) return 'down';
  return 'house';
}

function packHonorMean(
  pack: HouseholdScoreboardRow[],
  list: Array<{ id: number; bonusWeeks?: number; optionalWeeks?: number; cardioSeconds?: number }>,
  key: 'bonusWeeks' | 'optionalWeeks' | 'cardioSeconds'
) {
  return mean(pack.map((row) => honorCount(list, row.id, key)));
}

/** You % is vs Last. Them % is you vs them. */
export function youVsRows(
  you: HouseholdScoreboardRow,
  them: HouseholdScoreboardRow | null,
  honor: {
    bonus: BonusHonorRow[];
    optionals: OptionalHonorRow[];
    cardio: CardioHonorRow[];
  },
  pack: HouseholdScoreboardRow[],
  places: { you: number; them: number | null }
): CompareRow[] {
  const youKpis = kpisFromScoreboard(you);
  const themKpis = them ? kpisFromScoreboard(them) : [];
  const youVol = you.rawVolume != null ? you.rawVolume : you.volume;
  const themVol = them ? (them.rawVolume != null ? them.rawVolume : them.volume) : null;
  const youOpt = optionalLbs(you);
  const lastOpt = priorOptionalLbs(you);
  const themOpt = them ? optionalLbs(them) : null;
  const houseAvg = them && them.id < 0;
  const youBonus = honorCount(honor.bonus, you.id, 'bonusWeeks');
  const themBonus = them
    ? houseAvg
      ? packHonorMean(pack, honor.bonus, 'bonusWeeks')
      : honorCount(honor.bonus, them.id, 'bonusWeeks')
    : 0;
  const youOptWeeks = honorCount(honor.optionals, you.id, 'optionalWeeks');
  const themOptWeeks = them
    ? houseAvg
      ? packHonorMean(pack, honor.optionals, 'optionalWeeks')
      : honorCount(honor.optionals, them.id, 'optionalWeeks')
    : 0;
  const youCardio = honorCount(honor.cardio, you.id, 'cardioSeconds');
  const themCardio = them
    ? houseAvg
      ? packHonorMean(pack, honor.cardio, 'cardioSeconds')
      : honorCount(honor.cardio, them.id, 'cardioSeconds')
    : 0;

  const weight = kpiCell(youKpis, 'weight');
  const reps = kpiCell(youKpis, 'reps');
  const volume = kpiCell(youKpis, 'volume');
  const effective = kpiCell(youKpis, 'effective');
  const themWeight = kpiCell(themKpis, 'weight');
  const themReps = kpiCell(themKpis, 'reps');
  const themVolume = kpiCell(themKpis, 'volume');
  const themEffective = kpiCell(themKpis, 'effective');

  const youWeightN = you.weightSum;
  const youRepsN = you.repsSum;
  const youBest = scoreboardBestDay(you);
  const themBest = them ? scoreboardBestDay(them) : null;

  return [
    {
      id: 'place',
      label: 'Place',
      you: { value: placeWord(places.you) },
      last: { value: '—' },
      them: them
        ? { value: them.id < 0 || places.them == null ? '—' : placeWord(places.them) }
        : null,
    },
    {
      id: 'weight',
      label: 'Weight',
      you: weight,
      last: lastKpiValue(you.priorWeightSum),
      them: them
        ? { value: themWeight.value, pct: pctChange(youWeightN || 0, them.weightSum) }
        : null,
    },
    {
      id: 'reps',
      label: 'Reps',
      you: reps,
      last: lastKpiValue(you.priorRepSum),
      them: them ? { value: themReps.value, pct: pctChange(youRepsN || 0, them.repsSum) } : null,
    },
    {
      id: 'volume',
      label: 'Volume',
      you: volume,
      last: lastKpiValue(you.priorRawVolume ?? you.priorVolume),
      them: them ? { value: themVolume.value, pct: pctChange(youVol, themVol) } : null,
    },
    {
      id: 'effective',
      label: 'Effective',
      you: effective,
      last: lastKpiValue(you.priorEffortSets ?? you.priorEffortVolume),
      them: them
        ? {
            value: themEffective.value,
            pct: pctChange(
              you.effortSets != null ? you.effortSets : you.effortVolume || 0,
              them.effortSets != null ? them.effortSets : them.effortVolume || 0
            ),
          }
        : null,
    },
    {
      id: 'best-day',
      label: 'Best day',
      you: { value: youBest ? formatCompact(youBest) : '—' },
      last: { value: '—' },
      them: them
        ? {
            value: themBest ? formatCompact(themBest) : '—',
            pct: themBest ? pctChange(youBest || 0, themBest) : null,
          }
        : null,
    },
    {
      id: 'days',
      label: 'Days',
      you: { value: formatBoardNum(you.workouts) },
      last: { value: '—' },
      them: them
        ? { value: formatBoardNum(them.workouts), pct: pctChange(you.workouts, them.workouts) }
        : null,
    },
    {
      id: 'effort',
      label: 'Effort',
      you: { value: formatHardnessWithPct(you.perception) },
      last: { value: '—' },
      them: them ? { value: formatHardnessWithPct(them.perception) } : null,
    },
    {
      id: 'optionals',
      label: 'Optionals',
      you: { value: formatBoardNum(youOptWeeks) },
      last: { value: '—' },
      them: them ? { value: formatBoardNum(themOptWeeks) } : null,
    },
    {
      id: 'optional-lbs',
      label: 'Optional lbs',
      you: { value: youOpt ? `+${formatCompact(youOpt)}` : '0', pct: pctChange(youOpt, lastOpt) },
      last: { value: lastOpt != null ? `+${formatCompact(lastOpt)}` : '—' },
      them: them
        ? { value: themOpt ? `+${formatCompact(themOpt)}` : '0', pct: pctChange(youOpt, themOpt) }
        : null,
    },
    {
      id: 'bonus',
      label: 'Bonus',
      you: { value: formatBoardNum(youBonus) },
      last: { value: '—' },
      them: them ? { value: formatBoardNum(themBonus) } : null,
    },
    {
      id: 'cardio',
      label: 'Run + bike',
      you: { value: youCardio ? formatDuration(youCardio) : '—' },
      last: { value: '—' },
      them: them
        ? {
            value: themCardio ? formatDuration(themCardio) : '—',
            pct: themCardio ? pctChange(youCardio, themCardio) : null,
          }
        : null,
    },
  ];
}
