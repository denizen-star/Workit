'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendLine, TrendRow } from '@/lib/chartTrend';

const tooltipStyle = {
  backgroundColor: 'rgba(12, 12, 16, 0.92)',
  border: '1px solid rgba(232, 197, 71, 0.35)',
  borderRadius: 12,
  color: '#f6f1e3',
};

function hasWeight(value: unknown) {
  const amount = Number(value);
  return value != null && Number.isFinite(amount);
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: unknown; color?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload) return null;
  const items = payload.filter((item) => hasWeight(item.value));
  if (items.length === 0) return null;
  return (
    <div className="px-3 py-2 text-sm" style={tooltipStyle}>
      <p className="mb-1 font-semibold text-[#e8c547]">{label}</p>
      {items.map((item) => {
        const hard = item.name === 'Effort' || item.dataKey === 'hard';
        return (
          <p key={String(item.dataKey)} style={{ color: item.color || '#f6f1e3' }}>
            {item.name}:{' '}
            {hard
              ? Number(item.value).toFixed(1)
              : `${Math.round(Number(item.value)).toLocaleString()} lb`}
          </p>
        );
      })}
    </div>
  );
}

/** Shared cream-you / copper-house line chart. Lift days only. */
export default function WeightTrendChart({
  data,
  lines,
  height = 200,
  hardnessKey,
}: {
  data: TrendRow[];
  lines: TrendLine[];
  height?: number;
  hardnessKey?: string;
}) {
  const visible = lines.filter((line) => data.some((row) => hasWeight(row[line.key])));
  const hardKey = hardnessKey;
  const showHard = Boolean(hardKey && data.some((row) => hasWeight(row[hardKey])));
  if (data.length === 0 || visible.length === 0) {
    return <p className="text-sm text-[#f6f1e3]/55">No sessions in this window.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" tick={{ fill: '#e8c547', fontSize: 13 }} />
        <YAxis
          yAxisId="lb"
          tick={{ fill: '#e8c547', fontSize: 13 }}
          width={52}
          tickFormatter={(value) => Number(value).toLocaleString()}
        />
        {showHard ? (
          <YAxis
            yAxisId="hard"
            orientation="right"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fill: '#f6f1e3', fontSize: 12 }}
            width={28}
          />
        ) : null}
        <Tooltip content={<TrendTooltip />} filterNull />
        <Legend
          wrapperStyle={{ color: '#f6f1e3', fontSize: 14, paddingTop: 10 }}
          iconType="plainline"
        />
        {hardKey && showHard ? (
          <Area
            yAxisId="hard"
            type="monotone"
            dataKey={hardKey}
            name="Effort"
            fill="rgba(246, 241, 227, 0.22)"
            stroke="rgba(246, 241, 227, 0.35)"
            connectNulls
            isAnimationActive={false}
          />
        ) : null}
        {visible.map((line) => (
          <Line
            key={line.key}
            yAxisId="lb"
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.thick ? 3 : 1.75}
            strokeDasharray={line.dashed ? '6 4' : undefined}
            dot={line.thick ? { r: 3, fill: line.color } : { r: 2, fill: line.color }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
