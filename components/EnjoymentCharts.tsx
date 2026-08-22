'use client';

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DAY_TYPE_ORDER, dayTypeShort, formatAvg, lowestDayTypeLine } from '@/lib/feedback';
import type { RatingStats } from '@/lib/ratings';

const tooltipStyle = {
  backgroundColor: 'rgba(12, 12, 16, 0.92)',
  border: '1px solid rgba(232, 197, 71, 0.35)',
  borderRadius: 12,
  color: '#f6f1e3',
};

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 text-xl font-black text-white">{title}</h3>
      {children}
    </div>
  );
}

function heatColor(avg: number) {
  const t = Math.max(0, Math.min(1, (avg - 1) / 4));
  return `rgba(232, 197, 71, ${0.18 + t * 0.82})`;
}

export default function EnjoymentCharts({
  stats,
  scope,
}: {
  stats: RatingStats;
  scope: 'personal' | 'household';
}) {
  if (!stats.overall.count) return null;

  const modeData = stats.modes.map((row) => ({
    name: row.mode === 'travel' ? 'Travel' : 'Gym',
    avg: Number(row.avg.toFixed(2)),
    count: row.count,
  }));
  const weekData = stats.weeks.map((row) => ({
    week: `Week ${row.week}`,
    avg: Number(row.avg.toFixed(2)),
    count: row.count,
  }));
  const dayData = stats.dayTypes.map((row) => ({
    name: dayTypeShort(row.type),
    avg: Number(row.avg.toFixed(2)),
    count: row.count,
  }));
  const outcomeData = stats.outcomes.map((row) => ({
    name: row.outcome === 'quit' ? 'Walked' : 'Finished',
    avg: Number(row.avg.toFixed(2)),
    count: row.count,
  }));
  const athleteData = stats.athletes.map((row) => ({
    name: row.name,
    avg: Number(row.avg.toFixed(2)),
    count: row.count,
  }));

  const heatWeeks = Array.from(new Set(stats.heatmap.map((cell) => cell.week))).sort((a, b) => a - b);
  const heatTypes = DAY_TYPE_ORDER.filter((type) => stats.heatmap.some((cell) => cell.type === type));
  const leak = lowestDayTypeLine(stats.dayTypes);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
          {scope === 'household' ? 'Household' : 'Your score'}
        </p>
        <p className="mt-2 text-5xl font-black text-[#f5d76e]">{formatAvg(stats.overall.avg)}</p>
        <p className="mt-1 text-sm text-[#f6f1e3]/55">{stats.overall.count} rated sessions</p>
        {leak ? <p className="mt-4 text-sm font-semibold text-[#e8c547]">{leak}</p> : null}
      </div>

      {scope === 'household' && athleteData.length > 0 ? (
        <ChartCard title="Per athlete">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={athleteData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#e8c547' }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#e8c547' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" fill="#e8c547" name="Average" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {modeData.length > 0 ? (
        <ChartCard title="Gym vs travel">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={modeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#e8c547' }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#e8c547' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" fill="#e8c547" name="Average" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {weekData.length > 0 ? (
        <ChartCard title="By week">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="week" tick={{ fill: '#e8c547' }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#e8c547' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#f6f1e3' }} />
              <Line type="monotone" dataKey="avg" stroke="#e8c547" strokeWidth={2} name="Average" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {dayData.length > 0 ? (
        <ChartCard title="Day type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#e8c547' }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#e8c547' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" fill="#e8c547" name="Average" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {outcomeData.length > 0 ? (
        <ChartCard title="Finished vs walked">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={outcomeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#e8c547' }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#e8c547' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" fill="#e8c547" name="Average" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {stats.heatmap.length > 0 && heatWeeks.length > 0 && heatTypes.length > 0 ? (
        <ChartCard title="Week × day">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold text-[#f6f1e3]/55">Week</th>
                  {heatTypes.map((type) => (
                    <th key={type} className="p-2 text-center font-semibold text-[#f6f1e3]/55">
                      {dayTypeShort(type)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatWeeks.map((week) => (
                  <tr key={week}>
                    <td className="p-2 font-black text-white">{week}</td>
                    {heatTypes.map((type) => {
                      const cell = stats.heatmap.find((item) => item.week === week && item.type === type);
                      return (
                        <td key={type} className="p-1">
                          {cell ? (
                            <div
                              className="rounded-lg px-2 py-3 text-center font-black text-[#1a1404]"
                              style={{ background: heatColor(cell.avg) }}
                              title={cell.count + ' rated'}
                            >
                              {formatAvg(cell.avg)}
                            </div>
                          ) : (
                            <div className="rounded-lg bg-white/5 px-2 py-3 text-center text-[#f6f1e3]/25">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      ) : null}
    </div>
  );
}
