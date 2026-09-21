import type { LibraryMuscleGroup } from '@/lib/movementLibrary';

/** Simple line-icon pictogram per muscle group — The Library's section headers and card
 * badges (docs — CLAUDE.md's `app/library/page.tsx` entry). Abstract glyphs, not anatomy;
 * for a real anatomical highlight see `components/MuscleDiagram.tsx` (Alt Exercise's
 * different, gym-placard-style picture). */
const PATHS: Record<LibraryMuscleGroup, React.ReactNode> = {
  Chest: (
    <>
      <rect x="5" y="7" width="14" height="11" rx="4" />
      <line x1="12" y1="7" x2="12" y2="18" />
    </>
  ),
  Back: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="6" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </>
  ),
  Shoulders: (
    <>
      <circle cx="7" cy="10" r="3.2" />
      <circle cx="17" cy="10" r="3.2" />
      <line x1="10.2" y1="11" x2="13.8" y2="11" />
    </>
  ),
  Arms: (
    <>
      <rect x="2.5" y="10" width="3.5" height="4" rx="1.2" />
      <rect x="18" y="10" width="3.5" height="4" rx="1.2" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </>
  ),
  Core: (
    <>
      <rect x="9" y="5" width="3" height="3.4" rx="1" />
      <rect x="13.3" y="5" width="3" height="3.4" rx="1" />
      <rect x="9" y="9.6" width="3" height="3.4" rx="1" />
      <rect x="13.3" y="9.6" width="3" height="3.4" rx="1" />
      <rect x="9" y="14.2" width="3" height="3.4" rx="1" />
      <rect x="13.3" y="14.2" width="3" height="3.4" rx="1" />
    </>
  ),
  Glutes: (
    <>
      <circle cx="9" cy="14" r="5.2" />
      <circle cx="15" cy="14" r="5.2" />
    </>
  ),
  Quads: (
    <>
      <rect x="8.5" y="4" width="7" height="15" rx="3.5" />
      <line x1="8.5" y1="11.5" x2="15.5" y2="11.5" />
    </>
  ),
  Hamstrings: (
    <>
      <rect x="8.5" y="4" width="7" height="15" rx="3.5" />
      <path d="M9 19c0 1.5 1.2 2.5 3 2.5" />
    </>
  ),
  Calves: <path d="M12 3c2.8 4 3.6 8.4 1.8 12.8-.8 2-2.8 2-3.6 0C8.4 11.4 9.2 7 12 3z" />,
  'Full Body': (
    <>
      <circle cx="12" cy="4.5" r="2.3" />
      <line x1="12" y1="6.8" x2="12" y2="14" />
      <line x1="12" y1="9.5" x2="6.5" y2="12.5" />
      <line x1="12" y1="9.5" x2="17.5" y2="12.5" />
      <line x1="12" y1="14" x2="7.5" y2="21" />
      <line x1="12" y1="14" x2="16.5" y2="21" />
    </>
  ),
  Cardio: <path d="M12 19.5S4 14 4 8.8C4 5.9 6.2 4 8.6 4c1.6 0 3 .9 3.4 2.2C12.4 4.9 13.8 4 15.4 4 17.8 4 20 5.9 20 8.8c0 5.2-8 10.7-8 10.7z" />,
  Mobility: (
    <>
      <circle cx="12" cy="4.2" r="2" />
      <line x1="12" y1="6.2" x2="12" y2="11" />
      <line x1="12" y1="8" x2="7" y2="6" />
      <line x1="12" y1="8" x2="17" y2="10" />
      <line x1="12" y1="11" x2="8" y2="18" />
      <line x1="12" y1="11" x2="16" y2="17" />
    </>
  ),
};

const FILLED: Partial<Record<LibraryMuscleGroup, boolean>> = { Cardio: true };

export default function MuscleGroupIcon({ group, className }: { group: LibraryMuscleGroup; className?: string }) {
  const filled = FILLED[group];
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'h-5 w-5'}
      aria-hidden="true"
    >
      {PATHS[group]}
    </svg>
  );
}
