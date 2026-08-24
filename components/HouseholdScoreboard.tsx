'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { formatDuration } from '@/lib/formatDuration';
import {
  SCOREBOARD_PERIODS,
  scoreboardRangeLabel,
  tomScoreboardLine,
  type BonusHonorRow,
  type HouseholdScoreboardRow,
  type OptionalHonorRow,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';

const PERIOD_LABELS: Record<ScoreboardPeriod, string> = {
  '7': '7 days',
  '30': '30 days',
  all: 'All time',
};

function lastLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export default function HouseholdScoreboard() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<ScoreboardPeriod>('7');
  const [rows, setRows] = useState<HouseholdScoreboardRow[]>([]);
  const [bonusHonor, setBonusHonor] = useState<BonusHonorRow[]>([]);
  const [optionalHonor, setOptionalHonor] = useState<OptionalHonorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/scoreboard?period=' + period)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
        setBonusHonor(Array.isArray(data?.bonusHonor) ? data.bonusHonor : []);
        setOptionalHonor(Array.isArray(data?.optionalHonor) ? data.optionalHonor : []);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setBonusHonor([]);
          setOptionalHonor([]);
        }
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
          <p className="mb-4 text-sm text-[#f6f1e3]/60">
            Household only. Finished workouts count. Rank is workouts, then volume. Come take someone&apos;s place.
          </p>
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
            <p className="text-sm text-[#e8c547]">
              Empty board. Nobody finished a workout in this window. I am not impressed.
            </p>
          ) : (
            <div className="space-y-4">
              {bonusHonor.length > 0 && (
                <div className="rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-4">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">Bonus work</p>
                  <p className="mt-1 text-sm text-[#f6f1e3]/70">
                    Extra upper. They did not owe it. They paid it.
                  </p>
                  <div className="mt-3 space-y-2">
                    {bonusHonor.map((row) => (
                      <div key={row.id} className="flex items-center justify-between gap-3">
                        <p className="font-black text-white">{row.name}</p>
                        <p className="text-sm font-semibold text-[#e8c547]">
                          {row.bonusWeeks} bonus {row.bonusWeeks === 1 ? 'week' : 'weeks'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {optionalHonor.length > 0 && (
                <div className="rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-4">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">Optionals</p>
                  <p className="mt-1 text-sm text-[#f6f1e3]/70">
                    Four warmups. Four cooldowns. Easy minutes that still count.
                  </p>
                  <div className="mt-3 space-y-2">
                    {optionalHonor.map((row) => (
                      <div key={row.id} className="flex items-center justify-between gap-3">
                        <p className="font-black text-white">{row.name}</p>
                        <p className="text-sm font-semibold text-[#e8c547]">
                          {row.optionalWeeks} optional {row.optionalWeeks === 1 ? 'week' : 'weeks'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    index === 0
                      ? 'border-[#e8c547]/70 bg-[#e8c547]/10'
                      : 'border-white/10 bg-black/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-white">
                        {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`}{' '}
                        {row.name}
                      </p>
                      {row.lastWorkout && (
                        <p className="mt-1 text-xs text-[#f6f1e3]/55">
                          Last: {row.lastWorkout}
                          {lastLabel(row.lastAt) ? ` · ${lastLabel(row.lastAt)}` : ''}
                        </p>
                      )}
                    </div>
                    <p className="text-right text-xl font-black text-[#e8c547]">
                      {Math.round(row.volume).toLocaleString()}
                      <span className="block text-xs font-semibold text-[#f6f1e3]/50">lb volume</span>
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <Stat label="Workouts" value={String(row.workouts)} />
                    <Stat label="Sets" value={String(row.sets)} />
                    <Stat label="Heaviest" value={row.heaviest ? `${Math.round(row.heaviest)} lb` : '—'} />
                    <Stat label="Best day" value={row.bestSessionVolume ? `${Math.round(row.bestSessionVolume).toLocaleString()} lb` : '—'} />
                    <Stat label="Avg time" value={formatDuration(row.avgSeconds)} />
                    <Stat label="Medals" value={String(row.badges)} />
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-snug text-[#e8c547]">
                    {tomScoreboardLine(row, index, rows)}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#f6f1e3]/45">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}
