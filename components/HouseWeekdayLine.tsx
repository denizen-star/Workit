'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { HouseWeekdayBlock, ScoreboardPeriod } from '@/lib/scoreboardTypes';

/** Monday through Sunday. Two T's and two S's, so the index is the key. */
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function readBlock(value: unknown): HouseWeekdayBlock | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as HouseWeekdayBlock;
  if (!body.you || !Array.isArray(body.you.days) || !body.house || !Array.isArray(body.house.days)) {
    return null;
  }
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

/** Own finished-workout weekdays, then the house average. Hidden when the payload is absent (Test). */
export default function HouseWeekdayLine({ period }: { period: ScoreboardPeriod }) {
  const [block, setBlock] = useState<HouseWeekdayBlock | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBlock(null);
    setOpen(false);
    fetch('/api/scoreboard?period=' + period)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setBlock(readBlock(data?.weekdays));
      })
      .catch(() => {
        if (!cancelled) setBlock(null);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (!block) return null;

  const { you, house } = block;

  return (
    <div className="mb-6 space-y-2">
      <div className="rounded-2xl border border-[#f6f1e3]/45 bg-white/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <p className="text-lg font-black text-[#f6f1e3]">
            <span className="mr-2">{you.total}</span>
            {you.name}
          </p>
          {open ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
          )}
        </button>
        <DayBoxes days={you.days} />
        {open ? (
          <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
            {you.workouts.length === 0 ? (
              <li className="text-sm text-[#f6f1e3]/55">No finished workouts in this window.</li>
            ) : (
              you.workouts.map((workout) => (
                <li key={workout.name} className="text-sm font-semibold text-[#f6f1e3]/80">
                  {workout.name} · {workout.count}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

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
