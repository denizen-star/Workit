'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import YouPageShell from '@/components/YouPageShell';
import MuscleGroupIcon from '@/components/MuscleGroupIcon';
import {
  MOVEMENT_LIBRARY,
  LIBRARY_MUSCLE_GROUPS,
  type MovementEntry,
  type MovementGroup,
  type MovementMode,
  type LibraryMuscleGroup,
} from '@/lib/movementLibrary';

type SectionFilter = 'all' | 'main' | 'optional' | 'hyrox';
type ModeFilter = 'all' | MovementMode;

function toSection(group: MovementGroup): Exclude<SectionFilter, 'all'> {
  if (group === 'main') return 'main';
  if (group === 'hyrox') return 'hyrox';
  return 'optional';
}

const SECTIONS: { key: SectionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'main', label: 'Main Program' },
  { key: 'optional', label: 'Warmup & Cooldown' },
  { key: 'hyrox', label: 'Hyrox Training' },
];

const MODES: { key: ModeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gym', label: 'Gym' },
  { key: 'travel', label: 'Travel' },
  { key: 'bodyweight', label: 'Bodyweight' },
];

const SECTION_LABEL: Record<Exclude<SectionFilter, 'all'>, string> = {
  main: 'Main',
  optional: 'Optional',
  hyrox: 'Hyrox',
};

function Card({ movement, onJump }: { movement: MovementEntry; onJump: (name: string) => void }) {
  const [pos, setPos] = useState<'start' | 'end'>('start');
  const hasEnd = Boolean(movement.end);
  const src = pos === 'end' && movement.end ? movement.end : movement.start;

  return (
    <article className="glass-card overflow-hidden">
      <div className="relative aspect-[4/3] bg-black/30">
        <img src={src} alt={`${movement.name} — ${pos} position`} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#f6f1e3]">
          {SECTION_LABEL[toSection(movement.group)]}
        </span>
        {movement.mode === 'travel' && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#7aaee0]">
            Travel
          </span>
        )}
      </div>
      <div className="flex border-t border-white/10">
        <button
          type="button"
          onClick={() => setPos('start')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wide ${
            pos === 'start' ? 'bg-white/5 text-[#e8c547]' : 'text-[#f6f1e3]/40'
          }`}
        >
          Start
        </button>
        <button
          type="button"
          disabled={!hasEnd}
          onClick={() => setPos('end')}
          className={`flex-1 border-l border-white/10 py-1.5 text-[11px] font-black uppercase tracking-wide disabled:opacity-30 ${
            pos === 'end' ? 'bg-white/5 text-[#e8c547]' : 'text-[#f6f1e3]/40'
          }`}
        >
          End
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-white">{movement.name}</p>
        {movement.pairedWith && (
          <button
            type="button"
            onClick={() => onJump(movement.pairedWith as string)}
            className="mt-1 text-xs font-semibold text-[#e8c547] hover:underline"
          >
            ⇄ Paired with {movement.pairedWith}
          </button>
        )}
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#f6f1e3]/50">
          <span className="truncate">{movement.category}</span>
          <span className="font-mono font-bold text-[#f6f1e3]/70">{movement.occurrences}×</span>
        </div>
      </div>
    </article>
  );
}

export default function LibraryPage() {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<SectionFilter>('all');
  const [mode, setMode] = useState<ModeFilter>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return MOVEMENT_LIBRARY.filter((m) => {
      if (section !== 'all' && toSection(m.group) !== section) return false;
      if (mode !== 'all' && m.mode !== mode) return false;
      if (needle && !m.name.toLowerCase().includes(needle) && !m.category.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [query, section, mode]);

  const byGroup = useMemo(() => {
    const map = new Map<LibraryMuscleGroup, MovementEntry[]>();
    for (const g of LIBRARY_MUSCLE_GROUPS) map.set(g, []);
    for (const m of filtered) map.get(m.muscleGroup)?.push(m);
    return map;
  }, [filtered]);

  const jumpTo = (name: string) => {
    setQuery(name);
    setSection('all');
    setMode('all');
  };

  return (
    <YouPageShell title="The Library">
      <p className="text-sm text-[#f6f1e3]/70">
        Every distinct movement in Work-It — the main program (gym and travel), Hyrox Training, and the optional
        warmup/cooldown circuits — grouped by the muscle group it trains, with a start and end form photo for each.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f6f1e3]/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movements…"
            className="w-full rounded-2xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#e8c547]/50"
          />
        </div>
        <span className="font-mono text-xs text-[#f6f1e3]/50">
          {filtered.length} / {MOVEMENT_LIBRARY.length}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              section === s.key
                ? 'border-[#e8c547] bg-[#e8c547] text-[#1a1404]'
                : 'border-white/15 bg-black/30 text-[#f6f1e3]/60'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
              mode === m.key
                ? 'border-[#e8c547] bg-[#e8c547] text-[#1a1404]'
                : 'border-white/15 bg-black/20 text-[#f6f1e3]/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {LIBRARY_MUSCLE_GROUPS.map((g) => {
          const count = byGroup.get(g)?.length ?? 0;
          if (count === 0) return null;
          return (
            <a
              key={g}
              href={`#mg-${g.replace(/\s+/g, '-').toLowerCase()}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-[#f6f1e3]/70"
            >
              <MuscleGroupIcon group={g} className="h-3.5 w-3.5 text-[#e8c547]" />
              {g}
              <span className="font-mono text-[#f6f1e3]/40">{count}</span>
            </a>
          );
        })}
      </div>

      <div className="mt-6 space-y-10">
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-[#f6f1e3]/50">No movements match &ldquo;{query}&rdquo;.</p>
        )}
        {LIBRARY_MUSCLE_GROUPS.map((g) => {
          const items = byGroup.get(g) ?? [];
          if (items.length === 0) return null;
          return (
            <section key={g} id={`mg-${g.replace(/\s+/g, '-').toLowerCase()}`} className="scroll-mt-24">
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <MuscleGroupIcon group={g} className="h-5 w-5 text-[#e8c547]" />
                <h2 className="text-lg font-black text-white">{g}</h2>
                <span className="font-mono text-xs text-[#f6f1e3]/40">{items.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {items.map((m) => (
                  <Card key={m.name} movement={m} onJump={jumpTo} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </YouPageShell>
  );
}
