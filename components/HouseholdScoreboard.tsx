'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import ScanCard from '@/components/ScanCard';
import HouseholdWeightChart from '@/components/HouseholdWeightChart';
import { formatDuration } from '@/lib/formatDuration';
import { formatHardnessWithPct } from '@/lib/hardness';
import {
  SCOREBOARD_PERIODS,
  scoreboardBestDay,
  scoreboardRangeLabel,
  scoreboardVolume,
  tomScoreboardLine,
  type BonusHonorRow,
  type HouseholdScoreboardRow,
  type OptionalHonorRow,
  type ScoreboardDailyPoint,
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

export default function HouseholdScoreboard({
  standalone = false,
  highlightUserId = null,
}: {
  standalone?: boolean;
  highlightUserId?: number | null;
}) {
  const [open, setOpen] = useState(standalone);
  const [period, setPeriod] = useState<ScoreboardPeriod>('7');
  const [rows, setRows] = useState<HouseholdScoreboardRow[]>([]);
  const [bonusHonor, setBonusHonor] = useState<BonusHonorRow[]>([]);
  const [optionalHonor, setOptionalHonor] = useState<OptionalHonorRow[]>([]);
  const [dailySeries, setDailySeries] = useState<ScoreboardDailyPoint[]>([]);
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
        setDailySeries(Array.isArray(data?.dailySeries) ? data.dailySeries : []);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setBonusHonor([]);
          setOptionalHonor([]);
          setDailySeries([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const body = (
    <div className={standalone ? '' : 'mt-4'}>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {SCOREBOARD_PERIODS.map((option) => {
          const selected = option === period;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={`min-h-12 rounded-2xl border text-base font-semibold ${
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

      {!loading && dailySeries.length > 0 && (
        <HouseholdWeightChart points={dailySeries} highlightUserId={highlightUserId} />
      )}

      <p className="mb-3 text-base text-[#f6f1e3]/60">
        Household only. Finished workouts count. Rank is workouts, then raw iron. The lb is after
        Effort. Come take someone&apos;s place.
      </p>

      {loading ? (
        <p className="text-sm text-[#f6f1e3]/55">Loading household work...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#e8c547]">
          Empty board. Nobody finished a workout in this window. I am not impressed.
        </p>
      ) : (
        <div className="space-y-2">
          {bonusHonor.length > 0 && (
            <div className="rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-5 py-4">
              <p className="text-base font-black uppercase tracking-[0.16em] text-[#e8c547]">Bonus work</p>
              <p className="mt-1 text-base text-[#f6f1e3]/70">
                Extra upper. They did not owe it. They paid it.
              </p>
              <div className="mt-3 space-y-2">
                {bonusHonor.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-white">{row.name}</p>
                    <p className="text-base font-semibold text-[#e8c547]">
                      {row.bonusWeeks} bonus {row.bonusWeeks === 1 ? 'week' : 'weeks'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {optionalHonor.length > 0 && (
            <div className="rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-5 py-4">
              <p className="text-base font-black uppercase tracking-[0.16em] text-[#e8c547]">Optionals</p>
              <p className="mt-1 text-base text-[#f6f1e3]/70">
                Four warmups. Four cooldowns. Easy minutes that still count.
              </p>
              <div className="mt-3 space-y-2">
                {optionalHonor.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-white">{row.name}</p>
                    <p className="text-base font-semibold text-[#e8c547]">
                      {row.optionalWeeks} optional {row.optionalWeeks === 1 ? 'week' : 'weeks'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rows.map((row, index) => {
            const place =
              index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
            const last = row.lastWorkout
              ? `Last: ${row.lastWorkout}${lastLabel(row.lastAt) ? ` · ${lastLabel(row.lastAt)}` : ''}`
              : undefined;
            return (
              <ScanCard
                key={row.id}
                you={highlightUserId != null && Number(row.id) === highlightUserId}
                roomy
                kicker={place}
                title={row.name}
                headline={`${Math.round(scoreboardVolume(row)).toLocaleString()} lb`}
                sub={last}
                metrics={[
                  { label: 'Workouts', value: String(row.workouts) },
                  { label: 'Sets', value: String(row.sets) },
                  { label: 'Heaviest', value: row.heaviest ? `${Math.round(row.heaviest)} lb` : '—' },
                  {
                    label: 'Best day',
                    value: scoreboardBestDay(row)
                      ? `${Math.round(scoreboardBestDay(row)).toLocaleString()}`
                      : '—',
                  },
                  { label: 'Avg time', value: formatDuration(row.avgSeconds) },
                  { label: 'Medals', value: String(row.badges) },
                  { label: 'Belt', value: row.beltName || '—' },
                  { label: 'Effort', value: formatHardnessWithPct(row.perception) },
                ]}
                foot={tomScoreboardLine(row, index, rows)}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className={standalone ? 'mb-8' : 'glass-card mb-8 p-6'}>
      {!standalone && (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-2 text-left"
          aria-expanded={open}
        >
          <Trophy className="h-6 w-6 text-[#e8c547]" />
          <h2 className="text-2xl font-black text-[#c08457]">The house</h2>
          <span className="ml-auto text-sm text-[#f6f1e3]/65">{scoreboardRangeLabel(period)}</span>
          {open ? (
            <ChevronUp className="h-5 w-5 text-[#f6f1e3]/65" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />
          )}
        </button>
      )}
      {(standalone || open) && body}
    </div>
  );
}
