'use client';

import { useState, useEffect } from 'react';
import { Check, Edit2, Play } from 'lucide-react';
import SetRestTimer from './SetRestTimer';
import TimedSetTimer from './TimedSetTimer';
import { pickCoachLine, setProgressCopy } from '@/lib/coachLines';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { playSetChime, unlockAudio } from '@/lib/playChime';
import VideoModal from './VideoModal';
import PrFlash from './PrFlash';
import SetProgressFlash from './SetProgressFlash';
import { exerciseVideos, getExerciseMedia, youtubeThumbUrl } from '@/lib/exerciseMedia';
import { getExerciseImages } from '@/lib/exerciseImages';
import {
  canCompleteSet,
  getExerciseKind,
  parseTimedTarget,
  primaryFieldLabel,
  suggestedNextWeight,
  weightFieldLabel,
  type ExerciseKind,
} from '@/lib/exerciseKind';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
}

interface ExerciseSet {
  id?: number;
  exercise_name: string;
  set_number: number;
  target_reps: string;
  actual_reps: number | null;
  weight_lbs: number | null;
  is_completed: boolean;
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
  coachTone?: CoachTone | string | null;
  onComplete?: () => void;
}

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

function priorSetFor(
  exerciseName: string,
  setNumber: number,
  currentSets: ExerciseSet[],
  history: HistoryPayload
): { weight_lbs: number | null; actual_reps: number | null } | null {
  if (setNumber > 1) {
    const previous = currentSets.find(
      (item) =>
        item.exercise_name === exerciseName &&
        item.set_number === setNumber - 1 &&
        item.is_completed
    );
    if (previous) {
      return { weight_lbs: previous.weight_lbs, actual_reps: previous.actual_reps };
    }
  }

  const last = history.lastSets[exerciseName];
  if (!last?.length) return null;
  const match = last.find((item) => item.set_number === setNumber) ?? last[0];
  return { weight_lbs: match.weight_lbs, actual_reps: match.actual_reps };
}

function setDirection(
  kind: ExerciseKind,
  current: { weight_lbs: number | null; actual_reps: number | null },
  prior: { weight_lbs: number | null; actual_reps: number | null } | null
): 'up' | 'down' | null {
  if (!prior) return null;

  const currentReps = current.actual_reps ?? 0;
  const priorReps = prior.actual_reps ?? 0;

  if (kind === 'timed' || kind === 'distance') {
    if (currentReps > priorReps) return 'up';
    if (currentReps < priorReps) return 'down';
    return null;
  }

  const currentWeight = current.weight_lbs ?? 0;
  const priorWeight = prior.weight_lbs ?? 0;
  const weightUp = currentWeight > priorWeight;
  const weightDown = currentWeight < priorWeight;
  const repsUp = currentReps > priorReps;
  const repsDown = currentReps < priorReps;

  if ((weightUp || repsUp) && !weightDown && !repsDown) return 'up';
  if ((weightDown || repsDown) && !weightUp && !repsUp) return 'down';
  return null;
}

export default function ExerciseTracker({
  sessionId,
  weekNumber,
  exercises,
  coachTone,
  onComplete,
}: ExerciseTrackerProps) {
  const tone = normalizeCoachTone(coachTone);
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [editingSet, setEditingSet] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{
    title: string;
    videoId: string;
    videos: ReturnType<typeof exerciseVideos>;
  } | null>(null);
  const [restToken, setRestToken] = useState(0);
  const [restLine, setRestLine] = useState('Finish it. Make me proud.');
  const [timedTimer, setTimedTimer] = useState<{ index: number; target: number } | null>(null);
  const [history, setHistory] = useState<HistoryPayload>({ lastSets: {}, lastWeekMax: {}, personalRecords: {} });
  const [prFlash, setPrFlash] = useState<{ exerciseName: string; valueLabel: string } | null>(null);
  const [setFlash, setSetFlash] = useState<{ variant: 'up' | 'down'; title: string; body: string } | null>(null);

  useEffect(() => {
    const template: ExerciseSet[] = [];
    exercises.forEach((exercise) => {
      for (let i = 1; i <= exercise.sets; i++) {
        template.push({
          exercise_name: exercise.name,
          set_number: i,
          target_reps: exercise.reps,
          actual_reps: null,
          weight_lbs: null,
          is_completed: false,
        });
      }
    });

    let cancelled = false;

    const load = async () => {
      const [existingRes, historyRes] = await Promise.all([
        fetch(`/api/exercises?sessionId=${sessionId}`),
        fetch(`/api/exercises?history=1&weekNumber=${weekNumber}&sessionId=${sessionId}`),
      ]);

      let saved: any[] = [];
      if (existingRes.ok) {
        const data = await existingRes.json();
        saved = data.sets || [];
      }

      let historyData: HistoryPayload = { lastSets: {}, lastWeekMax: {}, personalRecords: {} };
      if (historyRes.ok) {
        historyData = await historyRes.json();
      }

      if (cancelled) return;
      setHistory(historyData);

      const merged = template.map((slot) => {
        const found = saved.find(
          (row: any) =>
            row.exercise_name === slot.exercise_name && Number(row.set_number) === slot.set_number
        );

        if (found) {
          return {
            ...slot,
            id: found.id,
            actual_reps: asNumber(found.actual_reps),
            weight_lbs: asNumber(found.weight_lbs),
            is_completed: Boolean(Number(found.is_completed)),
            notes: found.notes,
          };
        }

        const last = historyData.lastSets[slot.exercise_name]?.find(
          (item) => item.set_number === slot.set_number
        );
        if (last) {
          return {
            ...slot,
            actual_reps: last.actual_reps,
            weight_lbs: last.weight_lbs,
          };
        }

        return slot;
      });

      setExerciseSets(merged);
    };

    load().catch((error) => {
      console.error('Error loading sets:', error);
      if (!cancelled) setExerciseSets(template);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId, weekNumber, exercises]);

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
          item.exercise_name === updatedSet.exercise_name &&
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
      const saved = await persistSet(updatedSet);
      if (saved.id !== updatedSet.id) {
        setExerciseSets((current) => {
          const copy = [...current];
          copy[index] = { ...copy[index], id: saved.id };
          return copy;
        });
      }

      if (options?.copyForward) {
        const next = newSets.find(
          (item, itemIndex) =>
            itemIndex > index &&
            item.exercise_name === updatedSet.exercise_name &&
            !item.is_completed &&
            item.actual_reps === updatedSet.actual_reps &&
            item.weight_lbs === updatedSet.weight_lbs
        );
        if (next) {
          persistSet(next).catch((error) => console.error('Error copying set:', error));
        }
      }

      if (options?.startRest) {
        const remaining = newSets.filter((item) => !item.is_completed).length;
        if (remaining > 0) {
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
    const record = history.personalRecords[exercise.name] || { weight: 0, reps: 0 };
    const isWeightPr = kind !== 'timed' && kind !== 'distance' && weight > 0 && weight > record.weight;
    const isTimedPr = (kind === 'timed' || kind === 'distance') && reps > record.reps && record.reps > 0;

    const prior = priorSetFor(exercise.name, set.set_number, exerciseSets, history);
    const direction = setDirection(kind, set, prior);
    if (direction) {
      const copy = setProgressCopy(direction, tone);
      setSetFlash({ variant: direction, title: copy.title, body: copy.body });
    } else if (isWeightPr || isTimedPr) {
      setPrFlash({
        exerciseName: exercise.name,
        valueLabel: isWeightPr ? `${weight} lbs` : `${reps} ${kind === 'timed' ? 'sec' : 'm'}`,
      });
    }

    if (isWeightPr || isTimedPr) {
      setHistory((current) => ({
        ...current,
        personalRecords: {
          ...current.personalRecords,
          [exercise.name]: {
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

  const groupedSets = exercises.map((exercise) => {
    const sets = exerciseSets.filter((item) => item.exercise_name === exercise.name);
    return { exercise, sets };
  });
  const allSetsComplete =
    exerciseSets.length > 0 && exerciseSets.every((item) => item.is_completed);

  return (
    <div className="space-y-6 pb-28">
      {groupedSets.map(({ exercise, sets }) => {
        const media = getExerciseMedia(exercise.name);
        const photos = getExerciseImages(exercise.name);
        const kind = kindFor(exercise);
        const lastWeek = history.lastWeekMax[exercise.name];
        const completedWeights = sets
          .filter((item) => item.is_completed && item.weight_lbs != null)
          .map((item) => Number(item.weight_lbs));
        const currentMax = completedWeights.length ? Math.max(...completedWeights) : 0;
        const beatLastWeek = lastWeek != null && currentMax > lastWeek;
        const lastTime = history.lastSets[exercise.name]?.[0];

        return (
          <div key={exercise.name} className="glass-card p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white">{exercise.name}</h3>
                <p className="mt-1 text-sm text-[#f6f1e3]/70">
                  Target: {exercise.sets} sets × {exercise.reps}
                </p>
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

                return (
                  <div
                    key={`${set.exercise_name}-${set.set_number}`}
                    className={`rounded-2xl border p-4 transition-all ${
                      set.is_completed
                        ? 'border-white/50 bg-white/10'
                        : 'border-white/10 bg-black/25'
                    }`}
                  >
                    <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                      Set {set.set_number}
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#f6f1e3]/55">
                          {weightFieldLabel(kind)}
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.weight_lbs ?? ''}
                          onChange={(event) =>
                            updateSet(globalIndex, { weight_lbs: parseMaybeNumber(event.target.value) })
                          }
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
                      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-black transition-colors ${
                        set.is_completed
                          ? 'bg-[#e8c547] text-[#1a1404]'
                          : 'bg-[#e8c547] text-[#1a1404] disabled:bg-white/10 disabled:text-white/35'
                      }`}
                    >
                      {set.is_completed ? (
                        isEditing ? (
                          <>
                            <Edit2 className="h-5 w-5" />
                            Editing
                          </>
                        ) : (
                          <>
                            <Check className="h-6 w-6" />
                            Completed
                          </>
                        )
                      ) : (
                        <>
                          <Check className="h-6 w-6" />
                          Complete Set
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e8c547]">
            Workout Progress
          </span>
          <span className="text-3xl font-black text-[#f5d76e]">
            {exerciseSets.filter((item) => item.is_completed).length} / {exerciseSets.length}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[#e8c547] transition-all duration-300"
            style={{
              width: `${exerciseSets.length
                ? (exerciseSets.filter((item) => item.is_completed).length / exerciseSets.length) * 100
                : 0}%`,
            }}
          />
        </div>
      </div>

      <SetRestTimer startToken={restToken} line={restLine} cancelled={allSetsComplete} />

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
        open={!!prFlash && !setFlash}
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
