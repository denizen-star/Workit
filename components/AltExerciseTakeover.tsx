'use client';

import MuscleDiagram from './MuscleDiagram';
import PlaneIcon from './PlaneIcon';
import type { MuscleGroup } from '@/lib/muscleGroups';
import { isTravelFriendly } from '@/lib/travelFriendly';

/** Alt Exercise picker (docs/plans/PLAN_ALT_EXERCISES.md) — patterned on BonusPickModal's
 * bottom-sheet takeover. Parent owns `open` state and the alternatives list (from
 * lib/altExercises.ts); this component holds no network calls, same as BonusPickModal. */
export default function AltExerciseTakeover({
  open,
  exerciseName,
  muscleGroup,
  alternatives,
  onSelect,
  onClose,
}: {
  open: boolean;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  alternatives: string[];
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="glass-card w-full max-w-md p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/55">Alt Exercise</p>
        <h2 className="mt-1 text-2xl font-black text-white">Swap {exerciseName}</h2>
        <p className="mt-2 text-sm text-[#f6f1e3]/70">
          Same {muscleGroup.toLowerCase()} work, a different movement — for today only. History and PRs track the
          new exercise on its own.
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#f6f1e3]/50">
          <PlaneIcon className="h-3 w-3 shrink-0 text-[#e8c547]" /> No gym equipment needed
        </p>
        <div className="mt-4 flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {alternatives.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-left hover:bg-white/5"
            >
              <MuscleDiagram group={muscleGroup} className="h-14 shrink-0" />
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                {name}
                {isTravelFriendly(name) && <PlaneIcon className="h-3.5 w-3.5 shrink-0 text-[#e8c547]" />}
              </span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full py-2 text-sm font-semibold text-[#f6f1e3]/55">
          Never mind
        </button>
      </div>
    </div>
  );
}
