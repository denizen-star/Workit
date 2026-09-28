'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_YOU } from '@/lib/chartTrend';

export type BodyWeightChartEntry = { weightLb: number; createdAt: string };
type Entry = BodyWeightChartEntry;
type Point = { t: number; lb: number };

const tooltipStyle = {
  backgroundColor: 'rgba(12, 12, 16, 0.92)',
  border: '1px solid rgba(232, 197, 71, 0.35)',
  borderRadius: 12,
  color: '#f6f1e3',
};

export function shortDate(t: number) {
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

export function formatLb(lb: number) {
  return `${Math.round(lb * 10) / 10} lb`;
}

function WeighInTooltip({ active, payload }: { active?: boolean; payload?: { payload?: Point }[] }) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="px-3 py-2 text-sm" style={tooltipStyle}>
      <p className="mb-1 font-semibold text-[#e8c547]">{shortDate(point.t)}</p>
      <p>{formatLb(point.lb)}</p>
    </div>
  );
}

/**
 * Body weight over time (docs/plans/PLAN_BODY_WEIGHT.md). One cream line (you), a dot
 * per weigh-in on a real time axis — weigh-ins are irregular, so even spacing would
 * misstate the gaps. Neutral on purpose: no up/down colour, no verdict. Display only;
 * BodyWeightHistory loads the entries and owns add/delete.
 */
export default function BodyWeightChart({ entries }: { entries: Entry[] }) {
  const points: Point[] = entries
    .map((entry) => ({ t: new Date(entry.createdAt).getTime(), lb: Number(entry.weightLb) }))
    .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.lb));
  if (points.length === 0) return null;

  const latest = points[points.length - 1];
  return (
    <div>
      <p className="text-sm text-[#f6f1e3]/70">
        <span className="text-2xl font-black text-[#f6f1e3]">{formatLb(latest.lb)}</span>{' '}
        · saved {shortDate(latest.t)} · {points.length} {points.length === 1 ? 'weigh-in' : 'weigh-ins'}
      </p>
      {points.length > 1 ? (
        <div className="mt-3">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={shortDate}
                tick={{ fill: '#e8c547', fontSize: 13 }}
              />
              <YAxis
                domain={[(min: number) => Math.floor(min - 5), (max: number) => Math.ceil(max + 5)]}
                tick={{ fill: '#e8c547', fontSize: 13 }}
                width={44}
              />
              <Tooltip content={<WeighInTooltip />} cursor={{ stroke: 'rgba(246,241,227,0.35)' }} />
              <Line
                type="linear"
                dataKey="lb"
                name="Body weight"
                stroke={CHART_YOU}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_YOU, stroke: '#07070a', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
