'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
      {items.map((item) => (
        <p key={String(item.dataKey)} style={{ color: item.color || '#f6f1e3' }}>
          {item.name}: {Math.round(Number(item.value)).toLocaleString()} lb
        </p>
      ))}
    </div>
  );
}

/** Shared cream-you / copper-house line chart. Lift days only. */
export default function WeightTrendChart({
  data,
  lines,
  height = 200,
}: {
  data: TrendRow[];
  lines: TrendLine[];
  height?: number;
}) {
  const visible = lines.filter((line) => data.some((row) => hasWeight(row[line.key])));
  if (data.length === 0 || visible.length === 0) {
    return <p className="text-sm text-[#f6f1e3]/55">No sessions in this window.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" tick={{ fill: '#e8c547', fontSize: 13 }} />
        <YAxis
          tick={{ fill: '#e8c547', fontSize: 13 }}
          width={52}
          tickFormatter={(value) => Number(value).toLocaleString()}
        />
        <Tooltip content={<TrendTooltip />} filterNull />
        <Legend
          wrapperStyle={{ color: '#f6f1e3', fontSize: 14, paddingTop: 10 }}
          iconType="plainline"
        />
        {visible.map((line) => (
          <Line
            key={line.key}
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
      </LineChart>
    </ResponsiveContainer>
  );
}
