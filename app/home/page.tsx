'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, TrendingUp, Award, Calendar, Activity, Clock, Hourglass, Timer } from 'lucide-react';
import BadgeDisplay from '@/components/BadgeDisplay';
import HouseholdScoreboard from '@/components/HouseholdScoreboard';
import ProgressCharts from '@/components/ProgressCharts';
import AppMenu from '@/components/AppMenu';
import { formatDuration } from '@/lib/formatDuration';
import { estimateWorkoutSeconds, formatEstimateMinutes } from '@/lib/estimateDuration';
import { applyWorkoutMode } from '@/lib/workoutData';
import { getTodayTarget, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { normalizeWorkoutMode, workoutModeLabel } from '@/lib/workoutMode';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { setSoundEnabled } from '@/lib/playChime';
import { normalizeSoundOn } from '@/lib/soundPref';
import { trackAction } from '@/lib/analytics';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any>(null);
  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTone, setUserTone] = useState<CoachTone>('master');
  const [userSoundOn, setUserSoundOn] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meRes, statsRes, badgesRes, sessionsRes, catalogRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/stats'),
        fetch('/api/badges'),
        fetch('/api/sessions'),
        fetch('/api/coach-catalog'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUserName(meData.user?.name || '');
        setUserEmail(meData.user?.email || '');
        setUserTone(normalizeCoachTone(meData.user?.coachTone));
        const soundOn = normalizeSoundOn(meData.user?.soundOn);
        setUserSoundOn(soundOn);
        setSoundEnabled(soundOn);
        setIsAdmin(!!meData.user?.isAdmin);
      }

      if (statsRes.ok && badgesRes.ok) {
        const statsData = await statsRes.json();
        const badgesData = await badgesRes.json();
        setStats(statsData);
        setBadges(badgesData);

        const lastCompletedWeek = statsData.weekly.find((week: any) => week.completed_days > 0)?.week_number || 1;
        setCurrentWeek(lastCompletedWeek);
      }

      if (sessionsRes.ok) {
        const sessionData = await sessionsRes.json();
        setSessions(sessionData.sessions || []);
      }

      if (catalogRes.ok) {
        const catalog = await catalogRes.json();
        hydrateCoachCatalog(catalog);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = getTodayTarget(sessions);
  const todayHref =
    today.type === 'resume' && today.session
      ? `/workout?session=${today.session.id}`
      : today.type === 'start' && today.week && today.day
        ? `/workout?week=${today.week.weekNumber}&day=${today.day.dayNumber}`
        : '/workout';
  const todayMode =
    today.type === 'resume' && today.session
      ? normalizeWorkoutMode(today.session.workout_mode)
      : 'gym';
  const todayDay =
    today.day != null ? applyWorkoutMode(today.day, todayMode) : null;
  const todayEstimate =
    todayDay != null ? formatEstimateMinutes(estimateWorkoutSeconds(todayDay)) : null;
  const restartHref =
    today.type === 'resume' && today.week && today.day
      ? `/workout?week=${today.week.weekNumber}&day=${today.day.dayNumber}&restart=1`
      : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl font-black text-[#e8c547]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-[#e8c547]" />
              <h1 className="text-2xl font-black tracking-tight text-white">Work-It</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-[#f6f1e3]/65 sm:inline">6-Week Program</span>
              <AppMenu
                userName={userName}
                userEmail={userEmail}
                userTone={userTone}
                userSoundOn={userSoundOn}
                isAdmin={isAdmin}
                onProfileSaved={(profile) => {
                  setUserName(profile.name);
                  setUserEmail(profile.email || '');
                  setUserTone(profile.coachTone);
                  setUserSoundOn(profile.soundOn);
                  setSoundEnabled(profile.soundOn);
                }}
              />
              <Link
                href="/workout"
                className="min-h-11 rounded-2xl border border-[#e8c547]/50 px-3 py-2 text-sm font-black text-[#e8c547]"
              >
                Select
              </Link>
              <Link
                href={todayHref}
                onClick={() =>
                  trackAction(today.type === 'resume' ? 'workout_resume' : 'workout_start', {
                    category: 'home',
                    cta_type: todayMode,
                  })
                }
                className="min-h-11 rounded-2xl bg-[#e8c547] px-4 py-2 font-black text-[#1a1404]"
              >
                {today.type === 'resume' ? 'Resume' : 'Start'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="gold-hero mb-8 p-6 sm:p-8">
          {today.type === 'done' ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Program</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                All 6 weeks complete
              </h2>
              <p className="mt-3 text-lg text-[#f6f1e3]/75">Open the list if you want to run a session again.</p>
              <Link
                href="/workout"
                className="mt-6 inline-flex min-h-14 items-center rounded-2xl bg-[#e8c547] px-6 text-lg font-black text-[#1a1404]"
              >
                Browse workouts
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
                {today.type === 'resume' ? 'Pick back up' : 'Today'}
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
                Week {today.week?.weekNumber} · {today.day?.name}
              </h2>
              <p className="mt-3 text-lg text-[#f6f1e3]/75">{today.day?.focus}</p>
              {today.type === 'resume' && todayMode === 'travel' && (
                <p className="mt-2 text-sm font-semibold text-[#e8c547]">
                  {workoutModeLabel(todayMode)} · no equipment
                </p>
              )}
              {todayEstimate && (
                <p className="mt-3 text-sm font-semibold text-[#e8c547]">Est. session {todayEstimate}</p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={todayHref}
                  onClick={() =>
                    trackAction(today.type === 'resume' ? 'workout_resume' : 'workout_start', {
                      category: 'home',
                      cta_type: todayMode,
                    })
                  }
                  className="inline-flex min-h-14 items-center rounded-2xl bg-[#e8c547] px-6 text-lg font-black text-[#1a1404]"
                >
                  {today.type === 'resume' ? 'Resume Workout' : 'Start Workout'}
                </Link>
                <Link
                  href="/workout"
                  className="inline-flex min-h-14 items-center rounded-2xl border border-[#e8c547]/50 px-6 text-lg font-black text-[#e8c547]"
                >
                  Select Workout
                </Link>
                {restartHref && (
                  <Link
                    href={restartHref}
                    onClick={() => trackAction('workout_restart', { category: 'home' })}
                    className="inline-flex min-h-14 items-center rounded-2xl border border-white/15 px-6 text-lg font-black text-[#f6f1e3]/80"
                  >
                    Restart
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Workouts Completed</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {stats?.overall?.completed_workouts || 0}
            </p>
            <p className="text-sm text-[#f6f1e3]/55">out of 24 total</p>
          </div>

          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Activity className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Current Streak</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {stats?.currentStreak || 0} days
            </p>
            <p className="text-sm text-[#f6f1e3]/55">Keep it going</p>
          </div>

          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Total Weight Lifted</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {Math.round(stats?.overall?.total_weight_lifted || 0).toLocaleString()}
            </p>
            <p className="text-sm text-[#f6f1e3]/55">lbs across all workouts</p>
          </div>

          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Award className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Badges Earned</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {badges?.earnedBadges?.length || 0}
            </p>
            <p className="text-sm text-[#f6f1e3]/55">of {badges?.allBadges?.length || 0} total</p>
          </div>
        </div>

        <HouseholdScoreboard />

        <div className="glass-card mb-8 p-6">
          <h2 className="mb-4 text-2xl font-black text-white">Weekly Progress</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((week) => {
              const weekData = stats?.weekly?.find((item: any) => item.week_number === week);
              const completed = weekData?.completed_days || 0;
              const total = 4;
              const percentage = (completed / total) * 100;
              const isCurrentWeek = week === (today.week?.weekNumber || currentWeek);

              return (
                <div
                  key={week}
                  className={`rounded-2xl border p-4 ${
                    isCurrentWeek ? 'border-[#e8c547] bg-[#e8c547]/10' : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="mb-2 font-semibold text-[#f6f1e3]/80">Week {week}</h3>
                    <div className="mb-2 text-2xl font-black text-[#f5d76e]">
                      {completed}/{total}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-[#e8c547] transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Clock className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Last Workout</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {formatDuration(stats?.recentDurations?.[0]?.duration_seconds)}
            </p>
            <p className="text-sm text-[#f6f1e3]/55">
              {stats?.recentDurations?.[0]
                ? `Week ${stats.recentDurations[0].week_number} · ${stats.recentDurations[0].workout_type}`
                : 'Complete a workout to start tracking'}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Timer className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Average Duration</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {formatDuration(stats?.timing?.avg_seconds)}
            </p>
            <p className="text-sm text-[#f6f1e3]/55">across completed sessions</p>
          </div>

          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Hourglass className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Longest Session</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {formatDuration(stats?.timing?.max_seconds)}
            </p>
            <p className="text-sm text-[#f6f1e3]/55">best time in the gym</p>
          </div>

          <div className="glass-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Clock className="h-6 w-6 text-[#e8c547]" />
              <h3 className="font-semibold text-[#f6f1e3]/80">Total Training Time</h3>
            </div>
            <p className="text-4xl font-black text-[#f5d76e]">
              {formatDuration(stats?.timing?.total_seconds)}
            </p>
            <p className="text-sm text-[#f6f1e3]/55">start to finish, all workouts</p>
          </div>
        </div>

        {stats?.recentDurations?.length > 0 && (
          <div className="glass-card mb-8 p-6">
            <h2 className="mb-4 text-2xl font-black text-white">Recent Session Times</h2>
            <div className="space-y-3">
              {stats.recentDurations.map((session: any, index: number) => (
                <div
                  key={`${session.week_number}-${session.day_number}-${session.ended_at}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">
                      Week {session.week_number} · {session.workout_type}
                    </p>
                    <p className="text-sm text-[#f6f1e3]/55">
                      {session.started_at ? new Date(session.started_at).toLocaleString() : '—'}
                      {' → '}
                      {session.ended_at ? new Date(session.ended_at).toLocaleTimeString() : '—'}
                    </p>
                  </div>
                  <p className="text-lg font-black text-[#e8c547]">
                    {formatDuration(session.duration_seconds)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats?.daily && stats.daily.length > 0 && (
          <div className="mb-8">
            <ProgressCharts
              dailyStats={stats.daily}
              weeklyStats={stats.weekly || []}
            />
          </div>
        )}

        {badges && (
          <BadgeDisplay
            allBadges={badges.allBadges}
            earnedBadges={badges.earnedBadges}
          />
        )}

        <div className="glass-card mt-8 p-6">
          <h2 className="mb-4 text-2xl font-black text-white">Program Information</h2>
          <h3 className="text-lg font-semibold text-[#e8c547]">4-Day Upper/Lower Split</h3>
          <p className="mb-4 text-[#f6f1e3]/75">
            This 6-week program features an Upper / Lower / Rest / Upper / Lower weekly schedule,
            designed to balance high muscle retention with full recovery.
          </p>
          <ul className="list-inside list-disc space-y-2 text-[#f6f1e3]/75">
            <li><strong className="text-white">Day 1 (Monday):</strong> Upper Body A - Push Focus</li>
            <li><strong className="text-white">Day 2 (Tuesday):</strong> Lower Body A - Quad & Glute Focus</li>
            <li><strong className="text-white">Day 3 (Wednesday):</strong> Rest Day</li>
            <li><strong className="text-white">Day 4 (Thursday):</strong> Upper Body B - Pull & Shoulder Focus</li>
            <li><strong className="text-white">Day 5 (Friday):</strong> Lower Body B - Posterior Chain & Unilateral</li>
            <li><strong className="text-white">Weekend:</strong> Active recovery (walking, yoga, swimming)</li>
          </ul>
          <div className="mt-4 rounded-2xl border border-[#e8c547]/20 bg-[#e8c547]/10 p-4">
            <h4 className="mb-2 font-semibold text-[#e8c547]">Progressive Overload</h4>
            <p className="text-sm text-[#f6f1e3]/80">
              <strong>Weeks 1-2:</strong> Adaptation - Use conservative weights<br />
              <strong>Weeks 3-5:</strong> Building - Add 2.5-5 lbs or 1-2 reps per set<br />
              <strong>Week 6:</strong> Peak - Aim to match or beat Week 4 levels<br />
              Any day can be Gym or Travel (no equipment). Home Start uses Gym.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
