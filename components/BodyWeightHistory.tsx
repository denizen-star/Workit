'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import BodyWeightChart, { formatLb } from '@/components/BodyWeightChart';
import BodyWeightField from '@/components/BodyWeightField';
import {
  BODY_WEIGHT_INVALID,
  isBigWeightJump,
  parseBodyWeightInput,
  weightSavedLabel,
} from '@/lib/bodyWeightShared';

type Entry = { id: number; weightLb: number; createdAt: string };

function whenLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

/**
 * Your weigh-ins (docs/plans/PLAN_BODY_WEIGHT.md): trend chart, every entry newest
 * first, **+ Add weigh-in**, and a ✕ to remove a mistyped one. A jump of 20%+ from the
 * last weigh-in asks once before saving (catches 20 for 200). Neutral copy only.
 * With `userId` (Kevin, Admin → Athletes) it is the same view, read-only.
 */
export default function BodyWeightHistory({ userId }: { userId?: number }) {
  const editable = userId == null;
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [weight, setWeight] = useState('');
  const [confirmJump, setConfirmJump] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(userId ? `/api/body-weight?userId=${userId}` : '/api/body-weight')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setEntries((data?.history || []) as Entry[]);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const latest = entries && entries.length ? entries[entries.length - 1] : null;

  const closeForm = () => {
    setAdding(false);
    setWeight('');
    setConfirmJump(null);
    setError('');
  };

  const save = async (lb: number) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/body-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightLb: lb }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || 'Could not save. Try again.');
        return;
      }
      setEntries(data.history as Entry[]);
      closeForm();
      setSavedNote(weightSavedLabel(lb));
      window.setTimeout(() => setSavedNote(''), 2500);
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const lb = parseBodyWeightInput(weight);
    if (lb == null) {
      setError(BODY_WEIGHT_INVALID);
      return;
    }
    if (confirmJump !== lb && isBigWeightJump(latest?.weightLb, lb)) {
      setConfirmJump(lb);
      return;
    }
    void save(lb);
  };

  const remove = async (id: number) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/body-weight?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (res.ok) setEntries(data.history as Entry[]);
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  };

  if (entries == null) return <p className="text-sm text-[#f6f1e3]/55">Loading…</p>;

  return (
    <div>
      {entries.length ? (
        <BodyWeightChart entries={entries} />
      ) : (
        <p className="text-sm text-[#f6f1e3]/55">No weight saved yet.</p>
      )}

      {savedNote ? (
        <p role="status" className="mt-3 text-sm font-black text-[#6d8b6e]">
          {savedNote}
        </p>
      ) : null}

      {editable ? (
        adding ? (
          <div className="mt-4 rounded-2xl border border-white/10 p-4">
            <BodyWeightField value={weight} onChange={(value) => {
              setWeight(value);
              setConfirmJump(null);
            }} label="Weight now" className="" />
            {confirmJump != null && latest ? (
              <p className="mt-3 text-sm font-semibold text-[#a35d52]">
                That&rsquo;s a big change from {formatLb(latest.weightLb)}. Save {formatLb(confirmJump)}?
              </p>
            ) : null}
            {error ? <p className="mt-3 text-sm font-semibold text-[#a35d52]">{error}</p> : null}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="min-h-11 flex-1 rounded-2xl border border-white/10 font-semibold text-[#f6f1e3]/75"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="min-h-11 flex-1 rounded-2xl bg-[#e8c547] font-black text-[#1a1404] disabled:opacity-50"
              >
                {confirmJump != null ? `Save ${formatLb(confirmJump)}` : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#e8c547] px-4 font-black text-[#1a1404]"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Add weigh-in
          </button>
        )
      ) : null}

      {entries.length ? (
        <ul className="mt-4 divide-y divide-white/5">
          {[...entries].reverse().map((entry) => (
            <li key={entry.id} className="flex min-h-11 items-center justify-between gap-3 py-1">
              <span className="text-sm text-[#f6f1e3]/60">{whenLabel(entry.createdAt)}</span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-black text-[#f6f1e3]">{formatLb(entry.weightLb)}</span>
                {editable ? (
                  pendingDelete === entry.id ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(entry.id)}
                      className="min-h-9 rounded-xl bg-[#a35d52] px-3 text-xs font-black text-[#f6f1e3] disabled:opacity-50"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Remove ${formatLb(entry.weightLb)} entry`}
                      onClick={() => setPendingDelete(entry.id)}
                      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl text-[#f6f1e3]/45 hover:text-[#f6f1e3]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
