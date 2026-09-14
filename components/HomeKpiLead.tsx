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

// Keyed by track ('all' for the untracked default) so a Hyrox-scoped fetch never
// clobbers — or gets clobbered by — the normal Home's whole-history cache.
const homeBoardCache = new Map<string, AthletePerformanceBoard | null>();
const homeBoardInflight = new Map<string, Promise<AthletePerformanceBoard | null>>();

function loadHomeBoard(track?: 'hyrox') {
  const key = track ?? 'all';
  const trackQuery = track ? `&track=${track}` : '';
  if (homeBoardCache.has(key)) return Promise.resolve(homeBoardCache.get(key) ?? null);
  const inflight = homeBoardInflight.get(key);
  if (inflight) return inflight;
  const promise = (async () => {
    const first = await fetch(`/api/athlete-performance?period=t-15${trackQuery}`).then((res) =>
      res.ok ? res.json() : null
    );
    if (first?.hidden) {
      homeBoardCache.set(key, null);
      return null;
    }
    if (first?.exercises?.length || first?.window?.setCount) {
      const board = first as AthletePerformanceBoard;
      homeBoardCache.set(key, board);
      return board;
    }
    const fallback = await fetch(`/api/athlete-performance?period=all${trackQuery}`).then((res) =>
      res.ok ? res.json() : null
    );
    const board = fallback?.hidden ? null : (fallback as AthletePerformanceBoard);
    homeBoardCache.set(key, board);
    return board;
  })();
  homeBoardInflight.set(key, promise);
  return promise;
}

function useHomeBoard(track?: 'hyrox') {
  const [board, setBoard] = useState<AthletePerformanceBoard | null>(
    homeBoardCache.get(track ?? 'all') ?? null
  );

  useEffect(() => {
    let cancelled = false;
    loadHomeBoard(track)
      .then((value) => {
        if (!cancelled) setBoard(value);
      })
      .catch(() => {
        if (!cancelled) setBoard(null);
      });
    return () => {
      cancelled = true;
    };
  }, [track]);

  return board;
}

/** Four KPI rows that sit inside the Today card. */
export function HomeTodayKpis({ locked = false, track }: { locked?: boolean; track?: 'hyrox' }) {
  const board = useHomeBoard(track);
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

export default function HomeKpiLead({
  weekNumber,
  track,
}: {
  weekNumber?: number | null;
  track?: 'hyrox';
}) {
  const board = useHomeBoard(track);
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
