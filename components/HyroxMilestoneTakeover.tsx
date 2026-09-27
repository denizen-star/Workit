'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { coachPersonaSrc } from '@/lib/coachPersonas';
import type { CoachTone } from '@/lib/coachTone';
import { pickHyroxMilestoneLine } from '@/lib/coachLines';
import { HYROX_MILESTONE_CRITERIA } from '@/lib/hyroxProgram';
import { useSavingCaption } from '@/lib/useSavingCaption';

interface HyroxMilestoneTakeoverProps {
  tone: CoachTone;
  name: string;
  milestoneNumber: number;
  /** Called once a final decision is made: passed, or failed + what to do next. Awaited
   * so the button can show the saving captions while it records the result. */
  onResolve: (result: { passed: boolean; leaveHyrox: boolean }) => void | Promise<void>;
}

type Step = 'checklist' | 'result' | 'decide';

/** Self-reported milestone pass/fail. Criteria are subjective (joint pain, unbroken
 * sets) so the app can't infer them from logged sets/times — the athlete checks
 * them off themselves, honor-system, same as any benchmark test. */
export default function HyroxMilestoneTakeover({
  tone,
  name,
  milestoneNumber,
  onResolve,
}: HyroxMilestoneTakeoverProps) {
  const criteria = HYROX_MILESTONE_CRITERIA[milestoneNumber];
  const [checked, setChecked] = useState<boolean[]>(() => criteria.checks.map(() => false));
  const [step, setStep] = useState<Step>('checklist');
  const [passed, setPassed] = useState(false);

  const allChecked = checked.every(Boolean);
  const save = useSavingCaption();
  // Which final button is saving, so only that one shows the caption.
  const [savingChoice, setSavingChoice] = useState<'continue' | 'retry' | 'leave' | null>(null);

  const resolve = async (choice: 'continue' | 'retry' | 'leave') => {
    if (!save.begin()) return;
    setSavingChoice(choice);
    try {
      await onResolve({ passed: choice === 'continue', leaveHyrox: choice === 'leave' });
    } finally {
      save.end();
      setSavingChoice(null);
    }
  };

  const label = (choice: 'continue' | 'retry' | 'leave', text: string) =>
    savingChoice === choice ? (
      <span className="inline-flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        {save.caption}
      </span>
    ) : (
      text
    );
  const avatarSrc = coachPersonaSrc(tone, passed ? 'celebratory' : 'ok');
  const line = step !== 'checklist' ? pickHyroxMilestoneLine(passed, tone, name) : '';

  const submit = (result: boolean) => {
    setPassed(result);
    setStep(result ? 'result' : 'decide');
  };

  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto bg-[#07070a] px-5 py-10">
      <div className="mx-auto max-w-md">
        {step !== 'checklist' && (
          <img src={avatarSrc} alt="" className="mb-4 h-16 w-16 rounded-full border border-white/15 object-cover object-top" />
        )}
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Hyrox Training</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{criteria.title}</h2>

        {step === 'checklist' && (
          <>
            <p className="mt-3 text-[#f6f1e3]/80">Check off everything that&apos;s true, honestly.</p>
            <ul className="mt-6 space-y-3">
              {criteria.checks.map((check, index) => (
                <li key={check}>
                  <button
                    type="button"
                    onClick={() =>
                      setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)))
                    }
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm font-semibold ${
                      checked[index]
                        ? 'border-[#e8c547]/50 bg-[#e8c547]/10 text-white'
                        : 'border-white/10 bg-black/25 text-[#f6f1e3]/80'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
                        checked[index] ? 'border-[#e8c547] bg-[#e8c547] text-[#1a1404]' : 'border-white/30'
                      }`}
                    >
                      {checked[index] ? '✓' : ''}
                    </span>
                    {check}
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => submit(true)}
              disabled={!allChecked}
              className="mt-8 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404] disabled:opacity-40"
            >
              I passed
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              className="mt-3 block w-full text-center text-sm font-bold text-[#f6f1e3]/60"
            >
              Not yet
            </button>
          </>
        )}

        {step === 'result' && (
          <>
            <p className="mt-3 text-[#f6f1e3]/80">{line}</p>
            <button
              type="button"
              onClick={() => resolve('continue')}
              disabled={save.saving}
              aria-busy={savingChoice === 'continue'}
              className="mt-8 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
            >
              {label('continue', 'Continue')}
            </button>
          </>
        )}

        {step === 'decide' && (
          <>
            <p className="mt-3 text-[#f6f1e3]/80">{line}</p>
            <p className="mt-4 text-sm font-semibold text-[#f6f1e3]/60">
              Retry the benchmark whenever you&apos;re ready, or head back to your normal program right now.
            </p>
            <button
              type="button"
              onClick={() => resolve('retry')}
              disabled={save.saving}
              aria-busy={savingChoice === 'retry'}
              className="mt-8 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
            >
              {label('retry', 'Retry the milestone')}
            </button>
            <button
              type="button"
              onClick={() => resolve('leave')}
              disabled={save.saving}
              aria-busy={savingChoice === 'leave'}
              className="mt-3 block w-full text-center text-sm font-bold text-[#f6f1e3]/60"
            >
              {label('leave', 'Return to my normal program')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
