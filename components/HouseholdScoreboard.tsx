'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import {
  SCOREBOARD_PERIODS,
  scoreboardRangeLabel,
  type HouseholdScoreboardRow,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';

const PERIOD_LABELS: Record<ScoreboardPeriod, string> = {
  '7': '7 days',
  '30': '30 days',
  all: 'All time',
};

export default function HouseholdScoreboard() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<ScoreboardPeriod>('7');
  const [rows, setRows] = useState<HouseholdScoreboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/scoreboard?period=' + period)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="glass-card mb-8 p-6">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <Trophy className="h-6 w-6 text-[#e8c547]" />
        <h2 className="text-2xl font-black text-white">Scoreboard</h2>
        <span className="ml-auto text-sm text-[#f6f1e3]/65">{scoreboardRangeLabel(period)}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />
        )}
      </button>

      {open && (
        <div className="mt-4">
          <div className="mb-4 grid grid-cols-3 gap-2">
            {SCOREBOARD_PERIODS.map((option) => {
              const selected = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPeriod(option)}
                  className={`min-h-11 rounded-2xl border text-sm font-semibold ${
                    selected
                      ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                      : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
                  }`}
                >
                  {PERIOD_LABELS[option]}
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-sm text-[#f6f1e3]/55">Loading household work...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[#f6f1e3]/55">
              Nobody logged a completed workout in this window.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {index + 1}. {row.name}
                    </p>
                    <p className="text-sm text-[#f6f1e3]/55">
                      {row.workouts} workout{row.workouts === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="text-lg font-black text-[#e8c547]">
                    {Math.round(row.volume).toLocaleString()} lb
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
