'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EnjoymentCharts from '@/components/EnjoymentCharts';
import { reasonLabel, topicLabel } from '@/lib/feedback';
import type { RatingStats } from '@/lib/ratings';

type FeedbackItem = {
  id: number;
  kind: string;
  topic: string | null;
  reason: string | null;
  message: string;
  exercise_name: string | null;
  mailed_at: string | null;
  resolved_at: string | null;
  created_at: string;
  user_name: string;
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);

  const load = async () => {
    const [listRes, statsRes] = await Promise.all([
      fetch('/api/admin/feedback'),
      fetch('/api/ratings/stats?scope=household'),
    ]);
    if (listRes.status === 401 || listRes.status === 403) {
      router.replace('/home');
      return;
    }
    if (listRes.ok) {
      const data = await listRes.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    }
    if (statsRes.ok) {
      setStats(await statsRes.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markResolved = async (item: FeedbackItem, resolved: boolean) => {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', id: item.id, resolved }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || 'Could not update this note');
        return;
      }
      await load();
    } catch {
      setStatus('Could not update this note');
    } finally {
      setBusy(false);
    }
  };

  const sendDigest = async () => {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'digest' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || 'Could not send digest');
        return;
      }
      setStatus('Digest sent to ' + data.to);
      await load();
    } catch {
      setStatus('Could not send digest');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-2xl font-black text-[#e8c547]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
        {stats ? <div className="mb-8"><EnjoymentCharts stats={stats} scope="household" /></div> : null}

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Inbox</p>
            <h2 className="mt-1 text-3xl font-black text-white">Notes and thumbs</h2>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={sendDigest}
            className="inline-flex min-h-11 shrink-0 items-center rounded-2xl bg-[#e8c547] px-4 font-black text-[#1a1404] disabled:opacity-60"
          >
            Email digest
          </button>
        </div>
        {status ? <p className="mb-4 text-sm font-semibold text-[#e8c547]">{status}</p> : null}

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setShowDone(false)}
            className={`min-h-11 rounded-2xl border px-4 text-sm font-black ${
              !showDone
                ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                : 'border-white/10 text-[#f6f1e3]/70'
            }`}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setShowDone(true)}
            className={`min-h-11 rounded-2xl border px-4 text-sm font-black ${
              showDone
                ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                : 'border-white/10 text-[#f6f1e3]/70'
            }`}
          >
            Done
          </button>
        </div>

        {items.filter((item) => (showDone ? item.resolved_at : !item.resolved_at)).length === 0 ? (
          <p className="text-sm text-[#f6f1e3]/55">
            {items.length === 0
              ? 'No notes yet. I am waiting.'
              : showDone
                ? 'Nothing marked done yet.'
                : 'Inbox is clear.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {items
              .filter((item) => (showDone ? item.resolved_at : !item.resolved_at))
              .map((item) => (
              <li key={item.id} className="glass-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-black text-white">{item.user_name}</p>
                  <p className="text-xs text-[#f6f1e3]/45">
                    {new Date(item.created_at).toLocaleString()}
                    {item.mailed_at ? ' · mailed' : ''}
                    {item.resolved_at ? ' · done' : ''}
                  </p>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#e8c547]">
                  {item.kind === 'thumb'
                    ? reasonLabel(item.reason) + (item.exercise_name ? ' · ' + item.exercise_name : '')
                    : topicLabel(item.topic)}
                </p>
                {item.message ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#f6f1e3]/80">{item.message}</p>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => markResolved(item, !item.resolved_at)}
                  className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-[#e8c547]/50 px-3 text-sm font-black text-[#e8c547] disabled:opacity-60"
                >
                  {item.resolved_at ? 'Open again' : 'Mark done'}
                </button>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
