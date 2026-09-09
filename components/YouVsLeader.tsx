'use client';

import { useEffect, useMemo, useState } from 'react';
import CompareTable from '@/components/CompareTable';
import ScoreboardPeriodPills from '@/components/ScoreboardPeriodPills';
import { formatCompact } from '@/lib/athletePerformanceTypes';
import {
  scoreboardRangeLabel,
  scoreboardRangeTitle,
  type BonusHonorRow,
  type CardioHonorRow,
  type HouseholdScoreboardRow,
  type OptionalHonorRow,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';
import {
  boardVolume,
  houseAvgRow,
  houseRankRows,
  packRows,
  placeWord,
  resolveYouVsMode,
  themLabel,
  themRow,
  weekRowFor,
  youVsIndex,
  youVsRows,
  type YouVsMode,
} from '@/lib/youVs';

function barHeight(value: number, max: number) {
  return `${Math.max(16, Math.round((value / max) * 72))}px`;
}

function scoreboardPayload(data: unknown) {
  const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const members = Array.isArray(body.members)
    ? (body.members as Array<{ id: number; name: string; displayName: string | null }>)
    : [];
  return {
    rows: Array.isArray(body.rows) ? (body.rows as HouseholdScoreboardRow[]) : [],
    members,
    bonus: Array.isArray(body.bonusHonor) ? (body.bonusHonor as BonusHonorRow[]) : [],
    optionals: Array.isArray(body.optionalHonor) ? (body.optionalHonor as OptionalHonorRow[]) : [],
    cardio: Array.isArray(body.cardioHonor) ? (body.cardioHonor as CardioHonorRow[]) : [],
  };
}

/** Numbers and Next rank follow the house window (7d / 30d / all). Test out. */
export default function YouVsLeader({
  userId,
  period: periodProp,
  onPeriodChange,
  showPeriodPills = true,
}: {
  userId: number | null;
  period?: ScoreboardPeriod;
  onPeriodChange?: (period: ScoreboardPeriod) => void;
  showPeriodPills?: boolean;
}) {
  const [innerPeriod, setInnerPeriod] = useState<ScoreboardPeriod>('7');
  const period = periodProp ?? innerPeriod;
  const setPeriod = onPeriodChange ?? setInnerPeriod;
  const [weekRows, setWeekRows] = useState<HouseholdScoreboardRow[]>([]);
  const [rankRows, setRankRows] = useState<HouseholdScoreboardRow[]>([]);
  const [bonusHonor, setBonusHonor] = useState<BonusHonorRow[]>([]);
  const [optionalHonor, setOptionalHonor] = useState<OptionalHonorRow[]>([]);
  const [cardioHonor, setCardioHonor] = useState<CardioHonorRow[]>([]);
  const [mode, setMode] = useState<YouVsMode>('up');
  const [houseName, setHouseName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (cancelled) return;
        const name =
          me && typeof me === 'object' && me.user && typeof me.user === 'object'
            ? String((me.user as { householdName?: string | null }).householdName || '')
            : '';
        setHouseName(name || null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/scoreboard?period=' + period)
      .then((res) => (res.ok ? res.json() : null))
      .then((board) => {
        if (cancelled) return;
        const payload = scoreboardPayload(board);
        setWeekRows(payload.rows);
        setRankRows(houseRankRows(payload.rows, payload.members));
        setBonusHonor(payload.bonus);
        setOptionalHonor(payload.optionals);
        setCardioHonor(payload.cardio);
      })
      .catch(() => {
        if (cancelled) return;
        setWeekRows([]);
        setRankRows([]);
        setBonusHonor([]);
        setOptionalHonor([]);
        setCardioHonor([]);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const pack = useMemo(() => packRows(rankRows), [rankRows]);
  const weekPack = useMemo(() => packRows(weekRows), [weekRows]);
  const rankIndex = userId == null ? -1 : youVsIndex(pack, userId);
  const youRankRow = rankIndex >= 0 ? pack[rankIndex] : null;
  const weekYou = youRankRow ? weekRowFor(weekRows, youRankRow) : null;
  const canUp = rankIndex > 0;
  const canDown = rankIndex >= 0 && rankIndex < pack.length - 1;
  const resolved = rankIndex >= 0 ? resolveYouVsMode(mode, rankIndex, pack.length) : 'house';
  const rankThem = rankIndex >= 0 ? themRow(pack, rankIndex, resolved) : null;
  const them =
    resolved === 'house'
      ? houseAvgRow(weekRows)
      : rankThem
        ? weekRowFor(weekRows, rankThem)
        : houseAvgRow(weekRows);
  const label = themLabel(rankThem && resolved !== 'house' ? rankThem : them, resolved);
  const themRankIndex = rankThem && rankThem.id >= 0 ? youVsIndex(pack, rankThem.id) : -1;
  const tableRows = weekYou
    ? youVsRows(
        weekYou,
        them,
        { bonus: bonusHonor, optionals: optionalHonor, cardio: cardioHonor },
        weekPack,
        { you: rankIndex + 1, them: themRankIndex >= 0 ? themRankIndex + 1 : null }
      )
    : [];

  if (!weekYou || userId == null) return null;

  const youVol = boardVolume(weekYou);
  const lastVol = weekYou.priorRawVolume ?? weekYou.priorVolume ?? 0;
  const themVol = them ? boardVolume(them) : 0;
  const max = Math.max(youVol, lastVol, themVol, 1);

  return (
    <div className="rounded-2xl border border-[#f6f1e3]/45 bg-white/[0.06] px-4 py-5 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c08457]">
        {scoreboardRangeTitle(period)}
      </p>
      <p className="mt-1 text-xl font-black text-[#f6f1e3]">
        {them ? `You vs ${label}` : 'You vs last'}
      </p>
      <p className="mt-1 text-base text-[#f6f1e3]/60">
        You are {placeWord(rankIndex + 1)} of {pack.length} in {houseName || 'this house'}. Next is
        this house only, Test out. Switch house in the menu if you are in more than one. The table
        is {scoreboardRangeLabel(period)}. Last is the last time you posted these numbers.
      </p>
      {showPeriodPills ? (
        <ScoreboardPeriodPills period={period} onChange={setPeriod} className="mt-3 grid grid-cols-3 gap-2" />
      ) : null}
      <div className="mt-3 flex gap-2">
        <ModePill
          active={resolved === 'up'}
          disabled={!canUp}
          onClick={() => setMode('up')}
          label="Next"
          arrow="up"
        />
        <ModePill
          active={resolved === 'down'}
          disabled={!canDown}
          onClick={() => setMode('down')}
          label="Next"
          arrow="down"
        />
        <ModePill active={resolved === 'house'} onClick={() => setMode('house')} label="House" />
      </div>
      <div className="vs-col">
        <div className="stack">
          <div className="bar you" style={{ height: barHeight(youVol, max) }} />
          <b>You</b>
          <p className="text-sm text-[#f6f1e3]/55">{formatCompact(youVol)}</p>
        </div>
        <div className="stack">
          <div className="bar last" style={{ height: barHeight(lastVol, max) }} />
          <b>Last</b>
          <p className="text-sm text-[#f6f1e3]/55">{lastVol ? formatCompact(lastVol) : '—'}</p>
        </div>
        {them ? (
          <div className="stack">
            <div className="bar rival" style={{ height: barHeight(themVol, max) }} />
            <b>{label}</b>
            <p className="text-sm text-[#f6f1e3]/55">{formatCompact(themVol)}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-2">
        <CompareTable rows={tableRows} showThem={Boolean(them)} themLabel={label} />
      </div>
    </div>
  );
}

function ModeArrow({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      {dir === 'up' ? (
        <path
          d="M12 19V5M5 12l7-7 7 7"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M12 5v14M19 12l-7 7-7-7"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function ModePill({
  active,
  onClick,
  label,
  disabled,
  arrow,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  arrow?: 'up' | 'down';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={arrow === 'up' ? 'Next up' : arrow === 'down' ? 'Next down' : label}
      className={`min-h-12 flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border text-base font-semibold ${
        disabled
          ? 'cursor-not-allowed border-white/6 bg-black/15 text-[#f6f1e3]/30'
          : active
            ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
            : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
      }`}
    >
      {label}
      {arrow ? <ModeArrow dir={arrow} /> : null}
    </button>
  );
}
