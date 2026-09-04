'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Clock, Play, X } from 'lucide-react';
import { formatClock } from '@/lib/formatDuration';
import VideoModal from '@/components/VideoModal';
import { youtubeThumbUrl } from '@/lib/exerciseMedia';
import {
  OPTIONAL_LEVELS,
  OPTIONAL_SECONDS,
  OPTIONAL_SLOT_LBS,
  isGuidedOptionalTrack,
  isOptionalTrack,
  optionalCircuit,
  optionalCircuitStep,
  optionalElapsedSeconds,
  optionalHoldSeconds,
  optionalLevelLabel,
  optionalRemainingSeconds,
  optionalSlotLabel,
  optionalTimerReady,
  optionalTrackLabel,
  optionalTrackLevelLabel,
  optionalTracks,
  parseOptionalLevel,
  type OptionalCircuitStep,
  type OptionalLevel,
  type OptionalRegion,
  type OptionalSlot,
  type OptionalTrack,
} from '@/lib/optionals';

type SlotState = {
  track: OptionalTrack | null;
  level: OptionalLevel | null;
  startedAt: string | null;
  completedAt: string | null;
  lbs: number;
};

function asTrack(value: unknown): OptionalTrack | null {
  return isOptionalTrack(value) ? value : null;
}

function slotLevel(track: OptionalTrack | null, raw: unknown): OptionalLevel | null {
  if (!isGuidedOptionalTrack(track)) return null;
  return parseOptionalLevel(raw);
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
  region,
  dayName,
  onLbs,
  cue,
}: {
  sessionId: number;
  slot: OptionalSlot;
  region: OptionalRegion;
  dayName?: string;
  onLbs?: (lbs: number) => void;
  cue?: string;
}) {
  const [state, setState] = useState<SlotState>({
    track: null,
    level: null,
    startedAt: null,
    completedAt: null,
    lbs: 0,
  });
  const [picking, setPicking] = useState(false);
  const [levelFor, setLevelFor] = useState<OptionalTrack | null>(null);
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const finishSlot = (circuitComplete = false) => {
    if (completing.current) return;
    completing.current = true;
    setError('');
    fetch('/api/optionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, slot, action: 'complete', circuitComplete }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) {
          setState((current) => ({
            ...current,
            completedAt: data.completedAt || new Date().toISOString(),
            lbs: Number(data.lbs || OPTIONAL_SLOT_LBS),
          }));
          setOpen(false);
          setVideoOpen(false);
          setVideoStep(null);
          return;
        }
        completing.current = false;
        setError(data?.error || 'Could not credit this Optional');
      })
      .catch(() => {
        completing.current = false;
        setError('Could not credit this Optional');
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
          const track = asTrack(session.warmup_track);
          setState({
            track,
            level: slotLevel(track, session.warmup_level),
            startedAt: session.warmup_started_at || null,
            completedAt: session.warmup_completed_at || null,
            lbs: Number(session.warmup_lbs || 0),
          });
        } else {
          const track = asTrack(session.cooldown_track);
          setState({
            track,
            level: slotLevel(track, session.cooldown_level),
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
  const steps = state.track
    ? optionalCircuit(slot, state.track, region, state.level || 'easy', dayName || '')
    : [];

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

  const startTrack = async (track: OptionalTrack, level?: OptionalLevel) => {
    setError('');
    const response = await fetch('/api/optionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, slot, action: 'start', track, level }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'Could not start');
      return;
    }
    const nextTrack = asTrack(data.track) || track;
    setState({
      track: nextTrack,
      level: slotLevel(nextTrack, data.level ?? level),
      startedAt: data.startedAt || new Date().toISOString(),
      completedAt: data.completedAt || null,
      lbs: Number(data.lbs || 0),
    });
    setStepIndex(0);
    setCircuitDone(false);
    writeProgress(sessionId, slot, 0, false);
    setPicking(false);
    setLevelFor(null);
    setOpen(true);
  };

  const pickTrack = (track: OptionalTrack) => {
    if (isGuidedOptionalTrack(track)) {
      setLevelFor(track);
      setError('');
      return;
    }
    void startTrack(track);
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
  const trackTitle = state.track ? optionalTrackLevelLabel(state.track, state.level) : label;
  const runningCopy = guided
    ? `${trackTitle} · ${
        circuitDone ? 'done' : `${Math.min(stepIndex + 1, steps.length)} of ${steps.length}`
      } · ${formatClock(remaining)} left`
    : `${trackTitle} · ${formatClock(remaining)} left`;

  return (
    <div className="glass-card p-5">
      {done ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6d8b6e] text-[#1a1404]">
            <Check className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e8c547]">
              Optional · {label}
            </p>
            <p className="mt-1 font-black text-white">
              {trackTitle} · +
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
            onClick={() => {
              setPicking((current) => !current);
              setLevelFor(null);
            }}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 font-black text-[#e8c547]"
          >
            <span>Optional · {label}</span>
            <span className="text-sm">+{OPTIONAL_SLOT_LBS} lb</span>
          </button>
          {cue ? <p className="mt-3 text-base font-semibold text-[#f6f1e3]/75">{cue}</p> : null}
          {picking && !levelFor && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {optionalTracks().map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => pickTrack(track)}
                  className="min-h-12 rounded-2xl border border-white/15 bg-black/30 px-3 text-sm font-black text-white"
                >
                  {optionalTrackLabel(track)}
                </button>
              ))}
            </div>
          )}
          {picking && levelFor && (
            <div className="mt-3">
              <p className="mb-2 text-sm font-black text-white">{optionalTrackLabel(levelFor)}</p>
              <div className="grid grid-cols-3 gap-2">
                {OPTIONAL_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => startTrack(levelFor, level)}
                    className="min-h-12 rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-3 text-sm font-black text-[#e8c547]"
                  >
                    {optionalLevelLabel(level)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error ? <p className="mt-2 text-sm text-[#e8c547]">{error}</p> : null}
        </div>
      )}

      {mounted &&
        open &&
        running &&
        state.track &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex flex-col bg-[#07070a]">
            <div className="flex shrink-0 items-center justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setOpen(false);
                  setVideoOpen(false);
                  setVideoStep(null);
                }}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/15 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
                Optional · {label}
              </p>
              <p className="mt-3 text-lg font-black text-white">
                {optionalTrackLevelLabel(state.track, state.level)}
              </p>
              {guided ? (
                <p className="mt-2 text-sm font-black text-[#f6f1e3]/70">
                  {circuitDone
                    ? `${steps.length} of ${steps.length}`
                    : `${Math.min(stepIndex + 1, steps.length)} of ${steps.length}`}
                </p>
              ) : null}

              {guided && circuitDone ? (
                <>
                  <span className="mt-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#6d8b6e] text-[#1a1404]">
                    <Check className="h-8 w-8" />
                  </span>
                  <p className="mt-6 text-3xl font-black text-white">That is the six.</p>
                  <p className="mt-4 text-lg font-medium text-[#f6f1e3]/85">
                    Crediting +{OPTIONAL_SLOT_LBS.toLocaleString()} lb.
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
                      {holdRemaining === 0 ? 'That is the hold' : `Hold ${holdTarget} seconds`}
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
                        <div className="mt-6 mx-auto grid w-full max-w-md grid-cols-2 gap-2">
                          <figure className="overflow-hidden rounded-xl ring-1 ring-[#e8c547]/25">
                            <img
                              key={step.start}
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
                              key={step.end}
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
                      <p className="mx-auto mt-4 max-w-md text-lg font-medium leading-relaxed text-[#f6f1e3]/85">
                        {step.body}
                      </p>
                    </>
                  ) : null}
                  {guided ? (
                    <p className="mt-4 text-sm text-[#f6f1e3]/55">
                      Slot {formatClock(remaining)} left
                    </p>
                  ) : null}
                </>
              )}

              {circuitDone ? null : (
                <p className="mt-8 text-sm text-[#f6f1e3]/55">
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
              {error ? <p className="mt-4 text-sm font-semibold text-[#e8c547]">{error}</p> : null}
            </div>
            {guided && !circuitDone ? (
              <div className="shrink-0 border-t border-white/10 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={completeStep}
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
                >
                  <Check className="h-6 w-6" />
                  Done
                </button>
              </div>
            ) : null}
            {guided && circuitDone && error ? (
              <div className="shrink-0 border-t border-white/10 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => finishSlot(true)}
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
                >
                  Credit this Optional
                </button>
              </div>
            ) : null}
            <VideoModal
              open={Boolean(videoOpen && videoStep?.videoId)}
              title={
                videoStep && state.track
                  ? `${optionalTrackLevelLabel(state.track, state.level)} · ${videoStep.title}`
                  : ''
              }
              videoId={videoStep?.videoId || ''}
              onClose={() => {
                setVideoOpen(false);
                setVideoStep(null);
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
