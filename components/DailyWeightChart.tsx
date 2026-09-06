'use client';

import { useMemo, useState } from 'react';
import WeightTrendChart from '@/components/WeightTrendChart';
import { HelpTip } from '@/components/HelpSheet';
import { HOME_DAILY_WEIGHT_HELP } from '@/lib/helpCopy';
import {
  addWeight,
  CHART_HOUSE,
  CHART_YOU,
  compactTrendRows,
  earliestKey,
  pointsOnAxis,
  trendAxis,
  type TrendMode,
  type TrendRange,
} from '@/lib/chartTrend';

/** Home Quiet daily weight. You = cream. House = copper dashed. */
export default function DailyWeightChart({
  dailyStats,
  householdDaily,
  dailyHardness,
  programStart,
}: {
  dailyStats: { workout_date: string; total_weight_lifted: number | string }[];
  householdDaily?: { workout_date: string; avg_weight: number }[];
  dailyHardness?: { workout_date: string; avg_hard: number }[];
  /** First finished session. Days before this stay off the chart. */
  programStart?: string | null;
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

  const hardByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of dailyHardness || []) {
      const score = Number(row.avg_hard);
      if (Number.isFinite(score) && score > 0) addWeight(map, row.workout_date, score);
    }
    return map;
  }, [dailyHardness]);

  const axis = useMemo(() => {
    const floor =
      programStart ||
      earliestKey([...youByDate.keys()]) ||
      earliestKey([...houseByDate.keys()]);
    return trendAxis([...youByDate.keys(), ...houseByDate.keys()], range, floor);
  }, [youByDate, houseByDate, range, programStart]);

  const data = useMemo(
    () =>
      compactTrendRows(axis, [
        { key: 'you', values: pointsOnAxis(axis, youByDate, mode) },
        { key: 'house', values: pointsOnAxis(axis, houseByDate, mode) },
        { key: 'hard', values: pointsOnAxis(axis, hardByDate, 'daily') },
      ]),
    [axis, mode, youByDate, houseByDate, hardByDate]
  );

  if (data.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <h3 className="text-base font-black uppercase tracking-[0.16em] text-[#e8c547]">
            Daily weight lifted
          </h3>
          <HelpTip
            label="How to read Daily weight"
            title={HOME_DAILY_WEIGHT_HELP.title}
            lead={HOME_DAILY_WEIGHT_HELP.lead}
            bullets={HOME_DAILY_WEIGHT_HELP.bullets}
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {(['daily', 'cumulative'] as const).map((option) => {
            const selected = option === mode;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`min-h-12 rounded-xl border px-3 text-base font-semibold capitalize ${
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
                className={`min-h-12 rounded-xl border px-3 text-base font-semibold ${
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
      <WeightTrendChart
        data={data}
        height={240}
        hardnessKey="hard"
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
