'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Clock, Play, X } from 'lucide-react';
import { formatClock } from '@/lib/formatDuration';
import VideoModal from '@/components/VideoModal';
import { youtubeThumbUrl } from '@/lib/exerciseMedia';
import {
  OPTIONAL_SECONDS,
  OPTIONAL_SLOT_LBS,
  isGuidedOptionalTrack,
  isOptionalTrack,
  optionalCircuit,
  optionalCircuitStep,
  optionalElapsedSeconds,
  optionalHoldSeconds,
  optionalRemainingSeconds,
  optionalSlotLabel,
  optionalTimerReady,
  optionalTrackLabel,
  optionalTracks,
  type OptionalCircuitStep,
  type OptionalSlot,
  type OptionalTrack,
} from '@/lib/optionals';

type SlotState = {
  track: OptionalTrack | null;
  startedAt: string | null;
  completedAt: string | null;
  lbs: number;
};

function asTrack(value: unknown): OptionalTrack | null {
  return isOptionalTrack(value) ? value : null;
}

function progressKey(sessionId: number, slot: OptionalSlot) {
  return `workit-optional-progress-${sessionId}-${slot}`;
}

function readProgress(sessionId: number, slot: OptionalSlot) {
  try {
    const raw = sessionStorage.getItem(progressKey(sessionId, slot));
    if (!raw) return { stepIndex: 0, circuitDone: false };
    const parsed = JSON.parse(raw) as { stepIndex?: number; circuitDone?: boolean };
    return {
      stepIndex: Math.max(0, Number(parsed.stepIndex || 0)),
      circuitDone: Boolean(parsed.circuitDone),
    };
  } catch {
    return { stepIndex: 0, circuitDone: false };
  }
}

function writeProgress(
  sessionId: number,
  slot: OptionalSlot,
  stepIndex: number,
  circuitDone: boolean
) {
  try {
    sessionStorage.setItem(progressKey(sessionId, slot), JSON.stringify({ stepIndex, circuitDone }));
  } catch {
    // Private mode can block sessionStorage. Progress just lives in memory.
  }
}

export default function OptionalCard({
  sessionId,
  slot,
  onLbs,
}: {
  sessionId: number;
  slot: OptionalSlot;
  onLbs?: (lbs: number) => void;
}) {
  const [state, setState] = useState<SlotState>({
    track: null,
    startedAt: null,
    completedAt: null,
    lbs: 0,
  });
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState('');
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoStep, setVideoStep] = useState<OptionalCircuitStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [circuitDone, setCircuitDone] = useState(false);
  const [holdStartedAt, setHoldStartedAt] = useState<number | null>(null);
  const completing = useRef(false);
  const [slotReady, setSlotReady] = useState(false);

  const finishSlot = (circuitComplete = false) => {
    if (completing.current) return;
    completing.current = true;
    fetch('/api/optionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, slot, action: 'complete', circuitComplete }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setState((current) => ({
            ...current,
            completedAt: data.completedAt || new Date().toISOString(),
            lbs: Number(data.lbs || OPTIONAL_SLOT_LBS),
          }));
          setOpen(false);
          setVideoOpen(false);
          setVideoStep(null);
        } else {
          completing.current = false;
        }
      })
      .catch(() => {
        completing.current = false;
      });
  };

  useEffect(() => {
    let cancelled = false;
    setSlotReady(false);
    fetch(`/api/sessions?sessionId=${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.session) {
          if (!cancelled) setSlotReady(true);
          return;
        }
        const session = data.session;
        if (slot === 'warmup') {
          setState({
            track: asTrack(session.warmup_track),
            startedAt: session.warmup_started_at || null,
            completedAt: session.warmup_completed_at || null,
            lbs: Number(session.warmup_lbs || 0),
          });
        } else {
          setState({
            track: asTrack(session.cooldown_track),
            startedAt: session.cooldown_started_at || null,
            completedAt: session.cooldown_completed_at || null,
            lbs: Number(session.cooldown_lbs || 0),
          });
        }
        const saved = readProgress(sessionId, slot);
        setStepIndex(saved.stepIndex);
        setCircuitDone(saved.circuitDone);
        setSlotReady(true);
      })
      .catch(() => {
        if (!cancelled) setSlotReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, slot]);

  useEffect(() => {
    if (!slotReady) return;
    onLbs?.(Number(state.lbs || 0));
  }, [slotReady, state.lbs, onLbs]);

  const running = Boolean(state.startedAt && !state.completedAt);
  const done = Boolean(state.completedAt);
  const guided = isGuidedOptionalTrack(state.track);
  const steps = state.track ? optionalCircuit(slot, state.track) : [];

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 250);
    const onVis = () => tick();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [running, state.startedAt]);

  useEffect(() => {
    if (!running || !state.startedAt || !optionalTimerReady(state.startedAt, now)) return;
    finishSlot(false);
  }, [running, state.startedAt, now, sessionId, slot]);

  useEffect(() => {
    if (!running || !guided || !circuitDone) return;
    finishSlot(true);
  }, [running, guided, circuitDone, sessionId, slot]);

  useEffect(() => {
    if (!guided || !open || circuitDone) return;
    setHoldStartedAt(Date.now());
  }, [guided, open, circuitDone, stepIndex]);

  const elapsed = optionalElapsedSeconds(state.startedAt, now);
  const remaining = optionalRemainingSeconds(state.startedAt, now);
  const timedStep =
    state.track && running && !guided ? optionalCircuitStep(slot, state.track, elapsed) : null;
  const guidedStep = guided && !circuitDone ? steps[Math.min(stepIndex, Math.max(0, steps.length - 1))] : null;
  const step = guided ? guidedStep : timedStep;
  const holdTarget = optionalHoldSeconds(step);
  const holdElapsed =
    holdStartedAt != null ? Math.max(0, Math.floor((now - holdStartedAt) / 1000)) : 0;
  const holdRemaining = Math.max(0, holdTarget - holdElapsed);

  const startTrack = async (track: OptionalTrack) => {
    setError('');
    const response = await fetch('/api/optionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, slot, action: 'start', track }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'Could not start');
      return;
    }
    setState({
      track: asTrack(data.track) || track,
      startedAt: data.startedAt || new Date().toISOString(),
      completedAt: data.completedAt || null,
      lbs: Number(data.lbs || 0),
    });
    setStepIndex(0);
    setCircuitDone(false);
    writeProgress(sessionId, slot, 0, false);
    setPicking(false);
    setOpen(true);
  };

  const completeStep = () => {
    if (!guided || circuitDone) return;
    if (stepIndex + 1 >= steps.length) {
      setCircuitDone(true);
      writeProgress(sessionId, slot, stepIndex, true);
      setVideoOpen(false);
      setVideoStep(null);
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    writeProgress(sessionId, slot, next, false);
    setVideoOpen(false);
    setVideoStep(null);
  };

  const label = optionalSlotLabel(slot);
  const runningCopy = guided
    ? `${state.track ? optionalTrackLabel(state.track) : label} · ${
        circuitDone ? 'done' : `${Math.min(stepIndex + 1, steps.length)} of ${steps.length}`
      } · ${formatClock(remaining)} left`
    : `${state.track ? optionalTrackLabel(state.track) : label} · ${formatClock(remaining)} left`;

  return (
    <div className="glass-card p-5">
      {done ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e8c547] text-[#1a1404]">
            <Check className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">
              Optional · {label}
            </p>
            <p className="mt-1 font-black text-white">
              {state.track ? optionalTrackLabel(state.track) : label} · +
              {Math.round(state.lbs || OPTIONAL_SLOT_LBS).toLocaleString()} lb
            </p>
          </div>
        </div>
      ) : running ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">
              Optional · {label}
            </p>
            <p className="mt-1 font-black text-white">{runningCopy}</p>
          </div>
          <Clock className="h-5 w-5 text-[#e8c547]" />
        </button>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setPicking((current) => !current)}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 font-black text-[#e8c547]"
          >
            <span>Optional · {label}</span>
            <span className="text-sm">+{OPTIONAL_SLOT_LBS} lb</span>
          </button>
          {picking && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {optionalTracks().map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => startTrack(track)}
                  className="min-h-12 rounded-2xl border border-white/15 bg-black/30 px-3 text-sm font-black text-white"
                >
                  {optionalTrackLabel(track)}
                </button>
              ))}
            </div>
          )}
          {error ? <p className="mt-2 text-sm text-[#e8c547]">{error}</p> : null}
        </div>
      )}

      {open && running && state.track && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#07070a]/96 px-6 py-8">
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              setOpen(false);
              setVideoOpen(false);
              setVideoStep(null);
            }}
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/15 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
              Optional · {label}
            </p>
            <p className="mt-3 text-lg font-black text-white">{optionalTrackLabel(state.track)}</p>
            {guided ? (
              <p className="mt-2 text-sm font-black text-[#f6f1e3]/70">
                {circuitDone
                  ? `${steps.length} of ${steps.length}`
                  : `${Math.min(stepIndex + 1, steps.length)} of ${steps.length}`}
              </p>
            ) : null}

            {guided && circuitDone ? (
              <>
                <span className="mt-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#e8c547] text-[#1a1404]">
                  <Check className="h-8 w-8" />
                </span>
                <p className="mt-6 text-3xl font-black text-white">That is the five.</p>
                <p className="mt-4 max-w-md text-lg font-medium text-[#f6f1e3]/85">
                  Clock is done. Crediting +{OPTIONAL_SLOT_LBS.toLocaleString()} lb.
                </p>
              </>
            ) : (
              <>
                <p
                  className={`mt-6 font-black tabular-nums text-[#e8c547] ${
                    guided ? 'text-6xl' : 'text-7xl'
                  }`}
                >
                  {formatClock(guided ? holdRemaining : remaining)}
                </p>
                {guided && holdTarget > 0 ? (
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-[#f6f1e3]/55">
                    {holdRemaining === 0
                      ? 'That is the hold'
                      : `Hold ${holdTarget} seconds`}
                  </p>
                ) : null}
                {step ? (
                  <>
                    <div className="mt-8 flex items-center justify-center gap-3">
                      <h2 className="text-3xl font-black text-white">{step.title}</h2>
                      {step.videoId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setVideoStep(step);
                            setVideoOpen(true);
                          }}
                          className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-[#e8c547]/35"
                          aria-label={`Watch ${step.title} video`}
                        >
                          <img
                            src={youtubeThumbUrl(step.videoId)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play className="h-5 w-5 fill-white text-white" />
                          </span>
                        </button>
                      ) : null}
                    </div>
                    {step.start && step.end ? (
                      <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-2">
                        <figure className="overflow-hidden rounded-xl ring-1 ring-[#e8c547]/25">
                          <img
                            src={step.start}
                            alt={`${step.title} start position`}
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <figcaption className="bg-black/40 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#e8c547]">
                            Start
                          </figcaption>
                        </figure>
                        <figure className="overflow-hidden rounded-xl ring-1 ring-[#e8c547]/25">
                          <img
                            src={step.end}
                            alt={`${step.title} end position`}
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <figcaption className="bg-black/40 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#e8c547]">
                            End
                          </figcaption>
                        </figure>
                      </div>
                    ) : null}
                    <p className="mt-4 max-w-md text-lg font-medium leading-relaxed text-[#f6f1e3]/85">
                      {step.body}
                    </p>
                  </>
                ) : null}
                {guided ? (
                  <button
                    type="button"
                    onClick={completeStep}
                    className="mt-8 flex min-h-14 w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
                  >
                    <Check className="h-6 w-6" />
                    Done
                  </button>
                ) : null}
                {guided ? (
                  <p className="mt-4 text-sm text-[#f6f1e3]/55">
                    Slot {formatClock(remaining)} left
                  </p>
                ) : null}
              </>
            )}

            {circuitDone ? null : (
              <p className="mt-10 text-sm text-[#f6f1e3]/55">
                {guided
                  ? 'Phone can lock. Stay easy. Done when you have it.'
                  : 'Phone can lock. Stay easy until the clock hits zero.'}
              </p>
            )}
            {!guided ? (
              <p className="mt-3 text-xs text-[#f6f1e3]/40">
                Repeat until {Math.round(OPTIONAL_SECONDS / 60)} minutes are gone.
              </p>
            ) : null}
          </div>
        </div>
      )}

      <VideoModal
        open={Boolean(open && running && videoOpen && videoStep?.videoId)}
        title={
          videoStep && state.track
            ? `${optionalTrackLabel(state.track)} · ${videoStep.title}`
            : ''
        }
        videoId={videoStep?.videoId || ''}
        onClose={() => {
          setVideoOpen(false);
          setVideoStep(null);
        }}
      />
    </div>
  );
}
