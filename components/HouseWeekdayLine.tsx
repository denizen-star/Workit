'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { fetchScoreboard, peekScoreboard } from '@/lib/scoreboardClient';
import type { HouseWeekdayBlock, ScoreboardPeriod } from '@/lib/scoreboardTypes';

/** Monday through Sunday. Two T's and two S's, so the index is the key. */
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function readBlock(value: unknown): HouseWeekdayBlock | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as HouseWeekdayBlock;
  if (!body.you || !Array.isArray(body.you.days) || !body.house || !Array.isArray(body.house.days)) {
    return null;
  }
  if (body.athletes != null && !Array.isArray(body.athletes)) return null;
  return body;
}

function DayBoxes({ days }: { days: number[] }) {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1.5">
      {WEEKDAY_LABELS.map((label, index) => {
        const count = Number(days[index] || 0);
        const done = count >= 1;
        return (
          <div key={index} className="flex min-w-0 flex-col items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-[#f6f1e3]/45">{label}</span>
            <span
              className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-black ${
                done ? 'bg-[#6d8b6e] text-[#f6f1e3]' : 'bg-white/5 text-[#f6f1e3]/35'
              }`}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Own finished-workout weekdays, then the house average. Kevin also gets one row per active athlete. Hidden for Test. */
export default function HouseWeekdayLine({ period }: { period: ScoreboardPeriod }) {
  const [block, setBlock] = useState<HouseWeekdayBlock | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOpenId(null);
    const ready = peekScoreboard(period);
    if (ready) {
      setBlock(readBlock(ready && typeof ready === 'object' ? (ready as { weekdays?: unknown }).weekdays : null));
      return;
    }
    setBlock(null);
    fetchScoreboard(period).then((data) => {
      if (cancelled) return;
      setBlock(readBlock(data && typeof data === 'object' ? (data as { weekdays?: unknown }).weekdays : null));
    });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (!block) return null;

  const { you, house } = block;
  const rows = block.athletes?.length ? block.athletes : [you];

  return (
    <div className="mb-6 space-y-2">
      {rows.map((row) => {
        const open = openId === row.id;
        const yours = row.id === you.id;
        return (
          <div
            key={row.id}
            className={`rounded-2xl border px-4 py-3 ${
              yours ? 'border-[#f6f1e3]/45 bg-white/[0.06]' : 'border-white/10 bg-black/25'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : row.id)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={open}
            >
              <p className="text-lg font-black text-[#f6f1e3]">
                <span className="mr-2">{row.total}</span>
                {row.name}
              </p>
              {open ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
              )}
            </button>
            <DayBoxes days={row.days} />
            {open ? (
              <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
                {row.workouts.length === 0 ? (
                  <li className="text-sm text-[#f6f1e3]/55">No finished workouts in this window.</li>
                ) : (
                  row.workouts.map((workout) => (
                    <li key={workout.name} className="text-sm font-semibold text-[#f6f1e3]/80">
                      {workout.name} · {workout.count}
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        );
      })}

      <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
        <p className="text-lg font-black text-[#c08457]">
          <span className="mr-2 text-[#f6f1e3]">{house.total}</span>
          House
        </p>
        <DayBoxes days={house.days} />
      </div>
    </div>
  );
}
