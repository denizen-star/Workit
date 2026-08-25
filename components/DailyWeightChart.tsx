'use client';

import { useMemo, useState } from 'react';
import WeightTrendChart from '@/components/WeightTrendChart';
import {
  addWeight,
  CHART_HOUSE,
  CHART_YOU,
  compactTrendRows,
  pointsOnAxis,
  trendAxis,
  type TrendMode,
  type TrendRange,
} from '@/lib/chartTrend';

/** Home Quiet daily weight. You = gold. House avg = copper (dashed). */
export default function DailyWeightChart({
  dailyStats,
  householdDaily,
}: {
  dailyStats: { workout_date: string; total_weight_lifted: number | string }[];
  householdDaily?: { workout_date: string; avg_weight: number }[];
}) {
  const [range, setRange] = useState<TrendRange>('7');
  const [mode, setMode] = useState<TrendMode>('daily');

  const youByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of dailyStats) {
      addWeight(map, row.workout_date, parseFloat(String(row.total_weight_lifted)));
    }
    return map;
  }, [dailyStats]);

  const houseByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of householdDaily || []) {
      addWeight(map, row.workout_date, Number(row.avg_weight));
    }
    return map;
  }, [householdDaily]);

  const axis = useMemo(
    () => trendAxis([...youByDate.keys(), ...houseByDate.keys()], range),
    [youByDate, houseByDate, range]
  );

  const data = useMemo(
    () =>
      compactTrendRows(axis, [
        { key: 'you', values: pointsOnAxis(axis, youByDate, mode) },
        { key: 'house', values: pointsOnAxis(axis, houseByDate, mode) },
      ]),
    [axis, mode, youByDate, houseByDate]
  );

  if (data.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
          Daily weight lifted
        </h3>
        <div className="ml-auto flex flex-wrap gap-1">
          {(['daily', 'cumulative'] as const).map((option) => {
            const selected = option === mode;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`min-h-9 rounded-xl border px-2 text-xs font-semibold capitalize ${
                  selected
                    ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                    : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
                }`}
              >
                {option}
              </button>
            );
          })}
          {(['7', '30', 'all'] as const).map((option) => {
            const selected = option === range;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`min-h-9 rounded-xl border px-2 text-xs font-semibold ${
                  selected
                    ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                    : 'border-white/10 bg-black/25 text-[#f6f1e3]/75'
                }`}
              >
                {option === 'all' ? 'All' : option}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mb-3 text-xs text-[#f6f1e3]/55">
        <span className="font-semibold text-[#e8c547]">Gold</span> is you.{' '}
        <span className="font-semibold text-[#c08457]">Copper</span> is house avg (dashed).
      </p>
      <WeightTrendChart
        data={data}
        lines={[
          { key: 'you', name: 'You', color: CHART_YOU, thick: true },
          ...(houseByDate.size > 0
            ? [{ key: 'house', name: 'House avg', color: CHART_HOUSE, dashed: true }]
            : []),
        ]}
      />
    </div>
  );
}
