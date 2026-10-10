'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Play } from 'lucide-react';
import SetHardness from '@/components/SetHardness';
import SetRestTimer from '@/components/SetRestTimer';
import { HowTrigger } from '@/components/HelpSheet';
import { circuitSteps, circuitTemplateForDay, restForBlock, stepKey, type CircuitStep } from '@/lib/circuits';
import { exerciseHistoryKey } from '@/lib/exerciseKey';
import { howForExercise } from '@/lib/exerciseHow';
import {
  canCompleteSet,
  getExerciseKind,
  parseTimedTarget,
  sessionSetTotals,
  setLogLabel,
  weightFieldLabel,
  type ExerciseKind,
} from '@/lib/exerciseKind';
import { formatClock } from '@/lib/formatDuration';
import { parseHardness, type HardnessScore } from '@/lib/hardness';
import { unlockAudio } from '@/lib/playChime';
import { bestLoggedSet } from '@/lib/setHistory';
import type { Exercise } from '@/lib/workoutData';

/** A completed station set — the slice of an `exercise_sets` row this view reads. */
type DoneSet = {
  exercise_name: string;
  target_reps: string;
  weight_lbs: number | null;
  actual_reps: number | null;
  is_completed: true;
  hardness: HardnessScore | null;
  bodyweight_lb?: number | string | null;
};

type LastSet = { weight_lbs: number | null; actual_reps: number | null };

const asNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Live view for a lifting circuit or superset Your pick (docs/plans/PLAN_CIRCUITS.md), in
 * place of the exercise cards. It walks `circuitSteps`: one station on screen, back to back
 * with no rest between stations, then one rest after the round's last station. Each station
 * logs a normal `exercise_sets` row under its own movement name (POST /api/exercises), so
 * history, PRs and the board treat it like any other set; the server already exempts
 * `circuitGroup` stations from the 25-second skip rule. Progress is whatever the server
 * holds, so a reload resumes on the next station. Weight prefills from the same station's
 * previous round, else its best set last time, and stays editable.
 */
export default function CircuitFlow({
  sessionId,
  dayNumber,
  exercises,
  onTotals,
  onDone,
  onRestBannerChange,
}: {
  sessionId: number;
  dayNumber: number;
  exercises: Exercise[];
  onTotals?: (totals: { lbs: number; reps: number; effort: number }) => void;
  /** Fires once every station of every round is logged. */
  onDone?: () => void;
  onRestBannerChange?: (info: { active: boolean; height: number }) => void;
}) {
  const steps = useMemo(() => {
    const template = circuitTemplateForDay(dayNumber);
    return circuitSteps(exercises, restForBlock(template?.kind === 'hiit' ? undefined : template));
  }, [exercises, dayNumber]);
  const [done, setDone] = useState<Record<string, DoneSet>>({});
  const [lastSets, setLastSets] = useState<Record<string, LastSet[]>>({});
  const [ready, setReady] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [hardness, setHardness] = useState<HardnessScore | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [restToken, setRestToken] = useState(0);
  const [restSeconds, setRestSeconds] = useState(60);
  // Timed stations (the run leg, planks): when the clock started, ticked once a second.
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Resume: completed rows already on the server, plus last time's sets for round-1 prefill.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [savedRes, historyRes] = await Promise.all([
        fetch(`/api/exercises?sessionId=${sessionId}`),
        fetch(`/api/exercises?history=1&sessionId=${sessionId}`),
      ]);
      const saved: Record<string, DoneSet> = {};
      if (savedRes.ok) {
        const data = await savedRes.json();
        for (const row of data.sets || []) {
          if (!Number(row.is_completed)) continue;
          saved[stepKey(row.exercise_name, Number(row.set_number))] = {
            exercise_name: row.exercise_name,
            target_reps: row.target_reps ?? '',
            weight_lbs: asNumber(row.weight_lbs),
            actual_reps: asNumber(row.actual_reps),
            is_completed: true,
            hardness: parseHardness(row.hardness),
            bodyweight_lb: row.bodyweight_lb,
          };
        }
      }
      const history = historyRes.ok ? await historyRes.json() : { lastSets: {} };
      if (cancelled) return;
      setDone(saved);
      setLastSets(history.lastSets || {});
      setReady(true);
    })().catch(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const current: CircuitStep | undefined = ready ? steps.find((step) => !done[step.key]) : undefined;
  const allDone = ready && steps.length > 0 && !current;
  const kind: ExerciseKind | null = current ? getExerciseKind(current.name, current.reps) : null;
  const target = current && kind === 'timed' ? parseTimedTarget(current.reps, current.name) : 0;

  // Same totals the exercise cards report to the sticky Today bar.
  const totals = useMemo(() => sessionSetTotals(Object.values(done)), [done]);
  useEffect(() => {
    if (ready) onTotals?.(totals);
  }, [ready, totals, onTotals]);

  const doneNotified = useRef(false);
  useEffect(() => {
    if (allDone && !doneNotified.current) {
      doneNotified.current = true;
      onDone?.();
    }
  }, [allDone, onDone]);

  // Each new station starts from the previous round's same station, else its best set last time.
  const currentKey = current?.key;
  useEffect(() => {
    if (!current) return;
    const earlier = current.round > 1 ? done[stepKey(current.name, current.round - 1)] : undefined;
    const prior: LastSet | null =
      earlier ??
      bestLoggedSet(lastSets[exerciseHistoryKey(current.name)] || lastSets[current.name] || []) ??
      null;
    setWeight(prior?.weight_lbs != null ? String(prior.weight_lbs) : '');
    setReps(prior?.actual_reps != null && kind !== 'timed' ? String(prior.actual_reps) : '');
    setHardness(null);
    setTimerStart(null);
    setError('');
    // Only when the station changes (or history lands): typing must not be overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, lastSets]);

  useEffect(() => {
    if (timerStart == null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [timerStart]);

  const complete = useCallback(
    async (step: CircuitStep, actualReps: number, weightLbs: number | null) => {
      setSaving(true);
      setError('');
      try {
        const response = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutSessionId: sessionId,
            exerciseName: step.name,
            setNumber: step.setNumber,
            targetReps: step.reps,
            actualReps,
            weightLbs: weightLbs ?? 0,
            isCompleted: true,
            hardness,
          }),
        });
        if (!response.ok) throw new Error('save failed');
        const saved = await response.json();
        setDone((prev) => ({
          ...prev,
          [step.key]: {
            exercise_name: step.name,
            target_reps: step.reps,
            weight_lbs: weightLbs ?? 0,
            actual_reps: actualReps,
            is_completed: true,
            hardness,
            bodyweight_lb: saved.bodyweightLb,
          },
        }));
        // One rest, after the round's last station — never after the session's last set.
        if (step.roundEnd && step.nextName) {
          setRestSeconds(step.restSeconds);
          setRestToken((token) => token + 1);
        }
      } catch {
        setError('Could not save that set. Try again.');
      } finally {
        setSaving(false);
      }
    },
    [sessionId, hardness]
  );

  if (!ready) return <p className="text-center text-lg font-black text-[#e8c547]">Loading...</p>;

  if (allDone) {
    return (
      <section className="glass-card p-5 text-center">
        <p className="inline-flex items-center gap-2 text-xl font-black text-white">
          <Check className="h-6 w-6 text-[#6d8b6e]" strokeWidth={3} />
          All {steps.length} sets done
        </p>
        <p className="mt-2 text-sm text-[#f6f1e3]/70">Easy cooldown, then Finish it.</p>
      </section>
    );
  }
  if (!current || !kind) return null;

  const how = howForExercise(current.name);
  const timed = kind === 'timed';
  const elapsed = timerStart ? Math.max(0, Math.floor((now - timerStart) / 1000)) : 0;
  const repsNumber = asNumber(reps);
  const weightNumber = asNumber(weight);
  const canDone = canCompleteSet(kind, repsNumber, weightNumber) && !saving;
  // This round's finished stations, so the athlete sees the round fill up.
  const roundSteps = steps.filter((step) => step.blockLabel === current.blockLabel && step.round === current.round);

  return (
    <>
      <section className="glass-card p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#e8c547]">
          {current.blockLabel} · Round {current.round} of {current.rounds}
        </p>
        <div className="mt-2 flex gap-1.5" aria-label={`Station ${current.station} of ${current.stations}`}>
          {roundSteps.map((step) => (
            <span
              key={step.key}
              className={`h-1.5 flex-1 rounded-full ${
                done[step.key] ? 'bg-[#6d8b6e]' : step.key === current.key ? 'bg-[#e8c547]' : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-start gap-1">
          <h2 className="text-3xl font-black tracking-tight text-white">{current.name}</h2>
          {how ? <HowTrigger notes={how} /> : null}
        </div>
        <p className="mt-1 text-sm font-bold text-[#f6f1e3]/70">
          Station {current.station} of {current.stations} · {current.reps}
        </p>
        {current.notes ? <p className="mt-2 text-sm text-[#f6f1e3]/70">{current.notes}</p> : null}

        {timed ? (
          <div className="mt-5 text-center">
            <p className="text-6xl font-black tabular-nums text-[#e8c547]">
              {timerStart ? formatClock(elapsed < target ? target - elapsed : elapsed - target) : formatClock(target)}
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#f6f1e3]/55">
              {!timerStart ? 'Target' : elapsed < target ? 'Counting down' : 'Past target · stop when ready'}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="whitespace-nowrap text-xs font-black text-[#f6f1e3]/70">
                {weightFieldLabel(kind, current.name)}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-lg font-black text-white"
              />
            </label>
            <label className="block">
              <span className="whitespace-nowrap text-xs font-black text-[#f6f1e3]/70">Reps</span>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(event) => setReps(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-lg font-black text-white"
              />
            </label>
          </div>
        )}

        <p className="mt-4 text-xs font-black text-[#f6f1e3]/70">How hard?</p>
        <SetHardness value={hardness} forceEditable onPick={setHardness} />

        {error ? <p className="mt-3 text-sm font-bold text-[#a35d52]">{error}</p> : null}

        {timed && !timerStart ? (
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setNow(Date.now());
              setTimerStart(Date.now());
            }}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
          >
            <Play className="h-5 w-5 fill-[#1a1404]" />
            Start
          </button>
        ) : (
          <button
            type="button"
            disabled={timed ? saving : !canDone}
            onClick={() =>
              // Stop completes a timed station in one tap, recording the seconds held.
              timed ? complete(current, Math.max(1, elapsed), null) : complete(current, repsNumber ?? 0, weightNumber)
            }
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404] disabled:bg-white/10 disabled:text-white/35"
          >
            <Check className="h-6 w-6" />
            {timed ? 'Stop' : 'Done'}
          </button>
        )}

        <p className="mt-3 text-center text-sm font-bold text-[#f6f1e3]/60">
          {current.nextName
            ? current.roundEnd
              ? `Then rest ${current.restSeconds}s`
              : `Next: ${current.nextName} · no rest`
            : 'Last one'}
        </p>
      </section>

      {Object.keys(done).length > 0 ? (
        <section className="glass-card p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/55">Done so far</p>
          <ul className="mt-2 space-y-1 text-sm text-[#f6f1e3]/75">
            {steps
              .filter((step) => done[step.key])
              .slice(-6)
              .map((step) => {
                const set = done[step.key];
                return (
                  <li key={step.key} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#6d8b6e]" strokeWidth={3} />
                    <span className="min-w-0 truncate">
                      R{step.round} · {step.name} · {setLogLabel(getExerciseKind(step.name, step.reps), set.weight_lbs, set.actual_reps, set.bodyweight_lb)}
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      ) : null}

      <SetRestTimer
        startToken={restToken}
        cancelled={allDone}
        completedSets={Object.keys(done).length}
        totalSets={steps.length}
        seconds={restSeconds}
        onBannerChange={onRestBannerChange}
      />
    </>
  );
}
