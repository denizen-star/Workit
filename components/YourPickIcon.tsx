/** Your pick mark (docs/plans/PLAN_YOUR_PICK.md): a gold die with a spark — "you chose
 * this one." Used on the picker, Your pick cards, swapped tiles and the completed log.
 * Gold by default (the take-this-action tone); pass `className` to size/recolor. */
export default function YourPickIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Your pick"
      role="img"
      className={className ?? 'h-4 w-4 text-[#e8c547]'}
    >
      <rect x="2.5" y="6.5" width="14" height="14" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6.5" cy="10.5" r="1.25" fill="currentColor" />
      <circle cx="9.5" cy="13.5" r="1.25" fill="currentColor" />
      <circle cx="12.5" cy="16.5" r="1.25" fill="currentColor" />
      <path
        d="M19 1.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"
        fill="currentColor"
      />
    </svg>
  );
}
