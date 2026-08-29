'use client';

import { useEffect, useState } from 'react';
import ScanCard from '@/components/ScanCard';
import { formatDuration } from '@/lib/formatDuration';
import { firstName, type HouseholdScoreboardRow } from '@/lib/scoreboardTypes';

function formatLbs(value: number) {
  return Math.round(Number(value || 0)).toLocaleString();
}

/** Home Quiet hook: you vs whoever owns the 7-day board. */
export default function YouVsLeader({ userId }: { userId: number | null }) {
  const [rows, setRows] = useState<HouseholdScoreboardRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/scoreboard?period=7')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data?.rows) ? data.rows : []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0 || userId == null) return null;

  const you = rows.find((row) => Number(row.id) === userId);
  const leader = rows[0];
  if (!you || !leader) return null;

  const youPlace = rows.findIndex((row) => Number(row.id) === userId) + 1;
  const youFirst = youPlace === 1;
  const rival = youFirst ? rows[1] : leader;
  if (!rival) {
    return (
      <ScanCard
        you
        house
        roomy
        kicker="The house"
        title={`${firstName(you.name)} · you`}
        headline={formatLbs(you.volume)}
        sub="You are the only body who showed up."
        metrics={[
          { label: 'Workouts', value: String(you.workouts) },
          { label: 'Best day', value: formatLbs(you.bestSessionVolume) },
        ]}
      />
    );
  }

  const placeLabel = youPlace === 1 ? '1st' : youPlace === 2 ? '2nd' : youPlace === 3 ? '3rd' : `${youPlace}th`;

  return (
    <ScanCard
      you
      house
      roomy
      kicker="The house"
        title={`You vs ${firstName(rival.name)}`}
        headline={placeLabel}
        sub={
          youFirst
            ? `${firstName(you.name)} owns this board. Best day is ${formatLbs(you.bestSessionVolume)}.`
            : `Best day is yours (${formatLbs(you.bestSessionVolume)}). ${firstName(rival.name)} owns the days.`
        }
        metrics={[
          { label: 'Your volume', value: formatLbs(you.volume) },
          { label: `${firstName(rival.name)} volume`, value: formatLbs(rival.volume) },
          { label: 'Your days', value: String(you.workouts) },
          { label: `${firstName(rival.name)} days`, value: String(rival.workouts) },
          { label: 'Your best', value: formatLbs(you.bestSessionVolume) },
          { label: 'Avg time', value: formatDuration(you.avgSeconds) },
        ]}
        foot={youFirst ? `${firstName(you.name)} owns this board.` : `${firstName(you.name)}, hunt.`}
      />
    );
}
