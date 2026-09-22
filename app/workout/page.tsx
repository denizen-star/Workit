'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Clock, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import {
  isBonusDay,
  restBetweenUppersCopy,
  shouldRestBetweenUppers,
  weekProgress,
  weekProgressLabel,
} from '@/lib/bonusDay';
import { applyWorkoutMode, workoutProgram } from '@/lib/workoutData';
import { hyroxDisplayWeek, hyroxProgram } from '@/lib/hyroxProgram';
import HyroxMilestoneTakeover from '@/components/HyroxMilestoneTakeover';
import { formatClock } from '@/lib/formatDuration';
import { estimateWorkoutSeconds, formatEstimateMinutes, REST_SECONDS } from '@/lib/estimateDuration';
import {
  defaultSelectWeek,
  findIncompleteSession,
  findLatestCompletedSession,
  isSessionComplete,
  type WorkoutSessionRow,
} from '@/lib/nextWorkout';
import { normalizeWorkoutMode, type WorkoutMode } from '@/lib/workoutMode';
import {
  athleteRequiredDays,
  athleteWeekDays,
  clampScheduleDays,
  daysForWeekFn,
  DEFAULT_SCHEDULE_DAYS,
  resolveFullBodyDay,
} from '@/lib/scheduleDays';
import CompletedSessionCard, { type HistorySession } from '@/components/CompletedSessionCard';
import { useWakeLock } from '@/lib/useWakeLock';
import { usePortraitLock } from '@/lib/usePortraitLock';
import ExerciseTracker, { type ExerciseTrackerHandle } from '@/components/ExerciseTracker';
import CompleteTakeover, { type TakeoverBadge, type TakeoverBelt } from '@/components/CompleteTakeover';
import AwardsTakeover from '@/components/AwardsTakeover';
import WorkoutRecapTakeover from '@/components/WorkoutRecapTakeover';
import FinishStepper from '@/components/FinishStepper';
import BonusPickModal from '@/components/BonusPickModal';
import OptionalCard from '@/components/OptionalCard';
import SessionTotalsBar from '@/components/SessionTotalsBar';
import ExitTakeover from '@/components/ExitTakeover';
import CoachBubble, { type CoachBubbleHandle } from '@/components/CoachBubble';
import Modal from '@/components/Modal';
import StarRating from '@/components/StarRating';
import { pickBonusCompleteLine, pickCompleteLine, pickExitLine, pickOptionalCompleteLine, pickReplenishLine, pickResumeLine, pickSessionStartCopy } from '@/lib/coachLines';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { playCompleteChime, playHorn, setSoundEnabled, unlockAudio } from '@/lib/playChime';
import { normalizeSoundOn } from '@/lib/soundPref';
import { normalizeRestExtraMinutes, restSecondsWithExtra } from '@/lib/restPref';
import { normalizeNoiseLevel, normalizeShowPrs, type NoiseLevel } from '@/lib/noisePref';
import ModeToggle from '@/components/ModeToggle';
import { trackAction } from '@/lib/analytics';
import { beltWashStyle, displayBelt } from '@/lib/belts';
import { bonusActivityType } from '@/lib/bonusActivity';
import { optionalRegionFromDay, sessionCooldownDone, sessionWarmupDone } from '@/lib/optionals';
import { recapExerciseRows, type CompareRow } from '@/lib/compareTable';
import type { WorkoutTrend } from '@/lib/athletePerformanceTypes';

function dayModeKey(weekNumber: number, dayNumber: number) {
  return `${weekNumber}-${dayNumber}`;
}

function WorkoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);
  const [lockedWeeksDetail, setLockedWeeksDetail] = useState<
    Map<number, { requiredCount: number; completedCount: number }>
  >(new Map());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [exitLine, setExitLine] = useState('');
  // True for one render after an existing session is opened — the effect below fires
  // the resume coach bubble once the live session (and its CoachBubble dock) is mounted.
  const [pendingResume, setPendingResume] = useState(false);
  // Same idea, for a brand-new session (not a resume) — the effect below fires the
  // welcome-to-the-workout coach bubble once the live session is mounted.
  const [pendingSessionStart, setPendingSessionStart] = useState(false);
  const coachBubbleRef = useRef<CoachBubbleHandle>(null);
  // Measured pixel height of the open rest-timer banner (0 when it's closed) — the coach
  // dock lifts by exactly this much so it never sits underneath that banner.
  const [restBannerLift, setRestBannerLift] = useState(0);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [restartTarget, setRestartTarget] = useState<{ weekNumber: number; dayNumber: number; sessionId?: number } | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completeStars, setCompleteStars] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [recapTitle, setRecapTitle] = useState('Workout');
  const [recapRows, setRecapRows] = useState<CompareRow[]>([]);
  const [completeLine, setCompleteLine] = useState('');
  const [replenishLine, setReplenishLine] = useState('');
  const [bonusFinish, setBonusFinish] = useState(false);
  const [bonusFinishCount, setBonusFinishCount] = useState(0);
  const [optionalFinishLbs, setOptionalFinishLbs] = useState(0);
  const [recapWarmup, setRecapWarmup] = useState(false);
  const [recapCooldown, setRecapCooldown] = useState(false);
  const [optionalKickerLbs, setOptionalKickerLbs] = useState(0);
  const [awardedBadges, setAwardedBadges] = useState<TakeoverBadge[]>([]);
  const [earnedBelt, setEarnedBelt] = useState<TakeoverBelt | null>(null);
  const [bonusPick, setBonusPick] = useState<{ weekNumber: number; dayNumber: number; mode: WorkoutMode } | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const cooldownRef = useRef<HTMLDivElement>(null);
  // Lets completeWorkout() wait out any in-flight exercise-complete celebration
  // before the Finish takeover stack (recap -> complete -> awards) starts mounting,
  // so the celebration is never cut off by a takeover landing on top of it.
  const exerciseTrackerRef = useRef<ExerciseTrackerHandle>(null);
  const [liftsDone, setLiftsDone] = useState(false);
  const autoOpened = useRef(false);
  const selectWeekInit = useRef(false);
  const [coachTone, setCoachTone] = useState<CoachTone>('master');
  const [athleteName, setAthleteName] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [scheduleDays, setScheduleDays] = useState(DEFAULT_SCHEDULE_DAYS);
  // Persisted count from `locked_weeks` (server), not recomputed locally — see
  // lib/lockedWeeks.ts.
  const [lockedWeeks, setLockedWeeks] = useState(0);
  const [restExtraMinutes, setRestExtraMinutes] = useState(0);
  const [noiseTakeover, setNoiseTakeover] = useState<NoiseLevel>('set');
  const [noiseEffort, setNoiseEffort] = useState<NoiseLevel>('set');
  const [showPrs, setShowPrs] = useState(true);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('gym');
  const [pickModes, setPickModes] = useState<Record<string, WorkoutMode>>({});
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
  const [sessionLbs, setSessionLbs] = useState(0);
  const [sessionEffort, setSessionEffort] = useState(0);
  const [sessionReps, setSessionReps] = useState(0);
  const [warmupLbs, setWarmupLbs] = useState(0);
  const [cooldownLbs, setCooldownLbs] = useState(0);
  const [priorAllTimeLbs, setPriorAllTimeLbs] = useState(0);
  const [priorAllTimeEffort, setPriorAllTimeEffort] = useState(0);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  // While a Hyrox run is active, this page operates entirely in Hyrox mode: the
  // Hyrox program feeds Select Workout + the live session, new sessions are tagged
  // program_track='hyrox', and the live session gets an inverted wash instead of belt.
  const [hyroxMode, setHyroxMode] = useState(false);
  // The session-resume effect must not run until this is known — resuming an open
  // Hyrox session (week 101+) while `program` still defaults to the normal
  // 48-week array would make getCurrentWorkout() return undefined and blank the page.
  const [hyroxLoaded, setHyroxLoaded] = useState(false);
  const [pendingHyroxMilestone, setPendingHyroxMilestone] = useState<{
    number: number;
    weekNumber: number;
    dayNumber: number;
  } | null>(null);
  const program = hyroxMode ? hyroxProgram : workoutProgram;

  useWakeLock(!!currentSession);
  usePortraitLock(!!currentSession);

  // Fold the week/focus header and Today/All-time bar into the sticky Exit/Restart
  // row on scroll down, freeing space for exercise cards; restore near the top.
  useEffect(() => {
    if (!currentSession) return;
    const onScroll = () => {
      setHeaderCollapsed((current) => {
        if (window.scrollY > 48) return true;
        if (window.scrollY < 12) return false;
        return current;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [currentSession]);

  useEffect(() => {
    Promise.all([
      fetch('/api/me').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/coach-catalog').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/hyrox').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([data, catalog, hyroxData]) => {
        setHyroxMode(Boolean(hyroxData?.active));
        setHyroxLoaded(true);
        if (data?.user) {
          setAthleteName(data.user.name || '');
          setCoachTone(normalizeCoachTone(data.user.coachTone));
          const enabled = normalizeSoundOn(data.user.soundOn);
          setSoundOn(enabled);
          setSoundEnabled(enabled);
          setRestExtraMinutes(normalizeRestExtraMinutes(data.user.restExtraMinutes));
          setNoiseTakeover(normalizeNoiseLevel(data.user.noiseTakeover));
          setNoiseEffort(normalizeNoiseLevel(data.user.noiseEffort));
          setShowPrs(normalizeShowPrs(data.user.showPrs));
          setScheduleDays(clampScheduleDays(data.user.scheduleDaysPerWeek));
          setUserGender(data.user.gender);
        }
        if (catalog) hydrateCoachCatalog(catalog);
      })
      .catch((error) => {
        console.error('Error loading workout prefs / coach catalog:', error);
        setHyroxLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!pendingResume) return;
    // The live session (and its CoachBubble dock) mounts in this same render, but the
    // dock's ref is only guaranteed attached once the browser has painted — a same-tick
    // announce() call can land before that and get silently dropped. Deferring one frame
    // guarantees the dock exists before it's asked to show anything. The pending flag is
    // cleared INSIDE the frame callback, not right after scheduling it — clearing it
    // synchronously here would re-render immediately, and that render's effect cleanup
    // (cancelAnimationFrame) would cancel the frame before it ever fires.
    const raf = window.requestAnimationFrame(() => {
      playHorn();
      try {
        navigator.vibrate?.([200, 80, 200]);
      } catch {
        // Vibration is not available on every phone.
      }
      coachBubbleRef.current?.announce({
        tone: coachTone,
        expression: 'welcome',
        kicker: 'Resume',
        title: 'Still open',
        body: pickResumeLine(coachTone, athleteName),
      });
      setPendingResume(false);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pendingResume, coachTone, athleteName]);

  useEffect(() => {
    if (!pendingSessionStart) return;
    // Same one-frame defer as the resume effect above, and the same reason the pending
    // flag is cleared inside the callback rather than right after scheduling it.
    const raf = window.requestAnimationFrame(() => {
      try {
        navigator.vibrate?.(60);
      } catch {
        // Vibration is not available on every phone.
      }
      const copy = pickSessionStartCopy(coachTone, athleteName);
      coachBubbleRef.current?.announce({
        tone: coachTone,
        expression: 'welcome',
        kicker: 'New session',
        title: copy.title,
        body: copy.body,
      });
      setPendingSessionStart(false);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pendingSessionStart, coachTone, athleteName]);

  useEffect(() => {
    if (!currentSession) {
      setSessionLbs(0);
      setSessionEffort(0);
      setSessionReps(0);
      setWarmupLbs(0);
      setCooldownLbs(0);
      setPriorAllTimeLbs(0);
      setPriorAllTimeEffort(0);
      setLiftsDone(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/stats?home=1&excludeSession=${currentSession}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setPriorAllTimeLbs(Number(data?.overall?.total_weight_lifted || 0));
          setPriorAllTimeEffort(Number(data?.overall?.total_effort_lifted || 0));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriorAllTimeLbs(0);
          setPriorAllTimeEffort(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentSession]);

  const handleLiftTotals = useCallback((totals: { lbs: number; reps: number; effort: number }) => {
    setSessionLbs(totals.lbs);
    setSessionEffort(totals.effort);
    setSessionReps(totals.reps);
  }, []);
  const handleWarmupLbs = useCallback((lbs: number) => setWarmupLbs(lbs), []);
  const handleCooldownLbs = useCallback((lbs: number) => setCooldownLbs(lbs), []);

  const askRestart = (weekNumber: number, dayNumber: number, sessionId?: number) => {
    setRestartTarget({ weekNumber, dayNumber, sessionId });
    setConfirmRestart(true);
  };

  useEffect(() => {
    if (!hyroxLoaded) return;
    loadSessions().then((rows) => {
      if (autoOpened.current) return;
      const sessionId = searchParams.get('session');
      const week = Number(searchParams.get('week') || '');
      const day = Number(searchParams.get('day') || '');
      const shouldRestart = searchParams.get('restart') === '1';

      if (shouldRestart && week && day) {
        autoOpened.current = true;
        setExpandedWeek(week);
        const open = findIncompleteSession(rows, week, day);
        askRestart(week, day, open ? Number(open.id) : undefined);
        return;
      }

      if (sessionId) {
        autoOpened.current = true;
        openExistingSession(rows, Number(sessionId));
        return;
      }

      if (week && day) {
        autoOpened.current = true;
        const alreadyDone = rows.some(
          (session) =>
            isSessionComplete(session) &&
            Number(session.week_number) === week &&
            Number(session.day_number) === day
        );
        const open = findIncompleteSession(rows, week, day);
        if (open || !alreadyDone) {
          startWorkout(week, day, rows, { mode: normalizeWorkoutMode(searchParams.get('mode')) });
        }
      }
    });
  }, [hyroxLoaded]);

  useEffect(() => {
    if (!startedAt) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const loadSessions = async () => {
    try {
      const [response, historyRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/sessions?history=1'),
      ]);
      if (response.ok) {
        const data = await response.json();
        const rows: WorkoutSessionRow[] = data.sessions || [];
        setSessions(rows);
        setLockedWeeks(Number(data.lockedWeeks || 0));
        setLockedWeeksDetail(
          new Map(
            (data.lockedWeeksDetail || []).map(
              (row: { weekNumber: number; requiredCount: number; completedCount: number }) => [
                row.weekNumber,
                { requiredCount: row.requiredCount, completedCount: row.completedCount },
              ]
            )
          )
        );
        setCompletedWorkouts(
          new Set(
            rows
              .filter(isSessionComplete)
              .map((session) => `${session.week_number}-${session.day_number}`)
          )
        );
        if (!selectWeekInit.current) {
          selectWeekInit.current = true;
          setExpandedWeek(defaultSelectWeek(rows, workoutProgram, 1, daysForWeekFn(scheduleDays)));
        }
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistorySessions(
            Array.isArray(historyData?.sessions) ? historyData.sessions : []
          );
        }
        return rows;
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    }
    return [] as WorkoutSessionRow[];
  };

  const openExistingSession = (rows: WorkoutSessionRow[], sessionId: number) => {
    const session = rows.find((item) => Number(item.id) === sessionId);
    if (!session) return;
    setCurrentSession(Number(session.id));
    setSelectedWeek(Number(session.week_number));
    setSelectedDay(Number(session.day_number));
    setWorkoutMode(normalizeWorkoutMode(session.workout_mode));
    const start = new Date(session.started_at || session.created_at || Date.now()).getTime();
    setStartedAt(start);
    setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    setPendingResume(true);
  };

  const startWorkout = async (
    weekNumber: number,
    dayNumber: number,
    knownSessions?: WorkoutSessionRow[],
    options?: { forceNew?: boolean; mode?: WorkoutMode; skipBonusPick?: boolean }
  ) => {
    try {
      const week = program.find((item) => item.weekNumber === weekNumber);
      // Full-body days (2-3 day/week athletes, dayNumber 6+) aren't in the static
      // program array — they're synthesized per-athlete (lib/scheduleDays.ts) —
      // so a plain array lookup always misses them. Without this fallback, this
      // silently no-ops: the athlete clicks Start and nothing happens.
      const day = week?.days.find((item) => item.dayNumber === dayNumber) ?? resolveFullBodyDay(weekNumber, dayNumber);
      if (!day) return;

      if (!options?.forceNew) {
        const open = findIncompleteSession(knownSessions || sessions, weekNumber, dayNumber);
        if (open) {
          trackAction('workout_resume', {
            category: 'workout',
            cta_type: normalizeWorkoutMode(open.workout_mode),
          });
          openExistingSession(knownSessions || sessions, Number(open.id));
          return;
        }
      }

      const mode = normalizeWorkoutMode(options?.mode);
      if (isBonusDay(day) && weekNumber >= 7 && !options?.skipBonusPick) {
        setBonusPick({ weekNumber, dayNumber, mode });
        return;
      }
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber,
          dayNumber,
          workoutType: day.name,
          workoutMode: mode,
          scheduledDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        trackAction('workout_start', { category: 'workout', cta_type: mode });
        trackAction('workout_mode', { category: 'workout', cta_type: mode });
        setCurrentSession(data.sessionId);
        setSelectedWeek(weekNumber);
        setSelectedDay(dayNumber);
        setWorkoutMode(mode);
        setStartedAt(Date.now());
        setElapsedSeconds(0);
        setPendingSessionStart(true);
        await loadSessions();
      } else {
        setErrorMessage('Could not start this workout. Try again in a moment.');
        setShowError(true);
      }
      } catch (error) {
      console.error('Error starting workout:', error);
      setErrorMessage('Could not start this workout. Try again in a moment.');
      setShowError(true);
    }
  };

  const loadWorkoutRecap = async (workoutType: string | null) => {
    const short = (workoutType || 'Workout').replace(' Body ', ' ');
    setRecapTitle(short);
    try {
      const data = await fetch('/api/athlete-performance?period=t-15').then((res) =>
        res.ok ? res.json() : null
      );
      const rows = (Array.isArray(data?.workouts) ? data.workouts : []) as WorkoutTrend[];
      const match = workoutType
        ? rows.find(
            (row) =>
              row.workoutType === workoutType ||
              row.workoutType.replace(' Body ', ' ') === workoutType.replace(' Body ', ' ')
          )
        : rows[0];
      setRecapRows(match ? recapExerciseRows(match.exercises || []) : []);
    } catch {
      setRecapRows([]);
    }
  };

  const leaveWorkout = () => {
    // Capture before the state it reads (selectedWeek/selectedDay) gets cleared below.
    const finishedMilestoneNumber = hyroxMode ? getCurrentWorkout()?.milestone ?? null : null;
    const finishedMilestone = finishedMilestoneNumber
      ? { number: finishedMilestoneNumber, weekNumber: selectedWeek, dayNumber: selectedDay as number }
      : null;
    setShowRecap(false);
    setShowSuccess(false);
    setShowAwards(false);
    setRecapRows([]);
    setBonusFinish(false);
    setBonusFinishCount(0);
    setOptionalFinishLbs(0);
    setRecapWarmup(false);
    setRecapCooldown(false);
    setOptionalKickerLbs(0);
    setAwardedBadges([]);
    setEarnedBelt(null);
    setCurrentSession(null);
    setSelectedDay(null);
    setStartedAt(null);
    if (finishedMilestone) {
      setPendingHyroxMilestone(finishedMilestone);
      return;
    }
    router.push('/home');
  };

  const resolveHyroxMilestone = async (result: { passed: boolean; leaveHyrox: boolean }) => {
    const milestone = pendingHyroxMilestone;
    if (!milestone) return;
    await fetch('/api/hyrox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'milestone', milestoneNumber: milestone.number, passed: result.passed }),
    }).catch(() => {});

    if (!result.passed && !result.leaveHyrox) {
      // Retry: the failed day is already saved is_completed=1, so findNextProgramDay
      // would otherwise skip right past it — force a fresh session for that exact day
      // instead of just sending them home and hoping they find "Do Again" themselves.
      setPendingHyroxMilestone(null);
      startWorkout(milestone.weekNumber, milestone.dayNumber, undefined, { forceNew: true });
      return;
    }

    if (result.leaveHyrox) {
      await fetch('/api/hyrox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drop' }),
      }).catch(() => {});
    }
    setPendingHyroxMilestone(null);
    router.push('/home');
  };

  const openCoachLine = () => {
    setShowRecap(false);
    setShowSuccess(true);
  };

  const openAwardsOrHome = () => {
    setShowSuccess(false);
    if (earnedBelt || awardedBadges.length > 0) {
      setShowAwards(true);
      return;
    }
    leaveWorkout();
  };

  const finishBonusActivity = async (label: string) => {
    if (!bonusPick) return;
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber: bonusPick.weekNumber,
          dayNumber: bonusPick.dayNumber,
          workoutType: bonusActivityType(label),
          workoutMode: bonusPick.mode,
          scheduledDate: new Date().toISOString().split('T')[0],
          complete: true,
        }),
      });
      if (!response.ok) {
        setErrorMessage('Could not save that bonus. Try again.');
        setShowError(true);
        return;
      }
      const data = await response.json().catch(() => ({}));
      setBonusPick(null);
      await loadSessions();
      setAwardedBadges(Array.isArray(data.awardedBadges) ? data.awardedBadges : []);
      setEarnedBelt(data.earnedBelt || null);
      setBonusFinish(true);
      setCompleteLine(pickBonusCompleteLine(coachTone, athleteName));
      setReplenishLine(pickReplenishLine());
      await loadWorkoutRecap(bonusActivityType(label));
      setShowRecap(true);
    } catch (error) {
      console.error('Error saving bonus activity:', error);
      setErrorMessage('Could not save that bonus. Try again.');
      setShowError(true);
    }
  };

  const restartWorkout = async () => {
    const weekNumber = restartTarget?.weekNumber ?? selectedWeek;
    const dayNumber = restartTarget?.dayNumber ?? selectedDay;

    if (dayNumber == null) {
      setConfirmRestart(false);
      setRestartTarget(null);
      return;
    }

    try {
      // Wipe in-progress session(s) for this day and return to Start — do not reopen
      const response = await fetch(
        `/api/sessions?resetDay=1&weekNumber=${weekNumber}&dayNumber=${dayNumber}${
          restartTarget?.sessionId ? `&sessionId=${restartTarget.sessionId}` : ''
        }`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        setErrorMessage('Could not restart the workout. Try again.');
        setShowError(true);
        return;
      }

      trackAction('workout_restart', { category: 'workout' });
      await loadSessions();
      setCurrentSession(null);
      setSelectedDay(null);
      setStartedAt(null);
      setElapsedSeconds(0);
      setConfirmRestart(false);
      setRestartTarget(null);
      setExpandedWeek(weekNumber);
      router.replace('/workout');
    } catch (error) {
      console.error('Error restarting workout:', error);
      setErrorMessage('Could not restart the workout. Try again.');
      setShowError(true);
    }
  };

  const saveSessionRating = async (stars: number, outcome: 'complete' | 'quit') => {
    if (!currentSession) return false;
    const response = await fetch('/api/session-ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession, stars, outcome }),
    });
    return response.ok;
  };

  const completeWorkout = async () => {
    if (!currentSession || completeStars == null) return;

    unlockAudio();
    playCompleteChime();

    // If the last set of the last exercise was just rated (or skipped and moved past),
    // its celebration animation may still be playing or about to start — give it the
    // full run before the Finish takeover stack (recap -> complete -> awards) begins
    // mounting, so the celebration is never interrupted or hidden underneath a takeover.
    await exerciseTrackerRef.current?.awaitPendingCelebration();

    try {
      const rated = await saveSessionRating(completeStars, 'complete');
      if (!rated) {
        setErrorMessage('Could not save your score. Try again.');
        setShowError(true);
        return;
      }

      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession,
          isCompleted: true,
        }),
      });

      if (!response.ok) {
        setErrorMessage('Could not save the completed workout. Try again.');
        setShowError(true);
        return;
      }

      const data = await response.json().catch(() => ({ awardedBadges: [] }));
      await loadSessions();
      setConfirmComplete(false);
      setCompleteStars(null);
      setAwardedBadges(Array.isArray(data.awardedBadges) ? data.awardedBadges : []);
      setEarnedBelt(data.earnedBelt || null);
      const finishedBonus = Boolean(data.bonus);
      setBonusFinish(finishedBonus);
      setBonusFinishCount(Number(data.bonusCount || 0));
      const optionalLbs = Number(data.optionalLbs || 0);
      const kickerLbs = Number(data.kickerLbs || 0);
      const finished = sessions.find((session) => Number(session.id) === currentSession);
      setOptionalFinishLbs(optionalLbs);
      setRecapWarmup(finished ? sessionWarmupDone(finished) : false);
      setRecapCooldown(finished ? sessionCooldownDone(finished) : false);
      setOptionalKickerLbs(kickerLbs);
      setCompleteLine(
        optionalLbs > 0
          ? pickOptionalCompleteLine(coachTone, athleteName)
          : finishedBonus
            ? pickBonusCompleteLine(coachTone, athleteName)
            : pickCompleteLine(coachTone, athleteName)
      );
      setReplenishLine(pickReplenishLine());
      await loadWorkoutRecap(getCurrentWorkout()?.name || null);
      setShowRecap(true);
    } catch (error) {
      console.error('Error completing workout:', error);
      setErrorMessage('Could not save the completed workout. Try again.');
      setShowError(true);
    }
  };

  const getCurrentWorkout = () => {
    const week = program.find((item) => item.weekNumber === selectedWeek);
    const found = week?.days.find((item) => item.dayNumber === selectedDay);
    // Same full-body fallback as startWorkout() above — without it, the live
    // session for a full-body day renders blank (`if (!workout) return null`
    // below reads as a dead page, not an error).
    return found ?? (selectedDay != null ? resolveFullBodyDay(selectedWeek, selectedDay) : undefined);
  };

  const pickedMode = (weekNumber: number, dayNumber: number, incomplete?: WorkoutSessionRow | null) => {
    if (incomplete) return normalizeWorkoutMode(incomplete.workout_mode);
    return pickModes[dayModeKey(weekNumber, dayNumber)] ?? 'gym';
  };

  // Post-finish sequence: star rating -> Recap -> Complete -> Awards. Awards
  // only shows when something was earned, so the stepper's total reflects
  // that instead of always counting a screen that may not appear.
  const finishTotalSteps = 3 + (earnedBelt || awardedBadges.length > 0 ? 1 : 0);

  if (currentSession && selectedDay) {
    const workout = getCurrentWorkout();
    if (!workout) return null;

    const wash = beltWashStyle(displayBelt(lockedWeeks, userGender));
    return (
      <div
        className={hyroxMode ? 'hyrox-session min-h-screen' : 'belt-session min-h-screen'}
        style={hyroxMode ? undefined : { background: wash.background, ['--belt-rgb' as string]: wash.rgb }}
      >
        <header className="glass-header sticky top-0 z-10" style={{ borderBottomColor: wash.borderColor }}>
          <div className="container mx-auto px-4 py-2.5 sm:py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex w-full items-center sm:w-auto sm:justify-start sm:gap-3">
                <button
                  type="button"
                  aria-label="Exit"
                  onClick={() => {
                    setExitLine(pickExitLine(coachTone, athleteName));
                    setConfirmExit(true);
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm font-bold text-[#f6f1e3]/75 hover:text-white sm:flex-none sm:justify-start sm:gap-2 sm:text-base sm:font-normal"
                >
                  <ArrowLeft className="h-5 w-5 shrink-0" />
                  Exit
                </button>
                <button
                  type="button"
                  aria-label="Restart"
                  onClick={() => {
                    if (currentSession && selectedDay != null) {
                      askRestart(selectedWeek, selectedDay, currentSession);
                    }
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm font-bold text-[#f6f1e3]/75 hover:text-white sm:flex-none sm:justify-start sm:gap-2 sm:text-base sm:font-normal"
                >
                  <RotateCcw className="h-5 w-5 shrink-0" />
                  Restart
                </button>
                <div className="flex flex-1 items-center justify-center sm:hidden">
                  <p className="inline-flex items-center gap-1 text-sm font-black tabular-nums text-[#e8c547]">
                    <Clock className="h-3.5 w-3.5" />
                    {formatClock(elapsedSeconds)}
                  </p>
                </div>
                <div className="flex flex-1 items-center justify-center sm:hidden">
                  <button
                    type="button"
                    aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
                    onClick={() => {
                      const next = !soundOn;
                      setSoundOn(next);
                      setSoundEnabled(next);
                      fetch('/api/me', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ soundOn: next }),
                      }).catch(() => {});
                    }}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/10 text-[#e8c547] hover:border-[#e8c547]/40"
                  >
                    {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {/* Week/focus fold away on scroll to free room for exercise cards; the
                  clock lives outside this block on desktop too, so it stays visible collapsed or not. */}
              <div
                className={`w-full overflow-hidden text-center transition-all duration-200 sm:flex-1 ${
                  headerCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
                }`}
              >
                <h1 className="text-lg font-black leading-tight text-[#f5d76e] sm:text-xl">
                  Week {hyroxMode ? hyroxDisplayWeek(selectedWeek) : selectedWeek} · Day {workout.dayNumber} · {workout.name}
                </h1>
                <p className="text-sm text-[#f6f1e3]/65">
                  {workout.focus}
                  {workoutMode === 'travel' ? ' · Travel' : ''}
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <p className="inline-flex items-center gap-1 text-sm font-black tabular-nums text-[#e8c547]">
                  <Clock className="h-3.5 w-3.5" />
                  {formatClock(elapsedSeconds)}
                </p>
                <button
                  type="button"
                  aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    setSoundEnabled(next);
                    fetch('/api/me', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ soundOn: next }),
                    }).catch(() => {});
                  }}
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-[#e8c547] hover:border-[#e8c547]/40"
                >
                  {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              headerCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
            }`}
          >
            <SessionTotalsBar
              sessionLbs={sessionLbs + warmupLbs + cooldownLbs}
              sessionEffort={sessionEffort + warmupLbs + cooldownLbs}
              sessionReps={sessionReps}
              allTimeVolume={priorAllTimeLbs + sessionLbs + warmupLbs + cooldownLbs}
              allTimeEffective={priorAllTimeEffort + sessionEffort + warmupLbs + cooldownLbs}
            />
          </div>
        </header>

        <div className="container mx-auto space-y-6 px-4 py-8 pb-28">
          <OptionalCard
            sessionId={currentSession}
            slot="warmup"
            region={optionalRegionFromDay(workout.name)}
            dayName={workout.name}
            onLbs={handleWarmupLbs}
          />
          <ExerciseTracker
            ref={exerciseTrackerRef}
            sessionId={currentSession}
            weekNumber={selectedWeek}
            exercises={workout.exercises}
            sessionMode={workoutMode}
            coachTone={coachTone}
            athleteName={athleteName}
            restExtraMinutes={restExtraMinutes}
            noiseTakeover={noiseTakeover}
            noiseEffort={noiseEffort}
            showPrs={showPrs}
            onLiftsDone={() => {
              setLiftsDone(true);
              window.requestAnimationFrame(() => {
                cooldownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              });
            }}
            onTotals={handleLiftTotals}
            onCoachMoment={(moment) => coachBubbleRef.current?.announce(moment)}
            onRestBannerChange={({ active, height }) => setRestBannerLift(active ? height : 0)}
          />
          <div ref={cooldownRef}>
            <OptionalCard
              sessionId={currentSession}
              slot="cooldown"
              region={optionalRegionFromDay(workout.name)}
              dayName={workout.name}
              onLbs={handleCooldownLbs}
              cue={liftsDone ? 'Lifts are done. Easy cooldown, then Finish it.' : undefined}
            />
          </div>
          <button
            type="button"
            onClick={() => setConfirmComplete(true)}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#e8c547] text-base font-black text-[#1a1404]"
          >
            Finish it
          </button>
        </div>

        <CoachBubble ref={coachBubbleRef} tone={coachTone} liftPx={restBannerLift} />
        <ExitTakeover
          open={confirmExit}
          line={exitLine}
          tone={coachTone}
          onStay={() => setConfirmExit(false)}
          onQuit={() => {
            setConfirmExit(false);
            setCurrentSession(null);
            setSelectedDay(null);
            setStartedAt(null);
          }}
        />

        <WorkoutRecapTakeover
          open={showRecap}
          title={recapTitle}
          rows={recapRows}
          tone={coachTone}
          optionalLbs={optionalFinishLbs}
          warmup={recapWarmup}
          cooldown={recapCooldown}
          step={2}
          totalSteps={finishTotalSteps}
          onClose={openCoachLine}
        />
        <CompleteTakeover
          open={showSuccess}
          line={completeLine}
          replenish={replenishLine}
          bonus={bonusFinish}
          bonusCount={bonusFinishCount}
          optionalLbs={optionalFinishLbs}
          kickerLbs={optionalKickerLbs}
          step={3}
          totalSteps={finishTotalSteps}
          onClose={openAwardsOrHome}
        />
        <AwardsTakeover
          open={showAwards}
          belt={earnedBelt}
          badges={awardedBadges}
          accent={displayBelt(lockedWeeks, userGender)}
          tone={coachTone}
          step={4}
          totalSteps={finishTotalSteps}
          gender={userGender}
          onClose={leaveWorkout}
        />

        <Modal
          open={confirmRestart}
          title="Restart this workout?"
          cancelLabel="Cancel"
          confirmLabel="Restart"
          variant="danger"
          onCancel={() => {
            setConfirmRestart(false);
            setRestartTarget(null);
          }}
          onConfirm={restartWorkout}
        >
          This clears all in-progress sets for that day and returns it to Start. Nothing is opened until you tap Start.
        </Modal>

        <Modal
          open={confirmComplete}
          title="Mark this workout complete?"
          cancelLabel="Not yet"
          confirmLabel="Complete it"
          variant="success"
          confirmDisabled={completeStars == null}
          onCancel={() => {
            setConfirmComplete(false);
            setCompleteStars(null);
          }}
          onConfirm={completeWorkout}
        >
          <FinishStepper current={1} total={finishTotalSteps} />
          <p>Nice work. We will save the end time and add this session to your dashboard stats.</p>
          <div className="mt-5">
            <StarRating
              value={completeStars}
              onChange={setCompleteStars}
              label="How did that sit with you, man? One is weak. Five is you want it again."
            />
          </div>
        </Modal>

        <Modal
          open={showError}
          title="Something went wrong"
          confirmLabel="Got it"
          variant="danger"
          onConfirm={() => setShowError(false)}
        >
          {errorMessage}
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="relative flex min-h-11 items-center">
            <Link
              href="/home"
              className="relative z-10 flex min-h-11 shrink-0 items-center gap-2 text-[#f6f1e3]/75 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm sm:text-base">Dashboard</span>
            </Link>
            <h1 className="pointer-events-none absolute inset-x-0 text-center text-lg font-black whitespace-nowrap text-[#f5d76e] sm:text-2xl">
              Select Workout
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {program.map((week) => (
            <div key={week.weekNumber} className="glass-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
                className="flex w-full items-center justify-between px-6 py-4 hover:bg-white/5"
                aria-expanded={expandedWeek === week.weekNumber}
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-white">
                    Week {hyroxMode ? hyroxDisplayWeek(week.weekNumber) : week.weekNumber}
                  </h2>
                  <span className="text-sm text-[#f6f1e3]/65">
                    {weekProgressLabel(
                      weekProgress(
                        sessions,
                        week,
                        undefined,
                        daysForWeekFn(scheduleDays)(week),
                        lockedWeeksDetail.get(week.weekNumber)
                      )
                    )}
                  </span>
                </div>
                {expandedWeek === week.weekNumber ? (
                  <ChevronUp className="h-6 w-6 text-[#e8c547]" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-[#e8c547]" />
                )}
              </button>

              {expandedWeek === week.weekNumber && (
                <div className="px-6 pb-6">
                  <p className="mb-4 text-sm text-[#f6f1e3]/65">{week.description}</p>

                  <div className="grid gap-3">
                    {athleteWeekDays(week, scheduleDays).map((day) => {
                      const isCompleted = completedWorkouts.has(`${week.weekNumber}-${day.dayNumber}`);
                      const incomplete = findIncompleteSession(sessions, week.weekNumber, day.dayNumber);
                      const dayHistory = historySessions.filter(
                        (session) =>
                          Number(session.week_number) === week.weekNumber &&
                          Number(session.day_number) === day.dayNumber
                      );
                      const fallbackCompleted = findLatestCompletedSession(
                        sessions,
                        week.weekNumber,
                        day.dayNumber
                      );
                      const completedCards =
                        dayHistory.length > 0
                          ? dayHistory
                          : fallbackCompleted
                            ? [
                                {
                                  id: Number(fallbackCompleted.id),
                                  week_number: Number(fallbackCompleted.week_number),
                                  day_number: Number(fallbackCompleted.day_number),
                                  workout_type: fallbackCompleted.workout_type,
                                  workout_mode: fallbackCompleted.workout_mode || null,
                                  started_at: fallbackCompleted.started_at || null,
                                  completed_at: fallbackCompleted.completed_at || null,
                                  ended_at: fallbackCompleted.ended_at || null,
                                  created_at: fallbackCompleted.created_at || null,
                                  sets: [],
                                } satisfies HistorySession,
                              ]
                            : [];
                      const mode = pickedMode(week.weekNumber, day.dayNumber, incomplete);
                      const planned = applyWorkoutMode(day, mode);
                      const estimate = formatEstimateMinutes(
                        estimateWorkoutSeconds(
                          planned,
                          restSecondsWithExtra(restExtraMinutes, REST_SECONDS)
                        )
                      );

                      if (isCompleted && !incomplete) {
                        return (
                          <div key={day.dayNumber} className="space-y-3">
                            {completedCards.map((session) => (
                              <CompletedSessionCard
                                key={session.id}
                                session={session}
                                focus={day.focus}
                                headerAction={
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startWorkout(week.weekNumber, day.dayNumber, undefined, {
                                        mode: normalizeWorkoutMode(session.workout_mode),
                                      })
                                    }
                                    className="inline-flex min-h-8 items-center rounded-lg bg-[#e8c547] px-2.5 text-xs font-black text-[#1a1404]"
                                  >
                                    Do Again
                                  </button>
                                }
                              />
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={day.dayNumber}
                          className={`rounded-2xl border p-4 ${
                            incomplete
                              ? 'border-[#e8c547]/50 bg-[#e8c547]/10'
                              : 'border-white/10 bg-black/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#f6f1e3]/70">
                                  Day {day.dayNumber}
                                </span>
                                <h3 className="text-lg font-black text-white">{day.name}</h3>
                                {isBonusDay(day) ? (
                                  <span className="rounded-full border border-[#e8c547]/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#e8c547]">
                                    {/* At 5 days/week this bonus day is folded into athleteRequiredDays and
                                        counts toward the week lock — "Bonus" alone would misleadingly read
                                        as skippable, so say so plainly instead. */}
                                    {athleteRequiredDays(week, scheduleDays).some(
                                      (required) => required.dayNumber === day.dayNumber
                                    )
                                      ? 'Bonus · Required'
                                      : 'Bonus'}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm text-[#f6f1e3]/65">{day.focus}</p>
                              <p className="mt-1 text-xs text-[#f6f1e3]/50">
                                Suggested: {day.suggestedDay} • {day.exercises.length} exercises
                              </p>
                              {isBonusDay(day) && shouldRestBetweenUppers(sessions) ? (
                                <p className="mt-2 text-xs font-semibold text-[#e8c547]">
                                  {restBetweenUppersCopy()}
                                </p>
                              ) : isBonusDay(day) ? (
                                <p className="mt-2 text-xs text-[#f6f1e3]/50">
                                  {restBetweenUppersCopy()}
                                </p>
                              ) : null}
                            </div>
                            <ModeToggle
                              mode={mode}
                              locked={!!incomplete}
                              onChange={(next) =>
                                setPickModes((current) => ({
                                  ...current,
                                  [dayModeKey(week.weekNumber, day.dayNumber)]: next,
                                }))
                              }
                            />
                          </div>

                          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#e8c547]">
                              <Clock className="h-4 w-4" />
                              Est. {estimate}
                            </span>
                            <div className="flex items-center gap-2">
                              {incomplete && (
                                <button
                                  type="button"
                                  onClick={() => askRestart(week.weekNumber, day.dayNumber, Number(incomplete.id))}
                                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#e8c547]/50 px-4 font-black text-[#e8c547]"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Restart
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => startWorkout(week.weekNumber, day.dayNumber, undefined, { mode })}
                                className="min-h-12 flex-1 rounded-2xl bg-[#e8c547] px-6 font-black text-[#1a1404]"
                              >
                                {incomplete ? 'Resume' : 'Start'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={confirmRestart && !currentSession}
        title="Restart this workout?"
        cancelLabel="Cancel"
        confirmLabel="Restart"
        variant="danger"
        onCancel={() => {
          setConfirmRestart(false);
          setRestartTarget(null);
        }}
        onConfirm={restartWorkout}
      >
        This clears all in-progress sets for that day and returns it to Start. Nothing is opened until you tap Start.
      </Modal>

      <BonusPickModal
        open={Boolean(bonusPick)}
        onCore={() => {
          const pick = bonusPick;
          setBonusPick(null);
          if (pick) startWorkout(pick.weekNumber, pick.dayNumber, undefined, { mode: pick.mode, skipBonusPick: true });
        }}
        onActivity={(label) => finishBonusActivity(label)}
        onClose={() => setBonusPick(null)}
      />

      <WorkoutRecapTakeover
        open={showRecap}
        title={recapTitle}
        rows={recapRows}
        tone={coachTone}
        optionalLbs={optionalFinishLbs}
        warmup={recapWarmup}
        cooldown={recapCooldown}
        step={2}
        totalSteps={finishTotalSteps}
        onClose={openCoachLine}
      />
      <CompleteTakeover
        open={showSuccess}
        line={completeLine}
        replenish={replenishLine}
        bonus={bonusFinish}
        bonusCount={bonusFinishCount}
        optionalLbs={optionalFinishLbs}
        kickerLbs={optionalKickerLbs}
        step={3}
        totalSteps={finishTotalSteps}
        onClose={openAwardsOrHome}
      />
      <AwardsTakeover
        open={showAwards}
        belt={earnedBelt}
        badges={awardedBadges}
        accent={displayBelt(lockedWeeks)}
        tone={coachTone}
        step={4}
        totalSteps={finishTotalSteps}
        onClose={leaveWorkout}
      />

      <Modal
        open={showError}
        title="Something went wrong"
        confirmLabel="Got it"
        variant="danger"
        onConfirm={() => setShowError(false)}
      >
        {errorMessage}
      </Modal>

      {pendingHyroxMilestone && (
        <HyroxMilestoneTakeover
          tone={coachTone}
          name={athleteName}
          milestoneNumber={pendingHyroxMilestone.number}
          onResolve={resolveHyroxMilestone}
        />
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-2xl font-black text-[#e8c547]">
          Loading...
        </div>
      }
    >
      <WorkoutPageInner />
    </Suspense>
  );
}
