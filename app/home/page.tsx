'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
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
import YourPickIcon from '@/components/YourPickIcon';
import { isYourPickSlot, yourPickCurrentWeek, yourPickWeekAllowed } from '@/lib/yourPick';
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
import OverloadHome from '@/components/OverloadHome';
import OverloadIntroTakeover from '@/components/OverloadIntroTakeover';
import OverloadDiplomaTakeover from '@/components/OverloadDiplomaTakeover';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { pickResumeLine, pickWeek1StartCopy } from '@/lib/coachLines';
import { testDriveCountdown, testDriveTarget, type TestDriveState } from '@/lib/testDrive';
import TestDriveDoneHero, { type TestDriveDoneSummary } from '@/components/TestDriveDoneHero';
import { isWeekPlace, type WeekMissYou, type WeekPodiumYou } from '@/lib/weekPodium';

function shortDayName(name: string) {
  return name
    .replace(/^Upper Body /, 'Upper ')
    .replace(/^Lower Body /, 'Lower ');
}

function shortWeekDay(weekNumber?: number | null, dayName?: string | null) {
  if (weekNumber == null || !dayName) return '';
  // Test Drive (week 0) has no program week to show — its day name already says Test Drive.
  if (weekNumber === 0) return dayName;
  return `W${weekNumber} - ${shortDayName(dayName)}`;
}


/** Home's "today": a Test Drive start/resume while one is on (lib/testDrive.ts), else the program's. */
function homeTarget(
  sessions: WorkoutSessionRow[],
  testDrive: TestDriveState | null,
  resumeFloor: number,
  scheduleDays: number
) {
  return testDriveTarget(testDrive, sessions) ?? getTodayTarget(sessions, resumeFloor, daysForWeekFn(scheduleDays));
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
  // Where the 48-week program resumes after a Hyrox or Overload run (the later of the two).
  const [resumeFloor, setResumeFloor] = useState(1);
  // Overload Progressions (docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md): GET /api/overload.
  const [overload, setOverload] = useState<{
    eligible: boolean;
    active: boolean;
    running: boolean;
    daysUntilStart: number;
    unseenDiploma: { run: number; tier: number } | null;
  } | null>(null);
  const [showOverloadIntro, setShowOverloadIntro] = useState(false);
  const [overloadStartError, setOverloadStartError] = useState('');
  // Test Drive (lib/testDrive.ts): before Week 1's Monday, plus the one-time Monday takeover.
  const [testDrive, setTestDrive] = useState<(TestDriveState & { summary: TestDriveDoneSummary | null }) | null>(null);
  const [week1Start, setWeek1Start] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadShell = async () => {
      try {
        const [meRes, sessionsRes, catalogRes, hyroxRes, overloadRes] = await Promise.all([
          fetch('/api/me'),
          fetch('/api/sessions?home=1'),
          fetch('/api/coach-catalog'),
          fetch('/api/hyrox'),
          fetch('/api/overload'),
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
          setTestDrive(sessionData.testDrive || null);
          setWeek1Start(Boolean(sessionData.week1Start));
          // Quickstart shows on every Home open until Week 1's Monday during a Test Drive.
          if (sessionData.testDrive?.active) setShowQuickstartTakeover(true);
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
          setResumeFloor((floor) => Math.max(floor, Number(hyroxData.resumeFloor) || 1));
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

        if (overloadRes.ok) {
          const overloadData = await overloadRes.json();
          setOverload({
            eligible: Boolean(overloadData.eligible),
            active: Boolean(overloadData.active),
            running: Boolean(overloadData.running),
            daysUntilStart: Number(overloadData.daysUntilStart) || 0,
            unseenDiploma: overloadData.unseenDiploma ?? null,
          });
          // Its floor already folds in Hyrox's (lib/overloadState.ts `mainResumeFloor`).
          setResumeFloor((floor) => Math.max(floor, Number(overloadData.resumeFloor) || 1));
          // Same menu hand-off as ?hyrox=1 above, for the Overload Progressions item.
          if (
            overloadData.eligible &&
            !overloadData.active &&
            typeof window !== 'undefined' &&
            window.location.search.includes('overload=1')
          ) {
            setShowOverloadIntro(true);
            window.history.replaceState(null, '', '/home');
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
    if (homeTarget(sessions, testDrive, resumeFloor, userScheduleDays).type !== 'resume') {
      setResumeLine('');
      return;
    }
    setResumeLine(pickResumeLine(userTone, userName));
  }, [sessions, testDrive, userTone, userName, resumeFloor, userScheduleDays]);

  const week1Line = useMemo(() => {
    if (!week1Start) return '';
    const copy = pickWeek1StartCopy(userTone, userName);
    return `${copy.title}\n${copy.body}`;
  }, [week1Start, userTone, userName]);

  useEffect(() => {
    const target = homeTarget(sessions, testDrive, resumeFloor, userScheduleDays);
    const typeName = target.day?.name;
    // A Your pick slot has no fixed workout yet, so there's no last-time line to hold.
    if (!typeName || target.type === 'hold' || target.type === 'done' || isYourPickSlot(target.day)) {
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
  }, [sessions, testDrive, resumeFloor, userScheduleDays]);

  const today = homeTarget(sessions, testDrive, resumeFloor, userScheduleDays);
  const testDriveOn = Boolean(testDrive?.active);
  const testDriveDone = testDriveOn && Boolean(testDrive?.allDone) && today.type !== 'resume';
  const todayWeekNumber = today.week?.weekNumber ?? null;

  useEffect(() => {
    if (userId == null || todayWeekNumber == null || hyroxActive) return;
    if (weekTakeover || weekMissTakeover) return;
    if (!isScheduleDaysAskWeek(todayWeekNumber)) return;
    if (scheduleDaysAskedWeek === todayWeekNumber) return;
    setShowScheduleDaysAsk(true);
  }, [userId, todayWeekNumber, hyroxActive, weekTakeover, weekMissTakeover, scheduleDaysAskedWeek]);

  const homeFocus = homePerformanceFocus(today, sessions);
  // Your pick (docs/plans/PLAN_YOUR_PICK.md): filed under the current week when that
  // week can still take one. A 5-day athlete's open Your pick slot opens the picker
  // instead of starting a day directly.
  const pickWeek = yourPickCurrentWeek(sessions, lockedWeeksDetail.keys());
  // Your pick would file into Week 1, which waits for Monday during a Test Drive.
  const pickHref = !testDriveOn && yourPickWeekAllowed(pickWeek, sessions, lockedWeeksDetail.keys())
    ? `/workout?yourPick=${pickWeek}`
    : null;
  const todayHref =
    today.type === 'resume' && today.session
      ? `/workout?session=${today.session.id}`
      : today.type === 'start' && today.week && today.day
        ? isYourPickSlot(today.day)
          ? `/workout?yourPick=${today.week.weekNumber}`
          : `/workout?week=${today.week.weekNumber}&day=${today.day.dayNumber}`
        : '/workout';
  const todayMode =
    today.type === 'resume' && today.session
      ? normalizeWorkoutMode(today.session.workout_mode)
      : 'gym';
  const todayDay = today.day != null ? applyWorkoutMode(today.day, todayMode) : null;
  const todayEstimate =
    todayDay != null && !isYourPickSlot(todayDay) ? formatEstimateMinutes(estimateWorkoutSeconds(todayDay)) : null;
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

  // An earned Overload diploma tier shows once, on whichever Home is up (tier 3
  // lands as the run closes, so normal Home has to show it too).
  if (overload?.unseenDiploma) {
    const { run, tier } = overload.unseenDiploma;
    return (
      <OverloadDiplomaTakeover
        tier={tier}
        tone={userTone}
        name={userName}
        onDone={() => {
          setOverload((current) => (current ? { ...current, unseenDiploma: null } : current));
          fetch('/api/overload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'seen', run, tier }),
          }).catch(() => {});
        }}
      />
    );
  }

  if (hyroxActive) {
    return <HyroxHome userName={userName} userEmail={userEmail} userTone={userTone} isAdmin={isAdmin} />;
  }

  if (overload?.running) {
    return (
      <OverloadHome
        userName={userName}
        userEmail={userEmail}
        userTone={userTone}
        isAdmin={isAdmin}
        scheduleDays={userScheduleDays}
      />
    );
  }

  // Opted in, waiting for Monday: normal Home stays up, with a countdown and a way out.
  const overloadWaiting = Boolean(overload?.active && !overload.running);
  const overloadAvailable = Boolean(overload?.eligible && !overload.active);

  const startOverload = async () => {
    setOverloadStartError('');
    try {
      const res = await fetch('/api/overload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (!res.ok) {
        const reason = await res.json().then((data) => data?.error).catch(() => null);
        setOverloadStartError(reason || "Couldn't start Overload Progressions. Try again in a moment.");
        return;
      }
      setShowOverloadIntro(false);
      window.location.assign('/home');
    } catch {
      setOverloadStartError("Couldn't start Overload Progressions. Try again in a moment.");
    }
  };

  const leaveOverload = async () => {
    await fetch('/api/overload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'drop' }),
    }).catch(() => {});
    window.location.assign('/home');
  };

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

  if (showOverloadIntro) {
    return (
      <OverloadIntroTakeover
        tone={userTone}
        name={userName}
        onStart={startOverload}
        onCancel={() => setShowOverloadIntro(false)}
        error={overloadStartError}
      />
    );
  }

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
              hyroxAvailable={hyroxEligibleFlag && !overload?.active}
              onHyroxClick={() => setShowHyroxIntro(true)}
              overloadAvailable={overloadAvailable}
              onOverloadClick={() => setShowOverloadIntro(true)}
              overloadActive={overloadWaiting}
              onLeaveOverload={leaveOverload}
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
          countdown={testDrive?.active ? testDriveCountdown(testDrive) : undefined}
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
        {overloadWaiting ? (
          <div className="mb-6 rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-3">
            <p className="text-sm font-black text-[#e8c547]">
              Overload Progressions starts Monday
              {overload && overload.daysUntilStart > 0
                ? ` · ${overload.daysUntilStart} day${overload.daysUntilStart === 1 ? '' : 's'}`
                : ''}
            </p>
            <p className="mt-1 text-xs text-[#f6f1e3]/75">Keep training your program until then.</p>
          </div>
        ) : null}
        {overloadAvailable ? (
          // Appears once main-program week 6 is locked (lib/overloadState.ts `overloadEligible`).
          <button
            type="button"
            onClick={() => setShowOverloadIntro(true)}
            className="mb-6 block w-full rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-3 text-left"
          >
            <p className="text-sm font-black text-[#e8c547]">Overload Progressions is open</p>
            <p className="mt-1 text-xs text-[#f6f1e3]/75">
              You finished week 6. Six weeks of more weight, starting Monday. See what it is.
            </p>
          </button>
        ) : null}
        {overload?.active ? null : showHyroxBanner ? (
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
          {testDriveDone && testDrive ? (
            <TestDriveDoneHero daysUntilMonday={testDrive.daysUntilMonday} summary={testDrive.summary} />
          ) : today.type === 'hold' ? (
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
                {pickHref && (
                  <Link
                    href={pickHref}
                    className={inviteLinkClass}
                    aria-label="Your pick"
                  >
                    <YourPickIcon className="h-5 w-5 text-[#e8c547]" />
                    Pick
                  </Link>
                )}
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
              {testDriveOn && testDrive ? (
                <p className="mt-3 text-lg font-black text-[#e8c547]">{testDriveCountdown(testDrive)}</p>
              ) : null}
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
                {pickHref && (
                  <Link
                    href={pickHref}
                    className={inviteLinkClass}
                    aria-label="Your pick"
                  >
                    <YourPickIcon className="h-5 w-5 text-[#e8c547]" />
                    Pick
                  </Link>
                )}
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
            {/* No program week to lock yet during a Test Drive — Week 1 starts Monday. */}
            {!testDriveOn ? (
              <>
                <WeekLock
                  week={today.week}
                  sessions={sessions}
                  scheduleDays={userScheduleDays}
                  lockedRecord={today.week ? lockedWeeksDetail.get(today.week.weekNumber) : undefined}
                />
                <WeekPerformance week={today.week} />
              </>
            ) : null}
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
      {week1Line ? (
        <WeekMissTakeover
          open={week1Start}
          line={week1Line}
          tone={userTone}
          eyebrow="Test Drive · over"
          expression="celebratory"
          accent="#e8c547"
          onClose={() => setWeek1Start(false)}
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
