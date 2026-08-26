'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import ExerciseCompareCells from '@/components/ExerciseCompareCells';
import WeightRanking from '@/components/WeightRanking';
import type { ExerciseCompareRow, WeightRank } from '@/lib/exerciseCompare';
import {
  SCOREBOARD_PERIODS,
  scoreboardRangeLabel,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';

const PERIOD_LABELS: Record<ScoreboardPeriod, string> = {
  '7': '7 days',
  '30': '30 days',
  all: 'All time',
};

export default function ExerciseCompare({ standalone = false }: { standalone?: boolean }) {
  const [open, setOpen] = useState(standalone);
  const [period, setPeriod] = useState<ScoreboardPeriod>('7');
  const [row, setRow] = useState<ExerciseCompareRow | null>(null);
  const [ranking, setRanking] = useState<WeightRank[]>([]);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/exercise-compare?period=' + period)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.hidden) {
          setHidden(true);
          setRow(null);
          setRanking([]);
          return;
        }
        setHidden(false);
        setRow(data?.row ?? null);
        setRanking(Array.isArray(data?.ranking) ? data.ranking : []);
      })
      .catch(() => {
        if (!cancelled) {
          setHidden(false);
          setRow(null);
          setRanking([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (hidden) return null;

  return (
    <div className={standalone ? 'mb-8' : 'glass-card mb-8 p-6'}>
      {!standalone && (
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <Dumbbell className="h-6 w-6 text-[#e8c547]" />
        <h2 className="text-2xl font-black text-white">Vs the house</h2>
        <span className="ml-auto text-sm text-[#f6f1e3]/65">{scoreboardRangeLabel(period)}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />
        )}
      </button>
      )}

      {(standalone || open) && (
        <div className="mt-4">
          <p className="mb-3 text-base text-[#f6f1e3]/60">
            Best day is your heaviest day on each lift, added up. Total weight is every set, weight
            times reps. Then two boards against people in your pack.
          </p>

          <div className="mb-3 grid grid-cols-3 gap-2">
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

          {loading ? (
            <p className="text-sm text-[#f6f1e3]/55">Loading lifts...</p>
          ) : !row && ranking.length === 0 ? (
            <p className="text-sm text-[#f6f1e3]/55">
              No finished workouts in this window. Get under the bar.
            </p>
          ) : (
            <div className="space-y-3">
              <WeightRanking ranking={ranking} highlightUserId={row?.userId} />
              {row && (
                <>
                  <div>
                    <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#e8c547]">
                      By weight
                    </h3>
                    <ExerciseCompareCells trio={row.weight} athleteName={row.name} />
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#e8c547]">
                      By reps
                    </h3>
                    <ExerciseCompareCells trio={row.reps} athleteName={row.name} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
