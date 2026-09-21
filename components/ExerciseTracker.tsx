'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Check, ChevronDown, Edit2, Play, Plus, Trash2 } from 'lucide-react';
import EffortBar from './EffortBar';
import SetRestTimer from './SetRestTimer';
import TimedSetTimer from './TimedSetTimer';
import UnitToggle from './UnitToggle';
import AltButton from './AltButton';
import AltExerciseTakeover from './AltExerciseTakeover';
import PlaneIcon from './PlaneIcon';
import { pickCoachLine, setProgressCopy, hardnessCopy } from '@/lib/coachLines';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { exerciseHistoryKey, sameExerciseMovement } from '@/lib/exerciseKey';
import { modeForExercise, parseExerciseModes, type ExerciseModeMap } from '@/lib/exerciseModes';
import { parseExerciseAlts, type ExerciseAltMap } from '@/lib/exerciseAlts';
import { altsForExercise } from '@/lib/altExercises';
import { muscleGroupForExercise } from '@/lib/muscleGroups';
import { isTravelFriendly } from '@/lib/travelFriendly';
import { applyExerciseMode, canonicalProgramExercise, type Exercise as ProgramExercise } from '@/lib/workoutData';
import { normalizeWorkoutMode, type WorkoutMode } from '@/lib/workoutMode';
import { DEFAULT_HARDNESS, parseHardness, type HardnessScore } from '@/lib/hardness';
import { type NoiseLevel } from '@/lib/noisePref';
import LiveSetKpis from '@/components/LiveSetKpis';
import { playSetChime, unlockAudio } from '@/lib/playChime';
import { HowTrigger } from './HelpSheet';
import { howForExercise } from '@/lib/exerciseHow';
import ExerciseThumbs, { type ExerciseThumb } from './ExerciseThumbs';
import VideoModal from './VideoModal';
import type { CoachMoment } from './CoachBubble';
import SetHardness from './SetHardness';
import { exerciseVideos, getExerciseMedia, youtubeThumbUrl } from '@/lib/exerciseMedia';
import { getExerciseImages } from '@/lib/exerciseImages';
import {
  canCompleteSet,
  getExerciseKind,
  parseTimedTarget,
  primaryFieldLabel,
  sessionSetTotals,
  setLogLabel,
  setVolume,
  suggestedNextWeight,
  weightFieldLabel,
  type ExerciseKind,
} from '@/lib/exerciseKind';
import {
  bestLoggedSet,
  foldSetIntoHistory,
  setDirection,
  setNumberStatsFor,
  tileDelta,
  type SetNumberHistory,
} from '@/lib/setHistory';
import { formatWhen } from '@/lib/kpiView';
import { REST_SECONDS } from '@/lib/estimateDuration';
import { restSecondsWithExtra } from '@/lib/restPref';
import {
  kgFromLbs,
  lbsFromKg,
  readExerciseUnits,
  unitForExercise,
  writeExerciseUnits,
  type WeightUnit,
} from '@/lib/weightUnit';

type Exercise = Pick<ProgramExercise, 'name' | 'sets' | 'reps' | 'notes' | 'noRestAfter' | 'circuitGroup'>;

interface ExerciseSet {
  id?: number;
  exercise_name: string;
  set_number: number;
  target_reps: string;
  actual_reps: number | null;
  weight_lbs: number | null;
  is_completed: boolean;
  hardness?: HardnessScore | null;
  notes?: string;
}

interface HistoryPayload {
  lastSets: Record<
    string,
    Array<{ set_number: number; weight_lbs: number | null; actual_reps: number | null; hardness?: number | null }>
  >;
  lastWeekMax: Record<string, number>;
  personalRecords: Record<string, { weight: number; reps: number }>;
  /** Heaviest single set ever logged for this exercise (weight+reps as one pair), any set position. */
  bestSets: Record<
    string,
    { weight_lbs: number | null; actual_reps: number | null; set_number: number; done_at: string | null }
  >;
  /** How each set position of this exercise has gone across every past completed session. */
  setNumberHistory: SetNumberHistory;
}

interface ExerciseTrackerProps {
  sessionId: number;
  weekNumber: number;
  exercises: Exercise[];
  sessionMode?: WorkoutMode | string | null;
  coachTone?: CoachTone | string | null;
  athleteName?: string | null;
  restExtraMinutes?: number;
  /** How often the post-set result flash shows: every set, once per exercise, or never. */
  noiseTakeover?: NoiseLevel;
  /** How often the perceived-load result flash shows. Voting itself always stays per set. */
  noiseEffort?: NoiseLevel;
  /** Whether the "NEW PR" coach bubble fires in-app (PRs always land in the recap email). */
  showPrs?: boolean;
  onLiftsDone?: () => void;
  onTotals?: (totals: { lbs: number; reps: number; effort: number }) => void;
  /** Hands a PR / gain-loss / effort-call moment to the floating coach bubble dock. */
  onCoachMoment?: (moment: CoachMoment) => void;
  /** The rest-timer banner's open state and measured height, so the coach dock can lift clear of it. */
  onRestBannerChange?: (info: { active: boolean; height: number }) => void;
}

/** Imperative escape hatch for the Finish flow: let a parent wait out any in-flight (or
 * about-to-start) exercise-complete celebration before its own takeovers start mounting,
 * so the celebration never gets cut off. See `resolveFinish` / `awaitPendingCelebration` below. */
export interface ExerciseTrackerHandle {
  awaitPendingCelebration: () => Promise<void>;
}

const EXTRA_SET_CAP = 5;
// How long the exercise-complete sweep + stamp celebration runs (matches the CSS
// animation durations in globals.css) before the deferred PR/gain-loss/hardness
// flash is allowed to show, so the two never render on top of each other.
const CELEBRATION_MS = 2400;

function parseMaybeNumber(value: string): number | null {
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Sets that belong on one live card. Alt names are deliberately outside
 * `lib/exerciseKey.ts` groups (own history bucket), so a gym/travel alias
 * lookup misses rows already renamed to the alt — union the original
 * identity with the name currently on the card. */
function setOnCard(itemName: string, gymName: string, displayName: string) {
  return sameExerciseMovement(itemName, gymName) || itemName === displayName;
}

function setsForCard(sets: ExerciseSet[], gymName: string, displayName: string) {
  return sets.filter((item) => setOnCard(item.exercise_name, gymName, displayName));
}

/** Exercise-level "How hard?" score: mean of that exercise's set votes, unset sets default to Fair (3) same as a skipped vote. */
function averageHardness(sets: ExerciseSet[]): HardnessScore {
  if (sets.length === 0) return DEFAULT_HARDNESS;
  const total = sets.reduce((sum, item) => sum + (parseHardness(item.hardness) ?? DEFAULT_HARDNESS), 0);
  return Math.round(total / sets.length) as HardnessScore;
}

function inferExerciseMode(
  gym: Exercise,
  saved: Array<{ exercise_name: string; is_completed?: unknown }>,
  stored: ExerciseModeMap,
  fallback: WorkoutMode
): WorkoutMode {
  if (stored[gym.name] || stored[exerciseHistoryKey(gym.name)]) {
    return modeForExercise(gym.name, stored, fallback);
  }
  const travelName = applyExerciseMode(gym, 'travel').name;
  const related = saved.filter((row) => sameExerciseMovement(row.exercise_name, gym.name));
  const completed = related.filter((row) => Boolean(Number(row.is_completed)));
  const source = completed.length ? completed : related;
  if (source.some((row) => row.exercise_name === travelName) && travelName !== gym.name) {
    return 'travel';
  }
  if (source.some((row) => row.exercise_name === gym.name)) {
    return 'gym';
  }
  return fallback;
}

function priorSetFor(
  gymName: string,
  exerciseName: string,
  setNumber: number,
  currentSets: ExerciseSet[],
  history: HistoryPayload
): { weight_lbs: number | null; actual_reps: number | null } | null {
  if (setNumber === 1) {
    return lastBestFor(exerciseName, history);
  }

  const previous = currentSets.find(
    (item) =>
      setOnCard(item.exercise_name, gymName, exerciseName) &&
      item.set_number === setNumber - 1 &&
      item.is_completed
  );
  if (previous) {
    return { weight_lbs: previous.weight_lbs, actual_reps: previous.actual_reps };
  }
  return null;
}

function lastSetsFor(
  exerciseName: string,
  history: HistoryPayload
): HistoryPayload['lastSets'][string] {
  const key = exerciseHistoryKey(exerciseName);
  return history.lastSets[key] || history.lastSets[exerciseName] || [];
}

function lastBestFor(exerciseName: string, history: HistoryPayload) {
  return bestLoggedSet(lastSetsFor(exerciseName, history));
}

function setSummaryLabel(
  kind: ExerciseKind,
  set: { weight_lbs: number | null; actual_reps: number | null }
) {
  return setLogLabel(kind, set.weight_lbs, set.actual_reps);
}


const ExerciseTracker = forwardRef<ExerciseTrackerHandle, ExerciseTrackerProps>(function ExerciseTracker({
  sessionId,
  weekNumber,
  exercises,
  sessionMode,
  coachTone,
  athleteName,
  restExtraMinutes = 0,
  noiseTakeover = 'set',
  noiseEffort = 'set',
  showPrs = true,
  onLiftsDone,
  onTotals,
  onCoachMoment,
  onRestBannerChange,
}: ExerciseTrackerProps, ref) {
  const tone = normalizeCoachTone(coachTone);
  const defaultMode = normalizeWorkoutMode(sessionMode);
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [modes, setModes] = useState<ExerciseModeMap>({});
  const [alts, setAlts] = useState<ExerciseAltMap>({});
  // Which card's gym.name currently has the Alt Exercise takeover open, if any.
  const [altTakeoverFor, setAltTakeoverFor] = useState<string | null>(null);
  const [setsReady, setSetsReady] = useState(false);
  const [editingSet, setEditingSet] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{
    title: string;
    videoId: string;
    videos: ReturnType<typeof exerciseVideos>;
  } | null>(null);
  const restClock = restSecondsWithExtra(restExtraMinutes, REST_SECONDS);
  const [restToken, setRestToken] = useState(0);
  const [restSeconds, setRestSeconds] = useState(restClock);
  const [restLine, setRestLine] = useState('Finish it. Make me proud.');
  const [weightUnits, setWeightUnits] = useState<Record<string, WeightUnit>>({});
  const [timedTimer, setTimedTimer] = useState<{ index: number; target: number; gym: Exercise; exercise: Exercise } | null>(
    null
  );
  const [history, setHistory] = useState<HistoryPayload>({ lastSets: {}, lastWeekMax: {}, personalRecords: {}, bestSets: {}, setNumberHistory: {} });
  const [thumbs, setThumbs] = useState<Record<string, ExerciseThumb>>({});
  // A PR can land on any set of an exercise, but the flash itself is now held
  // until that exercise's last planned set. Remember the best PR seen so far
  // per exercise (by name) so it still surfaces, delayed, when the exercise
  // finishes — a ref (not state) so it's readable synchronously inside the
  // same completeSet() call that may set it.
  const pendingPrRef = useRef<Record<string, { valueLabel: string }>>({});

  // Mirrors `exerciseSets` state so deferred closures (fired well after the render
  // that created them, once the exercise-complete celebration has played) can read
  // the athlete's actual hardness vote instead of whatever was on the set the instant
  // it was completed — the vote itself is cast after completion, not before.
  const exerciseSetsRef = useRef<ExerciseSet[]>([]);
  useEffect(() => {
    exerciseSetsRef.current = exerciseSets;
  }, [exerciseSets]);

  // Exercise-complete celebration (gold sweep + checkmark stamp) — always plays once
  // per exercise, fully, before the PR/gain-loss/hardness flash it gates is allowed
  // to show. `celebrateExercise` drives which exercise card renders the animation;
  // `pendingFinishRef` holds one deferred "show whichever flash applies" thunk per
  // exercise between the moment its last planned set finishes and the moment the
  // celebration for it has played out (see `resolveFinish` and `completeSet` below).
  // Two exercises can finish in quick succession (e.g. a circuit, or a fast athlete),
  // so celebrations queue instead of one overwriting the other mid-animation.
  const [celebrateExercise, setCelebrateExercise] = useState<string | null>(null);
  const pendingFinishRef = useRef<Record<string, () => void>>({});
  const celebrationQueueRef = useRef<Array<{ name: string; fire: () => void }>>([]);
  const celebrationActiveRef = useRef(false);
  // Which exercise the athlete most recently completed a set in — lets a completed-
  // but-unrated set in a DIFFERENT, now-inactive exercise fold anyway ("moved on"),
  // and lets a same-exercise finish celebration resolve once they've clearly left it.
  const [lastTouchedExercise, setLastTouchedExercise] = useState<string | null>(null);

  const playNextCelebration = () => {
    const next = celebrationQueueRef.current.shift();
    if (!next) {
      celebrationActiveRef.current = false;
      return;
    }
    celebrationActiveRef.current = true;
    setCelebrateExercise(next.name);
    setTimeout(() => {
      setCelebrateExercise((current) => (current === next.name ? null : current));
      // `fire()` calls out to onCoachMoment, coach-line lookups, etc. — if any of that
      // ever throws, it must not take the queue down with it: every exercise still
      // queued behind this one would silently never get its celebration or message.
      try {
        next.fire();
      } catch (error) {
        console.error('Error firing exercise-complete coach moment:', error);
      }
      playNextCelebration();
    }, CELEBRATION_MS);
  };

  const resolveFinish = (exerciseName: string) => {
    const fireFlash = pendingFinishRef.current[exerciseName];
    if (!fireFlash) return;
    delete pendingFinishRef.current[exerciseName];
    celebrationQueueRef.current.push({ name: exerciseName, fire: fireFlash });
    if (!celebrationActiveRef.current) playNextCelebration();
  };

  useImperativeHandle(ref, () => ({
    // Called by the Finish flow right before it starts showing its own takeover
    // stack (recap -> complete -> awards), so a celebration still in flight — or
    // one that never got resolved because the athlete skipped rating the very
    // last set of the workout — always finishes before anything mounts on top of it.
    awaitPendingCelebration: () =>
      new Promise<void>((resolve) => {
        Object.keys(pendingFinishRef.current).forEach((name) => resolveFinish(name));
        const waitForQueue = () => {
          if (!celebrationActiveRef.current && celebrationQueueRef.current.length === 0) {
            resolve();
            return;
          }
          setTimeout(waitForQueue, 100);
        };
        waitForQueue();
      }),
  }));

  useEffect(() => {
    setRestSeconds(restClock);
  }, [restClock]);

  useEffect(() => {
    setWeightUnits(readExerciseUnits());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSetsReady(false);

    const load = async () => {
      const [existingRes, historyRes] = await Promise.all([
        fetch(`/api/exercises?sessionId=${sessionId}`),
        fetch(`/api/exercises?history=1&weekNumber=${weekNumber}&sessionId=${sessionId}`),
      ]);

      let saved: any[] = [];
      let storedModes: ExerciseModeMap = {};
      let storedAlts: ExerciseAltMap = {};
      if (existingRes.ok) {
        const data = await existingRes.json();
        saved = data.sets || [];
        storedModes = parseExerciseModes(data.exerciseModes ?? data.exercise_modes);
        storedAlts = parseExerciseAlts(data.exerciseAlts ?? data.exercise_alts);
      }

      let historyData: HistoryPayload = { lastSets: {}, lastWeekMax: {}, personalRecords: {}, bestSets: {}, setNumberHistory: {} };
      if (historyRes.ok) {
        historyData = await historyRes.json();
      }

      if (cancelled) return;
      setHistory(historyData);

      const nextModes: ExerciseModeMap = { ...storedModes };
      for (const gym of exercises) {
        nextModes[gym.name] = inferExerciseMode(gym, saved, storedModes, defaultMode);
      }
      setModes(nextModes);
      setAlts(storedAlts);

      const template: Array<ExerciseSet & { gymName: string }> = [];
      exercises.forEach((gym) => {
        // An Alt swap replaces the whole movement, so it wins over Gym/Travel mode.
        const exercise = storedAlts[gym.name]
          ? { ...gym, name: storedAlts[gym.name] }
          : applyExerciseMode(gym, nextModes[gym.name] || defaultMode);
        for (let i = 1; i <= gym.sets; i++) {
          template.push({
            gymName: gym.name,
            exercise_name: exercise.name,
            set_number: i,
            target_reps: gym.reps,
            actual_reps: null,
            weight_lbs: null,
            is_completed: false,
          });
        }
      });

      const merged = template.map((slot) => {
        const found = saved.find(
          (row: any) =>
            setOnCard(row.exercise_name, slot.gymName, slot.exercise_name) &&
            Number(row.set_number) === slot.set_number
        );

        const lastBest = lastBestFor(slot.exercise_name, historyData);

        if (found) {
          const completed = Boolean(Number(found.is_completed));
          let actual_reps = asNumber(found.actual_reps);
          let weight_lbs = asNumber(found.weight_lbs);
          if (!completed && slot.set_number === 1 && lastBest) {
            if (actual_reps == null) actual_reps = lastBest.actual_reps;
            if (weight_lbs == null || weight_lbs === 0) weight_lbs = lastBest.weight_lbs;
          }
          return {
            exercise_name: completed ? found.exercise_name : slot.exercise_name,
            set_number: slot.set_number,
            target_reps: slot.target_reps,
            id: found.id,
            actual_reps,
            weight_lbs,
            is_completed: completed,
            notes: found.notes,
            hardness: parseHardness(found.hardness),
          };
        }

        if (slot.set_number === 1 && lastBest) {
          return {
            exercise_name: slot.exercise_name,
            set_number: slot.set_number,
            target_reps: slot.target_reps,
            actual_reps: lastBest.actual_reps,
            weight_lbs: lastBest.weight_lbs,
            is_completed: false,
          };
        }

        return {
          exercise_name: slot.exercise_name,
          set_number: slot.set_number,
          target_reps: slot.target_reps,
          actual_reps: null,
          weight_lbs: null,
          is_completed: false,
        };
      });

      const extras: ExerciseSet[] = [];
      for (const gym of exercises) {
        const displayName = storedAlts[gym.name]
          ? storedAlts[gym.name]
          : applyExerciseMode(gym, nextModes[gym.name] || defaultMode).name;
        const extraRows = saved
          .filter(
            (row: any) =>
              setOnCard(row.exercise_name, gym.name, displayName) && Number(row.set_number) > gym.sets
          )
          .sort((a: any, b: any) => Number(a.set_number) - Number(b.set_number));

        for (const found of extraRows) {
          extras.push({
            exercise_name: found.exercise_name,
            set_number: Number(found.set_number),
            target_reps: found.target_reps || gym.reps,
            actual_reps: asNumber(found.actual_reps),
            weight_lbs: asNumber(found.weight_lbs),
            is_completed: Boolean(Number(found.is_completed)),
            id: found.id,
            notes: found.notes,
            hardness: parseHardness(found.hardness),
          });
        }
      }

      setExerciseSets([...merged, ...extras]);
      setSetsReady(true);
    };

    load().catch((error) => {
      console.error('Error loading sets:', error);
      if (!cancelled) {
        const template: ExerciseSet[] = [];
        exercises.forEach((gym) => {
          const exercise = applyExerciseMode(gym, defaultMode);
          for (let i = 1; i <= gym.sets; i++) {
            template.push({
              exercise_name: exercise.name,
              set_number: i,
              target_reps: gym.reps,
              actual_reps: null,
              weight_lbs: null,
              is_completed: false,
            });
          }
        });
        setExerciseSets(template);
        setSetsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId, weekNumber, defaultMode, exercises]);

  useEffect(() => {
    if (!setsReady) return;
    onTotals?.(sessionSetTotals(exerciseSets));
  }, [setsReady, exerciseSets, onTotals]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feedback?sessionId=' + sessionId)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data?.thumbs) return;
        const next: Record<string, ExerciseThumb> = {};
        for (const thumb of data.thumbs as ExerciseThumb[]) {
          next[thumb.exerciseName] = thumb;
        }
        setThumbs(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const persistSet = async (set: ExerciseSet) => {
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: set.id,
        workoutSessionId: sessionId,
        exerciseName: set.exercise_name,
        setNumber: set.set_number,
        targetReps: set.target_reps,
        actualReps: set.actual_reps,
        weightLbs: set.weight_lbs,
        isCompleted: set.is_completed,
        notes: set.notes,
        hardness: set.hardness,
      }),
    });

    if (!response.ok) return set;
    const data = await response.json();
    return data.setId && !set.id ? { ...set, id: data.setId } : set;
  };

  const updateSet = async (index: number, updates: Partial<ExerciseSet>, options?: { copyForward?: boolean; startRest?: boolean }) => {
    const updatedSet = { ...exerciseSets[index], ...updates };
    const newSets = [...exerciseSets];
    newSets[index] = updatedSet;

    if (options?.copyForward && updatedSet.is_completed) {
      const gym = exercises.find((item) => {
        const display = alts[item.name] || applyExerciseMode(item, modes[item.name] || defaultMode).name;
        return setOnCard(updatedSet.exercise_name, item.name, display);
      });
      const nextIndex = newSets.findIndex((item, itemIndex) => {
        if (itemIndex <= index || item.is_completed || item.actual_reps != null || item.weight_lbs != null) {
          return false;
        }
        if (gym) {
          const display = alts[gym.name] || applyExerciseMode(gym, modes[gym.name] || defaultMode).name;
          return setOnCard(item.exercise_name, gym.name, display);
        }
        return sameExerciseMovement(item.exercise_name, updatedSet.exercise_name);
      });
      if (nextIndex >= 0) {
        newSets[nextIndex] = {
          ...newSets[nextIndex],
          actual_reps: updatedSet.actual_reps,
          weight_lbs: updatedSet.weight_lbs,
        };
      }
    }

    setExerciseSets(newSets);

    try {
      const wasComplete = Boolean(exerciseSets[index]?.is_completed);
      const persistNow = Boolean(updatedSet.is_completed) || (Boolean(updatedSet.id) && wasComplete);
      if (persistNow) {
        const saved = await persistSet(updatedSet);
        if (saved.id !== updatedSet.id) {
          setExerciseSets((current) => {
            const copy = [...current];
            copy[index] = { ...copy[index], id: saved.id };
            return copy;
          });
        }
      }

      if (options?.copyForward) {
        // Next set already copied in memory. Do not write an unfinished row.
      }

      if (options?.startRest) {
        const remaining = newSets.filter((item) => !item.is_completed).length;
        if (remaining > 0) {
          setRestSeconds(restClock);
          const completed = newSets.filter((item) => item.is_completed).length;
          setRestLine(pickCoachLine(completed, newSets.length, tone, athleteName));
          setRestToken((token) => token + 1);
        }
      }

      const wasAllDone = exerciseSets.length > 0 && exerciseSets.every((item) => item.is_completed);
      const allCompleted = newSets.length > 0 && newSets.every((item) => item.is_completed);
      if (allCompleted && !wasAllDone && onLiftsDone) onLiftsDone();
    } catch (error) {
      console.error('Error saving set:', error);
    }
  };

  const kindFor = (exercise: Exercise): ExerciseKind => getExerciseKind(exercise.name, exercise.reps);

  // `overrideReps` lets the timed-set timer's Stop button complete a set in one
  // action (held seconds stand in for actual_reps) instead of requiring a
  // separate manual Complete Set tap after the clock closes.
  const completeSet = (index: number, gym: Exercise, exercise: Exercise, overrideReps?: number) => {
    const set = exerciseSets[index];
    const actualReps = overrideReps ?? set.actual_reps;
    const kind = kindFor(exercise);
    if (!canCompleteSet(kind, actualReps, set.weight_lbs)) return;

    // Moving on to a different exercise resolves any still-pending finish from the
    // one just left — this is the fallback for a last planned set that finished but
    // never got rated (the athlete skipped it and kept going), so its celebration
    // and deferred flash still fire instead of waiting forever for a vote.
    if (lastTouchedExercise && lastTouchedExercise !== exercise.name) {
      resolveFinish(lastTouchedExercise);
    }
    setLastTouchedExercise(exercise.name);

    unlockAudio();
    playSetChime();

    const weight = set.weight_lbs ?? 0;
    const reps = actualReps ?? 0;
    const record =
      history.personalRecords[exerciseHistoryKey(exercise.name)] ||
      history.personalRecords[exercise.name] ||
      { weight: 0, reps: 0 };
    // Weight PR is now by volume (weight × reps — docs/plans/PLAN_PR_VOLUME.md), not weight
    // alone: a lighter, higher-rep set can beat a heavier, lower-rep one. Timed/distance PRs
    // are untouched — there's no weight to multiply, so they still compare on duration/distance.
    const isWeightPr = kind !== 'timed' && kind !== 'distance' && weight > 0 && weight * reps > record.weight * record.reps;
    const isTimedPr = (kind === 'timed' || kind === 'distance') && reps > record.reps && record.reps > 0;

    const prior = priorSetFor(gym.name, exercise.name, set.set_number, exerciseSets, history);
    const direction = setDirection({ ...set, actual_reps: actualReps }, prior);

    // This exercise's planned (non-extra) sets, as they stand right before this
    // completion lands. `plannedSets.length` never changes (extras only add set
    // numbers above `exercise.sets`), and a set can only go incomplete -> complete,
    // so "one more completion reaches the planned total" can only be true once
    // per exercise — no extra "already flashed" bookkeeping needed.
    const plannedSets = setsForCard(exerciseSets, gym.name, exercise.name).filter(
      (item) => item.set_number <= exercise.sets
    );
    const completedPlannedCount = plannedSets.filter((item) => item.is_completed).length + 1;
    const exerciseJustFinished = completedPlannedCount === exercise.sets;

    // A PR can land on any set, but its flash is now held until exercise-end —
    // remember the best one seen so far for this exercise so it isn't lost by
    // the time the last set completes.
    if (isWeightPr || isTimedPr) {
      pendingPrRef.current[exercise.name] = {
        // Weight PRs now show both numbers — the record can be a rep increase at the same
        // or lower weight, so "just the weight" would misrepresent what actually improved.
        valueLabel: isWeightPr ? `${weight} lb × ${reps}` : `${reps} ${kind === 'timed' ? 'sec' : 'm'}`,
      };
    }

    // All three flashes now share one trigger — the exercise's last planned set —
    // instead of popping mid-exercise on every set. Same priority as before:
    // PR > gain/loss > hardness, single flash slot. The flash itself is no longer
    // fired here directly — it's handed to `pendingFinishRef` and only shown once
    // the exercise-complete celebration (triggered by rating that last set, or by
    // moving on without rating it) has fully played, via `resolveFinish`.
    if (exerciseJustFinished) {
      const pendingPr = pendingPrRef.current[exercise.name];
      const exerciseName = exercise.name;
      const exerciseSetCount = exercise.sets;
      pendingFinishRef.current[exercise.name] = () => {
        if (pendingPr && showPrs) {
          onCoachMoment?.({
            tone,
            expression: 'celebratory',
            kicker: 'Personal record',
            title: 'NEW PR',
            body: `${exerciseName} · ${pendingPr.valueLabel}`,
          });
        } else if (noiseTakeover === 'set' && direction) {
          const copy = setProgressCopy(direction, tone, athleteName);
          onCoachMoment?.({
            tone,
            expression: direction === 'up' ? 'happy' : 'mad',
            kicker: direction === 'up' ? 'Set up' : 'Set down',
            title: copy.title,
            body: copy.body,
          });
        } else if (noiseEffort === 'set') {
          // The "How hard?" takeover fires once per exercise (on its last planned
          // set) instead of once per vote, since votes are optional and skippable.
          // Read hardness fresh here, not from the `plannedSets` snapshot taken when
          // this exercise's last set completed — the athlete rates that set's effort
          // AFTER completing it, so the snapshot never had the real vote on it.
          const freshPlanned = setsForCard(exerciseSetsRef.current, gym.name, exerciseName).filter(
            (item) => item.set_number <= exerciseSetCount
          );
          const score = averageHardness(freshPlanned);
          const copy = hardnessCopy(score, tone, athleteName);
          onCoachMoment?.({
            tone,
            expression: 'ok',
            kicker: `Effort · ${score} of 5`,
            title: copy.title,
            body: copy.body,
          });
        }
      };
      delete pendingPrRef.current[exercise.name];
      // Weighted sets rate effort before Complete, so the finish can start right away.
      // Timed holds rate after the clock (optional) — wait for that vote or for the
      // athlete to move on, so the hardness flash still sees the real score.
      if (kind !== 'timed' || parseHardness(set.hardness) != null) {
        resolveFinish(exercise.name);
      }
    }

    if (isWeightPr || isTimedPr) {
      // Store this set's own weight/reps together, not an independent max of each field —
      // Math.max-ing them separately could stitch together a weight/reps combination that
      // was never actually logged, inflating the record beyond what was really lifted.
      setHistory((current) => ({
        ...current,
        personalRecords: {
          ...current.personalRecords,
          [exerciseHistoryKey(exercise.name)]: { weight, reps },
        },
      }));
    }

    updateSet(
      index,
      { is_completed: true, weight_lbs: set.weight_lbs ?? 0, actual_reps: actualReps },
      // Circuit movements (noRestAfter) flow straight into the next one — only the
      // round's last movement should fire the shared rest timer.
      { copyForward: true, startRest: !exercise.noRestAfter }
    );
  };

  const saveHardness = async (set: ExerciseSet, score: HardnessScore, plannedSets: number) => {
    // No "already rated" guard here on purpose — the explicit "Editing" flow on a
    // completed set needs to be able to change an existing vote, not just set it once.
    const previousScore = parseHardness(set.hardness);
    const setKey = (item: ExerciseSet) =>
      item.exercise_name === set.exercise_name && item.set_number === set.set_number;

    // Optimistic: reflect the rating immediately (this runs synchronously, before the
    // `await` below, so the caller sees it applied right away) so a fold or the next
    // widget can react without waiting on the round-trip. Reverted below if the save
    // actually fails — a shown rating must always match what's really stored.
    setExerciseSets((current) => current.map((item) => (setKey(item) ? { ...item, hardness: score } : item)));

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: set.id,
          workoutSessionId: sessionId,
          exerciseName: set.exercise_name,
          setNumber: set.set_number,
          hardness: score,
        }),
      });
      const data = response.ok || response.status === 409 ? await response.json() : null;
      if (!response.ok && response.status !== 409) {
        setExerciseSets((current) => current.map((item) => (setKey(item) ? { ...item, hardness: previousScore } : item)));
        return;
      }
      const locked = parseHardness(data?.hardness);
      const nextScore = locked ?? score;
      setExerciseSets((current) =>
        current.map((item) => (setKey(item) ? { ...item, hardness: nextScore, id: data?.setId || item.id } : item))
      );
      // The result flash for this no longer fires per vote — see the
      // exercise-level takeover fired from `completeSet` when the exercise's
      // last planned set completes. The vote itself still always saves.

      // Rating the exercise's last planned set is the primary trigger for the
      // exercise-complete celebration (a no-op if that exercise hasn't actually
      // finished yet, or its celebration already resolved via "moved on").
      if (set.set_number === plannedSets) {
        resolveFinish(set.exercise_name);
      }
    } catch (error) {
      console.error('Error saving hardness:', error);
      setExerciseSets((current) => current.map((item) => (setKey(item) ? { ...item, hardness: previousScore } : item)));
    }
  };

  const addSet = async (gym: Exercise, exercise: Exercise) => {
    const current = setsForCard(exerciseSets, gym.name, exercise.name);
    if (current.length >= exercise.sets + EXTRA_SET_CAP) return;

    const lastCompleted = [...current].reverse().find((item) => item.is_completed);
    const source = lastCompleted ?? current[current.length - 1];
    const nextNumber = current.reduce((max, item) => Math.max(max, item.set_number), 0) + 1;
    const extra: ExerciseSet = {
      exercise_name: exercise.name,
      set_number: nextNumber,
      target_reps: exercise.reps,
      actual_reps: source?.actual_reps ?? null,
      weight_lbs: source?.weight_lbs ?? null,
      is_completed: false,
    };

    const lastIndex = exerciseSets.reduce(
      (found, item, index) => (setOnCard(item.exercise_name, gym.name, exercise.name) ? index : found),
      -1
    );
    const insertAt = lastIndex >= 0 ? lastIndex + 1 : exerciseSets.length;
    const nextSets = [...exerciseSets];
    nextSets.splice(insertAt, 0, extra);
    setExerciseSets(nextSets);
  };

  const removeSet = async (gym: Exercise, exercise: Exercise, set: ExerciseSet) => {
    if (set.is_completed || set.set_number <= exercise.sets) return;
    if (!setOnCard(set.exercise_name, gym.name, exercise.name)) return;

    setExerciseSets((currentSets) =>
      currentSets.filter(
        (item) =>
          !(
            setOnCard(item.exercise_name, gym.name, exercise.name) &&
            item.set_number === set.set_number
          )
      )
    );
    setEditingSet((current) =>
      current === `${set.exercise_name}-${set.set_number}` ? null : current
    );

    if (!set.id) return;

    try {
      const response = await fetch(`/api/exercises?id=${set.id}`, { method: 'DELETE' });
      if (!response.ok) {
        console.error('Error removing set:', await response.text());
      }
    } catch (error) {
      console.error('Error removing set:', error);
    }
  };

  const changeWeightUnit = (gymName: string, unit: WeightUnit) => {
    setWeightUnits((current) => {
      const next = { ...current, [gymName]: unit };
      writeExerciseUnits(next);
      return next;
    });
  };

  /** Alt Exercise swap (docs/plans/PLAN_ALT_EXERCISES.md) — replaces the whole movement, not
   * just its gym/travel variant, so it takes over `exercise_name` directly and clears any
   * Gym/Travel choice on this card (that toggle has nothing to apply to anymore). `altName`
   * null reverts to the original program exercise. */
  const changeExerciseAlt = async (gym: Exercise, altName: string | null) => {
    const nextAlts = { ...alts };
    if (altName) {
      nextAlts[gym.name] = altName;
    } else {
      delete nextAlts[gym.name];
    }
    setAlts(nextAlts);
    setModes((current) => {
      if (!(gym.name in current)) return current;
      const next = { ...current };
      delete next[gym.name];
      return next;
    });
    setEditingSet(null);
    setAltTakeoverFor(null);
    const previousAlt = alts[gym.name];
    const displayName = altName || gym.name;
    setExerciseSets((current) =>
      current.map((item) => {
        if (item.is_completed) return item;
        const onThisCard =
          setOnCard(item.exercise_name, gym.name, displayName) ||
          (previousAlt != null && item.exercise_name === previousAlt);
        if (!onThisCard) return item;
        // Drop copied weight/reps from the previous movement — a plank must not
        // keep Dead Bugs' "8" in the seconds field (or as the timer target).
        return { ...item, exercise_name: displayName, actual_reps: null, weight_lbs: null };
      })
    );
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, exerciseAlts: nextAlts }),
      });
      if (!response.ok) {
        console.error('Error saving exercise alt:', await response.text());
      }
    } catch (error) {
      console.error('Error saving exercise alt:', error);
    }
  };

  const groupedSets = exercises.map((gym) => {
    const altName = alts[gym.name];
    const mode = modes[gym.name] || defaultMode;
    const exercise = altName
      ? (() => {
          const template = canonicalProgramExercise(altName);
          return { ...gym, name: altName, reps: template?.reps ?? gym.reps };
        })()
      : applyExerciseMode(gym, mode);
    const sets = setsForCard(exerciseSets, gym.name, exercise.name);
    return { gym, exercise, mode, sets, locked: sets.some((item) => item.is_completed) };
  });
  const completedSetCount = exerciseSets.filter((item) => item.is_completed).length;
  const totalSetCount = exerciseSets.length;
  const allSetsComplete = totalSetCount > 0 && completedSetCount === totalSetCount;

  // Which card the Alt Exercise takeover is open for, if any — resolved once here rather
  // than inside the per-card map below, since the takeover itself renders once, outside it.
  const altTakeoverTarget = altTakeoverFor ? groupedSets.find((item) => item.gym.name === altTakeoverFor) : null;
  const altTakeoverGroup = altTakeoverTarget ? muscleGroupForExercise(altTakeoverTarget.gym.name) : null;

  return (
    <div className="space-y-6">
      {!setsReady ? (
        <p className="text-center text-lg font-black text-[#e8c547]">Loading...</p>
      ) : (
        groupedSets.map(({ gym, exercise, sets, locked }) => {
        const media = getExerciseMedia(exercise.name);
        const photos = getExerciseImages(exercise.name);
        const kind = kindFor(exercise);
        const unit = unitForExercise(gym.name, weightUnits);
        const lastWeek =
          history.lastWeekMax[exerciseHistoryKey(exercise.name)] ?? history.lastWeekMax[exercise.name];
        const completedWeights = sets
          .filter((item) => item.is_completed && item.weight_lbs != null)
          .map((item) => Number(item.weight_lbs));
        const currentMax = completedWeights.length ? Math.max(...completedWeights) : 0;
        const beatLastWeek = lastWeek != null && currentMax > lastWeek;
        const lastTime = lastBestFor(exercise.name, history);
        const how = howForExercise(exercise.name) || howForExercise(gym.name);
        // Next set the athlete should work on, for the gold "you're here" border.
        const activeSetNumber = sets.find((item) => !item.is_completed)?.set_number;
        // Once every planned set is done, the Gym/Travel + Lb/Kg toggles, the feedback
        // thumbs, the video thumbnail, and the start/end photos are no longer actionable —
        // hide them so the finished card reads as sets + KPIs, not leftover setup chrome.
        const plannedSets = sets.filter((item) => item.set_number <= exercise.sets);
        const exerciseFullyDone = plannedSets.length > 0 && plannedSets.every((item) => item.is_completed);

        // Alt Exercise (docs/plans/PLAN_ALT_EXERCISES.md): no control shown at all when there's
        // nothing to swap to — Cardio/Mobility/AMRAP entries have no curated shortlist.
        const altMuscleGroup = muscleGroupForExercise(gym.name);
        const altOptions = altsForExercise(gym.name);

        const celebrating = celebrateExercise === exercise.name;

        // Circuit training: consecutive cards sharing the same circuitGroup (e.g. a
        // sled push into walking lunges into a carry, one round) get a shared red
        // accent + step badge so they read as one grouped circuit, not unrelated
        // exercises — purely a label here, each card still logs its own sets as before.
        // The first card also spells out the 1x1x1 round-robin order in plain
        // language, since "Circuit · 1 of 3" alone reads like 3 separate exercises.
        const circuitGroup = exercise.circuitGroup;
        const circuitSiblings = circuitGroup
          ? groupedSets.filter((item) => item.exercise.circuitGroup === circuitGroup)
          : [];
        const circuitIndex = circuitGroup
          ? circuitSiblings.findIndex((item) => item.gym.name === gym.name)
          : -1;
        const circuitRounds = circuitSiblings[0]?.exercise.sets;
        const circuitOrder = circuitSiblings.map((item) => item.exercise.name).join(' → ');

        return (
          <div
            key={gym.name}
            className={`glass-card relative overflow-hidden p-5 ${celebrating ? 'exercise-card-pulse' : ''}`}
            style={circuitGroup ? { borderColor: 'rgba(228, 3, 46, 0.45)' } : undefined}
          >
            {celebrating && <div className="exercise-card-sweep pointer-events-none absolute inset-0" />}
            {circuitGroup && (
              <div className="mb-3 rounded-xl border border-[#e4032e]/35 bg-[#e4032e]/10 px-3 py-2">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5c6c]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e4032e]" />
                  {circuitGroup} · Step {circuitIndex + 1} of {circuitSiblings.length}
                </p>
                {circuitIndex === 0 && (
                  <p className="mt-1.5 text-xs font-semibold leading-snug text-[#f6f1e3]/80">
                    One round = one set of each, back to back, no rest between them:{' '}
                    <span className="text-white">{circuitOrder}</span>. Rest after the round, then repeat —{' '}
                    {circuitRounds} rounds total.
                  </p>
                )}
              </div>
            )}
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-start gap-1">
                  <h3 className="text-2xl font-black tracking-tight text-white">{exercise.name}</h3>
                  {isTravelFriendly(exercise.name) && (
                    <PlaneIcon className="mt-1.5 h-3.5 w-3.5 shrink-0 text-[#e8c547]" />
                  )}
                  {celebrating && (
                    <span className="exercise-title-stamp flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e8c547] bg-[#e8c547]/20 text-[#e8c547]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {how ? <HowTrigger notes={how} /> : null}
                </div>
                {!exerciseFullyDone && (
                  // One line at every width: target, Gym/Travel, Lb/Kg, and exercise-feedback thumbs together.
                  <div className="mt-2 mb-4 flex flex-nowrap items-center gap-1 overflow-hidden">
                    <span className="min-w-0 shrink truncate text-xs font-bold text-[#f6f1e3]/70">
                      {exercise.sets}×{exercise.reps}
                    </span>
                    {altMuscleGroup && altOptions.length > 0 && (
                      <AltButton
                        active={Boolean(alts[gym.name])}
                        locked={locked}
                        onClick={() => setAltTakeoverFor(gym.name)}
                      />
                    )}
                    <UnitToggle
                      unit={unitForExercise(gym.name, weightUnits)}
                      context={gym.name}
                      onChange={(next) => changeWeightUnit(gym.name, next)}
                    />
                    <ExerciseThumbs
                      sessionId={sessionId}
                      exerciseName={exercise.name}
                      saved={thumbs[exercise.name] || thumbs[gym.name]}
                      onSaved={(thumb) => setThumbs((current) => ({ ...current, [thumb.exerciseName]: thumb }))}
                    />
                  </div>
                )}
              </div>
              {!exerciseFullyDone && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveVideo({
                      title: exercise.name,
                      videoId: media.videoId,
                      videos: exerciseVideos(media),
                    })
                  }
                  className="relative h-14 w-16 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-[#e8c547]/35"
                  aria-label={`Watch ${exercise.name} video`}
                >
                  <img
                    src={youtubeThumbUrl(media.videoId)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="h-5 w-5 fill-white text-white" />
                  </span>
                </button>
              )}
            </div>

            {!exerciseFullyDone && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {photos ? (
                  <>
                    <figure className="overflow-hidden rounded-xl ring-1 ring-[#e8c547]/25">
                      <img
                        src={photos.start}
                        alt={`${exercise.name} start position`}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <figcaption className="bg-black/40 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#e8c547]">
                        Start
                      </figcaption>
                    </figure>
                    <figure className="overflow-hidden rounded-xl ring-1 ring-[#e8c547]/25">
                      <img
                        src={photos.end}
                        alt={`${exercise.name} end position`}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <figcaption className="bg-black/40 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#e8c547]">
                        End
                      </figcaption>
                    </figure>
                  </>
                ) : (
                  <>
                    <img
                      src={`/api/exercise-image?name=${encodeURIComponent(exercise.name)}&type=start&v=3`}
                      alt={`${exercise.name} start`}
                      className="aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-[#e8c547]/25"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <img
                      src={`/api/exercise-image?name=${encodeURIComponent(exercise.name)}&type=end&v=3`}
                      alt={`${exercise.name} end`}
                      className="aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-[#e8c547]/25"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </>
                )}
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              {lastTime && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#f6f1e3]/80">
                  {kind === 'timed'
                    ? `Last time: ${lastTime.actual_reps ?? 0}s`
                    : kind === 'distance'
                      ? `Last time: ${lastTime.actual_reps ?? 0}m${lastTime.weight_lbs ? ` @ ${lastTime.weight_lbs} lb` : ''}`
                      : `Last time: ${lastTime.weight_lbs ?? 0} lb × ${lastTime.actual_reps ?? 0}`}
                  {` · Effort ${parseHardness(lastTime.hardness) ?? DEFAULT_HARDNESS}`}
                </span>
              )}
              {lastWeek != null && lastWeek > 0 && !beatLastWeek && (
                <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  Last week: {lastWeek} lbs
                </span>
              )}
              {beatLastWeek && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">
                  Beat last week. Suggested next: {suggestedNextWeight(currentMax)} lbs
                </span>
              )}
            </div>

            <div className="space-y-4">
              {sets.map((set) => {
                const globalIndex = exerciseSets.findIndex(
                  (item) => item.exercise_name === set.exercise_name && item.set_number === set.set_number
                );
                const isEditing = editingSet === `${set.exercise_name}-${set.set_number}`;
                const isActive = !set.is_completed && set.set_number === activeSetNumber;
                // Weighted sets rate effort before Complete. Timed holds start the clock
                // first; How hard stays optional there (skip = Fair after the row folds).
                const ready =
                  canCompleteSet(kind, set.actual_reps, set.weight_lbs) &&
                  (kind === 'timed' || set.hardness != null);
                const isExtra = set.set_number > exercise.sets;
                const folded = set.is_completed && !isEditing;
                const completeButtonClass = set.is_completed
                  ? isEditing
                    ? 'bg-[#e8c547] text-[#1a1404]'
                    : 'bg-white/10 text-white/45'
                  : 'bg-[#e8c547] text-[#1a1404] disabled:bg-white/10 disabled:text-white/35';

                // A folded set collapses all the way to one line once it's rated, OR once
                // the athlete has clearly moved on without rating it — either a LATER set in
                // this same exercise has actually been COMPLETED (not merely queued up next —
                // `activeSetNumber` flips to the next set the instant this one completes, so
                // checking against it here would skip the rating prompt before it's ever seen),
                // or they've started completing sets in a different exercise entirely. Skipping
                // the vote still defaults to Fair (3) for the effort bar, same as elsewhere.
                const rowKey = `${set.exercise_name}-${set.set_number}`;
                const hardnessScore = parseHardness(set.hardness);
                const laterSetTouched = sets.some(
                  (item) => item.set_number > set.set_number && item.is_completed
                );
                const movedToOtherExercise = lastTouchedExercise != null && lastTouchedExercise !== exercise.name;
                const resolved = folded && (hardnessScore != null || laterSetTouched || movedToOtherExercise);

                return (
                  <div
                    key={rowKey}
                    className={`rounded-2xl border p-4 transition-all ${
                      folded
                        ? 'border-white/10 bg-white/[0.04]'
                        : isEditing || isActive
                          ? 'border-[#e8c547]/40 bg-black/25'
                          : 'border-white/10 bg-black/25'
                    }`}
                  >
                    {folded ? (
                      <div>
                        {/* Block A: header + How-hard widget — height-collapses away the instant
                            it's resolved, leaving just the one-line view below. Both this block
                            and Block B share one elastic easing curve so the fold reads as a
                            single springy swipe, not a rate-then-separately-collapse sequence. */}
                        <div
                          className="grid transition-[grid-template-rows] duration-700 delay-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                          style={{ gridTemplateRows: resolved ? '0fr' : '1fr' }}
                        >
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                                  Set {set.set_number}
                                </div>
                                <p className="mt-1 truncate text-xs font-semibold text-white/40">
                                  {setSummaryLabel(kind, set)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingSet(rowKey)}
                                className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black transition-colors ${completeButtonClass}`}
                              >
                                <Check className="h-4 w-4" />
                                Completed
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                            {!resolved && (
                              <SetHardness
                                value={hardnessScore}
                                highlight={hardnessScore == null}
                                // saveHardness applies the optimistic update itself (and rolls
                                // it back if the save fails), so the fold still plays right on
                                // release without a second copy of that logic here.
                                onPick={(score) => saveHardness(set, score, exercise.sets)}
                              />
                            )}
                          </div>
                        </div>

                        {/* Block B: the true one-line resolved view — grows in as Block A
                            collapses, so the row visibly shrinks into this line. */}
                        <div
                          className="grid transition-[grid-template-rows] duration-700 delay-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                          style={{ gridTemplateRows: resolved ? '1fr' : '0fr' }}
                        >
                          <div className="overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setEditingSet(rowKey)}
                              className="flex w-full items-center justify-between gap-3 pt-1 text-left"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                                Set {set.set_number} · {setSummaryLabel(kind, set)}
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <EffortBar score={hardnessScore ?? DEFAULT_HARDNESS} />
                                <ChevronDown className="h-4 w-4 text-white/40" />
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white">
                            Set {set.set_number}
                          </div>
                          {isExtra && !set.is_completed && (
                            <button
                              type="button"
                              onClick={() => removeSet(gym, exercise, set)}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-white/45 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#f6f1e3]/55">
                              {unit === 'kg'
                                ? kind === 'bodyweight'
                                  ? 'Weight kg (0 = BW)'
                                  : 'Weight (kg)'
                                : weightFieldLabel(kind)}
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={
                                set.weight_lbs == null
                                  ? ''
                                  : unit === 'kg'
                                    ? kgFromLbs(set.weight_lbs)
                                    : set.weight_lbs
                              }
                              onChange={(event) => {
                                const raw = parseMaybeNumber(event.target.value);
                                updateSet(globalIndex, {
                                  weight_lbs:
                                    raw == null ? null : unit === 'kg' ? lbsFromKg(raw) : raw,
                                });
                              }}
                              className="glass-input w-full"
                              placeholder="0"
                              disabled={set.is_completed && !isEditing}
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#f6f1e3]/55">
                              {primaryFieldLabel(kind)}
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={set.actual_reps ?? ''}
                              onChange={(event) =>
                                updateSet(globalIndex, { actual_reps: parseMaybeNumber(event.target.value) })
                              }
                              className="glass-input w-full"
                              placeholder={set.target_reps}
                              disabled={set.is_completed && !isEditing}
                            />
                          </div>
                        </div>

                        {kind === 'timed' && !set.is_completed && (
                          <button
                            type="button"
                            onClick={() =>
                              setTimedTimer({
                                index: globalIndex,
                                target: parseTimedTarget(exercise.reps, exercise.name),
                                gym,
                                exercise,
                              })
                            }
                            className="mt-3 mb-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 text-base font-black text-white"
                          >
                            <Play className="h-5 w-5" />
                            Start timer
                          </button>
                        )}

                        {/* Weighted sets rate effort here before Complete. Timed holds put
                            the clock above this slider and leave the vote optional — after
                            Stop folds the row, an unrated set still gets the skippable
                            folded prompt. Reopening via "Editing" reuses this widget. */}
                        <SetHardness
                          value={hardnessScore}
                          forceEditable
                          highlight={kind !== 'timed' && !set.is_completed && hardnessScore == null}
                          onPick={(score) =>
                            set.is_completed
                              ? saveHardness(set, score, exercise.sets)
                              : updateSet(globalIndex, { hardness: score })
                          }
                        />

                        <button
                          type="button"
                          onClick={() => {
                            if (set.is_completed) {
                              setEditingSet(isEditing ? null : `${set.exercise_name}-${set.set_number}`);
                            } else {
                              completeSet(globalIndex, gym, exercise);
                            }
                          }}
                          disabled={!set.is_completed && !ready}
                          className={`mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-black transition-colors ${completeButtonClass}`}
                        >
                          {set.is_completed ? (
                            <>
                              <Edit2 className="h-5 w-5" />
                              Editing
                            </>
                          ) : (
                            <>
                              <Check className="h-6 w-6" />
                              Complete Set
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}

              {(() => {
                const lastDone = [...sets].reverse().find((item) => item.is_completed);
                if (!lastDone) return null;
                const key = exerciseHistoryKey(exercise.name);

                // Set N History / Avg Effective: the historical average for this exact set
                // position, folded live with today's own set the instant it completes. An extra
                // set beyond the plan (Set 4, 5, ...) with no history of its own borrows the last
                // planned set's average instead of dashing — it's more of the same work, not a
                // brand-new position. Only a genuinely untracked position (or a first-ever session
                // on this exercise) stays dashed.
                const beforeStats = setNumberStatsFor(history.setNumberHistory, key, lastDone.set_number, exercise.sets);
                const afterStats = beforeStats ? foldSetIntoHistory(beforeStats, lastDone) : null;

                const historyLabel = afterStats
                  ? `${Math.round(afterStats.weightAvg)} × ${Math.round(afterStats.repAvg * 10) / 10}`
                  : null;
                const historySub = beforeStats
                  ? `← ${Math.round(beforeStats.weightAvg)} lb × ${Math.round(beforeStats.hardnessAvg * 10) / 10} PE`
                  : 'no past sets yet';
                const historyDelta = afterStats ? tileDelta(afterStats.weightAvg, beforeStats!.weightAvg) : null;

                const effectiveValue = afterStats ? afterStats.effectiveAvg : null;
                const effectiveSub = beforeStats
                  ? `avg of ${beforeStats.count} past set${beforeStats.count === 1 ? '' : 's'}`
                  : 'no past sets yet';
                const effectiveDelta = afterStats
                  ? tileDelta(afterStats.effectiveAvg, beforeStats!.effectiveAvg)
                  : null;

                // Best: the true all-time max ever logged for this movement, at ANY set
                // position — not just this slot's value from the last session. If today's own
                // set now beats it, the tile flips to today's number with a "New PR" subtitle;
                // otherwise it keeps showing the standing max, captioned with which set and
                // session it came from (formatWhen returns null for a still-open session, i.e.
                // `done_at: null`, so that reads as "this session" instead of a bad date).
                const allTimeBest = history.bestSets[key] || history.bestSets[exercise.name] || null;
                const bestBeaten =
                  !allTimeBest ||
                  Number(lastDone.weight_lbs ?? 0) > Number(allTimeBest.weight_lbs ?? 0) ||
                  (Number(lastDone.weight_lbs ?? 0) === Number(allTimeBest.weight_lbs ?? 0) &&
                    Number(lastDone.actual_reps ?? 0) > Number(allTimeBest.actual_reps ?? 0));
                const bestLabel = allTimeBest
                  ? setSummaryLabel(kind, bestBeaten ? lastDone : allTimeBest)
                  : bestBeaten
                    ? setSummaryLabel(kind, lastDone)
                    : null;
                const bestSub = bestBeaten
                  ? allTimeBest
                    ? 'New PR'
                    : 'First set logged'
                  : `Set ${allTimeBest!.set_number} · ${formatWhen(allTimeBest!.done_at) ?? 'this session'}`;
                const bestDelta =
                  bestBeaten && allTimeBest ? tileDelta(Number(lastDone.weight_lbs ?? 0), Number(allTimeBest.weight_lbs ?? 0)) : null;

                // Volume: average (weight × reps) per completed set of this exercise today so far.
                const volumeValues = sets
                  .filter((item) => item.is_completed)
                  .map((item) => setVolume(item.exercise_name, item.target_reps, item.weight_lbs, item.actual_reps));
                const volumeAvg = volumeValues.reduce((sum, value) => sum + value, 0) / volumeValues.length;
                const volumeBeforeAvg =
                  volumeValues.length > 1
                    ? volumeValues.slice(0, -1).reduce((sum, value) => sum + value, 0) / (volumeValues.length - 1)
                    : null;
                const volumeDelta = tileDelta(volumeAvg, volumeBeforeAvg);

                return (
                  <LiveSetKpis
                    setNumber={lastDone.set_number}
                    historyLabel={historyLabel}
                    historySub={historySub}
                    historyDelta={historyDelta}
                    effectiveValue={effectiveValue}
                    effectiveSub={effectiveSub}
                    effectiveDelta={effectiveDelta}
                    bestLabel={bestLabel}
                    bestSub={bestSub}
                    bestDelta={bestDelta}
                    volumeAvg={volumeAvg}
                    volumeDelta={volumeDelta}
                  />
                );
              })()}

              {sets.length < exercise.sets + EXTRA_SET_CAP && (
                <button
                  type="button"
                  onClick={() => addSet(gym, exercise)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 text-sm font-bold text-white/70 hover:border-[#e8c547]/40 hover:text-[#e8c547]"
                >
                  <Plus className="h-4 w-4" />
                  Add set
                </button>
              )}
            </div>
          </div>
        );
      })
      )}

      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e8c547]">
            Workout Progress
          </span>
          <span className="text-3xl font-black text-[#f5d76e]">
            {completedSetCount} / {totalSetCount}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[#e8c547] transition-all duration-300"
            style={{
              width: `${totalSetCount ? (completedSetCount / totalSetCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <SetRestTimer
        startToken={restToken}
        line={restLine}
        cancelled={allSetsComplete}
        completedSets={completedSetCount}
        totalSets={totalSetCount}
        seconds={restSeconds}
        onBannerChange={onRestBannerChange}
      />

      <TimedSetTimer
        open={!!timedTimer}
        targetSeconds={timedTimer?.target ?? 45}
        onCancel={() => setTimedTimer(null)}
        onStop={(heldSeconds) => {
          if (timedTimer) {
            // Stop both records the hold and completes the set in one action.
            completeSet(timedTimer.index, timedTimer.gym, timedTimer.exercise, heldSeconds);
          }
          setTimedTimer(null);
        }}
      />

      <VideoModal
        open={!!activeVideo}
        title={activeVideo?.title || ''}
        videoId={activeVideo?.videoId || ''}
        videos={activeVideo?.videos}
        how={activeVideo ? howForExercise(activeVideo.title) : null}
        onClose={() => setActiveVideo(null)}
      />

      {altTakeoverTarget && altTakeoverGroup && (
        <AltExerciseTakeover
          open
          exerciseName={altTakeoverTarget.exercise.name}
          muscleGroup={altTakeoverGroup}
          alternatives={altsForExercise(altTakeoverTarget.gym.name)}
          onSelect={(name) => changeExerciseAlt(altTakeoverTarget.gym, name)}
          onClose={() => setAltTakeoverFor(null)}
        />
      )}

    </div>
  );
});

export default ExerciseTracker;
