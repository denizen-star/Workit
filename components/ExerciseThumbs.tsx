'use client';

import { FormEvent, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { THUMB_REASONS, reasonLabel, type ThumbReason } from '@/lib/feedback';

export type ExerciseThumb = {
  exerciseName: string;
  reason: string | null;
  message?: string;
};

export default function ExerciseThumbs({
  sessionId,
  exerciseName,
  saved,
  onSaved,
}: {
  sessionId: number;
  exerciseName: string;
  saved?: ExerciseThumb | null;
  onSaved: (thumb: ExerciseThumb) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherNote, setOtherNote] = useState('');
  const [busy, setBusy] = useState(false);

  const locked = !!saved;

  const post = async (vote: 'up' | 'down', reason?: ThumbReason, note = '') => {
    if (locked || busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'thumb',
          sessionId,
          exerciseName,
          vote,
          reason: reason ?? null,
          message: note,
        }),
      });
      if (response.status === 409) {
        onSaved({
          exerciseName,
          reason: vote === 'up' ? null : reason ?? 'other',
          message: note,
        });
        setPicking(false);
        setOtherOpen(false);
        return;
      }
      if (!response.ok) return;
      onSaved({
        exerciseName,
        reason: vote === 'up' ? null : reason ?? null,
        message: note,
      });
      setPicking(false);
      setOtherOpen(false);
      setOtherNote('');
    } finally {
      setBusy(false);
    }
  };

  const pickReason = (reason: ThumbReason) => {
    if (reason === 'other') {
      setOtherOpen(true);
      return;
    }
    void post('down', reason);
  };

  const sendOther = (event: FormEvent) => {
    event.preventDefault();
    const note = otherNote.trim();
    if (note.length < 3) return;
    void post('down', 'other', note);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={locked || busy}
          aria-label="Looks good"
          aria-pressed={saved ? saved.reason == null : false}
          onClick={() => post('up')}
          className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border ${
            saved && saved.reason == null
              ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
              : 'border-white/10 text-[#f6f1e3]/55 hover:border-[#e8c547]/40'
          } disabled:opacity-70`}
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={locked || busy}
          aria-label="Something is off"
          aria-pressed={saved ? saved.reason != null : false}
          onClick={() => {
            setPicking(true);
            setOtherOpen(false);
          }}
          className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border ${
            saved && saved.reason != null
              ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
              : 'border-white/10 text-[#f6f1e3]/55 hover:border-[#e8c547]/40'
          } disabled:opacity-70`}
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
        {saved ? (
          <span className="text-xs font-semibold text-[#f6f1e3]/50">{reasonLabel(saved.reason)}</span>
        ) : null}
      </div>
      {saved?.message ? (
        <p className="mt-2 text-sm text-[#f6f1e3]/70">{saved.message}</p>
      ) : null}
      {picking && !locked ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {THUMB_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              disabled={busy}
              onClick={() => pickReason(reason)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                reason === 'other' && otherOpen
                  ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                  : 'border-white/15 text-[#f6f1e3]/80 hover:border-[#e8c547]/50'
              }`}
            >
              {reasonLabel(reason)}
            </button>
          ))}
        </div>
      ) : null}
      {picking && otherOpen && !locked ? (
        <form onSubmit={sendOther} className="mt-3 space-y-2">
          <label className="grid gap-1 text-xs text-[#f6f1e3]/65">
            <span>What is it, man?</span>
            <textarea
              required
              minLength={3}
              maxLength={4000}
              rows={3}
              value={otherNote}
              onChange={(event) => setOtherNote(event.target.value)}
              placeholder="Tell me what is broken."
              className="glass-input min-h-[5rem] w-full resize-y rounded-xl px-3 py-2 text-sm font-semibold"
            />
          </label>
          <button
            type="submit"
            disabled={busy || otherNote.trim().length < 3}
            className="min-h-10 rounded-xl bg-[#e8c547] px-4 text-sm font-black text-[#1a1404] disabled:opacity-40"
          >
            Send it
          </button>
        </form>
      ) : null}
    </div>
  );
}
