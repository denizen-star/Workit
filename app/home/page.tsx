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
import {
  clampScheduleDays,
  daysForWeekFn,
  DEFAULT_SCHEDULE_DAYS,
  isScheduleDaysAskWeek,
} from '@/lib/scheduleDays';
import ScheduleDaysAskTakeover from '@/components/ScheduleDaysAskTakeover';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { setCoachVoiceEnabled, setSoundEnabled } from '@/lib/playChime';
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
import UpdateProfileGate from '@/components/UpdateProfileGate';
import QuickstartTakeover from '@/components/QuickstartTakeover';
import HyroxHome from '@/components/HyroxHome';
import HyroxIntroTakeover from '@/components/HyroxIntroTakeover';
import HyroxRewardBanner from '@/components/HyroxRewardBanner';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { pickResumeLine } from '@/lib/coachLines';
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
  const [userScheduleDays, setUserScheduleDays] = useState(DEFAULT_SCHEDULE_DAYS);
  const [userGender, setUserGender] = useState('male');
  // Persisted count from `locked_weeks` (server), not recomputed locally — a week
  // that already locked stays locked even if the athlete later changes their day
  // count. See lib/lockedWeeks.ts.
  const [lockedWeeks, setLockedWeeks] = useState(0);
  const [lockedWeeksDetail, setLockedWeeksDetail] = useState<
    Map<number, { requiredCount: number; completedCount: number }>
  >(new Map());
  const [scheduleDaysAskedWeek, setScheduleDaysAskedWeek] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [weekYou, setWeekYou] = useState<(WeekPodiumYou & { line: string; seen: boolean }) | null>(null);
  const [weekMiss, setWeekMiss] = useState<(WeekMissYou & { seen: boolean }) | null>(null);
  const [weekTakeover, setWeekTakeover] = useState(false);
  const [weekMissTakeover, setWeekMissTakeover] = useState(false);
  const [showScheduleDaysAsk, setShowScheduleDaysAsk] = useState(false);
  const [resumeLine, setResumeLine] = useState('');
  const [holdLine, setHoldLine] = useState('');
  const [needsWaiver, setNeedsWaiver] = useState(false);
  const [showQuickstartTakeover, setShowQuickstartTakeover] = useState(false);
  const [showHowBanner, setShowHowBanner] = useState(false);
  const [hyroxActive, setHyroxActive] = useState(false);
  const [hyroxEligibleFlag, setHyroxEligibleFlag] = useState(false);
  const [showHyroxIntro, setShowHyroxIntro] = useState(false);
  const [hyroxStartError, setHyroxStartError] = useState('');
  const [showHyroxBanner, setShowHyroxBanner] = useState(false);
  const [hyroxResumeFloor, setHyroxResumeFloor] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const loadShell = async () => {
      try {
        const [meRes, sessionsRes, catalogRes, hyroxRes] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/sessions'),
          fetch('/api/coach-catalog'),
          fetch('/api/hyrox'),
        ]);

        if (cancelled) return;

        let resolvedUserId: number | null = null;
        if (meRes.ok) {
          const meData = await meRes.json();
          resolvedUserId = meData.user?.id != null ? Number(meData.user.id) : null;
          setUserId(resolvedUserId);
          setUserName(meData.user?.callName || meData.user?.name || '');
          setUserEmail(meData.user?.email || '');
          setUserTone(normalizeCoachTone(meData.user?.coachTone));
          const soundOn = normalizeSoundOn(meData.user?.soundOn);
          setUserSoundOn(soundOn);
          setSoundEnabled(soundOn);
          setCoachVoiceEnabled(normalizeSoundOn(meData.user?.coachVoiceOn));
          setUserRestExtraMinutes(normalizeRestExtraMinutes(meData.user?.restExtraMinutes));
          setUserScheduleDays(clampScheduleDays(meData.user?.scheduleDaysPerWeek));
          setUserGender(meData.user?.gender || 'male');
          setScheduleDaysAskedWeek(
            meData.user?.scheduleDaysAskedWeek == null ? null : Number(meData.user.scheduleDaysAskedWeek)
          );
          setIsAdmin(!!meData.user?.isAdmin);
          setNeedsWaiver(meData.user?.waiverAccepted === false);
          setShowQuickstartTakeover(meData.user?.quickstartSeen === false);
          setShowHowBanner(Number(meData.completedWorkouts || 0) < 5);
        }

        if (sessionsRes.ok) {
          const sessionData = await sessionsRes.json();
          setSessions(sessionData.sessions || []);
          setLockedWeeks(Number(sessionData.lockedWeeks || 0));
          setLockedWeeksDetail(
            new Map(
              (sessionData.lockedWeeksDetail || []).map(
                (row: { weekNumber: number; requiredCount: number; completedCount: number }) => [
                  row.weekNumber,
                  { requiredCount: row.requiredCount, completedCount: row.completedCount },
                ]
              )
            )
          );
        }

        if (catalogRes.ok) {
          hydrateCoachCatalog(await catalogRes.json());
        }

        if (hyroxRes.ok) {
          const hyroxData = await hyroxRes.json();
          setHyroxActive(Boolean(hyroxData.active));
          setHyroxEligibleFlag(Boolean(hyroxData.eligible));
          setHyroxResumeFloor(Number(hyroxData.resumeFloor) || 1);
          if (hyroxData.eligible && !hyroxData.active) {
            try {
              setShowHyroxBanner(!localStorage.getItem(`hyrox_banner_seen_${resolvedUserId ?? ''}`));
            } catch {
              // localStorage can throw in private browsing; just skip the one-time nudge.
            }
            // The "Hyrox Training" menu item on every other page can't open the
            // takeover directly (only Home has it mounted) — it instead navigates
            // here with ?hyrox=1, which this picks up on the resulting fresh mount.
            if (typeof window !== 'undefined' && window.location.search.includes('hyrox=1')) {
              setShowHyroxIntro(true);
              window.history.replaceState(null, '', '/home');
            }
          }
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
          const you = podium?.you as (WeekPodiumYou & { line: string; seen: boolean }) | null;
          const miss = podium?.miss as (WeekMissYou & { seen: boolean }) | null;
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
    if (userId == null || !weekYou || weekYou.seen) return;
    setWeekTakeover(true);
  }, [userId, weekYou]);

  useEffect(() => {
    if (userId == null || !weekMiss || weekMiss.seen || weekYou) return;
    setWeekMissTakeover(true);
  }, [userId, weekMiss, weekYou]);

  useEffect(() => {
    if (getTodayTarget(sessions, hyroxResumeFloor, daysForWeekFn(userScheduleDays)).type !== 'resume') {
      setResumeLine('');
      return;
    }
    setResumeLine(pickResumeLine(userTone, userName));
  }, [sessions, userTone, userName, hyroxResumeFloor, userScheduleDays]);

  useEffect(() => {
    const target = getTodayTarget(sessions, hyroxResumeFloor, daysForWeekFn(userScheduleDays));
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
  }, [sessions, hyroxResumeFloor, userScheduleDays]);

  const today = getTodayTarget(sessions, hyroxResumeFloor, daysForWeekFn(userScheduleDays));
  const todayWeekNumber = today.week?.weekNumber ?? null;

  useEffect(() => {
    if (userId == null || todayWeekNumber == null || hyroxActive) return;
    if (weekTakeover || weekMissTakeover) return;
    if (!isScheduleDaysAskWeek(todayWeekNumber)) return;
    if (scheduleDaysAskedWeek === todayWeekNumber) return;
    setShowScheduleDaysAsk(true);
  }, [userId, todayWeekNumber, hyroxActive, weekTakeover, weekMissTakeover, scheduleDaysAskedWeek]);

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

  if (hyroxActive) {
    return <HyroxHome userName={userName} userEmail={userEmail} userTone={userTone} isAdmin={isAdmin} />;
  }

  const startHyrox = async () => {
    setHyroxStartError('');
    try {
      const res = await fetch('/api/hyrox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (!res.ok) {
        setHyroxStartError("Couldn't start Hyrox Training — try again in a moment.");
        return;
      }
      setShowHyroxIntro(false);
      window.location.assign('/home');
    } catch {
      setHyroxStartError("Couldn't start Hyrox Training — try again in a moment.");
    }
  };

  const dismissHyroxBanner = () => {
    setShowHyroxBanner(false);
    try {
      if (userId != null) localStorage.setItem(`hyrox_banner_seen_${userId}`, '1');
    } catch {
      // Best-effort only.
    }
  };

  if (showHyroxIntro) {
    return (
      <HyroxIntroTakeover
        tone={userTone}
        name={userName}
        onStart={startHyrox}
        onCancel={() => setShowHyroxIntro(false)}
        error={hyroxStartError}
      />
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
              userScheduleDays={userScheduleDays}
              userGender={userGender}
              isAdmin={isAdmin}
              hyroxAvailable={hyroxEligibleFlag}
              onHyroxClick={() => setShowHyroxIntro(true)}
              onProfileSaved={(profile) => {
                setUserName(profile.name);
                setUserEmail(profile.email || '');
                setUserTone(profile.coachTone);
                setUserSoundOn(profile.soundOn);
                setSoundEnabled(profile.soundOn);
                setCoachVoiceEnabled(profile.coachVoiceOn);
                setUserRestExtraMinutes(profile.restExtraMinutes);
                setUserScheduleDays(profile.scheduleDaysPerWeek);
                setUserGender(profile.gender);
              }}
            />
          </div>
        </div>
      </header>

      {needsWaiver ? (
        <UpdateProfileGate onDone={() => setNeedsWaiver(false)} />
      ) : showQuickstartTakeover ? (
        <QuickstartTakeover
          onDone={() => {
            setShowQuickstartTakeover(false);
            fetch('/api/me', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quickstartSeen: true }),
            }).catch(() => {});
          }}
        />
      ) : null}
      <div className="container mx-auto px-4 py-8">
        {showHowBanner ? (
          <Link
            href="/quickstart"
            className="mb-6 block rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-3 text-sm font-black text-[#e8c547]"
          >
            How to use Work-It
          </Link>
        ) : null}
        {showHyroxBanner ? (
          <HyroxRewardBanner
            onClick={() => {
              dismissHyroxBanner();
              setShowHyroxIntro(true);
            }}
          />
        ) : hyroxEligibleFlag ? (
          <HyroxRewardBanner onClick={() => setShowHyroxIntro(true)} />
        ) : null}
        <div className="gold-hero p-6 sm:p-8">
          <div className="min-w-0">
          {weekYou ? (
            // Float, not a flex sibling: the medal only narrows the lines beside it,
            // so wrapped titles and the KPI row below still get the card's full width.
            <div className="float-right ml-4 mb-2 shrink-0">
              <WeekMedal place={weekYou.place} size="sm" caption="Last week" />
            </div>
          ) : null}
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
          <div className="clear-both" />
          </div>
          <HomeTodayKpis locked={today.type === 'hold'} />
        </div>

        <div className="mt-6 divide-y divide-white/10 [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0 [&>section:empty]:hidden">
          <section>
            <WeekLock
              week={today.week}
              sessions={sessions}
              scheduleDays={userScheduleDays}
              lockedRecord={today.week ? lockedWeeksDetail.get(today.week.weekNumber) : undefined}
            />
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
          tone={userTone}
          onClose={() => setWeekTakeover(false)}
        />
      ) : null}
      {weekMiss && !weekYou ? (
        <WeekMissTakeover
          open={weekMissTakeover}
          line={weekMiss.line}
          tone={userTone}
          onClose={() => setWeekMissTakeover(false)}
        />
      ) : null}
      <ScheduleDaysAskTakeover
        open={showScheduleDaysAsk}
        currentDays={userScheduleDays}
        onDone={(days) => {
          setShowScheduleDaysAsk(false);
          setUserScheduleDays(days);
          if (todayWeekNumber != null) setScheduleDaysAskedWeek(todayWeekNumber);
          fetch('/api/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduleDaysAskedWeek: todayWeekNumber,
              scheduleDaysPerWeek: days,
            }),
          }).catch(() => {});
        }}
      />
    </div>
  );
}
