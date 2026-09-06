'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { KpiList } from '@/components/KpiList';
import { formatHardnessWithPct } from '@/lib/hardness';
import { kpisFromScoreboard } from '@/lib/kpi';
import { formatPct } from '@/lib/athletePerformanceTypes';
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

function trackingLine(row: HouseholdScoreboardRow, volumePct: number | null, effortPct: number | null) {
  const hasPrior = row.priorRawVolume != null || row.priorVolume != null;
  const noMoves = !row.trackingUp && !row.trackingDown;
  if (!hasPrior && noMoves) {
    return 'Tracking · no second session on these lifts yet.';
  }
  const bits = [
    'Tracking · Volume',
    row.trackingUp != null ? `${row.trackingUp} up` : null,
    row.trackingDown != null ? `/ ${row.trackingDown} down` : null,
    volumePct != null ? `· avg Volume ${formatPct(volumePct)}` : null,
    effortPct != null ? `· avg Effective ${formatPct(effortPct)}` : null,
  ].filter(Boolean);
  return bits.join(' ');
}

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

      {!loading && rows.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#c08457]">
            Pack Volume
          </p>
          {rows.map((row) => {
            const max = Math.max(...rows.map((item) => item.volume), 1);
            const you = highlightUserId != null && Number(row.id) === highlightUserId;
            const width = Math.max(4, Math.round((row.volume / max) * 100));
            return (
              <div key={row.id} className="pack-bar">
                <span className={you ? 'text-[#f6f1e3]' : 'text-[#c08457]'}>{row.name.split(/\s+/)[0]}</span>
                <div className="pack-bar-track">
                  <i
                    style={{
                      width: `${width}%`,
                      background: you ? '#f6f1e3' : '#c08457',
                    }}
                  />
                </div>
                <b className={you ? 'text-[#f6f1e3]' : 'text-[#c08457]'}>
                  {Math.round(row.volume).toLocaleString()}
                </b>
              </div>
            );
          })}
        </div>
      ) : null}

      <p className="mb-3 text-base text-[#f6f1e3]/60">
        Household only. Finished workouts count. Rank is workouts, then Volume Load. The card lb is
        Effective Load. Come take someone&apos;s place.
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
            const volume = row.rawVolume != null ? row.rawVolume : row.volume;
            const effective = row.effortSets != null ? row.effortSets : row.effortVolume;
            const last = row.lastWorkout
              ? `Last: ${row.lastWorkout}${lastLabel(row.lastAt) ? ` · ${lastLabel(row.lastAt)}` : ''}`
              : undefined;
            const you = highlightUserId != null && Number(row.id) === highlightUserId;
            const kpis = kpisFromScoreboard(row);
            const volKpi = kpis.find((item) => item.id === 'volume');
            const effKpi = kpis.find((item) => item.id === 'effective');
            return (
              <div
                key={row.id}
                className={`rounded-2xl border px-6 py-5 ${
                  you ? 'border-[#f6f1e3]/45 bg-white/[0.06]' : 'border-white/10 bg-black/25'
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c08457]">{place}</p>
                <p className={`mt-1 text-xl font-black ${you ? 'text-[#f6f1e3]' : 'text-white'}`}>{row.name}</p>
                <p className="mt-1 text-[28px] font-black leading-tight text-white">
                  {Math.round(volume).toLocaleString()} Volume
                </p>
                <p className="mt-1 text-sm text-[#f6f1e3]/55">
                  {[last, effective != null ? `Effective ${Math.round(effective).toLocaleString()}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <KpiList rows={kpis} />
                <div className="kpi-metrics">
                  <div>
                    <span>Workouts</span>
                    <b>{row.workouts}</b>
                  </div>
                  <div>
                    <span>Effort</span>
                    <b>{formatHardnessWithPct(row.perception)}</b>
                  </div>
                  <div>
                    <span>Belt</span>
                    <b>{row.beltName || '—'}</b>
                  </div>
                  <div>
                    <span>Heaviest</span>
                    <b>{row.heaviest ? `${Math.round(row.heaviest)} lb` : '—'}</b>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#f6f1e3]/70">
                  {trackingLine(row, volKpi?.pct ?? null, effKpi?.pct ?? null)}. {tomScoreboardLine(row, index, rows)}
                </p>
              </div>
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
