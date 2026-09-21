/** Flags a travel-friendly (no gym equipment needed) exercise — docs/plans/PLAN_ALT_EXERCISES.md.
 * Replaces the old per-card Gym/Travel toggle: instead of a control that switches a movement's
 * variant, this just marks which movements (current or Alt alternatives) need no equipment. */
export default function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Travel-friendly — no gym equipment needed"
      role="img"
      className={className ?? 'h-3.5 w-3.5'}
    >
      <path d="M21 15.5v-2l-8-5V4.5a1.5 1.5 0 0 0-3 0v4l-8 5v2l8-2.5V17l-2.5 2v1.5l3.5-1 3.5 1V19l-2.5-2v-4.5z" />
    </svg>
  );
}
