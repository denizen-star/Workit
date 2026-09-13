import type { HardnessScore } from '@/lib/hardness';

/** Tiny 5-segment fill bar standing in for "Effort N" text on a collapsed/folded set row. */
export default function EffortBar({ score }: { score: HardnessScore }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" aria-label={`Effort ${score} of 5`}>
      {[1, 2, 3, 4, 5].map((segment) => (
        <span
          key={segment}
          className={`h-1.5 w-3 rounded-full ${segment <= score ? 'bg-[#e8c547]' : 'bg-white/15'}`}
        />
      ))}
    </span>
  );
}
