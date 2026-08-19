'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, TrendingUp, Award, Calendar, Activity, Clock, Hourglass, Timer } from 'lucide-react';
import BadgeDisplay from '@/components/BadgeDisplay';
import ProgressCharts from '@/components/ProgressCharts';
import { formatDuration } from '@/lib/formatDuration';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, badgesRes] = await Promise.all([
        fetch('/api/stats?userId=1'),
        fetch('/api/badges?userId=1')
      ]);

      if (statsRes.ok && badgesRes.ok) {
        const statsData = await statsRes.json();
        const badgesData = await badgesRes.json();
        setStats(statsData);
        setBadges(badgesData);

        // Calculate current week based on completed workouts
        const lastCompletedWeek = statsData.weekly.find((w: any) => w.completed_days > 0)?.week_number || 1;
        setCurrentWeek(lastCompletedWeek);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Work-It Tracker</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">6-Week Program</span>
              <Link
                href="/workout"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Workout
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Workouts Completed</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {stats?.overall?.completed_workouts || 0}
            </p>
            <p className="text-sm text-gray-500">out of 24 total</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-700">Current Streak</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats?.currentStreak || 0} days
            </p>
            <p className="text-sm text-gray-500">Keep it going!</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-700">Total Weight Lifted</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(stats?.overall?.total_weight_lifted || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">lbs across all workouts</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-yellow-500" />
              <h3 className="font-semibold text-gray-700">Badges Earned</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-500">
              {badges?.earnedBadges?.length || 0}
            </p>
            <p className="text-sm text-gray-500">of {badges?.allBadges?.length || 0} total</p>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Weekly Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(week => {
              const weekData = stats?.weekly?.find((w: any) => w.week_number === week);
              const completed = weekData?.completed_days || 0;
              const total = 4;
              const percentage = (completed / total) * 100;
              const isCurrentWeek = week === currentWeek;

              return (
                <div
                  key={week}
                  className={`p-4 rounded-lg border-2 ${
                    isCurrentWeek ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Week {week}</h3>
                    <div className="text-2xl font-bold mb-2">
                      {completed}/{total}
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                        } transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {week === 2 && (
                      <p className="text-xs text-gray-500 mt-1">Travel Week</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              <h3 className="font-semibold text-gray-700">Last Workout</h3>
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {formatDuration(stats?.recentDurations?.[0]?.duration_seconds)}
            </p>
            <p className="text-sm text-gray-500">
              {stats?.recentDurations?.[0]
                ? `Week ${stats.recentDurations[0].week_number} · ${stats.recentDurations[0].workout_type}`
                : 'Complete a workout to start tracking'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Average Duration</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {formatDuration(stats?.timing?.avg_seconds)}
            </p>
            <p className="text-sm text-gray-500">across completed sessions</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Hourglass className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-700">Longest Session</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {formatDuration(stats?.timing?.max_seconds)}
            </p>
            <p className="text-sm text-gray-500">best time in the gym</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-emerald-600" />
              <h3 className="font-semibold text-gray-700">Total Training Time</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {formatDuration(stats?.timing?.total_seconds)}
            </p>
            <p className="text-sm text-gray-500">start to finish, all workouts</p>
          </div>
        </div>

        {stats?.recentDurations?.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Session Times</h2>
            <div className="space-y-3">
              {stats.recentDurations.map((session: any, index: number) => (
                <div
                  key={`${session.week_number}-${session.day_number}-${session.ended_at}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      Week {session.week_number} · {session.workout_type}
                    </p>
                    <p className="text-sm text-slate-500">
                      {session.started_at ? new Date(session.started_at).toLocaleString() : '—'}
                      {' → '}
                      {session.ended_at ? new Date(session.ended_at).toLocaleTimeString() : '—'}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">
                    {formatDuration(session.duration_seconds)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {stats?.daily && stats.daily.length > 0 && (
          <div className="mb-8">
            <ProgressCharts
              dailyStats={stats.daily}
              weeklyStats={stats.weekly || []}
            />
          </div>
        )}

        {/* Badges */}
        {badges && (
          <BadgeDisplay
            allBadges={badges.allBadges}
            earnedBadges={badges.earnedBadges}
          />
        )}

        {/* Program Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Program Information</h2>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold">4-Day Upper/Lower Split</h3>
            <p className="text-gray-700 mb-4">
              This 6-week program features an Upper / Lower / Rest / Upper / Lower weekly schedule,
              designed to balance high muscle retention with full recovery.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Day 1 (Monday):</strong> Upper Body A - Push Focus</li>
              <li><strong>Day 2 (Tuesday):</strong> Lower Body A - Quad & Glute Focus</li>
              <li><strong>Day 3 (Wednesday):</strong> Rest Day</li>
              <li><strong>Day 4 (Thursday):</strong> Upper Body B - Pull & Shoulder Focus</li>
              <li><strong>Day 5 (Friday):</strong> Lower Body B - Posterior Chain & Unilateral</li>
              <li><strong>Weekend:</strong> Active recovery (walking, yoga, swimming)</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Progressive Overload</h4>
              <p className="text-sm text-gray-700">
                <strong>Week 1:</strong> Adaptation - Use conservative weights<br />
                <strong>Week 2:</strong> Travel week with hotel-friendly exercises<br />
                <strong>Weeks 3-5:</strong> Building - Add 2.5-5 lbs or 1-2 reps per set<br />
                <strong>Week 6:</strong> Peak - Aim to match or beat Week 4 levels
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
