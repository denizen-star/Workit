'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { KpiList } from '@/components/KpiList';
import ScoreboardPeriodPills from '@/components/ScoreboardPeriodPills';
import { formatHardnessWithPct } from '@/lib/hardness';
import { kpisFromScoreboard } from '@/lib/kpi';
import { athleteCallName } from '@/lib/profile';
import { formatCompact, formatPct } from '@/lib/athletePerformanceTypes';
import {
  scoreboardRangeLabel,
  tomScoreboardLine,
  type HouseholdScoreboardRow,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';

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

/**
 * You always see your own real name here; every other athlete shows by their
 * alias (else first name) instead of their full real name.
 */
function houseAthleteLabel(
  row: { id: number; name: string; displayName: string | null },
  highlightUserId: number | null,
  full: boolean
) {
  const isYou = highlightUserId != null && Number(row.id) === highlightUserId;
  if (isYou) return full ? row.name : row.name.split(/\s+/)[0];
  return athleteCallName({ display_name: row.displayName, name: row.name });
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
  period: periodProp,
  onPeriodChange,
  showPeriodPills = true,
}: {
  standalone?: boolean;
  highlightUserId?: number | null;
  period?: ScoreboardPeriod;
  onPeriodChange?: (period: ScoreboardPeriod) => void;
  showPeriodPills?: boolean;
}) {
  const [open, setOpen] = useState(standalone);
  const [innerPeriod, setInnerPeriod] = useState<ScoreboardPeriod>('7');
  const period = periodProp ?? innerPeriod;
  const setPeriod = onPeriodChange ?? setInnerPeriod;
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

  const body = (
    <div className={standalone ? '' : 'mt-4'}>
      {showPeriodPills ? (
        <ScoreboardPeriodPills period={period} onChange={setPeriod} />
      ) : null}

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
                <span className={you ? 'text-[#f6f1e3]' : 'text-[#c08457]'}>
                  {houseAthleteLabel(row, highlightUserId, false)}
                </span>
                <div className="pack-bar-track">
                  <i
                    style={{
                      width: `${width}%`,
                      background: you ? '#f6f1e3' : '#c08457',
                    }}
                  />
                </div>
                <b className={you ? 'text-[#f6f1e3]' : 'text-[#c08457]'}>
                  {formatCompact(row.volume)}
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
                <p className={`mt-1 text-xl font-black ${you ? 'text-[#f6f1e3]' : 'text-white'}`}>
                  {houseAthleteLabel(row, highlightUserId, true)}
                </p>
                <p className="mt-1 text-[28px] font-black leading-tight text-white">
                  {formatCompact(volume)} Volume
                </p>
                <p className="mt-1 text-sm text-[#f6f1e3]/55">
                  {[last, effective != null ? `Effective ${formatCompact(effective)}` : null]
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
                    <b>{row.heaviest ? `${formatCompact(row.heaviest)} lb` : '—'}</b>
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
