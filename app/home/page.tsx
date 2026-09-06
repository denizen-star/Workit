'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Dumbbell, UserPlus } from 'lucide-react';
import HomeKpiLead, { HomeTodayKpis } from '@/components/HomeKpiLead';
import PerformanceDesk from '@/components/PerformanceDesk';
import AppMenu from '@/components/AppMenu';
import DailyWeightChart from '@/components/DailyWeightChart';
import WeekLock from '@/components/WeekLock';
import WeekPerformance from '@/components/WeekPerformance';
import YouVsLeader from '@/components/YouVsLeader';
import { estimateWorkoutSeconds, formatEstimateMinutes } from '@/lib/estimateDuration';
import { applyWorkoutMode } from '@/lib/workoutData';
import { getTodayTarget, homePerformanceFocus, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { setSoundEnabled } from '@/lib/playChime';
import { normalizeSoundOn } from '@/lib/soundPref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';
import { trackAction } from '@/lib/analytics';
import { isTestUserName } from '@/lib/householdUsers';
import { earliestKey } from '@/lib/chartTrend';
import { normalizeWorkoutMode } from '@/lib/workoutMode';
import { HelpTip } from '@/components/HelpSheet';
import {
  HOME_PERFORMANCE_HELP,
  HOME_TODAY_HELP,
  HOME_TROPHIES_HELP,
  HOME_YOU_VS_HELP,
} from '@/lib/helpCopy';
import InviteFriendModal from '@/components/InviteFriendModal';
import BeltChest from '@/components/BeltChest';
import { HomeFold } from '@/components/ScanCard';
import WeekMedal from '@/components/WeekMedal';
import WeekPodiumTakeover from '@/components/WeekPodiumTakeover';
import WeekMissTakeover from '@/components/WeekMissTakeover';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { pickResumeLine } from '@/lib/coachLines';
import { lockedWeekCount } from '@/lib/belts';
import {
  markWeekMissSeen,
  markWeekPodiumSeen,
  shouldShowWeekMissTakeover,
  shouldShowWeekPodiumTakeover,
} from '@/lib/weekPodiumSeen';
import { isWeekPlace, type WeekMissYou, type WeekPodiumYou } from '@/lib/weekPodium';

function shortDayName(name: string) {
  return name
    .replace(/^Upper Body /, 'Upper ')
    .replace(/^Lower Body /, 'Lower ');
}

function shortWeekDay(weekNumber?: number | null, dayName?: string | null) {
  if (weekNumber == null || !dayName) return '';
  return `W${weekNumber} - ${shortDayName(dayName)}`;
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
  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTone, setUserTone] = useState<CoachTone>('master');
  const [userSoundOn, setUserSoundOn] = useState(true);
  const [userRestExtraMinutes, setUserRestExtraMinutes] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [weekYou, setWeekYou] = useState<(WeekPodiumYou & { line: string }) | null>(null);
  const [weekMiss, setWeekMiss] = useState<WeekMissYou | null>(null);
  const [weekTakeover, setWeekTakeover] = useState(false);
  const [weekMissTakeover, setWeekMissTakeover] = useState(false);
  const [resumeLine, setResumeLine] = useState('');
  const [holdLine, setHoldLine] = useState('');

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
        const [statsRes, podiumRes] = await Promise.all([
          fetch('/api/stats?home=1'),
          fetch('/api/week-podium'),
        ]);
        if (cancelled) return;
        if (statsRes.ok) setStats(await statsRes.json());
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
    setResumeLine(pickResumeLine(userTone, userName));
  }, [sessions, userTone, userName]);

  useEffect(() => {
    const target = getTodayTarget(sessions);
    const typeName = target.day?.name;
    if (!typeName || target.type === 'hold' || target.type === 'done') {
      setHoldLine('');
      return;
    }
    let cancelled = false;
    fetch('/api/hold-line?type=' + encodeURIComponent(typeName))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setHoldLine(typeof data?.line === 'string' ? data.line : '');
      })
      .catch(() => {
        if (!cancelled) setHoldLine('');
      });
    return () => {
      cancelled = true;
    };
  }, [sessions]);

  const today = getTodayTarget(sessions);
  const homeFocus = homePerformanceFocus(today, sessions);
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

  const lockedWeeks = lockedWeekCount(sessions);
  const canInvite = !isTestUserName(userName);
  const inviteLinkClass =
    'inline-flex min-h-12 shrink-0 items-center gap-1.5 px-2 text-sm font-black text-[#e8c547] sm:min-h-14 sm:px-3 sm:text-base';
  const heroBtn =
    'inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-3 text-sm font-black sm:min-h-14 sm:px-5 sm:text-base';

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
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
          {today.type === 'hold' ? (
            <>
              <p className="flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
                Rest
                <HelpTip
                  label={HOME_TODAY_HELP.title}
                  title={HOME_TODAY_HELP.title}
                  lead={HOME_TODAY_HELP.lead}
                  bullets={HOME_TODAY_HELP.bullets}
                />
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Week {today.week?.weekNumber} locked
              </h2>
              <p className="mt-3 text-lg text-[#f6f1e3]/75">
                Week {(today.week?.weekNumber || 0) + 1} starts Monday.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <Link
                  href="/workout"
                  className={`${heroBtn} border border-[#e8c547]/50 text-[#e8c547]`}
                >
                  Select WO
                </Link>
                {canInvite && (
                  <button type="button" onClick={() => setInviteOpen(true)} className={inviteLinkClass}>
                    <UserPlus className="h-4 w-4" />
                    Invite
                  </button>
                )}
              </div>
            </>
          ) : today.type === 'done' ? (
            <>
              <p className="flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
                Program
                <HelpTip
                  label={HOME_TODAY_HELP.title}
                  title={HOME_TODAY_HELP.title}
                  lead={HOME_TODAY_HELP.lead}
                  bullets={HOME_TODAY_HELP.bullets}
                />
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                All 6 weeks complete
              </h2>
              <p className="mt-3 text-lg text-[#f6f1e3]/75">Open the list if you want to run a session again.</p>
              <div className="mt-6 flex items-center gap-2">
                <Link
                  href="/workout"
                  className={`${heroBtn} bg-[#e8c547] text-[#1a1404]`}
                >
                  Browse WO
                </Link>
                {canInvite && (
                  <button type="button" onClick={() => setInviteOpen(true)} className={inviteLinkClass}>
                    <UserPlus className="h-4 w-4" />
                    Invite
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
                {today.type === 'resume' ? 'Pick back up' : 'Today'}
                <HelpTip
                  label={HOME_TODAY_HELP.title}
                  title={HOME_TODAY_HELP.title}
                  lead={HOME_TODAY_HELP.lead}
                  bullets={HOME_TODAY_HELP.bullets}
                />
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
                {shortWeekDay(today.week?.weekNumber, today.day?.name)}
              </h2>
              <p className="mt-3 truncate text-lg text-[#f6f1e3]/75">
                {[today.day?.focus, todayEstimate ? `Est. ${todayEstimate}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {holdLine ? (
                <p className="mt-3 text-lg leading-relaxed text-[#f6f1e3]/90">{holdLine}</p>
              ) : null}
              {today.type === 'resume' && resumeLine && (
                <p className="mt-3 text-lg leading-relaxed text-[#f6f1e3]/90">{resumeLine}</p>
              )}
              <div className="mt-6 flex items-center gap-2">
                <Link
                  href={todayHref}
                  onClick={() =>
                    trackAction(today.type === 'resume' ? 'workout_resume' : 'workout_start', {
                      category: 'home',
                      cta_type: todayMode,
                    })
                  }
                  className={`${heroBtn} bg-[#e8c547] text-[#1a1404]`}
                >
                  {today.type === 'resume' ? 'Resume WO' : 'Start WO'}
                </Link>
                <Link
                  href="/workout"
                  className={`${heroBtn} border border-[#e8c547]/50 text-[#e8c547]`}
                >
                  Select WO
                </Link>
                {canInvite && (
                  <button type="button" onClick={() => setInviteOpen(true)} className={inviteLinkClass}>
                    <UserPlus className="h-4 w-4" />
                    Invite
                  </button>
                )}
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
            </>
          )}
            </div>
            {weekYou ? (
              <div className="shrink-0">
                <WeekMedal place={weekYou.place} size="sm" caption="Last week" />
              </div>
            ) : null}
          </div>
          <HomeTodayKpis locked={today.type === 'hold'} />
        </div>

        <div className="mt-6 divide-y divide-white/10 [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0 [&>section:empty]:hidden">
          <section>
            <WeekLock week={today.week} sessions={sessions} />
            <WeekPerformance week={today.week} />
            {stats?.daily && stats.daily.length > 0 ? (
              <div className="mt-6">
                <DailyWeightChart
                  dailyStats={stats.daily}
                  householdDaily={stats.household?.daily}
                  dailyHardness={stats.dailyHardness}
                  programStart={earliestCompletedDate(sessions)}
                />
              </div>
            ) : null}
          </section>

          <section>
            <HomeFold title="Your performance" help={HOME_PERFORMANCE_HELP}>
              <Suspense fallback={<p className="text-sm text-[#f6f1e3]/55">Loading your lifts...</p>}>
                <PerformanceDesk
                  variant="home"
                  focusWorkout={homeFocus.workoutType}
                  focusKind={homeFocus.kind}
                />
              </Suspense>
            </HomeFold>
          </section>

          <section>
            <HomeKpiLead weekNumber={today.week?.weekNumber} />
          </section>

          <section>
            <HomeFold title="Your trophies" trailing="See belts" help={HOME_TROPHIES_HELP}>
              <BeltChest lockedWeeks={lockedWeeks} hideHeading />
            </HomeFold>
          </section>

          {!isTestUserName(userName) ? (
            <section>
              <HomeFold title="You vs" help={HOME_YOU_VS_HELP}>
                <YouVsLeader userId={userId} />
              </HomeFold>
            </section>
          ) : null}
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
