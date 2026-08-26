'use client';

import { useMemo, useState } from 'react';
import WeightTrendChart from '@/components/WeightTrendChart';
import {
  addWeight,
  athleteStroke,
  CHART_HOUSE,
  CHART_YOU,
  compactTrendRows,
  pointsOnAxis,
  trendAxis,
  type TrendLine,
  type TrendMode,
} from '@/lib/chartTrend';
import { isTestUserName } from '@/lib/householdUsers';
import { firstName, type ScoreboardDailyPoint } from '@/lib/scoreboardTypes';

function mean(values: number[]) {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Pack chart: every athlete, copper house avg excluding Test, gold = you. */
export default function HouseholdWeightChart({
  points,
  highlightUserId,
}: {
  points: ScoreboardDailyPoint[];
  highlightUserId: number | null;
}) {
  const [mode, setMode] = useState<TrendMode>('daily');

  const athletes = useMemo(() => {
    const byUser = new Map<number, { name: string; byDate: Map<string, number> }>();
    for (const point of points) {
      const id = Number(point.userId);
      const existing = byUser.get(id) || { name: point.name, byDate: new Map() };
      addWeight(existing.byDate, point.workout_date, Number(point.weight));
      if (existing.byDate.size > 0) byUser.set(id, existing);
    }
    return [...byUser.entries()]
      .map(([userId, row]) => ({ userId, ...row }))
      .filter((athlete) => athlete.byDate.size > 0);
  }, [points]);

  const axis = useMemo(
    () => trendAxis(points.map((point) => point.workout_date), 'all'),
    [points]
  );

  const pack = useMemo(
    () => athletes.filter((athlete) => !isTestUserName(athlete.name)),
    [athletes]
  );

  const { data, lines } = useMemo(() => {
    const series: TrendLine[] = athletes.map((athlete) => {
      const you = highlightUserId != null && athlete.userId === highlightUserId;
      return {
        key: `u${athlete.userId}`,
        name: you ? `${firstName(athlete.name)} · you` : firstName(athlete.name),
        color: you ? CHART_YOU : athleteStroke(athlete.userId, highlightUserId),
        thick: you,
      };
    });
    series.push({
      key: 'house',
      name: 'House avg',
      color: CHART_HOUSE,
      dashed: true,
    });

    const athleteSeries = athletes.map((athlete) => ({
      key: `u${athlete.userId}`,
      values: pointsOnAxis(axis, athlete.byDate, mode),
    }));

    const houseValues = axis.map((_, index) =>
      mean(
        pack
          .map((athlete) => athleteSeries.find((item) => item.key === `u${athlete.userId}`)?.values[index])
          .filter((value): value is number => value != null && value > 0)
      )
    );

    return {
      data: compactTrendRows(axis, [...athleteSeries, { key: 'house', values: houseValues }]),
      lines: series,
    };
  }, [athletes, axis, highlightUserId, mode, pack]);

  if (data.length === 0) return null;

  return (
    <div className="glass-card mb-4 p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-black uppercase tracking-[0.16em] text-[#e8c547]">
          Weight lifted
        </h3>
        <div className="ml-auto grid grid-cols-2 gap-2">
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
        </div>
      </div>
      <p className="mb-4 text-base text-[#f6f1e3]/55">
        <span className="font-semibold text-[#e8c547]">Gold</span> is you.{' '}
        <span className="font-semibold text-[#c08457]">Copper dashed</span> is house avg, Test left out.
      </p>
      <WeightTrendChart data={data} lines={lines} height={240} />
    </div>
  );
}
