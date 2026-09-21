'use client';

import { FRONT_MUSCLES, BACK_MUSCLES } from 'body-muscles';
import { MUSCLE_GROUP_HIGHLIGHT_IDS, type MuscleGroup } from '@/lib/muscleGroups';

// `body-muscles` lays front and back regions out in one shared coordinate space (see its
// BodyChart.ts) — front spans x 0-35, back spans x 37-72. Slicing the viewBox per view is
// what turns the combined path set into two separate silhouettes.
const FRONT_VIEW_BOX = '0 0 35 93';
const BACK_VIEW_BOX = '37 0 35 93';

/** One anterior or posterior silhouette, every region in a neutral outline fill, with the
 * `highlightIds` regions filled gold — the "gym equipment placard" look. */
function BodySilhouette({
  muscles,
  viewBox,
  highlightIds,
  label,
}: {
  muscles: typeof FRONT_MUSCLES;
  viewBox: string;
  highlightIds: string[] | 'all';
  label: string;
}) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={label} className="h-full w-auto">
      {muscles.map((muscle) => {
        const isHighlighted = highlightIds === 'all' || highlightIds.includes(muscle.id);
        return (
          <path
            key={muscle.id}
            d={muscle.path}
            fill={isHighlighted ? '#e8c547' : 'rgba(246, 241, 227, 0.12)'}
            stroke="rgba(246, 241, 227, 0.35)"
            strokeWidth={0.15}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

/** Anatomical front + back muscle-group diagram for the Alt Exercise takeover — one per
 * alternative, matching how gym equipment placards show which muscle a machine targets. */
export default function MuscleDiagram({ group, className }: { group: MuscleGroup; className?: string }) {
  const highlightIds = group === 'Full Body' ? 'all' : MUSCLE_GROUP_HIGHLIGHT_IDS[group];

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <BodySilhouette muscles={FRONT_MUSCLES} viewBox={FRONT_VIEW_BOX} highlightIds={highlightIds} label={`${group} — front`} />
      <BodySilhouette muscles={BACK_MUSCLES} viewBox={BACK_VIEW_BOX} highlightIds={highlightIds} label={`${group} — back`} />
    </div>
  );
}
