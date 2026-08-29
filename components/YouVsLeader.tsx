'use client';

import { useEffect, useState } from 'react';
import YouHouseCols from '@/components/YouHouseCols';
import { formatDuration } from '@/lib/formatDuration';
import { firstName, type HouseholdScoreboardRow } from '@/lib/scoreboardTypes';

function formatLbs(value: number) {
  return `${Math.round(Number(value || 0)).toLocaleString()} lb`;
}

function placeWord(place: number) {
  if (place === 1) return '1st';
  if (place === 2) return '2nd';
  if (place === 3) return '3rd';
  return `${place}th`;
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
      <div className="rounded-2xl border border-[#f6f1e3]/45 bg-white/[0.06] px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c08457]">Last 7 days</p>
        <p className="mt-1 text-xl font-black text-[#f6f1e3]">{firstName(you.name)} · you</p>
        <p className="mt-1 text-base text-[#f6f1e3]/60">You are the only body who showed up.</p>
        <p className="mt-3 text-lg font-black text-white">{formatLbs(you.volume)}</p>
      </div>
    );
  }

  const rivalName = firstName(rival.name);

  return (
    <div className="rounded-2xl border border-[#f6f1e3]/45 bg-white/[0.06] px-6 py-5">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c08457]">Last 7 days</p>
      <p className="mt-1 text-xl font-black text-[#f6f1e3]">
        You vs {rivalName}
      </p>
      <p className="mt-1 text-base text-[#f6f1e3]/60">
        You are {placeWord(youPlace)} of {rows.length}. Rank is finished days first, then total lb
        (sets + optional).
      </p>
      <YouHouseCols
        houseLabel={rivalName}
        rows={[
          { label: 'Total lb', you: formatLbs(you.volume), house: formatLbs(rival.volume) },
          { label: 'Days', you: String(you.workouts), house: String(rival.workouts) },
          {
            label: 'Best session',
            you: formatLbs(you.bestSessionVolume),
            house: formatLbs(rival.bestSessionVolume),
          },
          {
            label: 'Avg time',
            you: formatDuration(you.avgSeconds),
            house: formatDuration(rival.avgSeconds),
          },
        ]}
      />
    </div>
  );
}
