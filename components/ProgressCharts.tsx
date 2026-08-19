'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProgressChartsProps {
  dailyStats: any[];
  weeklyStats: any[];
}

export default function ProgressCharts({ dailyStats, weeklyStats }: ProgressChartsProps) {
  // Prepare daily weight data
  const dailyWeightData = dailyStats
    .slice(0, 14)
    .reverse()
    .map(stat => ({
      date: new Date(stat.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(stat.total_weight_lifted) || 0
    }));

  // Prepare weekly completion data
  const weeklyData = weeklyStats.map(stat => ({
    week: `Week ${stat.week_number}`,
    completed: stat.completed_days,
    total: 4,
    percentage: (stat.completed_days / 4) * 100
  }));

  return (
    <div className="space-y-6">
      {/* Daily Weight Lifted */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Daily Weight Lifted (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyWeightData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value: any) => `${Number(value).toFixed(0)} lbs`} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Weight Lifted"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Completion */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Weekly Workout Completion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 4]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#10b981" name="Completed Workouts" />
            <Bar dataKey="total" fill="#e5e7eb" name="Total Workouts" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
