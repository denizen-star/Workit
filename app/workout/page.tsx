'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
import { workoutProgram } from '@/lib/workoutData';
import { formatClock } from '@/lib/formatDuration';
import ExerciseTracker from '@/components/ExerciseTracker';
import Modal from '@/components/Modal';

export default function WorkoutPage() {
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCompletedWorkouts();
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const loadCompletedWorkouts = async () => {
    try {
      const response = await fetch('/api/sessions?userId=1');
      if (response.ok) {
        const data = await response.json();
        const completed = new Set<string>(
          data.sessions
            .filter((s: any) => s.is_completed)
            .map((s: any) => `${s.week_number}-${s.day_number}`)
        );
        setCompletedWorkouts(completed);
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    }
  };

  const startWorkout = async (weekNumber: number, dayNumber: number) => {
    try {
      const week = workoutProgram.find(w => w.weekNumber === weekNumber);
      const day = week?.days.find(d => d.dayNumber === dayNumber);

      if (!day) return;

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          weekNumber,
          dayNumber,
          workoutType: day.name,
          scheduledDate: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.sessionId);
        setSelectedWeek(weekNumber);
        setSelectedDay(dayNumber);
        setStartedAt(Date.now());
        setElapsedSeconds(0);
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

  const completeWorkout = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession,
          isCompleted: true
        })
      });

      if (!response.ok) {
        setErrorMessage('Could not save the completed workout. Try again.');
        setShowError(true);
        return;
      }

      await loadCompletedWorkouts();
      setCurrentSession(null);
      setSelectedDay(null);
      setStartedAt(null);
      setConfirmComplete(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error completing workout:', error);
      setErrorMessage('Could not save the completed workout. Try again.');
      setShowError(true);
    }
  };

  const getCurrentWorkout = () => {
    const week = workoutProgram.find(w => w.weekNumber === selectedWeek);
    return week?.days.find(d => d.dayNumber === selectedDay);
  };

  if (currentSession && selectedDay) {
    const workout = getCurrentWorkout();
    if (!workout) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setConfirmExit(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Exit Workout
              </button>
              <div className="text-center flex-1">
                <h1 className="text-xl font-bold">Week {selectedWeek} - {workout.name}</h1>
                <p className="text-sm text-gray-600">{workout.focus}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                  <Clock className="h-3.5 w-3.5" />
                  {formatClock(elapsedSeconds)}
                </p>
              </div>
              <button
                onClick={() => setConfirmComplete(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Complete Workout
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <ExerciseTracker
            sessionId={currentSession}
            exercises={workout.exercises}
            onComplete={() => setConfirmComplete(true)}
          />
        </div>

        <Modal
          open={confirmExit}
          title="Leave this workout?"
          cancelLabel="Stay"
          confirmLabel="Exit"
          variant="danger"
          onCancel={() => setConfirmExit(false)}
          onConfirm={() => {
            setConfirmExit(false);
            setCurrentSession(null);
            setSelectedDay(null);
            setStartedAt(null);
          }}
        >
          Your sets are already saved. You can pick this session back up anytime.
        </Modal>

        <Modal
          open={confirmComplete}
          title="Mark this workout complete?"
          cancelLabel="Not yet"
          confirmLabel="Complete it"
          variant="success"
          onCancel={() => setConfirmComplete(false)}
          onConfirm={completeWorkout}
        >
          Nice work. We will save the end time and add this session to your dashboard stats.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Select Workout</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {workoutProgram.map(week => (
            <div key={week.weekNumber} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold">Week {week.weekNumber}</h2>
                  {week.isTravel && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      Travel Week
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    {week.days.filter(d => completedWorkouts.has(`${week.weekNumber}-${d.dayNumber}`)).length} / {week.days.length} completed
                  </span>
                </div>
                {expandedWeek === week.weekNumber ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              {expandedWeek === week.weekNumber && (
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-600 mb-4">{week.description}</p>
                  
                  <div className="grid gap-3">
                    {week.days.map(day => {
                      const isCompleted = completedWorkouts.has(`${week.weekNumber}-${day.dayNumber}`);
                      
                      return (
                        <div
                          key={day.dayNumber}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            isCompleted
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold">{day.name}</h3>
                                {isCompleted && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{day.focus}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Suggested: {day.suggestedDay} • {day.exercises.length} exercises
                              </p>
                            </div>
                            <button
                              onClick={() => startWorkout(week.weekNumber, day.dayNumber)}
                              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                                isCompleted
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isCompleted ? 'Do Again' : 'Start Workout'}
                            </button>
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
        open={showSuccess}
        title="Workout complete"
        confirmLabel="Back to dashboard"
        variant="success"
        onConfirm={() => router.push('/')}
      >
        Great job. Start and end time are saved, and your duration now shows on the dashboard.
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
