'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AthletePerformanceBoard } from '@/lib/athletePerformanceTypes';
import { firstName } from '@/lib/scoreboardTypes';

const tooltipStyle = {
  backgroundColor: 'rgba(12, 12, 16, 0.92)',
  border: '1px solid rgba(232, 197, 71, 0.35)',
  borderRadius: 12,
  color: '#f6f1e3',
};

function shortName(name: string) {
  const words = name.split(/\s+/);
  if (words.length <= 3) return name;
  return words.slice(0, 3).join(' ') + '…';
}

export default function HardnessCharts({
  board,
  athleteName,
  section = 'all',
}: {
  board: AthletePerformanceBoard;
  athleteName?: string;
  /** `workout` / `lift` split the page; `all` is Home fold and Admin. */
  section?: 'all' | 'workout' | 'lift';
}) {
  const showWorkout = section !== 'lift';
  const showLift = section !== 'workout';
  const byWorkout = showWorkout
    ? board.workouts
        .filter((row) => row.perception != null)
        .map((row) => ({
          label: row.workoutType.replace(' Body ', ' '),
          hard: Number(row.perception),
        }))
    : [];
  const byLift = showLift
    ? board.exercises
        .filter((row) => row.perception != null)
        .sort((a, b) => (b.perception || 0) - (a.perception || 0))
        .slice(0, 12)
        .map((row) => ({
          label: shortName(row.name),
          hard: Number(row.perception),
        }))
    : [];

  if (byWorkout.length === 0 && byLift.length === 0) return null;

  const who = athleteName ? firstName(athleteName) : 'You';
  const title = section === 'lift' ? `Effort by lift · ${who}` : `Effort · ${who}`;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
        {title}
      </p>
      <p className="text-sm text-[#f6f1e3]/55">Effort 1–5. Easy through Max. Only logged sets count.</p>
      {byWorkout.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#f6f1e3]/70">By workout</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byWorkout}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" tick={{ fill: '#e8c547', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#f6f1e3', fontSize: 11 }} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hard" name="Effort" fill="#e8c547" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {byLift.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#f6f1e3]/70">By lift</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byLift} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: '#e8c547', fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={110} tick={{ fill: '#f6f1e3', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hard" name="Effort" fill="#e8c547" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function HouseholdHardnessCharts({
  rows,
}: {
  rows: {
    name: string;
    summary: { perception: number | null };
    workouts: AthletePerformanceBoard['workouts'];
    exercises: AthletePerformanceBoard['exercises'];
  }[];
}) {
  const byAthlete = rows
    .filter((row) => row.summary.perception != null)
    .map((row) => ({ label: firstName(row.name), hard: Number(row.summary.perception) }));

  const workoutMap = new Map<string, { sum: number; n: number }>();
  const liftMap = new Map<string, { sum: number; n: number }>();
  for (const row of rows) {
    for (const workout of row.workouts) {
      if (workout.perception == null) continue;
      const key = workout.workoutType.replace(' Body ', ' ');
      const current = workoutMap.get(key) || { sum: 0, n: 0 };
      workoutMap.set(key, { sum: current.sum + workout.perception, n: current.n + 1 });
    }
    for (const lift of row.exercises) {
      if (lift.perception == null) continue;
      const current = liftMap.get(lift.name) || { sum: 0, n: 0 };
      liftMap.set(lift.name, { sum: current.sum + lift.perception, n: current.n + 1 });
    }
  }
  const byWorkout = [...workoutMap.entries()].map(([label, row]) => ({
    label,
    hard: Math.round((row.sum / row.n) * 10) / 10,
  }));
  const byLift = [...liftMap.entries()]
    .map(([label, row]) => ({
      label: shortName(label),
      hard: Math.round((row.sum / row.n) * 10) / 10,
    }))
    .sort((a, b) => b.hard - a.hard)
    .slice(0, 12);

  if (byAthlete.length === 0 && byWorkout.length === 0 && byLift.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
        Effort · house
      </p>
      <p className="text-sm text-[#f6f1e3]/55">Effort 1–5 by athlete, workout, and lift. Test left out.</p>
      {byAthlete.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#f6f1e3]/70">By athlete</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byAthlete}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" tick={{ fill: '#e8c547', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#f6f1e3', fontSize: 11 }} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hard" name="Effort" fill="#e8c547" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {byWorkout.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#f6f1e3]/70">By workout</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byWorkout}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" tick={{ fill: '#e8c547', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#f6f1e3', fontSize: 11 }} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hard" name="Effort" fill="#e8c547" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {byLift.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#f6f1e3]/70">By lift</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byLift} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: '#e8c547', fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={110} tick={{ fill: '#f6f1e3', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hard" name="Effort" fill="#e8c547" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

