'use client';

import { useState, useEffect, useMemo, Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { Dumbbell, UserPlus } from 'lucide-react';
import HomeKpiLead, { HomeTodayKpis, primeHomeBoard } from '@/components/HomeKpiLead';
import PerformanceDesk from '@/components/PerformanceDesk';
import AppMenu from '@/components/AppMenu';
import DailyWeightChart from '@/components/DailyWeightChart';
import WeekLock from '@/components/WeekLock';
import WeekPerformance from '@/components/WeekPerformance';
import YouVsLeader from '@/components/YouVsLeader';
import { estimateWorkoutSeconds, formatEstimateMinutes } from '@/lib/estimateDuration';
import { applyWorkoutMode } from '@/lib/workoutData';
import { homePerformanceFocus, mainProgramTarget, type WorkoutSessionRow } from '@/lib/nextWorkout';
import {
  DEFAULT_SCHEDULE_DAYS,
  isScheduleDaysAskWeek,
} from '@/lib/scheduleDays';
import ScheduleDaysAskTakeover from '@/components/ScheduleDaysAskTakeover';
import type { CoachTone } from '@/lib/coachTone';
import { setCoachVoiceEnabled, setSoundEnabled } from '@/lib/playChime';
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
import HyroxRewardBanner from '@/components/HyroxRewardBanner';
import DismissibleBanner from '@/components/DismissibleBanner';
import BodyWeightBanner from '@/components/BodyWeightBanner';
import { bodyWeightBannerDue } from '@/lib/bodyWeightShared';
import ProgramTrackHome from '@/components/ProgramTrackHome';
import ProgramIntroTakeover from '@/components/ProgramIntroTakeover';
import OverloadDiplomaTakeover from '@/components/OverloadDiplomaTakeover';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { pickResumeLine, pickWeek1StartCopy } from '@/lib/coachLines';
import { testDriveCountdown, testDriveTarget, type TestDriveState } from '@/lib/testDrive';
import TestDriveDoneHero, { type TestDriveDoneSummary } from '@/components/TestDriveDoneHero';
import { isWeekPlace, type WeekMissYou, type WeekPodiumYou } from '@/lib/weekPodium';
import { primeMe } from '@/lib/meClient';
import { MORE_PROGRAMS, programFromSearch, programLabel } from '@/lib/programUnlock';
import type { OptInTrack } from '@/lib/programTrack';
import type { MoreProgramState } from '@/components/AppMenu';
import { profileFromMe } from '@/lib/meProfile';

/** One More program's state on Home, from `GET /api/<track>`. Hyrox runs the moment
 * it's active; Overload waits for its Monday (`running`). */
type ProgramStatus = {
  eligible: boolean;
  active: boolean;
  running: boolean;
  bannerDue: boolean;
  daysUntilStart: number;
  unseenDiploma: { run: number; tier: number } | null;
};

function programStatusFrom(data: Record<string, unknown>): ProgramStatus {
  return {
    eligible: Boolean(data.eligible),
    active: Boolean(data.active),
    running: Boolean(data.running ?? data.active),
    bannerDue: Boolean(data.bannerDue),
    daysUntilStart: Number(data.daysUntilStart) || 0,
    unseenDiploma: (data.unseenDiploma as ProgramStatus['unseenDiploma']) ?? null,
  };
}

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
  return testDriveTarget(testDrive, sessions) ?? mainProgramTarget(sessions, resumeFloor, scheduleDays);
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
  // Weight on file — pre-fills the 6-week check-in (docs/plans/PLAN_BODY_WEIGHT.md).
  const [userWeightLb, setUserWeightLb] = useState<number | null>(null);
  // Missing-weight banner's "Add weight" bumps this; AppMenu opens Edit profile on Weight.
  const [weightEditSignal, setWeightEditSignal] = useState(0);
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
  // More programs (docs/plans/PLAN_MORE_PROGRAMS.md): GET /api/programs.
  const [programs, setPrograms] = useState<Partial<Record<OptInTrack, ProgramStatus>>>({});
  const [activeIntro, setActiveIntro] = useState<OptInTrack | null>(null);
  const [programStartError, setProgramStartError] = useState('');
  // Locked main weeks — the More programs menu's "N of 6 weeks locked" line (lib/programUnlock.ts).
  const [mainLockedWeeks, setMainLockedWeeks] = useState(0);
  // Where the 48-week program resumes after a Hyrox or Overload run (the later of the two).
  const [resumeFloor, setResumeFloor] = useState(1);
  // Test Drive (lib/testDrive.ts): before Week 1's Monday, plus the one-time Monday takeover.
  const [testDrive, setTestDrive] = useState<(TestDriveState & { summary: TestDriveDoneSummary | null }) | null>(null);
  const [week1Start, setWeek1Start] = useState(false);

  useEffect(() => {
    let cancelled = false;

    /** Home on open (GET /api/home): the top part paints the page; the rest (stats,
     * podium, performance board) is fetched at the same moment and fills in after.
     * Each part has its old route's shape; a part that failed is null and is skipped. */
    const fetchPart = (part: 'top' | 'rest') =>
      fetch(`/api/home?part=${part}`).then(async (res) => {
        // Admin blocked this account: the API already evicted the session.
        if (res.status === 403) {
          if ((await res.json().catch(() => null))?.blocked) window.location.replace('/blocked');
          return null;
        }
        return res.ok ? res.json() : null;
      });
    const restPromise = fetchPart('rest').catch(() => null);
    // The board widgets mount with the top half; they wait on this instead of fetching.
    primeHomeBoard(
      restPromise.then((rest) => (rest?.board ? (rest.board.hidden ? null : rest.board) : undefined))
    );

    const loadRest = async () => {
      const rest = await restPromise;
      if (cancelled || !rest) return;
      if (rest.stats) setStats(rest.stats);
      if (rest.podium) {
        const you = rest.podium.you as (WeekPodiumYou & { line: string; seen: boolean }) | null;
        const miss = rest.podium.miss as (WeekMissYou & { seen: boolean }) | null;
        setWeekYou(you && isWeekPlace(you.place) ? you : null);
        setWeekMiss(miss?.weekMonday && miss.line ? miss : null);
      }
    };

    const loadHome = async () => {
      try {
        const home = await fetchPart('top');
        if (cancelled || !home) return;

        // The menu reads the same profile; seed its cache so it doesn't fetch again.
        primeMe(home.me);

        const meData = home.me;
        if (meData?.user) {
          const profile = profileFromMe(meData.user);
          setUserId(profile.id);
          setUserName(profile.callName);
          setUserEmail(profile.email);
          setUserTone(profile.coachTone);
          setUserSoundOn(profile.soundOn);
          setSoundEnabled(profile.soundOn);
          setCoachVoiceEnabled(profile.coachVoiceOn);
          setUserRestExtraMinutes(profile.restExtraMinutes);
          setUserScheduleDays(profile.scheduleDaysPerWeek);
          setUserWeightLb(profile.bodyWeightLb);
          setUserGender(profile.gender);
          setScheduleDaysAskedWeek(
            meData.user?.scheduleDaysAskedWeek == null ? null : Number(meData.user.scheduleDaysAskedWeek)
          );
          setIsAdmin(profile.isAdmin);
          setNeedsWaiver(meData.user?.waiverAccepted === false);
          setShowQuickstartTakeover(meData.user?.quickstartSeen === false);
          setShowHowBanner(Number(meData.completedWorkouts || 0) < 5);
        }

        const sessionData = home.sessions;
        if (sessionData) {
          setSessions(sessionData.sessions || []);
          setResumeFloor(Number(sessionData.resumeFloor) || 1);
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

        if (home.catalog) hydrateCoachCatalog(home.catalog);

        // Both More programs.
        const loadedPrograms: Partial<Record<OptInTrack, ProgramStatus>> = {};
        if (home.programs) {
          setMainLockedWeeks(Number(home.programs.lockedWeeks) || 0);
          for (const { track } of MORE_PROGRAMS) {
            if (home.programs[track]) loadedPrograms[track] = programStatusFrom(home.programs[track]);
          }
        }
        setPrograms(loadedPrograms);
        // The More programs item on any other page can't open the intro directly (only
        // Home has it), so it navigates here with ?program=<track> (lib/programUnlock.ts).
        const handoff = typeof window !== 'undefined' ? programFromSearch(window.location.search) : null;
        if (handoff && loadedPrograms[handoff]?.eligible && !loadedPrograms[handoff]?.active) {
          setActiveIntro(handoff);
          window.history.replaceState(null, '', '/home');
        }

      } catch (error) {
        console.error('Error loading home:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHome();
    loadRest();
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

  const hyroxActive = Boolean(programs.hyrox?.active);

  useEffect(() => {
    if (userId == null || todayWeekNumber == null || hyroxActive) return;
    if (!isScheduleDaysAskWeek(todayWeekNumber)) return;
    if (scheduleDaysAskedWeek === todayWeekNumber) return;
    // Waits its turn behind any other takeover (Home's takeover queue below).
    setShowScheduleDaysAsk(true);
  }, [userId, todayWeekNumber, hyroxActive, scheduleDaysAskedWeek]);

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

  // A running More program replaces Home. One at a time, so the first one found is it.
  const runningTrack = MORE_PROGRAMS.find(({ track }) => programs[track]?.running)?.track ?? null;
  // An earned Overload diploma tier shows once, on whichever Home is up (tier 3
  // lands as the run closes, so normal Home has to show it too).
  const unseenDiploma = programs.overload?.unseenDiploma ?? null;
  const onNormalHome = !runningTrack;

  /** Home's takeovers, highest priority first. Only the first one that's due shows;
   * closing it lets the next one through. Each keeps its own "seen" rule (server-marked
   * on delivery, or saved when the athlete answers). */
  const takeovers: { key: string; due: boolean; render: () => ReactNode }[] = [
    {
      key: 'overload-diploma',
      due: Boolean(unseenDiploma),
      render: () => (
        <OverloadDiplomaTakeover
          tier={unseenDiploma!.tier}
          tone={userTone}
          name={userName}
          onDone={() => {
            const { run, tier } = unseenDiploma!;
            setPrograms((current) =>
              current.overload ? { ...current, overload: { ...current.overload, unseenDiploma: null } } : current
            );
            fetch('/api/overload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'seen', run, tier }),
            }).catch(() => {});
          }}
        />
      ),
    },
    {
      key: 'waiver',
      due: onNormalHome && needsWaiver,
      render: () => <UpdateProfileGate onDone={() => setNeedsWaiver(false)} />,
    },
    {
      key: 'quickstart',
      due: onNormalHome && showQuickstartTakeover,
      render: () => (
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
      ),
    },
    {
      key: 'week-podium',
      due: onNormalHome && weekTakeover && Boolean(weekYou),
      render: () => (
        <WeekPodiumTakeover
          open
          place={weekYou!.place}
          line={weekYou!.line}
          tone={userTone}
          onClose={() => setWeekTakeover(false)}
        />
      ),
    },
    {
      key: 'week1-start',
      due: onNormalHome && week1Start && Boolean(week1Line),
      render: () => (
        <WeekMissTakeover
          open
          line={week1Line}
          tone={userTone}
          eyebrow="Test Drive · over"
          expression="celebratory"
          accent="#e8c547"
          onClose={() => setWeek1Start(false)}
        />
      ),
    },
    {
      key: 'week-miss',
      due: onNormalHome && weekMissTakeover && Boolean(weekMiss) && !weekYou,
      render: () => (
        <WeekMissTakeover open line={weekMiss!.line} tone={userTone} onClose={() => setWeekMissTakeover(false)} />
      ),
    },
    {
      key: 'schedule-days-ask',
      due: onNormalHome && showScheduleDaysAsk,
      render: () => (
        <ScheduleDaysAskTakeover
          open
          currentDays={userScheduleDays}
          currentWeightLb={userWeightLb}
          onDone={(days, weightLb) => {
            setShowScheduleDaysAsk(false);
            setUserScheduleDays(days);
            if (weightLb != null) setUserWeightLb(weightLb);
            if (todayWeekNumber != null) setScheduleDaysAskedWeek(todayWeekNumber);
            fetch('/api/me', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scheduleDaysAskedWeek: todayWeekNumber,
                scheduleDaysPerWeek: days,
                ...(weightLb != null ? { bodyWeightLb: weightLb } : {}),
              }),
            }).catch(() => {});
          }}
        />
      ),
    },
  ];
  const takeover = takeovers.find((item) => item.due) ?? null;

  if (runningTrack) {
    return (
      <>
        <ProgramTrackHome
          track={runningTrack}
          userName={userName}
          userEmail={userEmail}
          userTone={userTone}
          isAdmin={isAdmin}
          scheduleDays={userScheduleDays}
        />
        {takeover?.render()}
      </>
    );
  }

  // Opted in, waiting for its Monday (Overload): normal Home stays up, with a countdown
  // and a way out. While any program is active, the menu's More programs items hide.
  const waitingTrack = MORE_PROGRAMS.find(({ track }) => programs[track]?.active)?.track ?? null;
  const waiting = waitingTrack ? programs[waitingTrack] : undefined;
  const morePrograms = {
    lockedWeeks: mainLockedWeeks,
    states: Object.fromEntries(
      MORE_PROGRAMS.map(({ track }) => {
        const status = programs[track];
        const state: MoreProgramState = waitingTrack || !status ? null : status.eligible ? 'open' : 'locked';
        return [track, state];
      })
    ) as Record<OptInTrack, MoreProgramState>,
  };
  /** Banner up for this program: open, not joined, inside its 3-day window (lib/programBanner.ts). */
  const bannerShown = (track: OptInTrack) => !waitingTrack && Boolean(programs[track]?.bannerDue);

  const startProgram = async (track: OptInTrack) => {
    setProgramStartError('');
    const failed = `Couldn't start ${programLabel(track)}. Try again in a moment.`;
    try {
      const res = await fetch(`/api/${track}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (!res.ok) {
        const reason = await res.json().then((data) => data?.error).catch(() => null);
        setProgramStartError(reason || failed);
        return;
      }
      setActiveIntro(null);
      window.location.assign('/home');
    } catch {
      setProgramStartError(failed);
    }
  };

  const leaveProgram = async (track: OptInTrack) => {
    await fetch(`/api/${track}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'drop' }),
    }).catch(() => {});
    window.location.assign('/home');
  };

  /** A More programs banner was tapped or ✕'d: hide it now, and record it on the
   * account so it never shows again (lib/programBanner.ts). */
  const dismissBanner = (track: OptInTrack) => {
    setPrograms((current) => {
      const status = current[track];
      return status ? { ...current, [track]: { ...status, bannerDue: false } } : current;
    });
    fetch(`/api/${track}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bannerSeen' }),
    }).catch(() => {});
  };
  const openFromBanner = (track: OptInTrack) => {
    dismissBanner(track);
    setActiveIntro(track);
  };

  if (activeIntro) {
    return (
      <ProgramIntroTakeover
        track={activeIntro}
        tone={userTone}
        name={userName}
        onStart={() => startProgram(activeIntro)}
        onCancel={() => setActiveIntro(null)}
        error={programStartError}
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
              morePrograms={morePrograms}
              onProgramClick={setActiveIntro}
              activeProgram={waitingTrack}
              onLeaveProgram={waitingTrack ? () => leaveProgram(waitingTrack) : undefined}
              editWeightSignal={weightEditSignal}
              onProfileSaved={(profile) => {
                if (profile.bodyWeightLb !== undefined) setUserWeightLb(profile.bodyWeightLb);
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

      <div className="container mx-auto px-4 py-8">
        {showHowBanner ? (
          <Link
            href="/quickstart"
            className="mb-6 block rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-3 text-sm font-black text-[#e8c547]"
          >
            How to use Work-It
          </Link>
        ) : null}
        {waitingTrack && waiting ? (
          <div className="mb-6 rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-3">
            <p className="text-sm font-black text-[#e8c547]">
              {programLabel(waitingTrack)} starts Monday
              {waiting.daysUntilStart > 0
                ? ` · ${waiting.daysUntilStart} day${waiting.daysUntilStart === 1 ? '' : 's'}`
                : ''}
            </p>
            <p className="mt-1 text-xs text-[#f6f1e3]/75">Keep training your program until then.</p>
          </div>
        ) : null}
        {bannerShown('overload') ? (
          // 3 days after 6 locked main weeks, until tapped or ✕'d (lib/programBanner.ts);
          // after that the menu's More programs section is the way in.
          <DismissibleBanner onDismiss={() => dismissBanner('overload')}>
            <button
              type="button"
              onClick={() => openFromBanner('overload')}
              className="block w-full rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-3 pr-10 text-left"
            >
              <p className="text-sm font-black text-[#e8c547]">Overload Progressions is open</p>
              <p className="mt-1 text-xs text-[#f6f1e3]/75">
                You locked 6 weeks. Six weeks of more weight, starting Monday. See what it is.
              </p>
            </button>
          </DismissibleBanner>
        ) : null}
        {bannerShown('hyrox') ? (
          <HyroxRewardBanner onClick={() => openFromBanner('hyrox')} onDismiss={() => dismissBanner('hyrox')} />
        ) : null}
        {bodyWeightBannerDue(userWeightLb, sessions) ? (
          <BodyWeightBanner onAdd={() => setWeightEditSignal((n) => n + 1)} />
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
      {takeover?.render()}
    </div>
  );
}
