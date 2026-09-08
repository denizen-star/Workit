'use client';

import { useEffect, useState } from 'react';
import { KPI_COLOR, KPI_LABEL, formatKpiPct, kpiTone, type KpiRowModel } from '@/lib/kpi';
import { kpisFromScoreboard } from '@/lib/kpi';
import {
  firstName,
  scoreboardBestDay,
  type HouseholdScoreboardRow,
} from '@/lib/scoreboardTypes';
import { athleteCallName } from '@/lib/profile';
import { formatCompact } from '@/lib/athletePerformanceTypes';
import { formatHardnessWithPct } from '@/lib/hardness';

function placeWord(place: number) {
  if (place === 1) return '1st';
  if (place === 2) return '2nd';
  if (place === 3) return '3rd';
  return `${place}th`;
}

function nextInLine(rows: HouseholdScoreboardRow[], userId: number) {
  const index = rows.findIndex((row) => Number(row.id) === userId);
  if (index < 0) return { you: null as HouseholdScoreboardRow | null, rival: null as HouseholdScoreboardRow | null, youPlace: 0 };
  const you = rows[index];
  const rival = index > 0 ? rows[index - 1] : rows[index + 1] || null;
  return { you, rival, youPlace: index + 1 };
}

function CompareLine({
  name,
  row,
  accent,
}: {
  name: string;
  row: KpiRowModel;
  accent: string;
}) {
  const tone = kpiTone(row.pct);
  const color = tone === 'up' ? '#6d8b6e' : tone === 'down' ? '#a35d52' : '#f6f1e3';
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2">
      <span className="truncate text-xs font-black uppercase tracking-[0.12em]" style={{ color: accent }}>
        {name}
      </span>
      <span className="text-sm font-black text-[#f6f1e3]">{row.value}</span>
      <span className="text-sm font-black" style={{ color }}>
        {formatKpiPct(row.pct)}
      </span>
    </div>
  );
}

/** Last 7 days: you vs the athlete one place up, or one place down if you own first. */
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

  const { you, rival, youPlace } = nextInLine(rows, userId);
  if (!you) return null;

  if (!rival) {
    return (
      <div className="rounded-2xl border border-[#f6f1e3]/45 bg-white/[0.06] px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c08457]">Last 7 days</p>
        <p className="mt-1 text-xl font-black text-[#f6f1e3]">{firstName(you.name)} · you</p>
        <p className="mt-1 text-base text-[#f6f1e3]/60">You are the only body who showed up.</p>
      </div>
    );
  }

  const rivalName = athleteCallName({ display_name: rival.displayName, name: rival.name });
  const youVol = you.volume;
  const rivalVol = rival.volume;
  const max = Math.max(youVol, rivalVol, 1);
  const youKpis = kpisFromScoreboard(you);
  const rivalKpis = kpisFromScoreboard(rival);

  return (
    <div className="rounded-2xl border border-[#f6f1e3]/45 bg-white/[0.06] px-4 py-5 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c08457]">Last 7 days</p>
      <p className="mt-1 text-xl font-black text-[#f6f1e3]">You vs {rivalName}</p>
      <p className="mt-1 text-base text-[#f6f1e3]/60">
        You are {placeWord(youPlace)} of {rows.length}. Next in line{' '}
        {youPlace === 1 ? 'down' : 'up'}. Rank is finished days, then Volume Load.
      </p>
      <div className="vs-col">
        <div className="stack">
          <div className="bar you" style={{ height: `${Math.max(16, Math.round((youVol / max) * 72))}px` }} />
          <b>You</b>
          <p className="text-sm text-[#f6f1e3]/55">{formatCompact(youVol)}</p>
        </div>
        <div className="stack">
          <div className="bar rival" style={{ height: `${Math.max(16, Math.round((rivalVol / max) * 72))}px` }} />
          <b>{rivalName}</b>
          <p className="text-sm text-[#f6f1e3]/55">{formatCompact(rivalVol)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#f6f1e3]/55">
        <span>Days You {you.workouts}</span>
        <span>
          {rivalName} {rival.workouts}
        </span>
        <span>Best You {formatCompact(scoreboardBestDay(you) || 0)}</span>
        <span>Effort You {formatHardnessWithPct(you.perception)}</span>
        <span>
          {rivalName} {formatHardnessWithPct(rival.perception)}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {youKpis.map((row) => {
          const other = rivalKpis.find((item) => item.id === row.id);
          return (
            <div key={row.id} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
              <p className="kpi-name mb-1.5" style={{ color: KPI_COLOR[row.id] }}>
                {KPI_LABEL[row.id]}
              </p>
              <CompareLine name="You" row={row} accent="#f6f1e3" />
              {other ? <CompareLine name={rivalName} row={other} accent="#c08457" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
