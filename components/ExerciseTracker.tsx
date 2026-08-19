'use client';

import { useState, useEffect } from 'react';
import { Check, Edit2, Play } from 'lucide-react';
import SetRestTimer from './SetRestTimer';
import VideoModal from './VideoModal';
import { getExerciseMedia, youtubeThumbUrl } from '@/lib/exerciseMedia';

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

interface ExerciseTrackerProps {
  sessionId: number;
  exercises: Exercise[];
  onComplete?: () => void;
}

export default function ExerciseTracker({ sessionId, exercises, onComplete }: ExerciseTrackerProps) {
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [editingSet, setEditingSet] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ title: string; videoId: string } | null>(null);

  useEffect(() => {
    const sets: ExerciseSet[] = [];
    exercises.forEach(exercise => {
      for (let i = 1; i <= exercise.sets; i++) {
        sets.push({
          exercise_name: exercise.name,
          set_number: i,
          target_reps: exercise.reps,
          actual_reps: null,
          weight_lbs: null,
          is_completed: false
        });
      }
    });
    setExerciseSets(sets);
    loadExistingSets();
  }, [exercises]);

  const loadExistingSets = async () => {
    try {
      const response = await fetch(`/api/exercises?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.sets && data.sets.length > 0) {
          setExerciseSets(data.sets);
        }
      }
    } catch (error) {
      console.error('Error loading sets:', error);
    }
  };

  const updateSet = async (index: number, updates: Partial<ExerciseSet>) => {
    const updatedSet = { ...exerciseSets[index], ...updates };
    const newSets = [...exerciseSets];
    newSets[index] = updatedSet;
    setExerciseSets(newSets);

    try {
      await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutSessionId: sessionId,
          ...updatedSet
        })
      });

      checkWorkoutCompletion(newSets);
    } catch (error) {
      console.error('Error saving set:', error);
    }
  };

  const checkWorkoutCompletion = (sets: ExerciseSet[]) => {
    const allCompleted = sets.every(set => set.is_completed);
    if (allCompleted && onComplete) {
      onComplete();
    }
  };

  const toggleSetComplete = (index: number) => {
    const set = exerciseSets[index];
    if (!set.is_completed && set.actual_reps && set.weight_lbs) {
      updateSet(index, { is_completed: true });
    } else {
      updateSet(index, { is_completed: !set.is_completed });
    }
  };

  const groupedSets = exercises.map(exercise => {
    const sets = exerciseSets.filter(s => s.exercise_name === exercise.name);
    return { exercise, sets };
  });

  return (
    <div className="space-y-6">
      {groupedSets.map(({ exercise, sets }) => {
        const media = getExerciseMedia(exercise.name);

        return (
          <div key={exercise.name} className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-2">{exercise.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Target: {exercise.sets} sets × {exercise.reps} reps
            </p>
            {exercise.notes && (
              <p className="text-sm text-blue-600 mb-4 italic">{exercise.notes}</p>
            )}

            <div className="space-y-3">
              {sets.map((set) => {
                const globalIndex = exerciseSets.findIndex(
                  s => s.exercise_name === set.exercise_name && s.set_number === set.set_number
                );
                const isEditing = editingSet === `${set.exercise_name}-${set.set_number}`;

                return (
                  <div
                    key={`${set.exercise_name}-${set.set_number}`}
                    className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      set.is_completed
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 w-14 font-semibold text-gray-700">
                      Set {set.set_number}
                    </div>

                    <div className="flex-1 min-w-[180px] flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Weight (lbs)</label>
                        <input
                          type="number"
                          value={set.weight_lbs || ''}
                          onChange={e => updateSet(globalIndex, { weight_lbs: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                          disabled={set.is_completed && !isEditing}
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Reps</label>
                        <input
                          type="number"
                          value={set.actual_reps || ''}
                          onChange={e => updateSet(globalIndex, { actual_reps: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={set.target_reps}
                          disabled={set.is_completed && !isEditing}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (set.is_completed) {
                          setEditingSet(isEditing ? null : `${set.exercise_name}-${set.set_number}`);
                        } else {
                          toggleSetComplete(globalIndex);
                        }
                      }}
                      disabled={!set.actual_reps || !set.weight_lbs}
                      className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${
                        set.is_completed
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                      }`}
                      aria-label={set.is_completed ? 'Edit completed set' : 'Mark set complete'}
                    >
                      {set.is_completed ? (
                        isEditing ? <Edit2 className="w-5 h-5" /> : <Check className="w-5 h-5" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveVideo({ title: exercise.name, videoId: media.videoId })}
                      className="relative h-11 w-16 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-slate-200"
                      aria-label={`Watch ${exercise.name} video`}
                    >
                      <img
                        src={youtubeThumbUrl(media.videoId)}
                        alt={`${exercise.name} video thumbnail`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </span>
                    </button>

                    <SetRestTimer />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Workout Progress</span>
          <span className="text-2xl font-bold text-blue-600">
            {exerciseSets.filter(s => s.is_completed).length} / {exerciseSets.length}
          </span>
        </div>
        <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${(exerciseSets.filter(s => s.is_completed).length / exerciseSets.length) * 100}%`
            }}
          />
        </div>
      </div>

      <VideoModal
        open={!!activeVideo}
        title={activeVideo?.title || ''}
        videoId={activeVideo?.videoId || ''}
        onClose={() => setActiveVideo(null)}
      />
    </div>
  );
}
