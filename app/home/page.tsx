'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import AthletePerformance from '@/components/AthletePerformance';
import AppMenu from '@/components/AppMenu';
import DailyWeightChart from '@/components/DailyWeightChart';
import YouHouseCols from '@/components/YouHouseCols';
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
import { thisWeekWeight } from '@/lib/statsHousehold';
import { earliestKey } from '@/lib/chartTrend';
import { normalizeWorkoutMode } from '@/lib/workoutMode';
import InviteFriendModal from '@/components/InviteFriendModal';
import BeltChest from '@/components/BeltChest';
import WeekMedal from '@/components/WeekMedal';
import WeekPodiumTakeover from '@/components/WeekPodiumTakeover';
import WeekMissTakeover from '@/components/WeekMissTakeover';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { pickResumeLine } from '@/lib/coachLines';
import { aimingCopy, lockedWeekCount } from '@/lib/belts';
import {
  markWeekMissSeen,
  markWeekPodiumSeen,
  shouldShowWeekMissTakeover,
  shouldShowWeekPodiumTakeover,
} from '@/lib/weekPodiumSeen';
import { isWeekPlace, type WeekMissYou, type WeekPodiumYou } from '@/lib/weekPodium';

function formatCount(value: number | null | undefined) {
  return String(Math.round(Number(value || 0)));
}

function formatWeight(value: number | null | undefined) {
  return Math.round(Number(value || 0)).toLocaleString();
}


function earliestCompletedDate(sessions: WorkoutSessionRow[]) {
  return earliestKey(
    sessions
      .filter((session) => Boolean(Number(session.is_completed)))
      .map((session) => session.completed_at || session.started_at || session.created_at)
  );
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
  const [weekYou, setWeekYou] = useState<(WeekPodiumYou & { line: string }) | null>(null);
  const [weekMiss, setWeekMiss] = useState<WeekMissYou | null>(null);
  const [weekTakeover, setWeekTakeover] = useState(false);
  const [weekMissTakeover, setWeekMissTakeover] = useState(false);
  const [resumeLine, setResumeLine] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadShell = async () => {
      try {
        const [meRes, sessionsRes, catalogRes] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/sessions'),
          fetch('/api/coach-catalog'),
        ]);

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

        if (catalogRes.ok) {
          hydrateCoachCatalog(await catalogRes.json());
        }
      } catch (error) {
        console.error('Error loading home shell:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const [statsRes, badgesRes, podiumRes] = await Promise.all([
          fetch('/api/stats?home=1'),
          fetch('/api/badges'),
          fetch('/api/week-podium'),
        ]);
        if (cancelled) return;
        if (statsRes.ok) setStats(await statsRes.json());
        if (badgesRes.ok) setBadges(await badgesRes.json());
        if (podiumRes.ok) {
          const podium = await podiumRes.json();
          const you = podium?.you as (WeekPodiumYou & { line: string }) | null;
          const miss = podium?.miss as WeekMissYou | null;
          setWeekYou(you && isWeekPlace(you.place) ? you : null);
          setWeekMiss(miss?.weekMonday && miss.line ? miss : null);
        }
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

  useEffect(() => {
    if (userId == null || !weekYou) return;
    if (shouldShowWeekPodiumTakeover(userId, weekYou)) setWeekTakeover(true);
  }, [userId, weekYou]);

  useEffect(() => {
    if (userId == null || !weekMiss || weekYou) return;
    if (shouldShowWeekMissTakeover(userId, weekMiss)) setWeekMissTakeover(true);
  }, [userId, weekMiss, weekYou]);

  useEffect(() => {
    if (getTodayTarget(sessions).type !== 'resume') {
      setResumeLine('');
      return;
    }
    setResumeLine(pickResumeLine(userTone));
  }, [sessions, userTone]);

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
  const lockedWeeks = lockedWeekCount(sessions);
  const beltCopy = aimingCopy(lockedWeeks);
  const allTime = Number(stats?.overall?.total_weight_lifted || 0);
  const weekLbs = thisWeekWeight(stats?.daily);
  const weekLbsSame = Math.round(weekLbs) === Math.round(allTime) && allTime > 0;
  const canInvite = !isTestUserName(userName);
  const inviteLinkClass =
    'mt-3 inline-flex min-h-11 items-center gap-2 text-base font-black text-[#e8c547]';

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
        <div className={`gold-hero relative p-6 sm:p-8${weekYou ? ' pr-24 sm:pr-28' : ''}`}>
          {weekYou ? (
            <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
              <WeekMedal place={weekYou.place} size="sm" caption="Last week" />
            </div>
          ) : null}
          {today.type === 'hold' ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
                Rest
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Week {today.week?.weekNumber} locked
              </h2>
              <p className="mt-3 text-lg text-[#f6f1e3]/75">
                Week {(today.week?.weekNumber || 0) + 1} starts Monday.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/workout"
                  className="inline-flex min-h-14 items-center rounded-2xl border border-[#e8c547]/50 px-6 text-lg font-black text-[#e8c547]"
                >
                  Select Workout
                </Link>
              </div>
              {canInvite && (
                <button type="button" onClick={() => setInviteOpen(true)} className={inviteLinkClass}>
                  <UserPlus className="h-4 w-4" />
                  Invite a friend
                </button>
              )}
            </>
          ) : today.type === 'done' ? (
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
                  <UserPlus className="h-4 w-4" />
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
              {today.type === 'resume' && resumeLine && (
                <p className="mt-3 text-lg leading-relaxed text-[#f6f1e3]/90">{resumeLine}</p>
              )}
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
                  <UserPlus className="h-4 w-4" />
                  Invite a friend
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-6 divide-y divide-white/10 [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0 [&>section:empty]:hidden">
          <section>
            <p className="mb-3 text-lg leading-relaxed text-[#f6f1e3]/90">
              {stats
                ? `${beltCopy.line} ${formatWeight(allTime)} lb all-time.${
                    weekLbsSame
                      ? ` This week is the same number. Still week ${today.week?.weekNumber || 1}.`
                      : weekLbs > 0
                        ? ` This week ${formatWeight(weekLbs)} lb.`
                        : ' This week 0 lb.'
                  } ${completed} sessions done.`
                : 'Loading your numbers...'}
            </p>
            <BeltChest lockedWeeks={lockedWeeks} />
            <WeekLock week={today.week} sessions={sessions} />
            <WeekPerformance week={today.week} />
          </section>

          {stats?.daily && stats.daily.length > 0 && (
            <section>
              <DailyWeightChart
                dailyStats={stats.daily}
                householdDaily={stats.household?.daily}
                programStart={earliestCompletedDate(sessions)}
              />
            </section>
          )}

          {!isTestUserName(userName) && (
            <section>
              <YouVsLeader userId={userId} />
            </section>
          )}

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
                <h2 className="text-base font-black uppercase tracking-[0.16em] text-[#c08457]">You / house</h2>
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
                  <p className="text-base text-[#f6f1e3]/60">
                    All-time numbers. House is the average of people who finished a workout in the
                    last 7 days, including you. Not a pack total. Streak is locked weeks in a row
                    (any 4 finished days). Rest days do not break it.
                  </p>
                  <YouHouseCols
                    houseLabel="House avg"
                    rows={[
                      {
                        label: 'Workouts',
                        you: formatCount(completed),
                        house: formatCount(stats?.household?.workoutsCompleted),
                      },
                      {
                        label: 'Streak',
                        you: `${formatCount(stats?.currentStreak)} ${
                          Number(stats?.currentStreak || 0) === 1 ? 'week' : 'weeks'
                        }`,
                        house: `${formatCount(stats?.household?.currentStreak)} ${
                          Number(stats?.household?.currentStreak || 0) === 1 ? 'week' : 'weeks'
                        }`,
                      },
                      {
                        label: 'All-time lb',
                        you: `${formatWeight(allTime)} lb`,
                        house: `${formatWeight(stats?.household?.totalWeightLifted)} lb`,
                      },
                      {
                        label: 'Medals',
                        you: `${formatCount(badges?.earnedBadges?.length)}/${formatCount(badges?.allBadges?.length)}`,
                        house: formatCount(stats?.household?.badgesEarned),
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
      {weekYou ? (
        <WeekPodiumTakeover
          open={weekTakeover}
          place={weekYou.place}
          line={weekYou.line}
          onClose={() => {
            if (userId != null) markWeekPodiumSeen(userId, weekYou.weekMonday);
            setWeekTakeover(false);
          }}
        />
      ) : null}
      {weekMiss && !weekYou ? (
        <WeekMissTakeover
          open={weekMissTakeover}
          line={weekMiss.line}
          onClose={() => {
            if (userId != null) markWeekMissSeen(userId, weekMiss.weekMonday);
            setWeekMissTakeover(false);
          }}
        />
      ) : null}
    </div>
  );
}
