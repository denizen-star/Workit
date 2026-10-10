import Link from 'next/link';

export type WorkoutBoxButton = {
  href: string;
  label: string;
  /** Small second line under the label. */
  sub: string;
  onClick?: () => void;
};

/**
 * The Home hero's "Workout" box: one gold button (what to do now) and an optional
 * outlined one beside it. Both share the row equally, so a lone button fills it.
 * Used by every Home hero state (start / resume, rest day, all complete).
 */
export default function HomeWorkoutBox({
  primary,
  secondary,
}: {
  primary: WorkoutBoxButton;
  secondary?: WorkoutBoxButton;
}) {
  const base =
    'flex min-h-[84px] min-w-0 flex-col items-start justify-center gap-0.5 rounded-2xl px-4 py-3 text-left text-sm font-black sm:text-base';
  const sub = 'text-[11px] font-semibold leading-tight opacity-65';
  return (
    <div className="mt-5 rounded-[20px] border border-[#e8c547]/25 bg-[#e8c547]/[0.04] p-3.5">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#e8c547]">Workout</p>
      <div className="mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-2.5">
        <Link
          href={primary.href}
          onClick={primary.onClick}
          className={`${base} bg-[#e8c547] text-[#1a1404]`}
        >
          <span>{primary.label}</span>
          <small className={sub}>{primary.sub}</small>
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            onClick={secondary.onClick}
            className={`${base} border border-[#e8c547]/50 text-[#f6f1e3]`}
          >
            <span>{secondary.label}</span>
            <small className={sub}>{secondary.sub}</small>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
