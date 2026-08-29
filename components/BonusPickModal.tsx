'use client';

import { useMemo, useState } from 'react';
import { BELT_ACTIVITY_OPTIONS } from '@/lib/belts';

export default function BonusPickModal({
  open,
  onCore,
  onActivity,
  onClose,
}: {
  open: boolean;
  onCore: () => void;
  onActivity: (label: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [...BELT_ACTIVITY_OPTIONS];
    return BELT_ACTIVITY_OPTIONS.filter((item) => item.toLowerCase().includes(needle));
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="glass-card w-full max-w-md p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/55">Bonus</p>
        <h2 className="mt-1 text-2xl font-black text-white">Core in here, or something else</h2>
        <p className="mt-2 text-sm text-[#f6f1e3]/70">
          Logged core counts. A run, yoga, or class counts too. We will not log the class sets.
        </p>
        <button
          type="button"
          onClick={onCore}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#e8c547] text-sm font-black text-[#1a1404]"
        >
          Logged core circuit
        </button>
        <label className="mt-5 block text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">
          Something else
        </label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search run, yoga, Hyrox..."
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
        />
        <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onActivity(item)}
              className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#f6f1e3] hover:bg-white/5"
            >
              {item}
            </button>
          ))}
        </div>
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Or type your own"
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
        />
        <button
          type="button"
          disabled={!custom.trim()}
          onClick={() => onActivity(custom.trim())}
          className="mt-2 flex min-h-11 w-full items-center justify-center rounded-2xl border border-white/15 text-sm font-black text-white disabled:opacity-40"
        >
          I did this
        </button>
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm font-semibold text-[#f6f1e3]/55">
          Not now
        </button>
      </div>
    </div>
  );
}
