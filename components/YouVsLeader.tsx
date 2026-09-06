'use client';

import { useEffect, useState } from 'react';
import { KPI_COLOR, KPI_LABEL, formatKpiPct, kpiTone, type KpiRowModel } from '@/lib/kpi';
import { kpisFromScoreboard } from '@/lib/kpi';
import { KpiSpike } from '@/components/KpiList';
import {
  firstName,
  scoreboardBestDay,
  type HouseholdScoreboardRow,
} from '@/lib/scoreboardTypes';
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

function CompareCell({ row }: { row: KpiRowModel }) {
  const tone = kpiTone(row.pct);
  const color = tone === 'up' ? '#6d8b6e' : tone === 'down' ? '#a35d52' : '#f6f1e3';
  return (
    <div className="vs-cell">
      <b>{row.value}</b>
      <KpiSpike pct={row.pct} id={row.id} />
      <strong style={{ color }}>{formatKpiPct(row.pct)}</strong>
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

  const rivalName = firstName(rival.name);
  const youVol = you.volume;
  const rivalVol = rival.volume;
  const max = Math.max(youVol, rivalVol, 1);
  const youKpis = kpisFromScoreboard(you);
  const rivalKpis = kpisFromScoreboard(rival);

  return (
    <div className="rounded-2xl border border-[#f6f1e3]/45 bg-white/[0.06] px-6 py-5">
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
          <p className="text-sm text-[#f6f1e3]/55">{Math.round(youVol).toLocaleString()}</p>
        </div>
        <div className="stack">
          <div className="bar rival" style={{ height: `${Math.max(16, Math.round((rivalVol / max) * 72))}px` }} />
          <b>{rivalName}</b>
          <p className="text-sm text-[#f6f1e3]/55">{Math.round(rivalVol).toLocaleString()}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-[#f6f1e3]/55">
        Days You {you.workouts} · {rivalName} {rival.workouts}
        {' · '}Best You {Math.round(scoreboardBestDay(you) || 0).toLocaleString()}
        {' · '}Effort You {formatHardnessWithPct(you.perception)} · {rivalName}{' '}
        {formatHardnessWithPct(rival.perception)}
      </p>
      <div className="vs-table">
        <div className="vs-head">
          <span />
          <span className="text-[#f6f1e3]">You</span>
          <span className="text-[#c08457]">{rivalName}</span>
        </div>
        {youKpis.map((row) => {
          const other = rivalKpis.find((item) => item.id === row.id);
          return (
            <div key={row.id} className="vs-kpi">
              <span className="kpi-name" style={{ color: KPI_COLOR[row.id] }}>
                {KPI_LABEL[row.id]}
              </span>
              <CompareCell row={row} />
              {other ? <CompareCell row={other} /> : <div />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
