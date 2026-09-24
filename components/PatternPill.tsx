import { movementPattern } from '@/lib/movementPattern';

/** Push / Pull / Legs / Core label for an exercise (lib/movementPattern.ts). Renders
 * nothing for cardio, conditioning and mobility. Neutral cream — it's a label, not an
 * action (gold) or a status (green/red). */
export default function PatternPill({
  name,
  muscleGroup,
  className = '',
}: {
  name: string;
  /** Library fallback for names outside the explicit map. */
  muscleGroup?: string | null;
  className?: string;
}) {
  const pattern = movementPattern(name, muscleGroup);
  if (!pattern) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#f6f1e3]/70 ${className}`}
    >
      {pattern}
    </span>
  );
}
