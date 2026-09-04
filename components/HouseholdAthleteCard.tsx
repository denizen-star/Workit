'use client';

import ScanCard from '@/components/ScanCard';
import { formatDuration } from '@/lib/formatDuration';
import { formatHardnessWithPct } from '@/lib/hardness';
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
    <ScanCard
      you={you}
      roomy
      kicker={placeLabel(place)}
      title={card.name}
      headline={`${Math.round(volume).toLocaleString()} lb`}
      sub={lastSub(card)}
      metrics={[
        { label: 'Workouts', value: String(card.workouts) },
        { label: 'Sets', value: String(card.sets) },
        { label: 'Heaviest', value: card.heaviest ? `${Math.round(card.heaviest)} lb` : '—' },
        {
          label: 'Best day',
          value: best ? `${Math.round(best).toLocaleString()}` : '—',
        },
        { label: 'Avg time', value: formatDuration(card.avgSeconds) },
        { label: 'Medals', value: String(card.badges) },
        { label: 'Belt', value: card.beltName || '—' },
        { label: 'Effort', value: formatHardnessWithPct(card.perception) },
      ]}
      foot={foot}
    />
  );
}
