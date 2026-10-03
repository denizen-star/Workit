'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import PlaneIcon from './PlaneIcon';
import { addableGroups, type AddedExercise } from '@/lib/exerciseEdits';
import { isTravelFriendly } from '@/lib/travelFriendly';

/** Add exercise picker (lib/exerciseEdits.ts) — same bottom-sheet takeover as
 * AltExerciseTakeover. Every main-program lift, grouped by muscle, minus today's cards.
 * Parent owns `open` and the save; no network calls here. Portals to `document.body` with a
 * solid panel so the live session's glass cards, Finish it and the coach dock can't show
 * through or sit on top of it. */
export default function AddExerciseTakeover({
  open,
  exclude,
  onSelect,
  onClose,
}: {
  open: boolean;
  exclude: string[];
  onSelect: (exercise: AddedExercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  if (!open || typeof document === 'undefined') return null;

  const needle = search.trim().toLowerCase();
  const groups = addableGroups(exclude)
    .map((group) => ({
      ...group,
      exercises: needle ? group.exercises.filter((item) => item.name.toLowerCase().includes(needle)) : group.exercises,
    }))
    .filter((group) => group.exercises.length > 0);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#14140f] p-5 shadow-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/55">Add exercise</p>
        <h2 className="mt-1 text-2xl font-black text-white">Add to today</h2>
        <p className="mt-2 text-sm text-[#f6f1e3]/70">For today only. It goes after the last card.</p>
        <label className="mt-4 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/30 px-3">
          <Search className="h-4 w-4 shrink-0 text-[#f6f1e3]/50" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search lifts"
            className="min-h-11 w-full bg-transparent text-base text-white placeholder:text-[#f6f1e3]/40 focus:outline-none"
          />
        </label>
        <div className="mt-3 flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
          {groups.length === 0 && <p className="text-sm text-[#f6f1e3]/60">No lifts match.</p>}
          {groups.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#e8c547]">{group.group}</p>
              <div className="flex flex-col gap-2">
                {group.exercises.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-2 text-left hover:border-[#e8c547]/40"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-white">
                      <span className="truncate">{item.name}</span>
                      {isTravelFriendly(item.name) && <PlaneIcon className="h-3 w-3 shrink-0 text-[#e8c547]" />}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#f6f1e3]/55">
                      {item.sets}×{item.reps}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-12 w-full rounded-2xl text-sm font-semibold text-[#f6f1e3]/80 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
