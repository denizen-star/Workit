interface FinishStepperProps {
  /** 1-indexed position of the screen currently showing. */
  current: number;
  /** Total screens in this run — only the ones that will actually show (e.g. Awards is skipped when nothing was earned). */
  total: number;
}

/**
 * Segmented progress bar for the post-finish screen sequence (star rating →
 * Recap → Complete → Awards). Instagram-story style: filled segments only, no
 * numbers. Purely visual — screens still advance on the same taps they always
 * have, this just shows how many are left.
 */
export default function FinishStepper({ current, total }: FinishStepperProps) {
  if (total <= 1) return null;

  return (
    <div className="mb-5 flex gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[#e8c547] transition-all duration-300"
            style={{ width: index < current ? '100%' : '0%' }}
          />
        </div>
      ))}
    </div>
  );
}
