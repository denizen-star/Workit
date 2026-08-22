'use client';

import { FormEvent, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FEEDBACK_TOPICS, topicLabel, type FeedbackTopic } from '@/lib/feedback';

const HIDDEN = ['/workout', '/who'];

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<FeedbackTopic | ''>('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (HIDDEN.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return null;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(false);
    setStatus('Handing it over…');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'note',
          topic: topic || null,
          message,
          pageUrl: window.location.href,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'That did not land. Try again.');
      }
      setMessage('');
      setTopic('');
      setStatus('Got it. Now get back under the bar.');
      window.setTimeout(() => {
        setOpen(false);
        setStatus('');
      }, 1600);
    } catch (err) {
      setError(true);
      setStatus(err instanceof Error ? err.message : 'That did not land. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-none fixed top-1/2 right-0 z-[60] -translate-y-1/2">
      <div className="pointer-events-auto flex flex-col items-end gap-2 pr-0">
        {open && (
          <div className="mr-2 w-[min(19.5rem,calc(100vw-1.5rem))] rounded-2xl border border-[#e8c547]/35 bg-[#12121a] p-4 shadow-2xl">
            <div className="mb-1 flex items-start justify-between gap-3">
              <strong className="text-sm font-black text-[#e8c547]">Talk to me, man.</strong>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-lg leading-none text-[#f6f1e3]/50"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#f6f1e3]/60">
              Broken video, wrong picture, weird set, next idea. I want the truth. Don&apos;t make me guess.
            </p>
            <form onSubmit={submit} className="space-y-2.5">
              <label className="grid gap-1 text-xs text-[#f6f1e3]/65">
                <span>
                  About <em className="not-italic opacity-70">(optional)</em>
                </span>
                <select
                  value={topic}
                  onChange={(event) => setTopic(event.target.value as FeedbackTopic | '')}
                  className="glass-input min-h-10 w-full rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  <option value="">Skip it</option>
                  {FEEDBACK_TOPICS.map((item) => (
                    <option key={item} value={item}>
                      {topicLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[#f6f1e3]/65">
                <span>Note</span>
                <textarea
                  required
                  minLength={3}
                  maxLength={4000}
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="What's wrong. What's working. What's next."
                  className="glass-input min-h-[5.5rem] w-full resize-y rounded-xl px-3 py-2 text-sm font-semibold"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="min-h-11 w-full rounded-xl bg-[#e8c547] text-sm font-black text-[#1a1404] disabled:opacity-60"
              >
                Send it
              </button>
              {status ? (
                <p className={`text-xs ${error ? 'text-rose-400' : 'text-[#f6f1e3]/70'}`} role="status">
                  {status}
                </p>
              ) : null}
            </form>
          </div>
        )}
        <button
          type="button"
          aria-label="Talk to me, man"
          title="Talk to me, man"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-12 w-10 items-center justify-center rounded-l-2xl border border-r-0 border-[#e8c547]/45 bg-[#12121a] text-[#e8c547] shadow-lg"
        >
          <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 10c0-2.2 1.8-4 4-4h24c2.2 0 4 1.8 4 4v18c0 2.2-1.8 4-4 4H22l-8 8v-8h-2c-2.2 0-4-1.8-4-4V10z"
              opacity="0.9"
            />
            <circle cx="18" cy="19" r="2.2" fill="#1a1404" />
            <circle cx="24" cy="19" r="2.2" fill="#1a1404" />
            <circle cx="30" cy="19" r="2.2" fill="#1a1404" />
          </svg>
        </button>
      </div>
    </div>
  );
}
