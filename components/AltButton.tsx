'use client';

/** Opens the Alt Exercise takeover (docs/plans/PLAN_ALT_EXERCISES.md). Same pill styling and
 * lock behavior as ModeToggle — gold-filled once an alt is active, disabled+dimmed once the
 * card is locked (first completed set), same as Gym/Travel. */
export default function AltButton({
  active,
  locked,
  onClick,
}: {
  active: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      aria-label={active ? 'Change alt exercise' : 'Swap for an alt exercise'}
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${
        active ? 'border-[#e8c547] bg-[#e8c547] text-[#1a1404]' : 'border-white/15 bg-black/35 text-[#f6f1e3]/55'
      } ${locked ? 'opacity-70' : ''}`}
    >
      Alt
    </button>
  );
}
