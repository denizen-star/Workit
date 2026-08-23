'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { workoutDateKey } from '@/lib/statsHousehold';

interface ProgressChartsProps {
  dailyStats: any[];
  weeklyStats: any[];
  householdDaily?: { workout_date: string; avg_weight: number }[];
  householdWeekly?: { week_number: number; avg_completed_days: number }[];
}

const tooltipStyle = {
  backgroundColor: 'rgba(12, 12, 16, 0.92)',
  border: '1px solid rgba(232, 197, 71, 0.35)',
  borderRadius: 12,
  color: '#f6f1e3',
};

export default function ProgressCharts({
  dailyStats,
  weeklyStats,
  householdDaily,
  householdWeekly,
}: ProgressChartsProps) {
  const householdWeightByDate = new Map(
    (householdDaily || []).map((row) => [workoutDateKey(row.workout_date), row.avg_weight])
  );
  const showHousehold = Boolean(householdDaily || householdWeekly);

  const dailyWeightData = dailyStats
    .slice(0, 14)
    .reverse()
    .map((stat) => ({
      date: new Date(stat.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(stat.total_weight_lifted) || 0,
      household: householdWeightByDate.get(workoutDateKey(stat.workout_date)) ?? null,
    }));

  const weeklyData = [1, 2, 3, 4, 5, 6].map((week) => {
    const stat = weeklyStats.find((item) => Number(item.week_number) === week);
    const household = householdWeekly?.find((item) => item.week_number === week);
    return {
      week: `Week ${week}`,
      completed: Math.min(4, Number(stat?.completed_days || 0)),
      total: 4,
      household: household ? Number(household.avg_completed_days) : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="mb-4 text-xl font-black text-white">Daily Weight Lifted (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyWeightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" tick={{ fill: '#e8c547' }} />
            <YAxis tick={{ fill: '#e8c547' }} label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', fill: '#e8c547' }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any) => (value == null ? '—' : `${Number(value).toFixed(0)} lbs`)}
            />
            <Legend wrapperStyle={{ color: '#f6f1e3' }} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#e8c547"
              strokeWidth={2}
              name="Weight Lifted"
              dot={{ r: 4, fill: '#f5d76e' }}
            />
            {showHousehold && (
              <Line
                type="monotone"
                dataKey="household"
                stroke="#f6f1e3"
                strokeWidth={2}
                name="Household avg"
                dot={{ r: 3, fill: '#f6f1e3' }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 text-xl font-black text-white">Weekly Workout Completion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="week" tick={{ fill: '#e8c547' }} />
            <YAxis domain={[0, 4]} tick={{ fill: '#e8c547' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: '#f6f1e3' }} />
            <Bar dataKey="completed" fill="#e8c547" name="Completed Workouts" />
            {showHousehold && (
              <Bar dataKey="household" fill="#f6f1e3" name="Household avg" />
            )}
            <Bar dataKey="total" fill="rgba(255,255,255,0.12)" name="Total Workouts" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
