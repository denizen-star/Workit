'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Finish saving indicator (docs/plans/PLAN_TEST_DRIVE.md). The server does it all in
 * one request, so these steps are timed for show: each holds `STEP_MS`, the last one
 * holds until the caller calls `end()`.
 */
export const SAVING_CAPTIONS = ['Saving…', 'Calculating…', 'Checking…'];
const STEP_MS = 1200;

export function useSavingCaption() {
  const [step, setStep] = useState<number | null>(null);
  // A ref, not state, so a second tap in the same frame is refused too.
  const active = useRef(false);

  useEffect(() => {
    if (step == null || step >= SAVING_CAPTIONS.length - 1) return;
    const timer = window.setTimeout(() => setStep((current) => (current == null ? null : current + 1)), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [step]);

  /** Starts the captions; false if a save is already running (block the double tap). */
  const begin = useCallback(() => {
    if (active.current) return false;
    active.current = true;
    setStep(0);
    return true;
  }, []);

  const end = useCallback(() => {
    active.current = false;
    setStep(null);
  }, []);

  return { saving: step != null, caption: step == null ? '' : SAVING_CAPTIONS[step], begin, end };
}
