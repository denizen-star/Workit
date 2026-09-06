'use client';

import { useEffect, useState } from 'react';
import { KpiList } from '@/components/KpiList';
import { LastSessionCard, LiftCard } from '@/components/KpiStory';
import { HomeFold } from '@/components/ScanCard';
import { HOME_STORIES_HELP } from '@/lib/helpCopy';
import { performanceRangeLabel, type AthletePerformanceBoard } from '@/lib/athletePerformanceTypes';
import { kpisFromBoard, kpisFromLine } from '@/lib/kpi';
import { bestProgress, heldOrFirst, latestWorkout, weekVsLast } from '@/lib/kpiView';
import { strongerLine, whyFromLine } from '@/lib/kpiWhy';

let homeBoardCache: AthletePerformanceBoard | null | undefined;
let homeBoardInflight: Promise<AthletePerformanceBoard | null> | null = null;

function loadHomeBoard() {
  if (homeBoardCache !== undefined) return Promise.resolve(homeBoardCache);
  if (homeBoardInflight) return homeBoardInflight;
  homeBoardInflight = (async () => {
    const first = await fetch('/api/athlete-performance?period=t-15').then((res) =>
      res.ok ? res.json() : null
    );
    if (first?.hidden) {
      homeBoardCache = null;
      return null;
    }
    if (first?.exercises?.length || first?.window?.setCount) {
      homeBoardCache = first as AthletePerformanceBoard;
      return homeBoardCache;
    }
    const fallback = await fetch('/api/athlete-performance?period=all').then((res) =>
      res.ok ? res.json() : null
    );
    homeBoardCache = fallback?.hidden ? null : (fallback as AthletePerformanceBoard);
    return homeBoardCache;
  })();
  return homeBoardInflight;
}

function useHomeBoard() {
  const [board, setBoard] = useState<AthletePerformanceBoard | null>(homeBoardCache ?? null);

  useEffect(() => {
    let cancelled = false;
    loadHomeBoard()
      .then((value) => {
        if (!cancelled) setBoard(value);
      })
      .catch(() => {
        if (!cancelled) setBoard(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return board;
}

/** Four KPI rows that sit inside the Today card. */
export function HomeTodayKpis({ locked = false }: { locked?: boolean }) {
  const board = useHomeBoard();
  const rows = board ? kpisFromBoard(board) : null;
  if (!rows || !board) return null;
  const range = performanceRangeLabel(board.period);
  return (
    <div>
      <p className="mt-5 text-sm leading-relaxed text-[#f6f1e3]/70">
        {locked
          ? `The week is locked. These four numbers are ${range} vs last time those lifts ran — not a rest-day score.`
          : `${range.charAt(0).toUpperCase()}${range.slice(1)} vs last time those lifts ran.`}
      </p>
      <KpiList rows={rows} />
    </div>
  );
}

export default function HomeKpiLead({ weekNumber }: { weekNumber?: number | null }) {
  const board = useHomeBoard();
  if (!board || (board.exercises.length === 0 && !board.window?.setCount)) return null;

  const last = latestWorkout(board);
  const best = last ? bestProgress(last.exercises) : undefined;
  const held = last ? heldOrFirst(last.exercises) : undefined;
  const week = weekVsLast(board, weekNumber ?? last?.weekNumber ?? null);

  return (
    <HomeFold title="Session stories" help={HOME_STORIES_HELP}>
      <div className="space-y-3">
        {last ? <LastSessionCard workout={last} /> : null}

        {best ? <LiftCard row={best} chip="best" /> : null}

        {held ? (
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/55">
              Did not improve
            </p>
            <p className="mt-1 text-base font-black text-white">{held.name}</p>
            <p className="mt-1 text-sm text-[#f6f1e3]/55">Why: {whyFromLine(held)}</p>
            <KpiList rows={kpisFromLine(held)} />
          </div>
        ) : null}

        {week ? (
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">Week vs last time</p>
            <KpiList rows={kpisFromLine(week, true)} />
            <p className="mt-2 text-sm text-[#f6f1e3]/55">
              {strongerLine(week.rawVolumeChangePct, week.volumeChangePct)}
            </p>
          </div>
        ) : null}
      </div>
    </HomeFold>
  );
}
