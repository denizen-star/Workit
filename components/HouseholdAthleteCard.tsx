'use client';

import { KpiList } from '@/components/KpiList';
import { formatDuration } from '@/lib/formatDuration';
import { kpisFromScoreboard } from '@/lib/kpi';
import {
  placeLabel,
  scoreboardBestDay,
  scoreboardVolume,
  tomScoreboardLine,
  type HouseholdScoreboardRow,
  type PerformanceSnapshot,
} from '@/lib/scoreboardTypes';

function lastLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function lastSub(row: HouseholdScoreboardRow) {
  if (!row.lastWorkout) return undefined;
  const when = lastLabel(row.lastAt);
  return `Last: ${row.lastWorkout}${when ? ` · ${when}` : ''}`;
}

export default function HouseholdAthleteCard({
  row,
  index,
  rows,
  you = false,
  snapshot,
}: {
  row?: HouseholdScoreboardRow;
  index?: number;
  rows?: HouseholdScoreboardRow[];
  you?: boolean;
  snapshot?: PerformanceSnapshot;
}) {
  const card = snapshot?.row || row;
  if (!card) return null;
  const place =
    snapshot != null ? snapshot.place : index == null ? null : index + 1;
  const volume = scoreboardVolume(card);
  const best = scoreboardBestDay(card);
  const foot =
    snapshot?.line ||
    (row && rows && index != null ? tomScoreboardLine(row, index, rows) : undefined);

  return (
    <div
      className={`rounded-2xl border px-6 py-5 ${
        you ? 'border-[#f6f1e3]/45 bg-white/[0.06]' : 'border-white/10 bg-black/25'
      }`}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c08457]">{placeLabel(place)}</p>
      <p className={`mt-1 text-xl font-black ${you ? 'text-[#f6f1e3]' : 'text-white'}`}>{card.name}</p>
      <p className="mt-1 text-sm text-[#f6f1e3]/55">
        {[
          `${Math.round(volume).toLocaleString()} lb`,
          lastSub(card),
          `${card.workouts} days`,
          best ? `best ${Math.round(best).toLocaleString()}` : null,
          formatDuration(card.avgSeconds),
          card.beltName,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <KpiList rows={kpisFromScoreboard(card)} />
      {foot ? <p className="mt-3 text-sm text-[#f6f1e3]/70">{foot}</p> : null}
    </div>
  );
}
