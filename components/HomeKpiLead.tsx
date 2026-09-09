'use client';

import { useEffect, useState } from 'react';
import CompareTable from '@/components/CompareTable';
import { HomeFold } from '@/components/ScanCard';
import { HOME_STORIES_HELP } from '@/lib/helpCopy';
import { recapExerciseRows, sessionStoryRows } from '@/lib/compareTable';
import { performanceRangeLabel, type AthletePerformanceBoard } from '@/lib/athletePerformanceTypes';
import { kpisFromBoard } from '@/lib/kpi';
import { KpiList } from '@/components/KpiList';
import { latestWorkout, weekVsLast } from '@/lib/kpiView';

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
  const week = weekVsLast(board, weekNumber ?? last?.weekNumber ?? null);
  const recapRows = last ? recapExerciseRows(last.exercises || []) : [];
  const storyRows = sessionStoryRows(last, week);

  return (
    <HomeFold title="Session stories" help={HOME_STORIES_HELP}>
      <div className="space-y-5">
        {last && recapRows.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#e8c547]">
              Last session · {last.workoutType.replace(' Body ', ' ')}
            </p>
            <CompareTable rows={recapRows} youLabel="This" />
          </div>
        ) : null}
        {storyRows.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#e8c547]">
              What moved
            </p>
            <CompareTable rows={storyRows} youLabel="This" />
          </div>
        ) : null}
      </div>
    </HomeFold>
  );
}
