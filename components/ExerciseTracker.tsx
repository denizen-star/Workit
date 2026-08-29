'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronDown, Edit2, Play, Plus, Trash2 } from 'lucide-react';
import SetRestTimer from './SetRestTimer';
import TimedSetTimer from './TimedSetTimer';
import ModeToggle from './ModeToggle';
import UnitToggle from './UnitToggle';
import { pickCoachLine, setProgressCopy, hardnessCopy } from '@/lib/coachLines';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { exerciseHistoryKey, sameExerciseMovement } from '@/lib/exerciseKey';
import { modeForExercise, parseExerciseModes, type ExerciseModeMap } from '@/lib/exerciseModes';
import { applyExerciseMode, type Exercise as ProgramExercise } from '@/lib/workoutData';
import { normalizeWorkoutMode, type WorkoutMode } from '@/lib/workoutMode';
import { parseHardness, type HardnessScore } from '@/lib/hardness';
import { playSetChime, unlockAudio } from '@/lib/playChime';
import ExerciseThumbs, { type ExerciseThumb } from './ExerciseThumbs';
import VideoModal from './VideoModal';
import PrFlash from './PrFlash';
import SetProgressFlash from './SetProgressFlash';
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
  suggestedNextWeight,
  weightFieldLabel,
  type ExerciseKind,
} from '@/lib/exerciseKind';
import { bestLoggedSet, setDirection } from '@/lib/setHistory';
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

type Exercise = Pick<ProgramExercise, 'name' | 'sets' | 'reps' | 'notes'>;

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
  lastSets: Record<string, Array<{ set_number: number; weight_lbs: number | null; actual_reps: number | null }>>;
  lastWeekMax: Record<string, number>;
  personalRecords: Record<string, { weight: number; reps: number }>;
}

interface ExerciseTrackerProps {
  sessionId: number;
  weekNumber: number;
  exercises: Exercise[];
  sessionMode?: WorkoutMode | string | null;
  coachTone?: CoachTone | string | null;
  restExtraMinutes?: number;
  onComplete?: () => void;
  onTotals?: (totals: { lbs: number; reps: number }) => void;
}

const EXTRA_SET_CAP = 5;

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

function setsForMovement(sets: ExerciseSet[], name: string) {
  return sets.filter((item) => sameExerciseMovement(item.exercise_name, name));
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
      sameExerciseMovement(item.exercise_name, exerciseName) &&
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
): Array<{ set_number: number; weight_lbs: number | null; actual_reps: number | null }> {
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

export default function ExerciseTracker({
  sessionId,
  weekNumber,
  exercises,
  sessionMode,
  coachTone,
  restExtraMinutes = 0,
  onComplete,
  onTotals,
}: ExerciseTrackerProps) {
  const tone = normalizeCoachTone(coachTone);
  const defaultMode = normalizeWorkoutMode(sessionMode);
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [modes, setModes] = useState<ExerciseModeMap>({});
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
  const [timedTimer, setTimedTimer] = useState<{ index: number; target: number } | null>(null);
  const [history, setHistory] = useState<HistoryPayload>({ lastSets: {}, lastWeekMax: {}, personalRecords: {} });
  const [prFlash, setPrFlash] = useState<{ exerciseName: string; valueLabel: string } | null>(null);
  const [setFlash, setSetFlash] = useState<{
    variant: 'up' | 'down' | 'call';
    title: string;
    body: string;
  } | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, ExerciseThumb>>({});

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
      if (existingRes.ok) {
        const data = await existingRes.json();
        saved = data.sets || [];
        storedModes = parseExerciseModes(data.exerciseModes ?? data.exercise_modes);
      }

      let historyData: HistoryPayload = { lastSets: {}, lastWeekMax: {}, personalRecords: {} };
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

      const template: ExerciseSet[] = [];
      exercises.forEach((gym) => {
        const exercise = applyExerciseMode(gym, nextModes[gym.name] || defaultMode);
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

      const merged = template.map((slot) => {
        const found = saved.find(
          (row: any) =>
            sameExerciseMovement(row.exercise_name, slot.exercise_name) &&
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
            ...slot,
            id: found.id,
            exercise_name: completed ? found.exercise_name : slot.exercise_name,
            actual_reps,
            weight_lbs,
            is_completed: completed,
            notes: found.notes,
            hardness: parseHardness(found.hardness),
          };
        }

        if (slot.set_number === 1 && lastBest) {
          return {
            ...slot,
            actual_reps: lastBest.actual_reps,
            weight_lbs: lastBest.weight_lbs,
          };
        }

        return slot;
      });

      const extras: ExerciseSet[] = [];
      for (const gym of exercises) {
        const extraRows = saved
          .filter(
            (row: any) =>
              sameExerciseMovement(row.exercise_name, gym.name) && Number(row.set_number) > gym.sets
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
      const nextIndex = newSets.findIndex(
        (item, itemIndex) =>
          itemIndex > index &&
          sameExerciseMovement(item.exercise_name, updatedSet.exercise_name) &&
          !item.is_completed &&
          item.actual_reps == null &&
          item.weight_lbs == null
      );
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
          setRestLine(pickCoachLine(completed, newSets.length, tone));
          setRestToken((token) => token + 1);
        }
      }

      const allCompleted = newSets.length > 0 && newSets.every((item) => item.is_completed);
      if (allCompleted && onComplete) onComplete();
    } catch (error) {
      console.error('Error saving set:', error);
    }
  };

  const kindFor = (exercise: Exercise): ExerciseKind => getExerciseKind(exercise.name, exercise.reps);

  const completeSet = (index: number, exercise: Exercise) => {
    const set = exerciseSets[index];
    const kind = kindFor(exercise);
    if (!canCompleteSet(kind, set.actual_reps, set.weight_lbs)) return;

    unlockAudio();
    playSetChime();

    const weight = set.weight_lbs ?? 0;
    const reps = set.actual_reps ?? 0;
    const record =
      history.personalRecords[exerciseHistoryKey(exercise.name)] ||
      history.personalRecords[exercise.name] ||
      { weight: 0, reps: 0 };
    const isWeightPr = kind !== 'timed' && kind !== 'distance' && weight > 0 && weight > record.weight;
    const isTimedPr = (kind === 'timed' || kind === 'distance') && reps > record.reps && record.reps > 0;

    const prior = priorSetFor(exercise.name, set.set_number, exerciseSets, history);
    const direction = setDirection(set, prior);
    if (isWeightPr || isTimedPr) {
      setPrFlash({
        exerciseName: exercise.name,
        valueLabel: isWeightPr ? `${weight} lbs` : `${reps} ${kind === 'timed' ? 'sec' : 'm'}`,
      });
    } else if (direction) {
      const copy = setProgressCopy(direction, tone);
      setSetFlash({ variant: direction, title: copy.title, body: copy.body });
    }

    if (isWeightPr || isTimedPr) {
      setHistory((current) => ({
        ...current,
        personalRecords: {
          ...current.personalRecords,
          [exerciseHistoryKey(exercise.name)]: {
            weight: Math.max(record.weight, weight),
            reps: Math.max(record.reps, reps),
          },
        },
      }));
    }

    updateSet(
      index,
      { is_completed: true, weight_lbs: set.weight_lbs ?? 0, actual_reps: set.actual_reps },
      { copyForward: true, startRest: true }
    );
  };

  const saveHardness = async (set: ExerciseSet, score: HardnessScore) => {
    if (parseHardness(set.hardness) != null) return;
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
      const locked = parseHardness(data?.hardness);
      if (!response.ok && response.status !== 409) return;
      const nextScore = locked ?? score;
      setExerciseSets((current) =>
        current.map((item) =>
          item.exercise_name === set.exercise_name && item.set_number === set.set_number
            ? { ...item, hardness: nextScore, id: data?.setId || item.id }
            : item
        )
      );
      const copy = hardnessCopy(nextScore, tone);
      setSetFlash({ variant: 'call', title: copy.title, body: copy.body });
    } catch (error) {
      console.error('Error saving hardness:', error);
    }
  };

  const addSet = async (exercise: Exercise) => {
    const current = setsForMovement(exerciseSets, exercise.name);
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
      (found, item, index) => (sameExerciseMovement(item.exercise_name, exercise.name) ? index : found),
      -1
    );
    const insertAt = lastIndex >= 0 ? lastIndex + 1 : exerciseSets.length;
    const nextSets = [...exerciseSets];
    nextSets.splice(insertAt, 0, extra);
    setExerciseSets(nextSets);
  };

  const removeSet = async (exercise: Exercise, set: ExerciseSet) => {
    if (set.is_completed || set.set_number <= exercise.sets) return;

    setExerciseSets((currentSets) =>
      currentSets.filter(
        (item) => !(item.exercise_name === set.exercise_name && item.set_number === set.set_number)
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

  const changeExerciseMode = async (gym: Exercise, next: WorkoutMode) => {
    const display = applyExerciseMode(gym, next);
    const nextModes = { ...modes, [gym.name]: next };
    setModes(nextModes);
    setEditingSet(null);
    setExerciseSets((current) =>
      current.map((item) => {
        if (!sameExerciseMovement(item.exercise_name, gym.name) || item.is_completed) return item;
        return { ...item, exercise_name: display.name };
      })
    );
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, exerciseModes: nextModes }),
      });
      if (!response.ok) {
        console.error('Error saving exercise mode:', await response.text());
      }
    } catch (error) {
      console.error('Error saving exercise mode:', error);
    }
  };

  const groupedSets = exercises.map((gym) => {
    const mode = modes[gym.name] || defaultMode;
    const exercise = applyExerciseMode(gym, mode);
    const sets = setsForMovement(exerciseSets, gym.name);
    return { gym, exercise, mode, sets, locked: sets.some((item) => item.is_completed) };
  });
  const completedSetCount = exerciseSets.filter((item) => item.is_completed).length;
  const totalSetCount = exerciseSets.length;
  const allSetsComplete = totalSetCount > 0 && completedSetCount === totalSetCount;

  return (
    <div className="space-y-6">
      {!setsReady ? (
        <p className="text-center text-lg font-black text-[#e8c547]">Loading...</p>
      ) : (
        groupedSets.map(({ gym, exercise, mode, sets, locked }) => {
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

        return (
          <div key={gym.name} className="glass-card p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-2xl font-black tracking-tight text-white">{exercise.name}</h3>
                <p className="mt-1 text-sm text-[#f6f1e3]/70">
                  Target: {exercise.sets} sets × {exercise.reps}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ModeToggle
                    mode={mode}
                    locked={locked}
                    context={gym.name}
                    onChange={(next) => changeExerciseMode(gym, next)}
                  />
                  <UnitToggle
                    unit={unitForExercise(gym.name, weightUnits)}
                    context={gym.name}
                    onChange={(next) => changeWeightUnit(gym.name, next)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveVideo({
                    title: exercise.name,
                    videoId: media.videoId,
                    videos: exerciseVideos(media),
                  })
                }
                className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-[#e8c547]/35"
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
            </div>

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

            <ExerciseThumbs
              sessionId={sessionId}
              exerciseName={exercise.name}
              saved={thumbs[exercise.name] || thumbs[gym.name]}
              onSaved={(thumb) => setThumbs((current) => ({ ...current, [thumb.exerciseName]: thumb }))}
            />

            {exercise.notes && (
              <p className="mb-4 text-sm italic text-white/90">{exercise.notes}</p>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              {lastTime && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#f6f1e3]/80">
                  {kind === 'timed'
                    ? `Last time: ${lastTime.actual_reps ?? 0}s`
                    : kind === 'distance'
                      ? `Last time: ${lastTime.actual_reps ?? 0}m${lastTime.weight_lbs ? ` @ ${lastTime.weight_lbs} lb` : ''}`
                      : `Last time: ${lastTime.weight_lbs ?? 0} lb × ${lastTime.actual_reps ?? 0}`}
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
                const ready = canCompleteSet(kind, set.actual_reps, set.weight_lbs);
                const isExtra = set.set_number > exercise.sets;
                const folded = set.is_completed && !isEditing;
                const completeButtonClass = set.is_completed
                  ? isEditing
                    ? 'bg-[#e8c547] text-[#1a1404]'
                    : 'bg-white/10 text-white/45'
                  : 'bg-[#e8c547] text-[#1a1404] disabled:bg-white/10 disabled:text-white/35';

                return (
                  <div
                    key={`${set.exercise_name}-${set.set_number}`}
                    className={`rounded-2xl border p-4 transition-all ${
                      folded
                        ? 'border-white/10 bg-white/[0.04]'
                        : isEditing
                          ? 'border-[#e8c547]/40 bg-black/25'
                          : 'border-white/10 bg-black/25'
                    }`}
                  >
                    {folded ? (
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-black uppercase tracking-[0.2em] text-white/45">
                              Set {set.set_number}
                            </div>
                            <p className="mt-1 truncate text-sm font-semibold text-white/40">
                              {setSummaryLabel(kind, set)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingSet(`${set.exercise_name}-${set.set_number}`)}
                            className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition-colors ${completeButtonClass}`}
                          >
                            <Check className="h-4 w-4" />
                            Completed
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <SetHardness
                          value={parseHardness(set.hardness)}
                          onPick={(score) => saveHardness(set, score)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-black uppercase tracking-[0.2em] text-white">
                            Set {set.set_number}
                          </div>
                          {isExtra && !set.is_completed && (
                            <button
                              type="button"
                              onClick={() => removeSet(exercise, set)}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-white/45 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#f6f1e3]/55">
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
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#f6f1e3]/55">
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
                                target: parseTimedTarget(exercise.reps),
                              })
                            }
                            className="mb-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 text-lg font-black text-white"
                          >
                            <Play className="h-5 w-5" />
                            Start timer
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (set.is_completed) {
                              setEditingSet(isEditing ? null : `${set.exercise_name}-${set.set_number}`);
                            } else {
                              completeSet(globalIndex, exercise);
                            }
                          }}
                          disabled={!set.is_completed && !ready}
                          className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-black transition-colors ${completeButtonClass}`}
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

              {sets.length < exercise.sets + EXTRA_SET_CAP && (
                <button
                  type="button"
                  onClick={() => addSet(exercise)}
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
      />

      <TimedSetTimer
        open={!!timedTimer}
        targetSeconds={timedTimer?.target ?? 45}
        onCancel={() => setTimedTimer(null)}
        onStop={(heldSeconds) => {
          if (timedTimer) {
            updateSet(timedTimer.index, { actual_reps: heldSeconds });
          }
          setTimedTimer(null);
        }}
      />

      <VideoModal
        open={!!activeVideo}
        title={activeVideo?.title || ''}
        videoId={activeVideo?.videoId || ''}
        videos={activeVideo?.videos}
        onClose={() => setActiveVideo(null)}
      />

      <PrFlash
        open={!!prFlash}
        exerciseName={prFlash?.exerciseName || ''}
        valueLabel={prFlash?.valueLabel || ''}
        onClose={() => setPrFlash(null)}
      />

      <SetProgressFlash
        open={!!setFlash}
        title={setFlash?.title || ''}
        body={setFlash?.body || ''}
        variant={setFlash?.variant || 'up'}
        onClose={() => setSetFlash(null)}
      />
    </div>
  );
}
