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
import CompletedSessionCard, { type HistorySession } from '@/components/CompletedSessionCard';
import { useWakeLock } from '@/lib/useWakeLock';
import ExerciseTracker from '@/components/ExerciseTracker';
import CompleteTakeover, { type TakeoverBadge, type TakeoverBelt } from '@/components/CompleteTakeover';
import BonusPickModal from '@/components/BonusPickModal';
import OptionalCard from '@/components/OptionalCard';
import SessionTotalsBar from '@/components/SessionTotalsBar';
import ExitTakeover from '@/components/ExitTakeover';
import ResumeTakeover from '@/components/ResumeTakeover';
import Modal from '@/components/Modal';
import StarRating from '@/components/StarRating';
import { pickBonusCompleteLine, pickCompleteLine, pickExitLine, pickOptionalCompleteLine, pickReplenishLine, pickResumeLine } from '@/lib/coachLines';
import { hydrateCoachCatalog } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { playCompleteChime, setSoundEnabled, unlockAudio } from '@/lib/playChime';
import { normalizeSoundOn } from '@/lib/soundPref';
import { normalizeRestExtraMinutes, restSecondsWithExtra } from '@/lib/restPref';
import ModeToggle from '@/components/ModeToggle';
import { trackAction } from '@/lib/analytics';
import { beltWashStyle, displayBelt, lockedWeekCount } from '@/lib/belts';
import { bonusActivityType } from '@/lib/bonusActivity';

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
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [exitLine, setExitLine] = useState('');
  const [confirmResume, setConfirmResume] = useState(false);
  const [resumeLine, setResumeLine] = useState('');
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [restartTarget, setRestartTarget] = useState<{ weekNumber: number; dayNumber: number; sessionId?: number } | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completeStars, setCompleteStars] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completeLine, setCompleteLine] = useState('');
  const [replenishLine, setReplenishLine] = useState('');
  const [bonusFinish, setBonusFinish] = useState(false);
  const [bonusFinishCount, setBonusFinishCount] = useState(0);
  const [optionalFinishLbs, setOptionalFinishLbs] = useState(0);
  const [optionalKickerLbs, setOptionalKickerLbs] = useState(0);
  const [awardedBadges, setAwardedBadges] = useState<TakeoverBadge[]>([]);
  const [earnedBelt, setEarnedBelt] = useState<TakeoverBelt | null>(null);
  const [bonusPick, setBonusPick] = useState<{ weekNumber: number; dayNumber: number; mode: WorkoutMode } | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const cooldownRef = useRef<HTMLDivElement>(null);
  const [liftsDone, setLiftsDone] = useState(false);
  const autoOpened = useRef(false);
  const selectWeekInit = useRef(false);
  const [coachTone, setCoachTone] = useState<CoachTone>('master');
  const [soundOn, setSoundOn] = useState(true);
  const [restExtraMinutes, setRestExtraMinutes] = useState(0);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('gym');
  const [pickModes, setPickModes] = useState<Record<string, WorkoutMode>>({});
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
  const [sessionLbs, setSessionLbs] = useState(0);
  const [sessionReps, setSessionReps] = useState(0);
  const [warmupLbs, setWarmupLbs] = useState(0);
  const [cooldownLbs, setCooldownLbs] = useState(0);
  const [priorAllTimeLbs, setPriorAllTimeLbs] = useState(0);

  useWakeLock(!!currentSession);

  useEffect(() => {
    Promise.all([
      fetch('/api/me').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/coach-catalog').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([data, catalog]) => {
        if (data?.user) {
          setCoachTone(normalizeCoachTone(data.user.coachTone));
          const enabled = normalizeSoundOn(data.user.soundOn);
          setSoundOn(enabled);
          setSoundEnabled(enabled);
          setRestExtraMinutes(normalizeRestExtraMinutes(data.user.restExtraMinutes));
        }
        if (catalog) hydrateCoachCatalog(catalog);
      })
      .catch((error) => {
        console.error('Error loading workout prefs / coach catalog:', error);
      });
  }, []);

  useEffect(() => {
    if (!confirmResume) return;
    setResumeLine(pickResumeLine(coachTone));
  }, [confirmResume, coachTone]);

  useEffect(() => {
    if (!currentSession) {
      setSessionLbs(0);
      setSessionReps(0);
      setWarmupLbs(0);
      setCooldownLbs(0);
      setPriorAllTimeLbs(0);
      setLiftsDone(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/stats?home=1&excludeSession=${currentSession}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setPriorAllTimeLbs(Number(data?.overall?.total_weight_lifted || 0));
        }
      })
      .catch(() => {
        if (!cancelled) setPriorAllTimeLbs(0);
      });
    return () => {
      cancelled = true;
    };
  }, [currentSession]);

  const handleLiftTotals = useCallback((totals: { lbs: number; reps: number }) => {
    setSessionLbs(totals.lbs);
    setSessionReps(totals.reps);
  }, []);
  const handleWarmupLbs = useCallback((lbs: number) => setWarmupLbs(lbs), []);
  const handleCooldownLbs = useCallback((lbs: number) => setCooldownLbs(lbs), []);

  const askRestart = (weekNumber: number, dayNumber: number, sessionId?: number) => {
    setRestartTarget({ weekNumber, dayNumber, sessionId });
    setConfirmRestart(true);
  };

  useEffect(() => {
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
  }, []);

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
        setCompletedWorkouts(
          new Set(
            rows
              .filter(isSessionComplete)
              .map((session) => `${session.week_number}-${session.day_number}`)
          )
        );
        if (!selectWeekInit.current) {
          selectWeekInit.current = true;
          setExpandedWeek(defaultSelectWeek(rows));
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
    setConfirmResume(true);
  };

  const startWorkout = async (
    weekNumber: number,
    dayNumber: number,
    knownSessions?: WorkoutSessionRow[],
    options?: { forceNew?: boolean; mode?: WorkoutMode; skipBonusPick?: boolean }
  ) => {
    try {
      const week = workoutProgram.find((item) => item.weekNumber === weekNumber);
      const day = week?.days.find((item) => item.dayNumber === dayNumber);
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
      setCompleteLine(pickBonusCompleteLine(coachTone));
      setReplenishLine(pickReplenishLine());
      setShowSuccess(true);
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
      setOptionalFinishLbs(optionalLbs);
      setOptionalKickerLbs(kickerLbs);
      setCompleteLine(
        optionalLbs > 0
          ? pickOptionalCompleteLine(coachTone)
          : finishedBonus
            ? pickBonusCompleteLine(coachTone)
            : pickCompleteLine(coachTone)
      );
      setReplenishLine(pickReplenishLine());
      setShowSuccess(true);
    } catch (error) {
      console.error('Error completing workout:', error);
      setErrorMessage('Could not save the completed workout. Try again.');
      setShowError(true);
    }
  };

  const getCurrentWorkout = () => {
    const week = workoutProgram.find((item) => item.weekNumber === selectedWeek);
    return week?.days.find((item) => item.dayNumber === selectedDay);
  };

  const pickedMode = (weekNumber: number, dayNumber: number, incomplete?: WorkoutSessionRow | null) => {
    if (incomplete) return normalizeWorkoutMode(incomplete.workout_mode);
    return pickModes[dayModeKey(weekNumber, dayNumber)] ?? 'gym';
  };

  if (currentSession && selectedDay) {
    const workout = getCurrentWorkout();
    if (!workout) return null;

    const wash = beltWashStyle(displayBelt(lockedWeekCount(sessions)));
    return (
      <div
        className="belt-session min-h-screen"
        style={{ background: wash.background, ['--belt-rgb' as string]: wash.rgb }}
      >
        <header className="glass-header sticky top-0 z-10" style={{ borderBottomColor: wash.borderColor }}>
          <div className="container mx-auto px-4 py-2.5 sm:py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex w-full items-center sm:w-auto sm:justify-start sm:gap-3">
                <button
                  type="button"
                  aria-label="Exit"
                  onClick={() => {
                    setExitLine(pickExitLine(coachTone));
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
              <div className="w-full text-center sm:flex-1">
                <h1 className="text-lg font-black leading-tight text-[#f5d76e] sm:text-xl">
                  Week {selectedWeek} · {workout.name}
                </h1>
                <p className="text-sm text-[#f6f1e3]/65">
                  {workout.focus}
                  {workoutMode === 'travel' ? ' · Travel' : ''}
                </p>
                <p className="mt-1 hidden items-center justify-center gap-1 text-sm font-black tabular-nums text-[#e8c547] sm:inline-flex">
                  <Clock className="h-3.5 w-3.5" />
                  {formatClock(elapsedSeconds)}
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
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
          <SessionTotalsBar
            sessionLbs={sessionLbs + warmupLbs + cooldownLbs}
            sessionReps={sessionReps}
            allTimeLbs={priorAllTimeLbs + sessionLbs + warmupLbs + cooldownLbs}
          />
        </header>

        <div className="container mx-auto space-y-6 px-4 py-8 pb-28">
          <OptionalCard sessionId={currentSession} slot="warmup" onLbs={handleWarmupLbs} />
          <ExerciseTracker
            sessionId={currentSession}
            weekNumber={selectedWeek}
            exercises={workout.exercises}
            sessionMode={workoutMode}
            coachTone={coachTone}
            restExtraMinutes={restExtraMinutes}
            onLiftsDone={() => {
              setLiftsDone(true);
              window.requestAnimationFrame(() => {
                cooldownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              });
            }}
            onTotals={handleLiftTotals}
          />
          <div ref={cooldownRef}>
            <OptionalCard
              sessionId={currentSession}
              slot="cooldown"
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

        <ResumeTakeover
          open={confirmResume}
          line={resumeLine}
          onClose={() => setConfirmResume(false)}
        />
        <ExitTakeover
          open={confirmExit}
          line={exitLine}
          onStay={() => setConfirmExit(false)}
          onQuit={async (stars) => {
            const rated = await saveSessionRating(stars, 'quit');
            if (!rated) {
              setErrorMessage('Could not save your score. Try again.');
              setShowError(true);
              return;
            }
            setConfirmExit(false);
            setCurrentSession(null);
            setSelectedDay(null);
            setStartedAt(null);
          }}
        />

        <CompleteTakeover
          open={showSuccess}
          line={completeLine}
          replenish={replenishLine}
          badges={awardedBadges}
          earnedBelt={earnedBelt}
          bonus={bonusFinish}
          bonusCount={bonusFinishCount}
          optionalLbs={optionalFinishLbs}
          kickerLbs={optionalKickerLbs}
          onClose={() => {
            setShowSuccess(false);
            setBonusFinish(false);
            setBonusFinishCount(0);
            setOptionalFinishLbs(0);
            setOptionalKickerLbs(0);
            setAwardedBadges([]);
            setEarnedBelt(null);
            setCurrentSession(null);
            setSelectedDay(null);
            setStartedAt(null);
            router.push('/home');
          }}
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
          {workoutProgram.map((week) => (
            <div key={week.weekNumber} className="glass-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
                className="flex w-full items-center justify-between px-6 py-4 hover:bg-white/5"
                aria-expanded={expandedWeek === week.weekNumber}
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-white">Week {week.weekNumber}</h2>
                  <span className="text-sm text-[#f6f1e3]/65">
                    {weekProgressLabel(weekProgress(sessions, week))}
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
                    {week.days.map((day) => {
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
                                <h3 className="text-lg font-black text-white">{day.name}</h3>
                                {isBonusDay(day) ? (
                                  <span className="rounded-full border border-[#e8c547]/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#e8c547]">
                                    Bonus
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

      <CompleteTakeover
        open={showSuccess}
        line={completeLine}
        replenish={replenishLine}
        badges={awardedBadges}
        earnedBelt={earnedBelt}
        bonus={bonusFinish}
        bonusCount={bonusFinishCount}
        optionalLbs={optionalFinishLbs}
        kickerLbs={optionalKickerLbs}
        onClose={() => {
          setShowSuccess(false);
          setBonusFinish(false);
          setBonusFinishCount(0);
          setOptionalFinishLbs(0);
          setOptionalKickerLbs(0);
          setAwardedBadges([]);
          setEarnedBelt(null);
          setCurrentSession(null);
          setSelectedDay(null);
          setStartedAt(null);
          router.push('/home');
        }}
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
