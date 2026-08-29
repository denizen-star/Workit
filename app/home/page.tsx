'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import AthletePerformance from '@/components/AthletePerformance';
import AppMenu from '@/components/AppMenu';
import DailyWeightChart from '@/components/DailyWeightChart';
import FlagStrip from '@/components/FlagStrip';
import ScanCard from '@/components/ScanCard';
import WeekLock from '@/components/WeekLock';
import WeekPerformance from '@/components/WeekPerformance';
import YouVsLeader from '@/components/YouVsLeader';
import { estimateWorkoutSeconds, formatEstimateMinutes } from '@/lib/estimateDuration';
import { applyWorkoutMode } from '@/lib/workoutData';
import { getTodayTarget, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { setSoundEnabled } from '@/lib/playChime';
import { normalizeSoundOn } from '@/lib/soundPref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';
import { trackAction } from '@/lib/analytics';
import { isTestUserName } from '@/lib/householdUsers';
import { workoutDateKey } from '@/lib/statsHousehold';
import { normalizeWorkoutMode } from '@/lib/workoutMode';
import InviteFriendModal from '@/components/InviteFriendModal';

function formatCount(value: number | null | undefined) {
  return String(Math.round(Number(value || 0)));
}

function formatWeight(value: number | null | undefined) {
  return Math.round(Number(value || 0)).toLocaleString();
}

function lastDaysWeight(
  daily: { workout_date: string; total_weight_lifted: number | string }[] | undefined,
  days: number
) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  const startKey = workoutDateKey(start);
  return (daily || []).reduce((sum, row) => {
    const key = workoutDateKey(row.workout_date);
    if (!key || key < startKey) return sum;
    return sum + (parseFloat(String(row.total_weight_lifted)) || 0);
  }, 0);
}

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any>(null);
  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTone, setUserTone] = useState<CoachTone>('master');
  const [userSoundOn, setUserSoundOn] = useState(true);
  const [userRestExtraMinutes, setUserRestExtraMinutes] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [houseOpen, setHouseOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadShell = async () => {
      try {
        const [meRes, sessionsRes] = await Promise.all([fetch('/api/me'), fetch('/api/sessions')]);

        if (cancelled) return;

        if (meRes.ok) {
          const meData = await meRes.json();
          setUserId(meData.user?.id != null ? Number(meData.user.id) : null);
          setUserName(meData.user?.name || '');
          setUserEmail(meData.user?.email || '');
          setUserTone(normalizeCoachTone(meData.user?.coachTone));
          const soundOn = normalizeSoundOn(meData.user?.soundOn);
          setUserSoundOn(soundOn);
          setSoundEnabled(soundOn);
          setUserRestExtraMinutes(normalizeRestExtraMinutes(meData.user?.restExtraMinutes));
          setIsAdmin(!!meData.user?.isAdmin);
        }

        if (sessionsRes.ok) {
          const sessionData = await sessionsRes.json();
          setSessions(sessionData.sessions || []);
        }
      } catch (error) {
        console.error('Error loading home shell:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const [statsRes, badgesRes] = await Promise.all([
          fetch('/api/stats?home=1'),
          fetch('/api/badges'),
        ]);
        if (cancelled) return;
        if (statsRes.ok) setStats(await statsRes.json());
        if (badgesRes.ok) setBadges(await badgesRes.json());
      } catch (error) {
        console.error('Error loading home stats:', error);
      }
    };

    loadShell();
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

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
  const todayDay = today.day != null ? applyWorkoutMode(today.day, todayMode) : null;
  const todayEstimate =
    todayDay != null ? formatEstimateMinutes(estimateWorkoutSeconds(todayDay)) : null;
  const restartHref =
    today.type === 'resume' && today.week && today.day
      ? `/workout?week=${today.week.weekNumber}&day=${today.day.dayNumber}&restart=1`
      : null;

  const completed = Number(stats?.overall?.completed_workouts || 0);
  const allTime = Number(stats?.overall?.total_weight_lifted || 0);
  const last7 = lastDaysWeight(stats?.daily, 7);
  const last7Same = Math.round(last7) === Math.round(allTime) && allTime > 0;
  const canInvite = !isTestUserName(userName);
  const inviteLinkClass =
    'mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[#f6f1e3]/55';

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
            <AppMenu
              userName={userName}
              userEmail={userEmail}
              userTone={userTone}
              userSoundOn={userSoundOn}
              userRestExtraMinutes={userRestExtraMinutes}
              isAdmin={isAdmin}
              onProfileSaved={(profile) => {
                setUserName(profile.name);
                setUserEmail(profile.email || '');
                setUserTone(profile.coachTone);
                setUserSoundOn(profile.soundOn);
                setSoundEnabled(profile.soundOn);
                setUserRestExtraMinutes(profile.restExtraMinutes);
              }}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="gold-hero p-6 sm:p-8">
          {today.type === 'done' ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Program</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                All 6 weeks complete
              </h2>
              <p className="mt-3 text-lg text-[#f6f1e3]/75">Open the list if you want to run a session again.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/workout"
                  className="inline-flex min-h-14 items-center rounded-2xl bg-[#e8c547] px-6 text-lg font-black text-[#1a1404]"
                >
                  Browse workouts
                </Link>
              </div>
              {canInvite && (
                <button type="button" onClick={() => setInviteOpen(true)} className={inviteLinkClass}>
                  Invite a friend
                </button>
              )}
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
              {todayEstimate && (
                <p className="mt-3 text-base font-semibold text-[#e8c547]">Est. session {todayEstimate}</p>
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
              </div>
              {restartHref && (
                <Link
                  href={restartHref}
                  onClick={() => trackAction('workout_restart', { category: 'home' })}
                  className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[#f6f1e3]/55"
                >
                  Restart
                </Link>
              )}
              {canInvite && (
                <button type="button" onClick={() => setInviteOpen(true)} className={inviteLinkClass}>
                  Invite a friend
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-6 divide-y divide-white/10 [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0 [&>section:empty]:hidden">
          <section>
            <p className="mb-4 text-lg leading-relaxed text-[#f6f1e3]/90">
              {stats
                ? `${completed} of 24 days. ${formatWeight(allTime)} lb all-time.${
                    last7Same
                      ? ` Last 7 days is the same number — still week ${today.week?.weekNumber || 1}.`
                      : last7 > 0
                        ? ` Last 7 days ${formatWeight(last7)} lb.`
                        : ''
                  }`
                : 'Loading your numbers...'}
            </p>
            <WeekLock week={today.week} sessions={sessions} />
            <WeekPerformance week={today.week} />
          </section>

          {stats?.daily && stats.daily.length > 0 && (
            <section>
              <DailyWeightChart dailyStats={stats.daily} householdDaily={stats.household?.daily} />
            </section>
          )}

          {!isTestUserName(userName) && (
            <section>
              <YouVsLeader userId={userId} />
            </section>
          )}

          <section>
            <FlagStrip sessions={sessions} week={today.week} />
          </section>

          <section>
            <AthletePerformance variant="home" />
          </section>

          <section>
            <div className="glass-card overflow-hidden">
              <button
                type="button"
                onClick={() => setHouseOpen((current) => !current)}
                className="flex min-h-14 w-full items-center gap-3 px-5 py-4 text-left"
                aria-expanded={houseOpen}
              >
                <h2 className="text-base font-black uppercase tracking-[0.16em] text-[#e8c547]">You / house</h2>
                <span className="ml-auto truncate text-sm text-[#f6f1e3]/55">
                  {completed} · {formatWeight(allTime)} lb
                </span>
                {houseOpen ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-[#f6f1e3]/65" />
                )}
              </button>
              {houseOpen && (
                <div className="border-t border-white/10 px-5 pb-5 pt-4">
                  <ScanCard
                    you
                    roomy
                    title="You"
                    headline={`${formatWeight(allTime)} lb`}
                    sub={`${completed} of 24 days`}
                    metrics={[
                      {
                        label: 'Workouts',
                        value: `${formatCount(completed)} · house ${formatCount(stats?.household?.workoutsCompleted)}`,
                      },
                      {
                        label: 'Streak',
                        value: `${formatCount(stats?.currentStreak)} day · house ${formatCount(stats?.household?.currentStreak)}`,
                      },
                      {
                        label: 'Weight',
                        value: `${formatWeight(allTime)} · house ${formatWeight(stats?.household?.totalWeightLifted)}`,
                      },
                      {
                        label: 'Medals',
                        value: `${formatCount(badges?.earnedBadges?.length)}/${formatCount(badges?.allBadges?.length)} · house ${formatCount(stats?.household?.badgesEarned)}`,
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <InviteFriendModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
