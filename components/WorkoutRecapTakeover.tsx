'use client';

import CompareTable from '@/components/CompareTable';
import FinishStepper from '@/components/FinishStepper';
import { HelpTip } from '@/components/HelpSheet';
import type { CompareRow } from '@/lib/compareTable';
import { recapOptionalRows } from '@/lib/compareTable';
import { KPI_CALC_BULLETS } from '@/lib/helpCopy';

/** Finish recap. This | Last per exercise vs last time that lift ran. */
export default function WorkoutRecapTakeover({
  open,
  title,
  rows,
  optionalLbs = 0,
  warmup = false,
  cooldown = false,
  step,
  totalSteps,
  onClose,
}: {
  open: boolean;
  title: string;
  rows: CompareRow[];
  optionalLbs?: number;
  warmup?: boolean;
  cooldown?: boolean;
  /** This screen's position in the post-finish sequence, for the segmented stepper. */
  step?: number;
  totalSteps?: number;
  onClose: () => void;
}) {
  if (!open) return null;

  const extra =
    optionalLbs || warmup || cooldown ? recapOptionalRows({ lbs: optionalLbs, warmup, cooldown }) : [];
  const tableRows = [...rows, ...extra];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') onClose();
      }}
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-[#07070a]/95 px-6"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#e8c547] opacity-20 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        {step && totalSteps ? <FinishStepper current={step} total={totalSteps} /> : null}
        <div className="mb-3 flex items-center justify-center gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">This session</p>
          <HelpTip
            label="How these numbers are made"
            title="This vs last time"
            lead="Each row is that lift vs the last time you ran that same exercise, not last time you ran this program day."
            bullets={KPI_CALC_BULLETS}
          />
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-white">{title}</h2>
        {tableRows.length > 0 ? (
          <div className="mt-6 max-h-[50vh] overflow-y-auto">
            <CompareTable rows={tableRows} youLabel="This" />
          </div>
        ) : (
          <p className="mt-6 text-center text-base text-[#f6f1e3]/70">No completed sets to score.</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#e8c547] text-base font-black text-[#1a1404]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
